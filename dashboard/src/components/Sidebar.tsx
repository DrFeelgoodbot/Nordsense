import { LayoutDashboard, Building2, Zap, BellRing, Settings, TrendingDown, ChevronRight, Network, Mail, Info } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { id: 'overview',       icon: LayoutDashboard, label: 'Oversikt' },
  { id: 'buildings',      icon: Building2,        label: 'Bygg & enheter' },
  { id: 'energy',         icon: Zap,              label: 'Energianalyse' },
  { id: 'optimization',   icon: TrendingDown,     label: 'Optimalisering' },
  { id: 'alarms',         icon: BellRing,         label: 'Alarmer', badge: 2 },
  { id: 'canbus',         icon: Network,          label: 'CAN-bus', badge: 3 },
  { id: 'settings',       icon: Settings,         label: 'Innstillinger' },
  { id: 'contact',        icon: Mail,             label: 'Kontakt / Tilbud' },
  { id: 'about',          icon: Info,             label: 'Om NordSense' },
]

export function Sidebar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  return (
    <aside className="fixed top-9 bottom-0 left-0 w-64 bg-white border-r border-slate-100 flex flex-col z-20">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">NordSense</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest leading-tight">Energioptimalisering</div>
          </div>
        </div>
      </div>

      {/* Portfolio selector */}
      <div className="px-4 py-3 border-b border-slate-100">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="text-left">
            <div className="text-xs text-slate-400 leading-tight">Portefølje</div>
            <div className="text-sm font-semibold text-slate-700 leading-tight">Oslo & Akershus</div>
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ id, icon: Icon, label, badge }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={clsx('nav-item w-full text-left', page === id && 'nav-item-active')}
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            {badge ? (
              <span className={clsx(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                page === id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
              )}>
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">SS</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-700 truncate">Stian Skjerven</div>
            <div className="text-[10px] text-slate-400 truncate">Driftssjef</div>
          </div>
          <Settings size={14} className="text-slate-400 cursor-pointer hover:text-slate-600" />
        </div>
      </div>
    </aside>
  )
}
