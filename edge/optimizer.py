import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from dataclasses import dataclass
from nordpool import PriceForecast
from modbus_reader import ModbusReader, DeviceReading

log = logging.getLogger(__name__)
TZ = ZoneInfo("Europe/Oslo")


@dataclass
class OptimizationAction:
    device_id: str
    register: str
    old_value: float
    new_value: float
    reason: str


@dataclass
class OptimizationResult:
    timestamp: datetime
    price_nok: float
    price_zone: str        # "cheap" | "normal" | "expensive"
    actions: list[OptimizationAction]
    estimated_saving_kwh: float = 0.0


class HvacOptimizer:
    def __init__(self, config: dict, modbus: ModbusReader):
        self.cfg = config
        self.modbus = modbus
        self.low = config["price_threshold_low"]
        self.high = config["price_threshold_high"]
        self.comfort = config["comfort"]
        self.preheat_delta = config["preheat_delta"]
        self.precool_delta = config["precool_delta"]

    def run(self, readings: list[DeviceReading], forecast: PriceForecast) -> OptimizationResult:
        now = datetime.now(TZ)
        price = forecast.price_at(now)
        if price is None:
            log.warning("Ingen priser tilgjengelig for nå — hopper over optimering")
            return OptimizationResult(timestamp=now, price_nok=0.0, price_zone="unknown", actions=[])

        zone = self._price_zone(price)
        log.info("Strømpris nå: %.4f kr/kWh (%s)", price, zone)

        actions = []
        for reading in readings:
            if not reading.online:
                continue
            if reading.alarm_code > 0:
                log.info("Hopper over %s — aktiv alarm %d", reading.device_id, reading.alarm_code)
                continue

            if reading.device_type == "heat_pump":
                action = self._optimize_heat_pump(reading, zone, forecast, now)
            elif reading.device_type == "cooling":
                action = self._optimize_cooling(reading, zone, forecast, now)
            else:
                action = None

            if action:
                actions.append(action)
                self.modbus.write_setpoint(action.device_id, action.register, action.new_value)

        saving = self._estimate_saving(actions, price)
        return OptimizationResult(
            timestamp=now,
            price_nok=price,
            price_zone=zone,
            actions=actions,
            estimated_saving_kwh=saving,
        )

    def _optimize_heat_pump(
        self, reading: DeviceReading, zone: str, forecast: PriceForecast, now: datetime
    ) -> OptimizationAction | None:
        current_sp = reading.values.get("setpoint")
        if current_sp is None:
            return None

        min_sp = self.comfort["heat_setpoint_min"]
        max_sp = self.comfort["heat_setpoint_max"]

        if zone == "cheap":
            # Forvarm — lagre termisk energi i bygg
            target = min(current_sp + self.preheat_delta, max_sp)
            reason = "Billig strøm — forvarm for å lagre termisk energi"
        elif zone == "expensive":
            # Reduser — bruk lagret varme
            target = max(current_sp - self.preheat_delta, min_sp)
            reason = "Dyr strøm — reduser setpunkt, bruk termisk buffer"
        else:
            # Normal — se om neste time er billig og forvarm litt
            next_hour = now.replace(minute=0, second=0).replace(hour=(now.hour + 1) % 24)
            next_price = forecast.price_at(next_hour)
            if next_price and next_price < self.low:
                target = min(current_sp + 0.5, max_sp)
                reason = f"Neste time billig ({next_price:.2f} kr) — start forsiktig forvarming"
            else:
                return None

        target = round(target, 1)
        if abs(target - current_sp) < 0.2:
            return None

        return OptimizationAction(
            device_id=reading.device_id,
            register="setpoint",
            old_value=current_sp,
            new_value=target,
            reason=reason,
        )

    def _optimize_cooling(
        self, reading: DeviceReading, zone: str, forecast: PriceForecast, now: datetime
    ) -> OptimizationAction | None:
        current_sp = reading.values.get("setpoint")
        if current_sp is None:
            return None

        min_sp = self.comfort["cool_setpoint_min"]
        max_sp = self.comfort["cool_setpoint_max"]

        if zone == "cheap":
            # Prekjøl — kjøl ned mer enn nødvendig, lagre kulde
            target = max(current_sp + self.precool_delta, min_sp)
            reason = "Billig strøm — prekjøl for termisk lagring"
        elif zone == "expensive":
            # Slapp av kjøling — la temperaturen stige litt
            target = min(current_sp - self.precool_delta, max_sp)
            reason = "Dyr strøm — øk setpunkt, bruk termisk buffer"
        else:
            return None

        target = round(target, 1)
        if abs(target - current_sp) < 0.2:
            return None

        return OptimizationAction(
            device_id=reading.device_id,
            register="setpoint",
            old_value=current_sp,
            new_value=target,
            reason=reason,
        )

    def _price_zone(self, price: float) -> str:
        if price <= self.low:
            return "cheap"
        if price >= self.high:
            return "expensive"
        return "normal"

    def _estimate_saving(self, actions: list[OptimizationAction], price: float) -> float:
        # Grov estimering: 1°C setpunktreduksjon ≈ 3% energibesparelse
        total_kwh = 0.0
        for action in actions:
            delta = action.old_value - action.new_value
            if delta > 0:  # reduksjon
                total_kwh += delta * 0.03 * price
        return round(total_kwh, 4)
