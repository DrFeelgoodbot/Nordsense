import json
import logging
import time
from dataclasses import asdict
from typing import Callable
import paho.mqtt.client as mqtt
from modbus_reader import DeviceReading
from can_reader import CanMessage
from optimizer import OptimizationResult

log = logging.getLogger(__name__)


def _serialize(obj):
    if isinstance(obj, bytes):
        return obj.hex()
    raise TypeError(f"Kan ikke serialisere {type(obj)}")


class MqttClient:
    def __init__(self, config: dict, command_callback: Callable | None = None):
        self.cfg = config
        self._command_callback = command_callback
        self._client = mqtt.Client(client_id=config["client_id"])
        self._client.username_pw_set(config["username"], config["password"])
        self._client.on_connect = self._on_connect
        self._client.on_message = self._on_message
        self._client.on_disconnect = self._on_disconnect
        self._connected = False

    def connect(self):
        self._client.connect_async(self.cfg["broker"], self.cfg["port"], keepalive=60)
        self._client.loop_start()

    def disconnect(self):
        self._client.loop_stop()
        self._client.disconnect()

    def publish_telemetry(self, reading: DeviceReading):
        topic = self.cfg["topics"]["telemetry"].format(device_id=reading.device_id)
        payload = {
            "device_id": reading.device_id,
            "device_name": reading.device_name,
            "type": reading.device_type,
            "timestamp": reading.timestamp,
            "online": reading.online,
            "values": reading.values,
            "alarm_code": reading.alarm_code,
            "alarm_text": reading.alarm_text,
        }
        self._publish(topic, payload)

    def publish_alarm(self, device_id: str, alarm: CanMessage | dict):
        topic = self.cfg["topics"]["alarms"].format(device_id=device_id)
        if isinstance(alarm, CanMessage):
            payload = {
                "timestamp": alarm.timestamp,
                "device_id": alarm.device_id,
                "can_id": hex(alarm.arbitration_id),
                "fault_code": alarm.fault_code,
                "fault_text": alarm.fault_text,
                "severity": alarm.severity,
                "data": alarm.data.hex(),
            }
        else:
            payload = alarm
        self._publish(topic, payload, retain=True)

    def publish_optimization(self, result: OptimizationResult):
        topic = "hvac/optimization/result"
        payload = {
            "timestamp": result.timestamp.isoformat(),
            "price_nok": result.price_nok,
            "price_zone": result.price_zone,
            "estimated_saving_kwh": result.estimated_saving_kwh,
            "actions": [
                {
                    "device_id": a.device_id,
                    "register": a.register,
                    "old_value": a.old_value,
                    "new_value": a.new_value,
                    "reason": a.reason,
                }
                for a in result.actions
            ],
        }
        self._publish(topic, payload)

    def publish_prices(self, prices: list[dict]):
        topic = self.cfg["topics"]["prices"]
        self._publish(topic, {"prices": prices}, retain=True)

    def _publish(self, topic: str, payload: dict, retain: bool = False):
        if not self._connected:
            log.warning("MQTT ikke tilkoblet — dropper melding til %s", topic)
            return
        try:
            msg = json.dumps(payload, default=_serialize)
            self._client.publish(topic, msg, qos=1, retain=retain)
        except Exception as e:
            log.error("MQTT publisering feilet på %s: %s", topic, e)

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self._connected = True
            log.info("MQTT tilkoblet til %s:%d", self.cfg["broker"], self.cfg["port"])
            client.subscribe(self.cfg["topics"]["commands"], qos=1)
        else:
            log.error("MQTT tilkobling feilet, kode: %d", rc)

    def _on_disconnect(self, client, userdata, rc):
        self._connected = False
        if rc != 0:
            log.warning("MQTT uventet frakoblet (kode %d) — prøver igjen...", rc)

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload)
            log.info("MQTT kommando mottatt: %s → %s", msg.topic, payload)
            if self._command_callback:
                self._command_callback(msg.topic, payload)
        except json.JSONDecodeError as e:
            log.error("Ugyldig MQTT-melding: %s", e)
