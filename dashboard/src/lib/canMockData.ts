import { format, subMinutes, subHours } from 'date-fns'

// ── CAN-bus konfigurasjon (speiler can_reader.py) ─────────────────────────
export const CAN_IDS = [
  { id: 0x100, name: 'Kompressor-node',   description: 'Kompressor-status og trykkalarm' },
  { id: 0x101, name: 'Kommunikasjon',     description: 'Bus-kommunikasjonstimeout' },
  { id: 0x200, name: 'Nødstopp/sikring',  description: 'Nødstopp og motorvern' },
  { id: 0x300, name: 'Temperatur-node',   description: 'Temperaturalarmer alle soner' },
  { id: 0x301, name: 'Trykk-node',        description: 'Høy-/lavtrykksvakter' },
  { id: 0x400, name: 'Vifte-node',        description: 'Kondensatorvifter' },
  { id: 0x500, name: 'Heartbeat',         description: 'Systemstatus puls (hvert 10s)' },
]

export const FAULT_TABLE: Record<string, string> = {
  '0x100-0x01': 'Høy kondenseringstemperatur',
  '0x100-0x02': 'Lav fordampningstemperatur',
  '0x100-0x03': 'Høy trykkdifferanse',
  '0x100-0x04': 'Kompressor overbelastning',
  '0x101-0x01': 'Kommunikasjonstimeout enhet 1',
  '0x101-0x02': 'Kommunikasjonstimeout enhet 2',
  '0x101-0x03': 'Bussfeil — ingen respons',
  '0x200-0x10': 'Nødstopp aktivert',
  '0x200-0x11': 'Motorvern utløst',
  '0x200-0x12': 'Jordfeil registrert',
  '0x300-0x01': 'Høy romtemperatur sone A',
  '0x300-0x02': 'Lav romtemperatur sone B',
  '0x300-0x03': 'Temperatursonde feil',
  '0x301-0x01': 'Høytrykksalarm',
  '0x301-0x02': 'Lavtrykksalarm',
  '0x400-0x01': 'Kondensatorvifte stopp',
  '0x400-0x02': 'Vifte overtemperatur',
}

export interface CanFrame {
  id: string
  timestamp: Date
  arbitration_id: number
  can_id_hex: string
  can_id_name: string
  data_hex: string
  byte0: number     // fault_code
  byte1: number     // device_byte
  byte2: number     // value high
  byte3: number     // value low
  fault_code: number
  fault_text: string | null
  severity: 'info' | 'warning' | 'critical'
  device_id: string
  resolved: boolean
  resolved_at: Date | null
  duration_min: number | null
}

function severity(code: number): 'info' | 'warning' | 'critical' {
  if (code === 0) return 'info'
  if (code < 0x10) return 'info'
  if (code < 0x20) return 'warning'
  return 'critical'
}

function randomHex(bytes = 8): string {
  return Array.from({ length: bytes }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
  ).join(' ')
}

function makeFrame(
  minutesAgo: number,
  arb_id: number,
  fault_code: number,
  device_byte: number,
  resolved = false,
  resolvedAfterMin: number | null = null,
): CanFrame {
  const ts = subMinutes(new Date(), minutesAgo)
  const hexId = `0x${arb_id.toString(16).toUpperCase()}`
  const key = `${hexId}-0x${fault_code.toString(16).padStart(2, '0')}`
  const canNode = CAN_IDS.find(c => c.id === arb_id)
  const sev = severity(fault_code)
  const resolvedAt = resolved && resolvedAfterMin != null
    ? subMinutes(new Date(), minutesAgo - resolvedAfterMin)
    : null
  const b2 = Math.floor(Math.random() * 256)
  const b3 = Math.floor(Math.random() * 256)

  return {
    id: `${arb_id}-${fault_code}-${minutesAgo}`,
    timestamp: ts,
    arbitration_id: arb_id,
    can_id_hex: hexId,
    can_id_name: canNode?.name ?? `Node ${hexId}`,
    data_hex: [
      fault_code.toString(16).padStart(2,'0').toUpperCase(),
      device_byte.toString(16).padStart(2,'0').toUpperCase(),
      b2.toString(16).padStart(2,'0').toUpperCase(),
      b3.toString(16).padStart(2,'0').toUpperCase(),
      '00', '00', '00', '00',
    ].join(' '),
    byte0: fault_code,
    byte1: device_byte,
    byte2: b2,
    byte3: b3,
    fault_code,
    fault_text: FAULT_TABLE[key] ?? null,
    severity: sev,
    device_id: `can_device_${device_byte.toString(16).padStart(2,'0')}`,
    resolved,
    resolved_at: resolvedAt,
    duration_min: resolvedAt != null ? resolvedAfterMin : null,
  }
}

// ── Historikk siste 24t ───────────────────────────────────────────────────
export const canHistory: CanFrame[] = [
  makeFrame(2,   0x100, 0x01, 0x01, false),           // aktiv — Høy kondenseringstemperatur
  makeFrame(5,   0x200, 0x11, 0x02, false),           // aktiv — Motorvern utløst
  makeFrame(18,  0x301, 0x01, 0x01, true, 12),        // løst — Høytrykksalarm
  makeFrame(32,  0x101, 0x01, 0x03, true, 8),         // løst — Kommunikasjonstimeout
  makeFrame(45,  0x100, 0x03, 0x01, true, 22),        // løst — Høy trykkdifferanse
  makeFrame(60,  0x300, 0x01, 0x04, true, 15),        // løst — Høy romtemperatur sone A
  makeFrame(75,  0x400, 0x01, 0x05, false),           // aktiv — Kondensatorvifte stopp
  makeFrame(90,  0x101, 0x02, 0x03, true, 5),         // løst
  makeFrame(120, 0x200, 0x10, 0x02, true, 3),         // løst — Nødstopp
  makeFrame(150, 0x301, 0x02, 0x01, true, 30),        // løst — Lavtrykksalarm
  makeFrame(180, 0x100, 0x02, 0x01, true, 18),        // løst
  makeFrame(210, 0x300, 0x03, 0x04, true, 45),        // løst — Sensor feil
  makeFrame(240, 0x100, 0x04, 0x01, true, 60),        // løst — Kompressor overbelastning
  makeFrame(300, 0x200, 0x12, 0x02, true, 10),        // løst — Jordfeil
  makeFrame(360, 0x101, 0x03, 0x03, true, 25),        // løst
  makeFrame(420, 0x301, 0x01, 0x01, true, 40),
  makeFrame(480, 0x100, 0x01, 0x01, true, 20),
  makeFrame(540, 0x400, 0x02, 0x05, true, 12),
  makeFrame(600, 0x300, 0x02, 0x04, true, 35),
  makeFrame(660, 0x101, 0x01, 0x03, true, 18),
  makeFrame(720, 0x200, 0x11, 0x02, true, 8),
  makeFrame(780, 0x100, 0x03, 0x01, true, 22),
  makeFrame(840, 0x301, 0x02, 0x01, true, 15),
  makeFrame(900, 0x400, 0x01, 0x05, true, 30),
]

// ── Live melding-feed (siste 50 meldinger inkl heartbeat/status) ──────────
function makeLive(secAgo: number, arb_id: number, fault_code: number, device_byte: number): CanFrame {
  return makeFrame(secAgo / 60, arb_id, fault_code, device_byte, fault_code === 0)
}

export const liveFeed: CanFrame[] = [
  makeLive(2,  0x500, 0x00, 0x01),   // heartbeat
  makeLive(4,  0x500, 0x00, 0x02),
  makeLive(5,  0x100, 0x01, 0x01),   // fault aktiv
  makeLive(8,  0x500, 0x00, 0x03),
  makeLive(10, 0x301, 0x00, 0x01),   // ok
  makeLive(12, 0x500, 0x00, 0x01),
  makeLive(15, 0x200, 0x11, 0x02),   // motorvern
  makeLive(16, 0x500, 0x00, 0x02),
  makeLive(18, 0x400, 0x01, 0x05),   // vifte stopp
  makeLive(20, 0x500, 0x00, 0x03),
  makeLive(22, 0x101, 0x00, 0x03),   // ok
  makeLive(24, 0x500, 0x00, 0x01),
  makeLive(26, 0x300, 0x00, 0x04),   // ok
  makeLive(28, 0x500, 0x00, 0x02),
  makeLive(30, 0x100, 0x01, 0x01),   // fault pågår
]

// ── Meldingsfrekvens per time (siste 24t) ─────────────────────────────────
export const messageRatePerHour = Array.from({ length: 24 }, (_, i) => {
  const h = (new Date().getHours() - 23 + i + 24) % 24
  const base = 60 + Math.random() * 40
  const faults = i > 20 ? 3 : Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0
  return {
    hour: `${h.toString().padStart(2, '0')}:00`,
    total: Math.round(base),
    faults,
    heartbeat: Math.round(base * 0.6),
    status: Math.round(base * 0.3),
  }
})

// ── KPI-er ─────────────────────────────────────────────────────────────────
export const canKpis = {
  totalMessagesToday: 1842,
  activeFaults: canHistory.filter(f => !f.resolved).length,
  criticalActive: canHistory.filter(f => !f.resolved && f.severity === 'critical').length,
  resolvedToday: canHistory.filter(f => f.resolved).length,
  avgResolutionMin: Math.round(
    canHistory.filter(f => f.resolved && f.duration_min != null)
      .reduce((s, f) => s + (f.duration_min ?? 0), 0) /
    Math.max(1, canHistory.filter(f => f.resolved && f.duration_min != null).length)
  ),
  busLoad_pct: 12.4,   // % av 250kbps kapasitet
  nodeCount: CAN_IDS.length,
  onlineNodes: CAN_IDS.length - 1,
}

// ── Feilfrekvens (topp feil siste 24t) ────────────────────────────────────
export const faultFrequency = Object.entries(
  canHistory.reduce((acc, f) => {
    const k = f.fault_text ?? `Kode 0x${f.fault_code.toString(16)}`
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
)
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 8)

// ── Alvorlighetsfordeling ─────────────────────────────────────────────────
export const severityDist = [
  { name: 'Kritisk', value: canHistory.filter(f => f.severity === 'critical').length, color: '#ef4444' },
  { name: 'Advarsel', value: canHistory.filter(f => f.severity === 'warning').length, color: '#f59e0b' },
  { name: 'Info',    value: canHistory.filter(f => f.severity === 'info').length,     color: '#10b981' },
]

// ── Per-node statistikk ───────────────────────────────────────────────────
export const nodeStats = CAN_IDS.map(node => {
  const frames = canHistory.filter(f => f.arbitration_id === node.id)
  const active = frames.filter(f => !f.resolved)
  const critical = frames.filter(f => f.severity === 'critical')
  return {
    ...node,
    id_hex: `0x${node.id.toString(16).toUpperCase()}`,
    total_faults: frames.length,
    active_faults: active.length,
    critical_faults: critical.length,
    online: node.id !== 0x400,   // simuler at vifte-node er offline
    last_seen: active.length > 0 ? active[0].timestamp : subMinutes(new Date(), 2),
  }
})
