import { Bell, RefreshCw, Search, Menu } from 'lucide-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

const titles: Record<string, string> = {
  overview:     'Oversikt',
  buildings:    'Bygg & enheter',
  energy:       'Energianalyse',
  optimization: 'Optimalisering',
  alarms:       'Alarmer',
  canbus:       'CAN-bus monitor',
  settings:     'Innstillinger',
  contact:      'Kontakt / Få tilbud',
  about:        'Om NordSense',
  privacy:      'Personvernerklæring',
}

export function Topbar({ page, lastUpdated, onMenuClick }: { page: string; lastUpdated: Date; onMenuClick?: () => void }) {
  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-100 flex items-center px-3 md:px-6 gap-3 md:gap-4 sticky top-9 z-10">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Menu size={20} className="text-slate-600" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-sm md:text-base font-semibold text-slate-800 truncate">{titles[page]}</h1>
        <p className="text-xs text-slate-400 hidden sm:block">
          Sist oppdatert {format(lastUpdated, 'HH:mm:ss', { locale: nb })}
        </p>
      </div>

      <div className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Søk bygg, enhet..."
          className="pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
        />
      </div>

      <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <Bell size={18} className="text-slate-500" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <RefreshCw size={16} className="text-slate-500" />
      </button>
    </header>
  )
}
