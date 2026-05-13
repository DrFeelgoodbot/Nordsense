#!/usr/bin/env python3
"""
HVAC Energy Optimizer — edge-tjeneste for Raspberry Pi Zero 2 WH
Leser varmepumper og kjøleanlegg via RS485/Modbus, feilmeldinger via CAN-bus,
optimerer setpunkter basert på Nord Pool strømpriser og sender via 4G/MQTT.
"""
import logging
import signal
import sys
import time
import yaml
from datetime import datetime
from pathlib import Path

from modbus_reader import ModbusReader
from can_reader import CanReader, CanMessage
from nordpool import NordPoolClient
from optimizer import HvacOptimizer
from mqtt_client import MqttClient

CONFIG_PATH = Path(__file__).parent / "config.yaml"
TELEMETRY_INTERVAL = 60    # sekunder mellom avlesninger
OPTIMIZE_INTERVAL  = 300   # sekunder mellom optimeringskjøringer (5 min)
PRICE_REFRESH_INTERVAL = 3600  # hent nye priser én gang i timen


def setup_logging(config: dict):
    log_file = config.get("file", "/var/log/hvac-optimizer/edge.log")
    level = getattr(logging, config.get("level", "INFO"))
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(name)s %(levelname)s %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_file),
        ],
    )


def on_command(topic: str, payload: dict, modbus: ModbusReader):
    """Håndterer manuelle kommandoer fra backend via MQTT."""
    device_id = topic.split("/")[1]
    register = payload.get("register")
    value = payload.get("value")
    if device_id and register and value is not None:
        modbus.write_setpoint(device_id, register, float(value))


def main():
    with open(CONFIG_PATH) as f:
        cfg = yaml.safe_load(f)

    setup_logging(cfg.get("logging", {}))
    log = logging.getLogger("main")
    log.info("HVAC Optimizer starter...")

    modbus = ModbusReader(cfg["modbus"])
    can = CanReader(cfg["can"])
    nordpool = NordPoolClient(area=cfg["optimizer"]["area"])
    optimizer = HvacOptimizer(cfg["optimizer"], modbus)
    mqtt = MqttClient(cfg["mqtt"], command_callback=lambda t, p: on_command(t, p, modbus))

    # Koble til
    modbus.connect()
    can.start()
    mqtt.connect()
    time.sleep(2)  # la MQTT koble til

    last_optimize = 0.0
    last_price_refresh = 0.0
    forecast = None

    def shutdown(sig, frame):
        log.info("Avslutter...")
        can.stop()
        modbus.disconnect()
        mqtt.disconnect()
        sys.exit(0)

    signal.signal(signal.SIGTERM, shutdown)
    signal.signal(signal.SIGINT, shutdown)

    # Callback for kritiske CAN-feil — publiser umiddelbart
    def on_critical_fault(fault: CanMessage):
        log.critical("KRITISK FEIL fra CAN-bus: %s", fault.fault_text or fault.fault_code)
        mqtt.publish_alarm(fault.device_id, fault)

    can.set_fault_callback(on_critical_fault)

    log.info("Kjører — telemetri hvert %ds, optimering hvert %ds", TELEMETRY_INTERVAL, OPTIMIZE_INTERVAL)

    while True:
        loop_start = time.time()

        # --- Hent Nord Pool priser ---
        if loop_start - last_price_refresh > PRICE_REFRESH_INTERVAL or forecast is None:
            forecast = nordpool.get_prices()
            last_price_refresh = loop_start
            if forecast:
                prices_payload = [
                    {"hour": p.hour, "date": str(p.date), "price_nok": p.price_nok}
                    for p in forecast.today + forecast.tomorrow
                ]
                mqtt.publish_prices(prices_payload)

        # --- Les alle HVAC-enheter via Modbus ---
        readings = modbus.read_all()
        for reading in readings:
            mqtt.publish_telemetry(reading)
            if reading.alarm_code > 0:
                mqtt.publish_alarm(reading.device_id, {
                    "source": "modbus",
                    "device_id": reading.device_id,
                    "alarm_code": reading.alarm_code,
                    "alarm_text": reading.alarm_text,
                    "timestamp": reading.timestamp,
                })

        # --- Publiser aktive CAN-feil ---
        can_reading = can.get_latest()
        for fault in can_reading.active_faults:
            mqtt.publish_alarm(fault.device_id, fault)

        # --- Kjør optimering ---
        if forecast and (loop_start - last_optimize > OPTIMIZE_INTERVAL):
            result = optimizer.run(readings, forecast)
            mqtt.publish_optimization(result)
            last_optimize = loop_start

            if result.actions:
                log.info(
                    "Optimering: %d tiltak, estimert besparelse %.4f kWh ved %.2f kr/kWh",
                    len(result.actions),
                    result.estimated_saving_kwh,
                    result.price_nok,
                )

        elapsed = time.time() - loop_start
        sleep_time = max(0, TELEMETRY_INTERVAL - elapsed)
        time.sleep(sleep_time)


if __name__ == "__main__":
    main()
