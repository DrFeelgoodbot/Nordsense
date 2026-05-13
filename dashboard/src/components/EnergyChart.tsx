import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { telemetryData } from '../lib/mockData'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-700 mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-600">{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export function EnergyChart() {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Energiforbruk — siste 24 timer (kW)</span>
        <span className="text-xs text-slate-400">Alle bygg samlet</span>
      </div>
      <div className="px-6 pb-5">
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={telemetryData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPower" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0c8de9" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0c8de9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="power_kw" name="Effekt (kW)"
              stroke="#0c8de9" strokeWidth={2} fill="url(#gradPower)"
              dot={false} activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
