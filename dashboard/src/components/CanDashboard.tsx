import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts'
import {
  Activity, AlertTriangle, XCircle, CheckCircle2, Radio,
  Cpu, Clock, Zap, RefreshCw, ChevronRight, Info
} from 'lucide-react'
import {
  canKpis, canHistory, liveFeed, messageRatePerHour,
  faultFrequency, severityDist, nodeStats, CAN_IDS, CanFrame
} from '../lib/canMockData'
import { KpiCard } from './KpiCard'

// ── Hjelpere ──────────────────────────────────────────────────────────────
const SEV_COLOR  = { critical: '#ef4444', warning: '#f59e0b', info: '#10b981' }
const SEV_BG     = { critical: 'bg-red-50/60', warning: 'bg-amber-50/40', info: '' }
const SEV_BADGE  = { critical: 'badge-crit', warning: 'badge-warn', info: 'badge-ok' }
const SEV_LABEL  = { critical: 'Kritisk', warning: 'Advarsel', info: 'Info' }
const SEV_ICON   = { critical: XCircle, warning: AlertTriangle, info: Info }

function SevBadge({ sev }: { sev: string }) {
  return <span className={SEV_BADGE[sev as keyof typeof SEV_BADGE]}>{SEV_LABEL[sev as keyof typeof SEV_LABEL]}</span>
}

// ── Live feed rad ──────────────────────────────────────────────────────────
function FeedRow({ frame, flash }: { frame: CanFrame; flash: boolean }) {
  const Icon = SEV_ICON[frame.severity]
  return (
    <tr className={clsx(
      'table-row font-mono text-xs transition-colors duration-700',
      SEV_BG[frame.severity],
      flash && 'bg-brand-50'
    )}>
      <td className="px-3 py-1.5 text-slate-400 tabular-nums whitespace-nowrap">
        {format(frame.timestamp, 'HH:mm:ss')}
      </td>
      <td className="px-3 py-1.5 font-semibold text-slate-700">{frame.can_id_hex}</td>
      <td className="px-3 py-1.5 text-slate-500">{frame.can_id_name}</td>
      <td className="px-3 py-1.5 text-slate-400 tracking-widest">{frame.data_hex}</td>
      <td className="px-3 py-1.5">
        <Icon size={13} className={clsx(
          frame.severity === 'critical' ? 'text-red-500' :
          frame.severity === 'warning'  ? 'text-amber-500' : 'text-emerald-500'
        )} />
      </td>
      <td className="px-3 py-1.5 text-slate-600 font-sans">
        {frame.fault_text ?? (frame.fault_code === 0 ? <span className="text-slate-400">OK / Heartbeat</span> : `Kode 0x${frame.fault_code.toString(16)}`)}
      </td>
    </tr>
  )
}

// ── Node-status kort ───────────────────────────────────────────────────────
function NodeCard({ node }: { node: typeof nodeStats[0] }) {
  return (
    <div className={clsx(
      'rounded-xl border p-4 flex flex-col gap-2',
      node.online ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50/40'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 font-mono">{node.id_hex}</span>
        <span className={clsx(
          'flex items-center gap-1 text-xs font-medium',
          node.online ? 'text-emerald-600' : 'text-red-500'
        )}>
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full',
            node.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
          )} />
          {node.online ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="text-sm font-semibold text-slate-800 leading-tight">{node.name}</div>
      <div className="text-xs text-slate-400 leading-tight">{node.description}</div>
      <div className="flex items-center gap-3 mt-1 text-xs">
        <span className="text-slate-500">{node.total_faults} feil</span>
        {node.active_faults > 0 && (
          <span className="text-red-600 font-semibold">{node.active_faults} aktive</span>
        )}
        {node.critical_faults > 0 && (
          <span className="badge-crit">{node.critical_faults} kritiske</span>
        )}
      </div>
      <div className="text-xs text-slate-400">
        Sist sett: {format(node.last_seen, 'HH:mm:ss')}
      </div>
    </div>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm">
      <div className="font-semibold text-slate-700 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          <span className="text-slate-600">{p.name ?? p.dataKey}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

// ── Hovedkomponent ─────────────────────────────────────────────────────────
export function CanDashboard() {
  const [liveFrames, setLiveFrames] = useState<CanFrame[]>(liveFeed)
  const [flashId, setFlashId] = useState<string | null>(null)
  const [filterSev, setFilterSev] = useState<string>('alle')
  const [showResolved, setShowResolved] = useState(true)
  const feedRef = useRef<HTMLDivElement>(null)

  // Simuler nye meldinger hvert 4. sekund
  useEffect(() => {
    const ids = [0x100, 0x101, 0x200, 0x300, 0x301, 0x400, 0x500]
    const timer = setInterval(() => {
      const arb = ids[Math.floor(Math.random() * ids.length)]
      const isHeartbeat = arb === 0x500 || Math.random() > 0.3
      const code = isHeartbeat ? 0 : [0x01, 0x02, 0x10, 0x11, 0x20][Math.floor(Math.random() * 5)]
      const node = CAN_IDS.find(n => n.id === arb)
      const key = `0x${arb.toString(16).toUpperCase()}-0x${code.toString(16).padStart(2,'0')}`
      const sev = code === 0 ? 'info' : code < 0x10 ? 'info' : code < 0x20 ? 'warning' : 'critical'
      const newFrame: CanFrame = {
        id: `live-${Date.now()}`,
        timestamp: new Date(),
        arbitration_id: arb,
        can_id_hex: `0x${arb.toString(16).toUpperCase()}`,
        can_id_name: node?.name ?? 'Ukjent',
        data_hex: [code, Math.floor(Math.random()*256), Math.floor(Math.random()*256), 0,0,0,0,0]
          .map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' '),
        byte0: code, byte1: 1, byte2: 0, byte3: 0,
        fault_code: code,
        fault_text: (import('../lib/canMockData') as any).FAULT_TABLE?.[key] ?? null,
        severity: sev as any,
        device_id: `can_device_01`,
        resolved: code === 0,
        resolved_at: null,
        duration_min: null,
      }
      setFlashId(newFrame.id)
      setLiveFrames(prev => [newFrame, ...prev].slice(0, 60))
      setTimeout(() => setFlashId(null), 600)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const activeFaults = canHistory.filter(f => !f.resolved)
  const historyFiltered = canHistory.filter(f =>
    (showResolved || !f.resolved) &&
    (filterSev === 'alle' || f.severity === filterSev)
  )

  return (
    <div className="space-y-6">

      {/* KPI-rad */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Meldinger i dag"
          value={canKpis.totalMessagesToday.toLocaleString('nb-NO')}
          icon={<Activity size={18} className="text-brand-600" />}
          iconBg="bg-brand-50"
          sub={`${canKpis.busLoad_pct}% bussbelastning`}
          delta="12% vs. i går"
          deltaUp={false}
        />
        <KpiCard
          title="Aktive feil"
          value={canKpis.activeFaults.toString()}
          icon={<XCircle size={18} className="text-red-500" />}
          iconBg="bg-red-50"
          delta={`${canKpis.criticalActive} kritiske`}
          deltaUp={false}
          sub="Ukvitterte alarmer"
        />
        <KpiCard
          title="Løst i dag"
          value={canKpis.resolvedToday.toString()}
          icon={<CheckCircle2 size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          delta={`Snitt ${canKpis.avgResolutionMin} min`}
          deltaUp={true}
          sub="Gjennomsnittstid"
        />
        <KpiCard
          title="Noder online"
          value={`${canKpis.onlineNodes}/${canKpis.nodeCount}`}
          icon={<Radio size={18} className="text-amber-500" />}
          iconBg="bg-amber-50"
          delta="1 offline"
          deltaUp={false}
          sub="250 kbps CAN-bus"
        />
      </div>

      {/* Node-status grid */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">CAN-node status</span>
          <span className="text-xs text-slate-400">250 kbps · {CAN_IDS.length} noder</span>
        </div>
        <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {nodeStats.map(node => <NodeCard key={node.id} node={node} />)}
        </div>
      </div>

      {/* Trafikk + Fordeling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meldingsfrekvens */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <span className="card-title">Meldingsfrekvens — siste 24 timer</span>
            <span className="text-xs text-slate-400">Meldinger per time</span>
          </div>
          <div className="px-6 pb-5">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={messageRatePerHour} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8de9" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#0c8de9" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradFaults" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total"  name="Totalt"  stroke="#0c8de9" strokeWidth={2} fill="url(#gradTotal)"  dot={false} />
                <Area type="monotone" dataKey="faults" name="Feil"    stroke="#ef4444" strokeWidth={2} fill="url(#gradFaults)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alvorlighetsfordeling */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Fordeling alvorlighet</span>
          </div>
          <div className="px-6 pb-5 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={severityDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {severityDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5 w-full mt-1">
              {severityDist.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                    <span className="text-slate-600">{s.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800 tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feilfrekvens */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Hyppigste feilmeldinger — siste 24 timer</span>
        </div>
        <div className="px-6 pb-5">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={faultFrequency} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category" dataKey="name"
                tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                width={200}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Antall" fill="#0c8de9" radius={[0, 4, 4, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aktive feil */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Aktive feil</span>
          <span className={clsx(
            'text-xs font-semibold px-2.5 py-0.5 rounded-full',
            activeFaults.length > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
          )}>
            {activeFaults.length > 0 ? `${activeFaults.length} ukvittert` : 'Ingen aktive feil'}
          </span>
        </div>
        {activeFaults.length === 0 ? (
          <div className="px-6 pb-6 flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 size={16} /> Alt OK — ingen aktive feil på CAN-bussen
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-6 py-2 text-left font-medium">Alvorlighet</th>
                  <th className="px-4 py-2 text-left font-medium font-mono">CAN ID</th>
                  <th className="px-4 py-2 text-left font-medium">Node</th>
                  <th className="px-4 py-2 text-left font-medium">Feilmelding</th>
                  <th className="px-4 py-2 text-left font-medium font-mono">Data</th>
                  <th className="px-4 py-2 text-center font-medium">Tid</th>
                  <th className="px-4 py-2 text-center font-medium">Varighet</th>
                </tr>
              </thead>
              <tbody>
                {activeFaults.map(f => {
                  const Icon = SEV_ICON[f.severity]
                  const ageMin = Math.round((Date.now() - f.timestamp.getTime()) / 60000)
                  return (
                    <tr key={f.id} className={clsx('table-row', SEV_BG[f.severity])}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Icon size={14} style={{ color: SEV_COLOR[f.severity] }} />
                          <SevBadge sev={f.severity} />
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">{f.can_id_hex}</td>
                      <td className="px-4 py-3 text-slate-600">{f.can_id_name}</td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {f.fault_text ?? `Kode 0x${f.fault_code.toString(16).padStart(2,'0')}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{f.data_hex}</td>
                      <td className="px-4 py-3 text-center text-xs text-slate-500 tabular-nums">
                        {format(f.timestamp, 'HH:mm:ss')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-medium text-red-600 tabular-nums">{ageMin} min</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historikk */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Feilhistorikk — siste 24 timer</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
              <input type="checkbox" checked={showResolved} onChange={e => setShowResolved(e.target.checked)}
                className="rounded" />
              Vis løste
            </label>
            <div className="flex gap-1">
              {['alle','critical','warning','info'].map(s => (
                <button key={s} onClick={() => setFilterSev(s)}
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium border transition-colors',
                    filterSev === s
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'text-slate-500 border-slate-200 hover:border-brand-300'
                  )}>
                  {s === 'alle' ? 'Alle' : SEV_LABEL[s as keyof typeof SEV_LABEL]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-6 py-2 text-left font-medium">Tid</th>
                <th className="px-4 py-2 text-left font-medium">Alvorlighet</th>
                <th className="px-4 py-2 text-left font-mono font-medium">CAN ID</th>
                <th className="px-4 py-2 text-left font-medium">Feilmelding</th>
                <th className="px-4 py-2 text-center font-medium">Varighet</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {historyFiltered.map(f => (
                <tr key={f.id} className={clsx('table-row', !f.resolved && SEV_BG[f.severity])}>
                  <td className="px-6 py-2.5 text-xs text-slate-500 tabular-nums whitespace-nowrap font-mono">
                    {format(f.timestamp, 'HH:mm:ss')}
                  </td>
                  <td className="px-4 py-2.5"><SevBadge sev={f.severity} /></td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-700 text-xs">{f.can_id_hex}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {f.fault_text ?? `Kode 0x${f.fault_code.toString(16).padStart(2,'0')}`}
                  </td>
                  <td className="px-4 py-2.5 text-center text-xs tabular-nums text-slate-500">
                    {f.duration_min != null ? `${f.duration_min} min` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {f.resolved
                      ? <span className="flex items-center justify-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={12} /> Løst</span>
                      : <span className="flex items-center justify-center gap-1 text-xs text-red-500 font-medium"><XCircle size={12} /> Aktiv</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live CAN-frame feed */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Live CAN-frame feed</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
            <span className="text-xs text-slate-400">Oppdateres hvert 4. sek</span>
          </div>
        </div>
        <div ref={feedRef} className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                <th className="px-3 py-2 text-left font-medium font-mono">Tid</th>
                <th className="px-3 py-2 text-left font-medium font-mono">CAN ID</th>
                <th className="px-3 py-2 text-left font-medium">Node</th>
                <th className="px-3 py-2 text-left font-medium font-mono">Data (hex)</th>
                <th className="px-3 py-2 text-center font-medium">Sev</th>
                <th className="px-3 py-2 text-left font-medium">Tolkning</th>
              </tr>
            </thead>
            <tbody>
              {liveFrames.map(f => (
                <FeedRow key={f.id} frame={f} flash={f.id === flashId} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
