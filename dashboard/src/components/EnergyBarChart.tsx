import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { energyByBuilding } from '../lib/mockData'

const COLORS = ['#0c8de9', '#36aaf8', '#7cc8fc', '#0058a2', '#054b85']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = energyByBuilding.find(b => b.name === label)
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-700 mb-1">{d?.fullName}</div>
      <div className="text-xs text-slate-600">Effekt: <strong>{payload[0].value} kW</strong></div>
      <div className="text-xs text-slate-600">Kostnad i dag: <strong>{d?.cost.toLocaleString('nb-NO')} kr</strong></div>
    </div>
  )
}

export function EnergyBarChart() {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Forbruk per bygg — nå (kW)</span>
      </div>
      <div className="px-6 pb-5">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={energyByBuilding} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="kw" radius={[6, 6, 0, 0]} maxBarSize={44}>
              {energyByBuilding.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
