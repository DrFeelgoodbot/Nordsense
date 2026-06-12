import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Legend
} from 'recharts'
import { useNordpoolPrices } from '../lib/useNordpoolPrices'

const LOW  = 0.50
const HIGH = 1.20

function priceColor(price: number) {
  if (price <= LOW)  return '#10b981'
  if (price >= HIGH) return '#ef4444'
  return '#f59e0b'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const price = payload[0]?.value as number
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-700 mb-1">{label}:00</div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: priceColor(price) }} />
        <span className="text-slate-600">{price.toFixed(2)} kr/kWh</span>
      </div>
      <div className="text-xs mt-1 text-slate-400">
        {price <= LOW ? '✦ Billig — optimaliserer setpunkter' :
         price >= HIGH ? '✦ Dyr — reduserer forbruk' : '✦ Normal pris'}
      </div>
    </div>
  )
}

export function PriceChart() {
  const now = new Date().getHours()
  const { prices, live } = useNordpoolPrices('NO1')

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          Nord Pool — timespris i dag (kr/kWh)
          {live && <span className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Live NO1</span>}
        </span>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Billig (&lt;0.50)</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Normal</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Dyr (&gt;1.20)</span>
        </div>
      </div>
      <div className="px-6 pb-5">
        <ResponsiveContainer width="100%" height={210}>
          <ComposedChart data={prices} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="hour"
              tickFormatter={h => `${h}:00`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false} axisLine={false}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false} axisLine={false}
              tickFormatter={v => v.toFixed(1)}
              domain={[0, 'dataMax + 0.2']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <ReferenceLine y={LOW}  stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
            <ReferenceLine y={HIGH} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
            <ReferenceLine x={now} stroke="#0c8de9" strokeWidth={2} label={{ value: 'Nå', position: 'top', fontSize: 11, fill: '#0c8de9' }} />
            <Bar dataKey="price" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {prices.map((entry, i) => (
                <Cell key={i} fill={priceColor(entry.price)} fillOpacity={entry.hour === now ? 1 : 0.75} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
