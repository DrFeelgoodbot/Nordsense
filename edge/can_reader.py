import can
import logging
import time
import threading
from dataclasses import dataclass, field
from typing import Callable, Optional

log = logging.getLogger(__name__)

# J1939 / proprietær CAN feilkode-mapping
# Tilpass til faktiske CAN-meldinger fra ditt anlegg
FAULT_SEVERITY = {
    range(0x00, 0x10): "info",
    range(0x10, 0x20): "warning",
    range(0x20, 0xFF): "critical",
}

def _severity(fault_code: int) -> str:
    for r, sev in FAULT_SEVERITY.items():
        if fault_code in r:
            return sev
    return "unknown"


@dataclass
class CanMessage:
    timestamp: float
    arbitration_id: int
    data: bytes
    fault_code: Optional[int] = None
    fault_text: Optional[str] = None
    severity: str = "info"
    device_id: str = "unknown"


@dataclass
class CanReading:
    timestamp: float
    messages: list[CanMessage] = field(default_factory=list)
    active_faults: list[CanMessage] = field(default_factory=list)


class CanReader:
    def __init__(self, config: dict):
        self.channel = config["channel"]
        self.bustype = config["bustype"]
        self.bitrate = config["bitrate"]
        self.fault_ids = set(config.get("fault_ids", []))
        self._bus: Optional[can.BusABC] = None
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._latest: CanReading = CanReading(timestamp=time.time())
        self._lock = threading.Lock()
        self._on_fault: Optional[Callable] = None

    def set_fault_callback(self, callback: Callable):
        """Kalles umiddelbart når en kritisk feil oppdages."""
        self._on_fault = callback

    def start(self):
        try:
            self._bus = can.interface.Bus(
                channel=self.channel,
                bustype=self.bustype,
                bitrate=self.bitrate,
            )
            self._running = True
            self._thread = threading.Thread(target=self._listen, daemon=True)
            self._thread.start()
            log.info("CAN-bus lytter startet på %s", self.channel)
        except Exception as e:
            log.error("Klarte ikke starte CAN-bus: %s", e)

    def stop(self):
        self._running = False
        if self._bus:
            self._bus.shutdown()
        log.info("CAN-bus lytter stoppet")

    def get_latest(self) -> CanReading:
        with self._lock:
            return self._latest

    def _listen(self):
        active_faults: dict[int, CanMessage] = {}

        while self._running:
            try:
                msg = self._bus.recv(timeout=1.0)
                if msg is None:
                    continue

                can_msg = self._parse(msg)

                if msg.arbitration_id in self.fault_ids:
                    if can_msg.fault_code and can_msg.fault_code > 0:
                        active_faults[msg.arbitration_id] = can_msg
                        log.warning(
                            "CAN feil [0x%X] %s: %s",
                            msg.arbitration_id,
                            can_msg.severity,
                            can_msg.fault_text or can_msg.fault_code,
                        )
                        if can_msg.severity == "critical" and self._on_fault:
                            self._on_fault(can_msg)
                    else:
                        # feilkode 0 = kvittert
                        active_faults.pop(msg.arbitration_id, None)

                with self._lock:
                    self._latest = CanReading(
                        timestamp=time.time(),
                        messages=[can_msg],
                        active_faults=list(active_faults.values()),
                    )

            except can.CanError as e:
                log.error("CAN feil: %s", e)
                time.sleep(1)

    def _parse(self, msg: can.Message) -> CanMessage:
        data = msg.data
        fault_code = data[0] if len(data) > 0 else 0
        device_byte = data[1] if len(data) > 1 else 0

        fault_text = self._fault_text(msg.arbitration_id, fault_code)
        severity = _severity(fault_code) if fault_code > 0 else "info"

        return CanMessage(
            timestamp=msg.timestamp,
            arbitration_id=msg.arbitration_id,
            data=bytes(data),
            fault_code=fault_code,
            fault_text=fault_text,
            severity=severity,
            device_id=f"can_device_{device_byte:02x}",
        )

    def _fault_text(self, arb_id: int, fault_code: int) -> Optional[str]:
        # Tilpass til ditt anleggs feilkodetabell
        fault_table = {
            (0x100, 0x01): "Høy kondenseringstemperatur",
            (0x100, 0x02): "Lav fordampningstemperatur",
            (0x100, 0x03): "Høy trykkdifferanse",
            (0x101, 0x01): "Kommunikasjonstimeout enhet 1",
            (0x101, 0x02): "Kommunikasjonstimeout enhet 2",
            (0x200, 0x10): "Nødstopp aktivert",
            (0x200, 0x11): "Motorvern utløst",
        }
        return fault_table.get((arb_id, fault_code))
