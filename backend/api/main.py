"""
HVAC Optimizer Backend API
- Mottar MQTT-meldinger og lagrer i InfluxDB
- Tilbyr REST API for dashboard og manuell kontroll
"""
import json
import logging
import os
import threading
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import paho.mqtt.client as mqtt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
from pydantic import BaseModel

log = logging.getLogger("hvac-api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

TZ = ZoneInfo("Europe/Oslo")

INFLUX_URL    = os.getenv("INFLUX_URL", "http://localhost:8086")
INFLUX_TOKEN  = os.getenv("INFLUX_TOKEN", "hvac-super-secret-token")
INFLUX_ORG    = os.getenv("INFLUX_ORG", "hvac")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET", "hvac_data")
MQTT_BROKER   = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT     = int(os.getenv("MQTT_PORT", "1883"))
MQTT_USER     = os.getenv("MQTT_USERNAME", "hvac")
MQTT_PASS     = os.getenv("MQTT_PASSWORD", "changeme")

app = FastAPI(title="HVAC Optimizer API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

influx_client = InfluxDBClient(url=INFLUX_URL, token=INFLUX_TOKEN, org=INFLUX_ORG)
write_api = influx_client.write_api(write_options=SYNCHRONOUS)
query_api = influx_client.query_api()


# ── MQTT → InfluxDB ─────────────────────────────────────────────────────────

def _write_telemetry(payload: dict):
    device_id = payload.get("device_id", "unknown")
    device_type = payload.get("type", "unknown")
    ts = datetime.fromtimestamp(payload.get("timestamp", datetime.now().timestamp()), tz=TZ)

    points = []
    for field, value in payload.get("values", {}).items():
        if isinstance(value, (int, float)):
            p = (
                Point("hvac_telemetry")
                .tag("device_id", device_id)
                .tag("device_type", device_type)
                .tag("device_name", payload.get("device_name", device_id))
                .field(field, float(value))
                .time(ts)
            )
            points.append(p)

    if not payload.get("online", True):
        points.append(
            Point("hvac_telemetry")
            .tag("device_id", device_id)
            .field("online", 0)
            .time(ts)
        )

    if points:
        write_api.write(bucket=INFLUX_BUCKET, record=points)


def _write_alarm(payload: dict):
    p = (
        Point("hvac_alarm")
        .tag("device_id", payload.get("device_id", "unknown"))
        .tag("severity", payload.get("severity", "unknown"))
        .tag("source", payload.get("source", "unknown"))
        .field("fault_code", int(payload.get("fault_code", 0)))
        .field("fault_text", str(payload.get("fault_text") or payload.get("alarm_text") or ""))
        .time(datetime.now(TZ))
    )
    write_api.write(bucket=INFLUX_BUCKET, record=p)
    log.warning("Alarm lagret: %s — %s", payload.get("device_id"), payload.get("fault_text"))


def _write_optimization(payload: dict):
    p = (
        Point("hvac_optimization")
        .field("price_nok", float(payload.get("price_nok", 0)))
        .field("price_zone", payload.get("price_zone", "unknown"))
        .field("actions_count", len(payload.get("actions", [])))
        .field("estimated_saving_kwh", float(payload.get("estimated_saving_kwh", 0)))
        .time(datetime.now(TZ))
    )
    write_api.write(bucket=INFLUX_BUCKET, record=p)


def _write_prices(payload: dict):
    points = []
    for entry in payload.get("prices", []):
        try:
            dt = datetime.strptime(f"{entry['date']} {entry['hour']:02d}:00", "%Y-%m-%d %H:%M")
            dt = dt.replace(tzinfo=TZ)
            p = (
                Point("nordpool_price")
                .field("price_nok", float(entry["price_nok"]))
                .time(dt)
            )
            points.append(p)
        except (KeyError, ValueError):
            continue
    if points:
        write_api.write(bucket=INFLUX_BUCKET, record=points)


def on_mqtt_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload)
        topic = msg.topic

        if "/telemetry" in topic:
            _write_telemetry(payload)
        elif "/alarm" in topic:
            _write_alarm(payload)
        elif "optimization/result" in topic:
            _write_optimization(payload)
        elif "nordpool/prices" in topic:
            _write_prices(payload)
    except Exception as e:
        log.error("Feil ved behandling av MQTT-melding på %s: %s", msg.topic, e)


def start_mqtt():
    client = mqtt.Client(client_id="hvac-backend")
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_message = on_mqtt_message
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.subscribe([
        ("hvac/+/telemetry", 1),
        ("hvac/+/alarm", 1),
        ("hvac/optimization/result", 1),
        ("nordpool/prices", 1),
    ])
    client.loop_start()
    log.info("MQTT lytter startet")


# ── REST API ─────────────────────────────────────────────────────────────────

class SetpointCommand(BaseModel):
    device_id: str
    register: str
    value: float


_mqtt_client_global: mqtt.Client | None = None


@app.on_event("startup")
def startup():
    global _mqtt_client_global
    thread = threading.Thread(target=start_mqtt, daemon=True)
    thread.start()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/devices")
def list_devices():
    query = f"""
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -10m)
      |> filter(fn: (r) => r._measurement == "hvac_telemetry")
      |> keep(columns: ["device_id", "device_type", "device_name"])
      |> distinct(column: "device_id")
    """
    tables = query_api.query(query, org=INFLUX_ORG)
    devices = [
        {"device_id": r.values.get("device_id"), "device_type": r.values.get("device_type")}
        for table in tables for r in table.records
    ]
    return {"devices": devices}


@app.get("/telemetry/{device_id}")
def get_telemetry(device_id: str, hours: int = 24):
    query = f"""
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -{hours}h)
      |> filter(fn: (r) => r._measurement == "hvac_telemetry" and r.device_id == "{device_id}")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    """
    tables = query_api.query(query, org=INFLUX_ORG)
    rows = [
        {"time": r.get_time().isoformat(), **{k: v for k, v in r.values.items() if not k.startswith("_")}}
        for table in tables for r in table.records
    ]
    return {"device_id": device_id, "data": rows}


@app.get("/alarms")
def get_alarms(hours: int = 24):
    query = f"""
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -{hours}h)
      |> filter(fn: (r) => r._measurement == "hvac_alarm")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    """
    tables = query_api.query(query, org=INFLUX_ORG)
    alarms = [
        {"time": r.get_time().isoformat(), **{k: v for k, v in r.values.items() if not k.startswith("_")}}
        for table in tables for r in table.records
    ]
    return {"alarms": alarms}


@app.get("/prices")
def get_prices():
    query = f"""
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -2d)
      |> filter(fn: (r) => r._measurement == "nordpool_price")
      |> sort(columns: ["_time"])
    """
    tables = query_api.query(query, org=INFLUX_ORG)
    prices = [
        {"time": r.get_time().isoformat(), "price_nok": r.get_value()}
        for table in tables for r in table.records
    ]
    return {"prices": prices}


@app.get("/optimization/history")
def get_optimization_history(hours: int = 24):
    query = f"""
    from(bucket: "{INFLUX_BUCKET}")
      |> range(start: -{hours}h)
      |> filter(fn: (r) => r._measurement == "hvac_optimization")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    """
    tables = query_api.query(query, org=INFLUX_ORG)
    rows = [
        {"time": r.get_time().isoformat(), **{k: v for k, v in r.values.items() if not k.startswith("_")}}
        for table in tables for r in table.records
    ]
    return {"history": rows}


@app.post("/command/setpoint")
def send_setpoint(cmd: SetpointCommand, mqtt_client: mqtt.Client | None = None):
    topic = f"hvac/{cmd.device_id}/command"
    payload = json.dumps({"register": cmd.register, "value": cmd.value})
    # publiser direkte til edge via MQTT
    result = mqtt.Client(client_id="hvac-api-cmd")
    result.username_pw_set(MQTT_USER, MQTT_PASS)
    result.connect(MQTT_BROKER, MQTT_PORT)
    result.publish(topic, payload, qos=1)
    result.disconnect()
    return {"status": "sent", "topic": topic, "payload": cmd.dict()}
