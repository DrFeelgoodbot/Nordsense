import logging
import time
from dataclasses import dataclass, field
from typing import Optional
from pymodbus.client import ModbusSerialClient
from pymodbus.exceptions import ModbusException

log = logging.getLogger(__name__)

ALARM_CODES = {
    0: None,
    1: "Høy trykkalarm",
    2: "Lav trykkalarm",
    3: "Høy temperatur kompressor",
    4: "Sensor feil — inntak",
    5: "Sensor feil — uttak",
    6: "Kommunikasjonsfeil",
    10: "Lav kjølemiddeltrykk",
    20: "Motorvern utløst",
}


@dataclass
class DeviceReading:
    device_id: str
    device_name: str
    device_type: str
    timestamp: float
    values: dict = field(default_factory=dict)
    alarm_code: int = 0
    alarm_text: Optional[str] = None
    online: bool = True


class ModbusReader:
    def __init__(self, config: dict):
        self.config = config
        self.devices = config["devices"]
        self.client = ModbusSerialClient(
            port=config["port"],
            baudrate=config["baudrate"],
            parity=config["parity"],
            stopbits=config["stopbits"],
            timeout=config["timeout"],
        )
        self._connected = False

    def connect(self) -> bool:
        self._connected = self.client.connect()
        if self._connected:
            log.info("Modbus RS485 tilkoblet på %s", self.config["port"])
        else:
            log.error("Klarte ikke koble til Modbus på %s", self.config["port"])
        return self._connected

    def disconnect(self):
        self.client.close()
        self._connected = False

    def read_all(self) -> list[DeviceReading]:
        if not self._connected and not self.connect():
            return []

        readings = []
        for device in self.devices:
            reading = self._read_device(device)
            readings.append(reading)
        return readings

    def _read_device(self, device: dict) -> DeviceReading:
        slave = device["slave_address"]
        reading = DeviceReading(
            device_id=device["id"],
            device_name=device["name"],
            device_type=device["type"],
            timestamp=time.time(),
        )

        for reg_name, reg_cfg in device["registers"].items():
            try:
                value = self._read_register(slave, reg_cfg)
                if value is not None:
                    reading.values[reg_name] = value
            except ModbusException as e:
                log.warning("Feil ved lesing av %s.%s: %s", device["id"], reg_name, e)
                reading.online = False

        alarm_raw = reading.values.get("alarm_code", 0)
        reading.alarm_code = int(alarm_raw)
        reading.alarm_text = ALARM_CODES.get(reading.alarm_code)

        return reading

    def _read_register(self, slave: int, reg_cfg: dict) -> Optional[float]:
        addr = reg_cfg["address"]
        scale = reg_cfg.get("scale", 1)
        reg_type = reg_cfg.get("type", "input")

        if reg_type == "input":
            result = self.client.read_input_registers(addr, count=1, slave=slave)
        else:
            result = self.client.read_holding_registers(addr, count=1, slave=slave)

        if result.isError():
            return None

        raw = result.registers[0]
        # håndter fortegn (signed 16-bit)
        if raw > 32767:
            raw -= 65536
        return round(raw * scale, 3)

    def write_setpoint(self, device_id: str, register: str, value: float) -> bool:
        device = next((d for d in self.devices if d["id"] == device_id), None)
        if not device:
            log.error("Ukjent enhet: %s", device_id)
            return False

        reg_cfg = device["registers"].get(register)
        if not reg_cfg or not reg_cfg.get("writable"):
            log.error("Register %s er ikke skrivbart på %s", register, device_id)
            return False

        scale = reg_cfg.get("scale", 1)
        raw_value = int(value / scale)
        slave = device["slave_address"]

        result = self.client.write_register(reg_cfg["address"], raw_value, slave=slave)
        if result.isError():
            log.error("Klarte ikke skrive %s.%s = %s", device_id, register, value)
            return False

        log.info("Satt %s.%s = %.1f", device_id, register, value)
        return True
