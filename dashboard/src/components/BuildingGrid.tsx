import { Building2, Thermometer, Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import clsx from 'clsx'
import { buildings, energyByBuilding } from '../lib/mockData'

const statusIcon = { ok: CheckCircle2, warning: AlertTriangle, critical: XCircle }
const statusColor = { ok: 'text-emerald-500', warning: 'text-amber-500', critical: 'text-red-500' }
const statusBadge = { ok: 'badge-ok', warning: 'badge-warn', critical: 'badge-crit' }
const statusLabel = { ok: 'OK', warning: 'Advarsel', critical: 'Kritisk' }

export function BuildingGrid({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title flex items-center gap-2">
          Bygningsportefølje
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">Demo</span>
        </span>
        <span className="text-xs text-slate-400">{buildings.length} bygg</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-6 py-2 text-left font-medium">Bygg</th>
              <th className="px-4 py-2 text-right font-medium">Areal</th>
              <th className="px-4 py-2 text-right font-medium">Effekt nå</th>
              <th className="px-4 py-2 text-right font-medium">Kostnad i dag</th>
              <th className="px-4 py-2 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b, i) => {
              const energy = energyByBuilding[i]
              const Icon = statusIcon[b.status as keyof typeof statusIcon]
              return (
                <tr
                  key={b.id}
                  className="table-row cursor-pointer"
                  onClick={() => onSelect(b.id)}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
                        <Building2 size={15} className="text-brand-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{b.name}</div>
                        <div className="text-xs text-slate-400">{b.city} · {b.floors} etg · {b.devices} enheter</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600 tabular-nums">
                    {b.area_m2.toLocaleString('nb-NO')} m²
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="font-semibold text-slate-800">{energy.kw}</span>
                    <span className="text-slate-400 text-xs"> kW</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="font-semibold text-slate-800">{energy.cost.toLocaleString('nb-NO')}</span>
                    <span className="text-slate-400 text-xs"> kr</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={statusBadge[b.status as keyof typeof statusBadge]}>
                      {statusLabel[b.status as keyof typeof statusLabel]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
