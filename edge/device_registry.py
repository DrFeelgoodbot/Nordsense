"""
Device Registry — laster alle produsent-YAML-filer og bygger et komplett
registerbibliotek som ModbusReader kan bruke direkte.

Støttede produsenter: Carel, System Air, Danfoss, Eliwell, Swegon
"""
import logging
from pathlib import Path
from typing import Any
import yaml

log = logging.getLogger(__name__)

DEVICES_DIR = Path(__file__).parent / "devices"

# Mappping fra produsent-nøkkel i config til YAML-filnavn
MANUFACTURER_FILES = {
    "carel":      "carel.yaml",
    "systemair":  "systemair.yaml",
    "danfoss":    "danfoss.yaml",
    "eliwell":    "eliwell.yaml",
    "swegon":     "swegon.yaml",
}

# Hvilke kategorier av registre som inneholder Modbus-adresser
REGISTER_SECTIONS = {
    "temperatures", "airflow", "air_quality", "heat_recovery", "coils",
    "coils_valves", "energy", "fans", "filters", "setpoints", "control",
    "status", "alarms", "analog_inputs", "analog_outputs", "digital_inputs",
    "digital_outputs", "compressors", "defrost", "readouts", "registers",
}

# Kategorier som alltid er skrivbare (override)
WRITABLE_SECTIONS = {"setpoints", "control"}

# Kategorier som aldri er skrivbare
READONLY_SECTIONS = {
    "temperatures", "airflow", "air_quality", "heat_recovery", "energy",
    "fans", "filters", "status", "analog_inputs", "compressors", "defrost",
    "readouts",
}


class DeviceRegistry:
    def __init__(self):
        self._library: dict[str, dict] = {}
        self._load_all()

    def _load_all(self):
        for mfr, filename in MANUFACTURER_FILES.items():
            path = DEVICES_DIR / filename
            if not path.exists():
                log.warning("Enhetsfil ikke funnet: %s", path)
                continue
            try:
                with open(path, encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                self._library[mfr] = data
                models = [k for k in data if k not in ("manufacturer",)]
                log.info("Lastet %s: %s", mfr, ", ".join(models))
            except Exception as e:
                log.error("Klarte ikke laste %s: %s", filename, e)

    def get_register_map(self, manufacturer: str, model: str) -> dict[str, Any]:
        """
        Returnerer et flatt registermap: { register_name: register_config }
        Slår sammen alle seksjoner fra modellen.
        """
        mfr_data = self._library.get(manufacturer.lower())
        if not mfr_data:
            raise ValueError(f"Ukjent produsent: {manufacturer}")

        model_data = mfr_data.get(model)
        if not model_data:
            available = [k for k in mfr_data if k != "manufacturer"]
            raise ValueError(f"Ukjent modell '{model}' for {manufacturer}. Tilgjengelige: {available}")

        flat: dict[str, Any] = {}
        for section, content in model_data.items():
            if section not in REGISTER_SECTIONS or not isinstance(content, dict):
                continue
            for reg_name, reg_cfg in content.items():
                if not isinstance(reg_cfg, dict) or "address" not in reg_cfg:
                    continue
                enriched = dict(reg_cfg)
                # Sett writable basert på seksjonstype om ikke eksplisitt angitt
                if "writable" not in enriched:
                    enriched["writable"] = section in WRITABLE_SECTIONS
                enriched["_section"] = section
                flat[reg_name] = enriched

        if not flat:
            raise ValueError(f"Ingen registre funnet for {manufacturer}/{model}")

        log.debug("Registermap %s/%s: %d registre", manufacturer, model, len(flat))
        return flat

    def get_alarm_map(self, manufacturer: str, model: str) -> dict:
        """Returnerer alarm_codes / alarm_bits for produsent/modell."""
        mfr_data = self._library.get(manufacturer.lower(), {})
        model_data = mfr_data.get(model, {})

        result = {}
        for key, val in model_data.items():
            if "alarm" in key.lower() and isinstance(val, dict):
                result.update(val)
        return result

    def get_connection_params(self, manufacturer: str, model: str) -> dict:
        """Returnerer tilkoblingsparametre (baud, parity, stopbits, …)."""
        mfr_data = self._library.get(manufacturer.lower(), {})
        model_data = mfr_data.get(model, {})
        params = {}
        for key in ("baud", "parity", "stopbits", "word_order", "timeout",
                    "function_code_read", "function_code_write"):
            if key in model_data:
                params[key] = model_data[key]
        return params

    def list_manufacturers(self) -> list[str]:
        return list(self._library.keys())

    def list_models(self, manufacturer: str) -> list[str]:
        mfr_data = self._library.get(manufacturer.lower(), {})
        return [k for k in mfr_data if k != "manufacturer"]

    def decode_alarm(self, manufacturer: str, model: str, alarm_word: int) -> list[str]:
        """Dekoder en alarm-bitmask til tekstliste."""
        alarm_map = self.get_alarm_map(manufacturer, model)
        active = []
        for bit_or_code, text in alarm_map.items():
            if isinstance(bit_or_code, int):
                if alarm_word & bit_or_code:
                    active.append(text)
            elif isinstance(bit_or_code, str):
                try:
                    bit = int(bit_or_code, 16)
                    if alarm_word & bit:
                        active.append(text)
                except ValueError:
                    pass
        return active


# Singleton
_registry: DeviceRegistry | None = None

def get_registry() -> DeviceRegistry:
    global _registry
    if _registry is None:
        _registry = DeviceRegistry()
    return _registry


# ── Hjelpefunksjon: bygg config.yaml-enhetsblokk fra registry ────────────────
def build_device_config(
    device_id: str,
    device_name: str,
    manufacturer: str,
    model: str,
    slave_address: int,
    device_type: str,
    register_override: dict | None = None,
) -> dict:
    """
    Genererer en enhetsblokk klar for ModbusReader basert på registry-data.
    register_override kan brukes for å overstyre enkeltregistre.
    """
    reg = get_registry()
    registers = reg.get_register_map(manufacturer, model)
    if register_override:
        registers.update(register_override)

    return {
        "id": device_id,
        "name": device_name,
        "manufacturer": manufacturer,
        "model": model,
        "type": device_type,
        "slave_address": slave_address,
        "registers": registers,
    }
