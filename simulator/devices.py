"""
Realistiske enhets-simulatorer for NordSense.

Hver enhet er en state-maskin som etterligner hvordan en ekte regulator/styring
oppfører seg på en RS485/CAN buss-linje:
  - Sensorverdier drifter sakte (Ornstein-Uhlenbeck mean reversion)
  - Setpunkt reagerer på virtuell spotpris (forvarmer billig, demper dyrt)
  - Kompressor/vifte-effekt følger laststyringen
  - Tilfeldig sensorstøy (Gauss)
  - Tilfeldige "tapte rammer" — online=false i en syklus (Modbus timeout)
  - Tilfeldige alarmer med rimelig recovery-tid
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional
import random
import time


# ── Mean-reverting random walk for realistisk sensor-drift ─────────────────────

def ou_step(value: float, mean: float, theta: float = 0.05, sigma: float = 0.15) -> float:
    """Ornstein-Uhlenbeck-steg — trekker verdien mot mean med litt støy."""
    return value + theta * (mean - value) + random.gauss(0, sigma)


# ── Alarmkatalog (matcher dashboard + realistiske bus-feil) ─────────────────────

ALARM_LIBRARY: Dict[str, List[dict]] = {
    "heat_pump":   [
        {"severity": "critical", "fault_code": 401, "fault_text": "Lavt sugetrykk"},
        {"severity": "warning",  "fault_code": 402, "fault_text": "Høy kondenseringstemperatur"},
        {"severity": "critical", "fault_code": 403, "fault_text": "Motorvern utløst"},
        {"severity": "warning",  "fault_code": 404, "fault_text": "Lav superheat"},
    ],
    "cooling":     [
        {"severity": "critical", "fault_code": 501, "fault_text": "Mistanke om kjølemiddellekkasje"},
        {"severity": "warning",  "fault_code": 502, "fault_text": "Høy diskhastighet kompressor 2"},
        {"severity": "critical", "fault_code": 503, "fault_text": "Høy temperatur datarom"},
    ],
    "ahu":         [
        {"severity": "warning",  "fault_code": 601, "fault_text": "Filterskifte påkrevd (∆p over grense)"},
        {"severity": "warning",  "fault_code": 602, "fault_text": "Avtrekksvifte — overstrøm"},
        {"severity": "info",     "fault_code": 603, "fault_text": "CO₂ over grense — øker friskluft"},
    ],
    "vfd":         [
        {"severity": "warning",  "fault_code": 701, "fault_text": "Sirkulasjonspumpe — driftsfeil"},
        {"severity": "warning",  "fault_code": 702, "fault_text": "Overstrøm frekvensomformer"},
    ],
    "heat_control":[
        {"severity": "warning",  "fault_code": 801, "fault_text": "Modbus — timeout på enhet"},
        {"severity": "warning",  "fault_code": 802, "fault_text": "Sensor feil — inntak"},
    ],
}


# ── Base ──────────────────────────────────────────────────────────────────────

@dataclass(kw_only=True)
class SimulatedDevice:
    device_id: str
    name: str
    building_id: str
    device_type: str        # heat_pump / cooling / ahu / vfd / heat_control
    manufacturer: str
    model: str
    poll_seconds: float = 30.0
    state: Dict[str, float] = field(default_factory=dict)
    last_poll: float = 0.0
    alarm_active: Optional[dict] = None
    alarm_recover_at: float = 0.0
    dropout_until: float = 0.0

    # Sannsynlighet per poll
    p_dropout: float = 0.008        # ~1 % av polls = "tapt ramme"
    p_alarm: float = 0.0008         # ~1 alarm per ~20 min hvis poll = 30s

    def update(self, price_nok_per_kwh: float) -> None:
        """Kalles av hver subklasse — overstyrer state-maskinen."""
        raise NotImplementedError

    def is_online(self) -> bool:
        return time.time() >= self.dropout_until

    def maybe_alarm(self) -> Optional[dict]:
        """Returnerer alarm-payload hvis ny alarm skal fyres, ellers None."""
        now = time.time()
        # Recovery
        if self.alarm_active and now >= self.alarm_recover_at:
            self.alarm_active = None
        # Ny alarm
        if not self.alarm_active and random.random() < self.p_alarm:
            choices = ALARM_LIBRARY.get(self.device_type, [])
            if not choices:
                return None
            alarm = random.choice(choices).copy()
            self.alarm_active = alarm
            self.alarm_recover_at = now + random.uniform(10 * 60, 45 * 60)  # 10–45 min varighet
            return {
                "device_id": self.device_id,
                "severity": alarm["severity"],
                "source": "modbus",
                "fault_code": alarm["fault_code"],
                "fault_text": alarm["fault_text"],
            }
        return None

    def maybe_dropout(self) -> None:
        """Simulerer tapt Modbus/CAN-ramme — online=false i 1 syklus."""
        if random.random() < self.p_dropout:
            self.dropout_until = time.time() + self.poll_seconds * 0.9

    def telemetry_payload(self) -> dict:
        return {
            "device_id": self.device_id,
            "type": self.device_type,
            "device_name": self.name,
            "timestamp": time.time(),
            "online": self.is_online(),
            "values": {k: round(v, 3) for k, v in self.state.items()},
        }


# ── Varmepumpe (Carel pCO5) ────────────────────────────────────────────────────

@dataclass(kw_only=True)
class HeatPump(SimulatedDevice):
    device_type: str = "heat_pump"
    nominal_power_kw: float = 12.0
    nominal_cop: float = 3.8

    def __post_init__(self):
        self.state = {
            "power_kw":   self.nominal_power_kw * 0.7,
            "cop":        self.nominal_cop,
            "setpoint":   21.5,
            "supply_temp": 19.0,
            "return_temp": 23.5,
            "ambient_temp": 8.0,
            "suction_pressure_bar": 4.2,
            "discharge_pressure_bar": 18.5,
        }

    def update(self, price: float):
        # Setpunkt-logikk basert på spotpris (NordSense-optimaliseringen)
        if price < 0.50:
            target_sp = 23.0     # forvarm i billige timer
        elif price > 1.20:
            target_sp = 19.5     # demp i dyre timer
        else:
            target_sp = 21.0
        self.state["setpoint"] = ou_step(self.state["setpoint"], target_sp, theta=0.15, sigma=0.05)

        # Last følger gap mellom setpunkt og rom (forenklet)
        gap = self.state["setpoint"] - self.state["return_temp"] + 1.0
        load_factor = max(0.3, min(1.1, 0.5 + gap * 0.15))
        target_power = self.nominal_power_kw * load_factor
        self.state["power_kw"] = ou_step(self.state["power_kw"], target_power, theta=0.2, sigma=0.3)

        # COP synker når det er kaldt ute / høy last
        target_cop = self.nominal_cop + (self.state["ambient_temp"] - 5) * 0.05 - (load_factor - 0.7) * 0.4
        self.state["cop"] = max(2.0, ou_step(self.state["cop"], target_cop, theta=0.1, sigma=0.08))

        # Temperaturer drifter
        self.state["return_temp"] = ou_step(self.state["return_temp"], self.state["setpoint"] - 2.0, theta=0.08, sigma=0.1)
        self.state["supply_temp"] = ou_step(self.state["supply_temp"], self.state["return_temp"] - 4.5, theta=0.1, sigma=0.1)
        self.state["ambient_temp"] = ou_step(self.state["ambient_temp"], 8.0, theta=0.02, sigma=0.3)

        # Trykk reagerer på last
        self.state["suction_pressure_bar"] = ou_step(self.state["suction_pressure_bar"], 4.0 + load_factor * 0.5, theta=0.15, sigma=0.1)
        self.state["discharge_pressure_bar"] = ou_step(self.state["discharge_pressure_bar"], 16 + load_factor * 4, theta=0.15, sigma=0.3)


# ── Kjøleanlegg (Eliwell / Carel IR33 / Danfoss Optyma) ────────────────────────

@dataclass(kw_only=True)
class CoolingUnit(SimulatedDevice):
    device_type: str = "cooling"
    nominal_power_kw: float = 8.0
    setpoint_c: float = 4.0  # kjølerom: 4 °C, fryser: -18 °C

    def __post_init__(self):
        self.state = {
            "power_kw": self.nominal_power_kw * 0.6,
            "setpoint": self.setpoint_c,
            "supply_temp": self.setpoint_c - 1.5,
            "return_temp": self.setpoint_c + 1.0,
            "suction_pressure_bar": 2.2 if self.setpoint_c > 0 else 0.8,
            "discharge_pressure_bar": 14.0,
        }

    def update(self, price: float):
        # Prekjøling i billige timer (kun for plusskjøl, ikke fryser)
        if self.setpoint_c > 0 and price < 0.50:
            target_sp = self.setpoint_c - 1.0
        elif price > 1.20:
            target_sp = self.setpoint_c + 1.0
        else:
            target_sp = self.setpoint_c
        self.state["setpoint"] = ou_step(self.state["setpoint"], target_sp, theta=0.15, sigma=0.03)

        gap = self.state["return_temp"] - self.state["setpoint"] + 0.5
        load_factor = max(0.2, min(1.1, 0.4 + gap * 0.2))
        target_power = self.nominal_power_kw * load_factor
        self.state["power_kw"] = ou_step(self.state["power_kw"], target_power, theta=0.2, sigma=0.2)

        self.state["return_temp"]  = ou_step(self.state["return_temp"],  self.state["setpoint"] + 1.0, theta=0.08, sigma=0.08)
        self.state["supply_temp"]  = ou_step(self.state["supply_temp"],  self.state["setpoint"] - 1.5, theta=0.1,  sigma=0.08)

        self.state["suction_pressure_bar"]   = ou_step(self.state["suction_pressure_bar"],   (2.2 if self.setpoint_c > 0 else 0.8) + load_factor * 0.3, theta=0.15, sigma=0.05)
        self.state["discharge_pressure_bar"] = ou_step(self.state["discharge_pressure_bar"], 12 + load_factor * 3.0, theta=0.15, sigma=0.2)


# ── Ventilasjonsaggregat (System Air SAVE / Swegon GOLD) ────────────────────────

@dataclass(kw_only=True)
class AHU(SimulatedDevice):
    device_type: str = "ahu"
    nominal_power_kw: float = 5.5

    def __post_init__(self):
        self.state = {
            "power_kw": self.nominal_power_kw * 0.7,
            "setpoint": 19.0,
            "supply_air_temp": 18.0,
            "extract_air_temp": 21.0,
            "outdoor_air_temp": 6.0,
            "supply_fan_speed_pct": 65.0,
            "extract_fan_speed_pct": 60.0,
            "heat_recovery_pct": 78.0,
            "filter_dp_pa": 110.0,
        }

    def update(self, price: float):
        if price > 1.20:
            target_fan = 50.0  # demp i dyre timer
        elif price < 0.50:
            target_fan = 75.0  # full friskluft når billig
        else:
            target_fan = 65.0
        self.state["supply_fan_speed_pct"]  = ou_step(self.state["supply_fan_speed_pct"],  target_fan,        theta=0.15, sigma=1.0)
        self.state["extract_fan_speed_pct"] = ou_step(self.state["extract_fan_speed_pct"], target_fan - 5.0,  theta=0.15, sigma=1.0)

        load_factor = self.state["supply_fan_speed_pct"] / 65.0
        target_power = self.nominal_power_kw * load_factor
        self.state["power_kw"] = ou_step(self.state["power_kw"], target_power, theta=0.2, sigma=0.1)

        self.state["outdoor_air_temp"]  = ou_step(self.state["outdoor_air_temp"], 6.0, theta=0.02, sigma=0.4)
        self.state["supply_air_temp"]   = ou_step(self.state["supply_air_temp"],  self.state["setpoint"] - 1.0, theta=0.1, sigma=0.1)
        self.state["extract_air_temp"]  = ou_step(self.state["extract_air_temp"], self.state["setpoint"] + 2.0, theta=0.05, sigma=0.1)
        self.state["heat_recovery_pct"] = ou_step(self.state["heat_recovery_pct"], 78.0, theta=0.05, sigma=0.5)

        # Filter fylles sakte opp over tid
        self.state["filter_dp_pa"] = ou_step(self.state["filter_dp_pa"], self.state["filter_dp_pa"] + 0.02, theta=0.0, sigma=0.5)


# ── Frekvensomformer (Danfoss FC) ───────────────────────────────────────────────

@dataclass(kw_only=True)
class VFD(SimulatedDevice):
    device_type: str = "vfd"
    nominal_power_kw: float = 5.0

    def __post_init__(self):
        self.state = {
            "power_kw":   self.nominal_power_kw * 0.6,
            "setpoint":   45.0,                 # Hz
            "frequency":  44.0,
            "current_a":  8.0,
            "motor_temp": 55.0,
        }

    def update(self, price: float):
        if price > 1.20:
            target_freq = 38.0
        elif price < 0.50:
            target_freq = 50.0
        else:
            target_freq = 45.0
        self.state["setpoint"]   = ou_step(self.state["setpoint"],   target_freq,                theta=0.15, sigma=0.3)
        self.state["frequency"]  = ou_step(self.state["frequency"],  self.state["setpoint"] - 1, theta=0.2,  sigma=0.4)
        load_factor = self.state["frequency"] / 50.0
        self.state["power_kw"]   = ou_step(self.state["power_kw"],   self.nominal_power_kw * load_factor, theta=0.2, sigma=0.15)
        self.state["current_a"]  = ou_step(self.state["current_a"],  6.0 + load_factor * 4.0,   theta=0.15, sigma=0.2)
        self.state["motor_temp"] = ou_step(self.state["motor_temp"], 50 + load_factor * 15,     theta=0.05, sigma=0.5)


# ── Varmestyring (Danfoss ECL Comfort) ──────────────────────────────────────────

@dataclass(kw_only=True)
class HeatControl(SimulatedDevice):
    device_type: str = "heat_control"

    def __post_init__(self):
        self.state = {
            "setpoint":         60.0,
            "supply_temp":      57.0,
            "return_temp":      38.0,
            "outdoor_temp":     6.0,
            "valve_position_pct": 65.0,
        }

    def update(self, price: float):
        if price < 0.50:
            target_sp = 65.0
        elif price > 1.20:
            target_sp = 55.0
        else:
            target_sp = 60.0
        self.state["setpoint"]           = ou_step(self.state["setpoint"],         target_sp,                   theta=0.1,  sigma=0.2)
        self.state["supply_temp"]        = ou_step(self.state["supply_temp"],      self.state["setpoint"] - 3,  theta=0.1,  sigma=0.3)
        self.state["return_temp"]        = ou_step(self.state["return_temp"],      self.state["supply_temp"] - 20, theta=0.05, sigma=0.3)
        self.state["outdoor_temp"]       = ou_step(self.state["outdoor_temp"],     6.0,                          theta=0.02, sigma=0.3)
        self.state["valve_position_pct"] = ou_step(self.state["valve_position_pct"], 50 + (target_sp - 55) * 3, theta=0.1,  sigma=1.0)


# ── Factory ────────────────────────────────────────────────────────────────────

_DEVICE_CLASSES = {
    "heat_pump":    HeatPump,
    "cooling":      CoolingUnit,
    "ahu":          AHU,
    "vfd":          VFD,
    "heat_control": HeatControl,
}


def build_device(spec: dict) -> SimulatedDevice:
    """Bygg en simulert enhet fra en YAML-spesifikasjon."""
    cls = _DEVICE_CLASSES[spec["type"]]
    # Drop "type" siden hver klasse setter sin egen device_type
    kwargs = {k: v for k, v in spec.items() if k != "type"}
    return cls(**kwargs)
