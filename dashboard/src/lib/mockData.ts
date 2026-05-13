import { addHours, startOfDay, format } from 'date-fns'

export const buildings = [
  { id: 'bygg-a', name: 'Storgata 12', city: 'Oslo', area_m2: 8400, floors: 12, devices: 4, status: 'ok' },
  { id: 'bygg-b', name: 'Lysaker Atrium', city: 'Bærum', area_m2: 15200, floors: 8, devices: 6, status: 'warning' },
  { id: 'bygg-c', name: 'Aker Brygge Tower', city: 'Oslo', area_m2: 22100, floors: 18, devices: 10, status: 'ok' },
  { id: 'bygg-d', name: 'Fornebu Park', city: 'Bærum', area_m2: 11800, floors: 6, devices: 5, status: 'critical' },
  { id: 'bygg-e', name: 'Nydalen Hub', city: 'Oslo', area_m2: 9600, floors: 10, devices: 4, status: 'ok' },
]

export const devices = [
  // Carel pCO5+ — Storgata 12
  { id: 'c-vp1', building_id: 'bygg-a', name: 'Varmepumpe 1', manufacturer: 'Carel', model: 'pCO5', type: 'heat_pump',   power_kw: 12.4, cop: 3.8,  setpoint: 21.5, inlet_temp: 18.2, outlet_temp: 24.1, status: 'ok',       alarm: null },
  { id: 'c-vp2', building_id: 'bygg-a', name: 'Varmepumpe 2', manufacturer: 'Carel', model: 'pCO5', type: 'heat_pump',   power_kw: 11.8, cop: 3.6,  setpoint: 21.0, inlet_temp: 17.9, outlet_temp: 23.8, status: 'ok',       alarm: null },
  { id: 'c-kj1', building_id: 'bygg-a', name: 'Kjøleanlegg 1', manufacturer: 'Carel', model: 'pCO5', type: 'cooling',    power_kw: 8.2,  cop: null, setpoint: 22.0, inlet_temp: 24.5, outlet_temp: 19.2, status: 'warning',  alarm: 'Høy kondenseringstemperatur' },
  // System Air SAVE — Storgata 12
  { id: 'sa-v1', building_id: 'bygg-a', name: 'Ventilasjon 1', manufacturer: 'System Air', model: 'Topline_SAVE', type: 'ahu', power_kw: 3.1, cop: null, setpoint: 19.0, inlet_temp: 17.5, outlet_temp: 20.2, status: 'ok', alarm: null },

  // Danfoss FC302 drives — Lysaker Atrium
  { id: 'd-dr1', building_id: 'bygg-b', name: 'Pumpe-frekvensomformer 1', manufacturer: 'Danfoss', model: 'FC_drive', type: 'vfd', power_kw: 5.2, cop: null, setpoint: 45.0, inlet_temp: 42.1, outlet_temp: 48.3, status: 'ok', alarm: null },
  { id: 'd-dr2', building_id: 'bygg-b', name: 'Vifte-frekvensomformer 1', manufacturer: 'Danfoss', model: 'FC_drive', type: 'vfd', power_kw: 4.8, cop: null, setpoint: 50.0, inlet_temp: null, outlet_temp: null, status: 'ok', alarm: null },
  // Danfoss ECL Comfort — Lysaker Atrium
  { id: 'd-ecl', building_id: 'bygg-b', name: 'Varmestyring ECL', manufacturer: 'Danfoss', model: 'ECL_Comfort', type: 'heat_control', power_kw: null, cop: null, setpoint: 60.0, inlet_temp: 57.2, outlet_temp: 38.4, status: 'warning', alarm: 'Sensor feil — inntak' },
  // Swegon GOLD — Lysaker Atrium
  { id: 'sw-g1', building_id: 'bygg-b', name: 'GOLD RX 150', manufacturer: 'Swegon', model: 'GOLD', type: 'ahu', power_kw: 7.4, cop: 4.2, setpoint: 18.5, inlet_temp: 16.2, outlet_temp: 20.1, status: 'ok', alarm: null },
  { id: 'sw-g2', building_id: 'bygg-b', name: 'GOLD RX 150 (2)', manufacturer: 'Swegon', model: 'GOLD', type: 'ahu', power_kw: 6.9, cop: 4.0, setpoint: 18.5, inlet_temp: 15.8, outlet_temp: 19.8, status: 'ok', alarm: null },

  // Carel IR33 + Eliwell EWCM — Aker Brygge Tower
  { id: 'e-ew1', building_id: 'bygg-c', name: 'Kjølerom multi-kompressor', manufacturer: 'Eliwell', model: 'EWCM_4120', type: 'cooling', power_kw: 22.6, cop: null, setpoint: -18.0, inlet_temp: -16.2, outlet_temp: -20.1, status: 'critical', alarm: 'Lav kjølemiddeltrykk' },
  { id: 'c-ir1', building_id: 'bygg-c', name: 'Kjøledisk 1', manufacturer: 'Carel', model: 'IR33', type: 'cooling', power_kw: 1.8, cop: null, setpoint: 4.0, inlet_temp: 5.2, outlet_temp: 2.8, status: 'ok', alarm: null },
  { id: 'c-ir2', building_id: 'bygg-c', name: 'Kjøledisk 2', manufacturer: 'Carel', model: 'IR33', type: 'cooling', power_kw: 1.6, cop: null, setpoint: 4.0, inlet_temp: 5.0, outlet_temp: 3.1, status: 'ok', alarm: null },
  // Swegon GOLD — Aker Brygge Tower
  { id: 'sw-g3', building_id: 'bygg-c', name: 'GOLD VX 200', manufacturer: 'Swegon', model: 'GOLD', type: 'ahu', power_kw: 14.2, cop: 3.5, setpoint: 18.0, inlet_temp: 15.5, outlet_temp: 20.8, status: 'ok', alarm: null },

  // Eliwell IC915 + Danfoss Optyma — Fornebu Park
  { id: 'e-ic1', building_id: 'bygg-d', name: 'Kjøledisk 1', manufacturer: 'Eliwell', model: 'IC915', type: 'cooling', power_kw: 1.4, cop: null, setpoint: 4.0, inlet_temp: 5.5, outlet_temp: 2.9, status: 'critical', alarm: 'Motorvern utløst' },
  { id: 'd-opt', building_id: 'bygg-d', name: 'Optyma kondenser', manufacturer: 'Danfoss', model: 'Optyma_Plus', type: 'cooling', power_kw: 12.8, cop: null, setpoint: 38.0, inlet_temp: 35.2, outlet_temp: 42.1, status: 'critical', alarm: 'Høy kondenseringstemperatur' },
  { id: 'sa-v2', building_id: 'bygg-d', name: 'Ventilasjon 1', manufacturer: 'System Air', model: 'Topline_SAVE', type: 'ahu', power_kw: 4.2, cop: null, setpoint: 19.0, inlet_temp: 17.0, outlet_temp: 20.5, status: 'ok', alarm: null },

  // System Air + Carel pCO5 — Nydalen Hub
  { id: 'sa-v3', building_id: 'bygg-e', name: 'SAVE VTR 500', manufacturer: 'System Air', model: 'Topline_SAVE', type: 'ahu', power_kw: 5.8, cop: null, setpoint: 18.5, inlet_temp: 16.4, outlet_temp: 20.1, status: 'ok', alarm: null },
  { id: 'c-vp3', building_id: 'bygg-e', name: 'Varmepumpe 1', manufacturer: 'Carel', model: 'pCO5', type: 'heat_pump', power_kw: 18.6, cop: 4.1, setpoint: 22.0, inlet_temp: 19.4, outlet_temp: 25.3, status: 'ok', alarm: null },
  { id: 'sw-casa', building_id: 'bygg-e', name: 'CASA R (etasje 3)', manufacturer: 'Swegon', model: 'CASA_R', type: 'ahu', power_kw: 0.6, cop: null, setpoint: 20.0, inlet_temp: 18.5, outlet_temp: 21.0, status: 'ok', alarm: null },
]

function generatePrices(): { hour: number; price: number; date: string }[] {
  const base = [0.38, 0.34, 0.31, 0.29, 0.28, 0.30, 0.44, 0.72, 0.95, 1.08, 1.18, 1.22,
                 1.15, 1.05, 0.98, 1.12, 1.35, 1.48, 1.42, 1.28, 1.05, 0.82, 0.61, 0.45]
  const today = format(new Date(), 'yyyy-MM-dd')
  return base.map((p, i) => ({ hour: i, price: p + (Math.random() * 0.04 - 0.02), date: today }))
}

export const nordpoolPrices = generatePrices()

export const currentPrice = (() => {
  const h = new Date().getHours()
  return nordpoolPrices[h]?.price ?? 0.85
})()

function generateTelemetry(deviceId: string, hours = 24) {
  const now = new Date()
  return Array.from({ length: hours }, (_, i) => {
    const t = addHours(startOfDay(now), i)
    const price = nordpoolPrices[i]?.price ?? 0.8
    const powerBase = 10 + Math.random() * 6
    const powerAdj = price < 0.5 ? powerBase * 1.15 : price > 1.2 ? powerBase * 0.75 : powerBase
    return {
      time: format(t, 'HH:mm'),
      fullTime: t.toISOString(),
      power_kw: +powerAdj.toFixed(2),
      setpoint: price < 0.5 ? 23.0 : price > 1.2 ? 19.5 : 21.0,
      cop: +(3.2 + Math.random() * 1.2).toFixed(2),
      price,
    }
  })
}

export const telemetryData = generateTelemetry('all')

export const alarms = [
  { id: 1, device: 'Kjøleanlegg 1', building: 'Storgata 12', severity: 'warning', text: 'Høy kondenseringstemperatur', time: '08:42', acknowledged: false },
  { id: 2, device: 'Varmepumpe 1', building: 'Aker Brygge Tower', severity: 'critical', text: 'Lav kjølemiddeltrykk', time: '06:17', acknowledged: false },
  { id: 3, device: 'Varmepumpe 2', building: 'Fornebu Park', severity: 'critical', text: 'Motorvern utløst', time: '05:03', acknowledged: true },
  { id: 4, device: 'Kjøleanlegg 2', building: 'Lysaker Atrium', severity: 'warning', text: 'Sensor feil — inntak', time: 'I går 22:11', acknowledged: true },
  { id: 5, device: 'Varmepumpe 3', building: 'Nydalen Hub', severity: 'info', text: 'Planlagt vedlikehold', time: 'I går 14:00', acknowledged: true },
]

export const optimizationLog = [
  { time: '10:00', zone: 'expensive', action: 'Reduserte setpunkt 22→20°C', devices: 3, saving: 0.42 },
  { time: '09:00', zone: 'expensive', action: 'Reduserte setpunkt 22→20°C', devices: 3, saving: 0.38 },
  { time: '06:00', zone: 'cheap', action: 'Forvarmte til 23°C', devices: 5, saving: -0.12 },
  { time: '04:00', zone: 'cheap', action: 'Forvarmte til 23.5°C', devices: 5, saving: -0.18 },
  { time: '02:00', zone: 'cheap', action: 'Forvarmte til 23°C', devices: 4, saving: -0.09 },
]

export const kpis = {
  totalPowerKw: 89.4,
  totalCostToday: 1842,
  savingsToday: 312,
  savingsPct: 14.5,
  activeAlarms: 2,
  criticalAlarms: 2,
  buildings: buildings.length,
  avgCop: 3.85,
}

export const energyByBuilding = buildings.map(b => ({
  name: b.name.split(' ')[0],
  fullName: b.name,
  kw: +(8 + Math.random() * 20).toFixed(1),
  cost: Math.round(800 + Math.random() * 1200),
}))
