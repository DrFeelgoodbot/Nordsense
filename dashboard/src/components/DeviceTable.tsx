import { Thermometer, Wind, Cpu, Zap, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { devices } from '../lib/mockData'

const statusBadge  = { ok: 'badge-ok', warning: 'badge-warn', critical: 'badge-crit' }
const statusIcon   = { ok: CheckCircle2, warning: AlertTriangle, critical: XCircle }
const statusColor  = { ok: 'text-emerald-500', warning: 'text-amber-500', critical: 'text-red-500' }

const mfrColor: Record<string, string> = {
  'Carel':       'bg-violet-50 text-violet-700 border-violet-200',
  'System Air':  'bg-sky-50 text-sky-700 border-sky-200',
  'Danfoss':     'bg-red-50 text-red-700 border-red-200',
  'Eliwell':     'bg-teal-50 text-teal-700 border-teal-200',
  'Swegon':      'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const typeIcon: Record<string, { icon: any; bg: string; color: string; label: string }> = {
  heat_pump:    { icon: Thermometer, bg: 'bg-orange-50', color: 'text-orange-500', label: 'Varmepumpe' },
  cooling:      { icon: Thermometer, bg: 'bg-blue-50',   color: 'text-blue-500',   label: 'Kjøleanlegg' },
  ahu:          { icon: Wind,        bg: 'bg-cyan-50',   color: 'text-cyan-600',   label: 'Ventilasjon (AHU)' },
  vfd:          { icon: Cpu,         bg: 'bg-indigo-50', color: 'text-indigo-500', label: 'Frekvensomformer' },
  heat_control: { icon: Zap,         bg: 'bg-amber-50',  color: 'text-amber-500',  label: 'Varmestyring' },
}

const manufacturers = ['Alle', 'Carel', 'System Air', 'Danfoss', 'Eliwell', 'Swegon']

import { useState } from 'react'

export function DeviceTable() {
  const [filter, setFilter] = useState('Alle')
  const visible = filter === 'Alle' ? devices : devices.filter(d => d.manufacturer === filter)

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Alle HVAC-enheter</span>
        <div className="flex items-center gap-1.5">
          {manufacturers.map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border',
                filter === m
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-600'
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-6 py-2 text-left font-medium">Enhet</th>
              <th className="px-4 py-2 text-left font-medium">Produsent / Modell</th>
              <th className="px-4 py-2 text-right font-medium">Effekt</th>
              <th className="px-4 py-2 text-right font-medium">COP</th>
              <th className="px-4 py-2 text-right font-medium">Setpunkt</th>
              <th className="px-4 py-2 text-right font-medium">Inn / Ut °C</th>
              <th className="px-4 py-2 text-center font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">Feilmelding</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(d => {
              const StatusIcon = statusIcon[d.status as keyof typeof statusIcon]
              const ti = typeIcon[d.type] ?? typeIcon.heat_pump
              const TypeIcon = ti.icon
              const mfc = mfrColor[d.manufacturer] ?? 'bg-slate-50 text-slate-600 border-slate-200'
              return (
                <tr key={d.id} className={clsx('table-row', d.status === 'critical' && 'bg-red-50/30')}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center', ti.bg)}>
                        <TypeIcon size={13} className={ti.color} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{d.name}</div>
                        <div className="text-xs text-slate-400">{ti.label}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded border w-fit', mfc)}>
                        {d.manufacturer}
                      </span>
                      <span className="text-xs text-slate-400">{d.model}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {d.power_kw != null
                      ? <><span className="font-semibold">{d.power_kw}</span><span className="text-slate-400 text-xs"> kW</span></>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {d.cop ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {d.setpoint}°C
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 text-xs">
                    {d.inlet_temp != null ? `${d.inlet_temp}° / ${d.outlet_temp}°` : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center">
                      <StatusIcon size={16} className={statusColor[d.status as keyof typeof statusColor]} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-red-500">
                    {d.alarm ?? <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
        {visible.length} av {devices.length} enheter
      </div>
    </div>
  )
}
