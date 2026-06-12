import { ReactNode } from 'react'
import clsx from 'clsx'

interface Props {
  title: ReactNode
  value: string
  unit?: string
  delta?: string
  deltaUp?: boolean
  icon: ReactNode
  iconBg?: string
  sub?: string
}

export function KpiCard({ title, value, unit, delta, deltaUp, icon, iconBg = 'bg-brand-50', sub }: Props) {
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="card-title">{title}</span>
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-end gap-1.5">
          <span className="kpi-value">{value}</span>
          {unit && <span className="text-sm text-slate-400 mb-0.5 font-medium">{unit}</span>}
        </div>
        {(delta || sub) && (
          <div className="mt-1.5 flex items-center gap-2">
            {delta && (
              <span className={deltaUp ? 'kpi-delta-up' : 'kpi-delta-down'}>
                {deltaUp ? '▲' : '▼'} {delta}
              </span>
            )}
            {sub && <span className="text-xs text-slate-400">{sub}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
