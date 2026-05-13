import { AlertTriangle, XCircle, Info, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { alarms } from '../lib/mockData'

const sevIcon = { critical: XCircle, warning: AlertTriangle, info: Info }
const sevColor = { critical: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-400' }
const sevBadge = { critical: 'badge-crit', warning: 'badge-warn', info: 'text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full' }
const sevLabel = { critical: 'Kritisk', warning: 'Advarsel', info: 'Info' }

export function AlarmTable({ compact = false }: { compact?: boolean }) {
  const rows = compact ? alarms.slice(0, 4) : alarms

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Aktive alarmer</span>
        {compact && (
          <span className="text-xs text-brand-600 font-medium cursor-pointer hover:underline">Se alle →</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 uppercase tracking-wide">
              <th className="px-6 py-2 text-left font-medium">Alvorlighet</th>
              <th className="px-4 py-2 text-left font-medium">Enhet</th>
              <th className="px-4 py-2 text-left font-medium">Melding</th>
              {!compact && <th className="px-4 py-2 text-left font-medium">Bygg</th>}
              <th className="px-4 py-2 text-center font-medium">Tid</th>
              <th className="px-4 py-2 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(alarm => {
              const Icon = sevIcon[alarm.severity as keyof typeof sevIcon]
              return (
                <tr key={alarm.id} className={clsx('table-row', !alarm.acknowledged && 'bg-red-50/30')}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Icon size={15} className={sevColor[alarm.severity as keyof typeof sevColor]} />
                      <span className={sevBadge[alarm.severity as keyof typeof sevBadge]}>
                        {sevLabel[alarm.severity as keyof typeof sevLabel]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">{alarm.device}</td>
                  <td className="px-4 py-3 text-slate-600">{alarm.text}</td>
                  {!compact && <td className="px-4 py-3 text-slate-500 text-xs">{alarm.building}</td>}
                  <td className="px-4 py-3 text-center text-xs text-slate-400 tabular-nums">{alarm.time}</td>
                  <td className="px-4 py-3 text-center">
                    {alarm.acknowledged
                      ? <span className="text-xs text-slate-400 flex items-center justify-center gap-1"><CheckCircle2 size={13} /> Kvittert</span>
                      : <button className="text-xs text-brand-600 font-medium hover:underline">Kvitter</button>
                    }
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
