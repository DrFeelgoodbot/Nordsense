import { TrendingDown, TrendingUp, Zap } from 'lucide-react'
import clsx from 'clsx'
import { optimizationLog, nordpoolPrices, telemetryData } from '../lib/mockData'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Bar, Line
} from 'recharts'

const zoneColor = { cheap: 'badge-ok', normal: 'text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full', expensive: 'badge-crit' }
const zoneLabel = { cheap: 'Billig', normal: 'Normal', expensive: 'Dyr' }

const combined = telemetryData.map((d, i) => ({
  ...d,
  price: nordpoolPrices[i]?.price ?? 0,
}))

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm space-y-1">
      <div className="font-semibold text-slate-700">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600">{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export function OptimizationLog() {
  return (
    <div className="space-y-6">
      {/* Pris vs forbruk */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Pris vs. effektforbruk — korrelasjon</span>
          <span className="text-xs text-slate-400">Nord Pool optimalisert</span>
        </div>
        <div className="px-6 pb-5">
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={combined} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="gradKw" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0c8de9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0c8de9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 2]} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left" type="monotone" dataKey="power_kw" name="kW" stroke="#0c8de9" strokeWidth={2} fill="url(#gradKw)" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="price" name="kr/kWh" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Optimaliseringslogg */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Optimaliseringslogg — i dag</span>
          <span className="text-xs text-emerald-600 font-medium">Estimert besparelse: 312 kr</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-6 py-2 text-left font-medium">Tid</th>
                <th className="px-4 py-2 text-left font-medium">Prissone</th>
                <th className="px-4 py-2 text-left font-medium">Tiltak</th>
                <th className="px-4 py-2 text-center font-medium">Enheter</th>
                <th className="px-4 py-2 text-right font-medium">Besparelse</th>
              </tr>
            </thead>
            <tbody>
              {optimizationLog.map((row, i) => (
                <tr key={i} className="table-row">
                  <td className="px-6 py-3 tabular-nums font-medium text-slate-700">{row.time}</td>
                  <td className="px-4 py-3">
                    <span className={zoneColor[row.zone as keyof typeof zoneColor]}>
                      {zoneLabel[row.zone as keyof typeof zoneLabel]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.action}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{row.devices}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className={row.saving > 0 ? 'text-emerald-600 font-semibold' : 'text-slate-400 text-xs'}>
                      {row.saving > 0 ? `+${row.saving.toFixed(2)} kWh` : `Lagring (${Math.abs(row.saving).toFixed(2)} kWh)`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
