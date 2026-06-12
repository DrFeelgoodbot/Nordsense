"""
NordSense buss-simulator.

Etterligner et fleet av varmepumper, kjøleanlegg, ventilasjon og frekvensomformere
som ligger på en Modbus/CAN buss-linje. Sender realistisk telemetri og alarmer
via MQTT til NordSense-backenden på Hetzner.

Bruk:
  python main.py                              # kjør mot localhost
  python main.py --broker 178.105.130.167     # kjør mot Hetzner
  python main.py --speed 30                   # 30× raskere tid (debug)
  python main.py --once                       # send én sample per enhet og avslutt
"""

from __future__ import annotations
import argparse
import json
import logging
import os
import random
import signal
import sys
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import paho.mqtt.client as mqtt
import requests
import yaml

from devices import SimulatedDevice, build_device


log = logging.getLogger("simulator")


# ── Nord Pool-priser (NO1, inkl. ca. 25 % MVA) ─────────────────────────────────

class PriceFeed:
    """Henter dagens timepriser fra hvakosterstrommen.no, cacher i 1 time."""

    URL = "https://www.hvakosterstrommen.no/api/v1/prices/{y}/{md}_{zone}.json"
    MVA = 1.25

    def __init__(self, zone: str = "NO1"):
        self.zone = zone
        self._prices: dict[int, float] = {}     # hour → kr/kWh
        self._fetched_for_date: Optional[str] = None

    def _fetch(self) -> None:
        today = datetime.now()
        date_str = today.strftime("%Y-%m-%d")
        if self._fetched_for_date == date_str and self._prices:
            return
        url = self.URL.format(y=today.year, md=today.strftime("%m-%d"), zone=self.zone)
        try:
            data = requests.get(url, timeout=10).json()
            self._prices = {
                datetime.fromisoformat(e["time_start"]).hour: e["NOK_per_kWh"] * self.MVA
                for e in data
            }
            self._fetched_for_date = date_str
            log.info("Hentet %d Nord Pool-timer for %s (%s)", len(self._prices), date_str, self.zone)
        except Exception as exc:
            log.warning("Klarte ikke hente Nord Pool-priser (%s) — bruker syntetisk", exc)
            # Fallback: syntetisk dag-pris-kurve
            base = [0.45, 0.40, 0.36, 0.34, 0.34, 0.40, 0.65, 0.95, 1.10, 1.20, 1.25, 1.30,
                    1.20, 1.05, 0.95, 1.05, 1.30, 1.45, 1.40, 1.25, 1.05, 0.85, 0.65, 0.50]
            self._prices = {h: p for h, p in enumerate(base)}

    def current(self) -> float:
        self._fetch()
        return self._prices.get(datetime.now().hour, 0.85)


# ── MQTT-publisering ───────────────────────────────────────────────────────────

class MqttPublisher:
    def __init__(self, broker: str, port: int, user: str, password: str):
        self.broker = broker
        self.port = port
        self.client = mqtt.Client(client_id=f"nordsense-sim-{random.randint(0, 99999)}")
        if user:
            self.client.username_pw_set(user, password)
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, c, u, f, rc):
        if rc == 0:
            log.info("MQTT tilkoblet %s:%d", self.broker, self.port)
        else:
            log.error("MQTT-tilkobling feilet, rc=%s", rc)

    def _on_disconnect(self, c, u, rc):
        log.warning("MQTT frakoblet (rc=%s) — paho prøver auto-reconnect", rc)

    def connect(self):
        self.client.connect_async(self.broker, self.port, keepalive=60)
        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()

    def publish_telemetry(self, payload: dict):
        topic = f"hvac/{payload['device_id']}/telemetry"
        self.client.publish(topic, json.dumps(payload), qos=1)

    def publish_alarm(self, payload: dict):
        topic = f"hvac/{payload['device_id']}/alarm"
        self.client.publish(topic, json.dumps(payload), qos=1)
        log.warning("ALARM %s (%s): %s", payload["device_id"], payload["severity"], payload["fault_text"])

    def publish_prices(self, zone: str, prices: dict[int, float]):
        today = datetime.now().strftime("%Y-%m-%d")
        payload = {
            "zone": zone,
            "prices": [
                {"date": today, "hour": h, "price_nok": round(p, 4)}
                for h, p in sorted(prices.items())
            ],
        }
        self.client.publish("nordpool/prices", json.dumps(payload), qos=1)


# ── Simulator-orkestrator ──────────────────────────────────────────────────────

class FleetSimulator:
    def __init__(self, devices: List[SimulatedDevice], publisher: MqttPublisher,
                 price_feed: PriceFeed, speed: float = 1.0):
        self.devices = devices
        self.publisher = publisher
        self.price_feed = price_feed
        self.speed = speed
        self.stop_event = threading.Event()

    def _device_loop(self, device: SimulatedDevice):
        """En tråd per enhet — hver poller på sin egen takt med litt jitter."""
        # Stagger oppstart så vi ikke får en busy spike første sekund
        time.sleep(random.uniform(0, min(5.0, device.poll_seconds)))

        while not self.stop_event.is_set():
            price = self.price_feed.current()
            device.update(price)
            device.maybe_dropout()

            if device.is_online():
                self.publisher.publish_telemetry(device.telemetry_payload())
            else:
                # Sender online=false slik at backend kan markere enheten frakoblet
                payload = device.telemetry_payload()
                self.publisher.publish_telemetry(payload)
                log.debug("Tapt ramme: %s", device.device_id)

            alarm = device.maybe_alarm()
            if alarm:
                self.publisher.publish_alarm(alarm)

            jitter = random.uniform(-0.1, 0.1) * device.poll_seconds
            self.stop_event.wait((device.poll_seconds + jitter) / self.speed)

    def _price_loop(self):
        """Publiser dagens priser hver time så backend har det i InfluxDB."""
        while not self.stop_event.is_set():
            self.price_feed._fetch()
            if self.price_feed._prices:
                self.publisher.publish_prices(self.price_feed.zone, self.price_feed._prices)
                log.info("Publiserte %d Nord Pool-timer", len(self.price_feed._prices))
            self.stop_event.wait(3600 / self.speed)

    def run(self):
        log.info("Starter simulator med %d enheter (speed=%.1f×)", len(self.devices), self.speed)
        threads = [threading.Thread(target=self._device_loop, args=(d,), daemon=True) for d in self.devices]
        threads.append(threading.Thread(target=self._price_loop, daemon=True))
        for t in threads:
            t.start()
        try:
            while not self.stop_event.is_set():
                self.stop_event.wait(1.0)
        except KeyboardInterrupt:
            log.info("Stopper ...")

    def run_once(self):
        log.info("Engangskjøring — én sample per enhet")
        price = self.price_feed.current()
        for d in self.devices:
            d.update(price)
            self.publisher.publish_telemetry(d.telemetry_payload())
        if self.price_feed._prices:
            self.publisher.publish_prices(self.price_feed.zone, self.price_feed._prices)
        time.sleep(2.0)  # gi MQTT tid til å flushe

    def stop(self):
        self.stop_event.set()


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="NordSense buss-simulator")
    parser.add_argument("--broker",   default=os.getenv("MQTT_BROKER", "localhost"))
    parser.add_argument("--port",     type=int, default=int(os.getenv("MQTT_PORT", "1883")))
    parser.add_argument("--user",     default=os.getenv("MQTT_USER", "hvac"))
    parser.add_argument("--password", default=os.getenv("MQTT_PASS", "changeme"))
    parser.add_argument("--fleet",    default=str(Path(__file__).parent / "fleet.yaml"))
    parser.add_argument("--speed",    type=float, default=1.0,
                        help="Tidsskala — 1.0 = sanntid, 30 = 30× raskere (debug)")
    parser.add_argument("--zone",     default="NO1")
    parser.add_argument("--once",     action="store_true", help="Send én sample per enhet og avslutt")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
    )

    with open(args.fleet, "r", encoding="utf-8") as fh:
        fleet_spec = yaml.safe_load(fh)
    devices = [build_device(spec) for spec in fleet_spec["devices"]]

    pub = MqttPublisher(args.broker, args.port, args.user, args.password)
    pub.connect()
    time.sleep(2.0)  # vent på første tilkobling

    sim = FleetSimulator(devices, pub, PriceFeed(args.zone), speed=args.speed)

    def sigterm(_sig, _frame):
        sim.stop()
    signal.signal(signal.SIGINT, sigterm)
    signal.signal(signal.SIGTERM, sigterm)

    if args.once:
        sim.run_once()
    else:
        sim.run()

    pub.stop()


if __name__ == "__main__":
    main()
