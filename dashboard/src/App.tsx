import { useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { KpiCard } from './components/KpiCard'
import { PriceChart } from './components/PriceChart'
import { EnergyChart } from './components/EnergyChart'
import { EnergyBarChart } from './components/EnergyBarChart'
import { BuildingGrid } from './components/BuildingGrid'
import { AlarmTable } from './components/AlarmTable'
import { DeviceTable } from './components/DeviceTable'
import { OptimizationLog } from './components/OptimizationLog'
import { CanDashboard } from './components/CanDashboard'
import { ContactForm } from './components/ContactForm'
import { PrivacyPolicy } from './components/PrivacyPolicy'
import { AboutPage } from './components/AboutPage'
import { kpis, currentPrice } from './lib/mockData'
import {
  Zap, Building2, TrendingDown, BellRing, Cpu, BarChart3, ThermometerSun
} from 'lucide-react'

function Overview({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard
          title="Totalt forbruk nå"
          value={kpis.totalPowerKw.toString()}
          unit="kW"
          delta="8.2% vs. i går"
          deltaUp={false}
          icon={<Zap size={18} className="text-brand-600" />}
          iconBg="bg-brand-50"
          sub="Alle bygg"
        />
        <KpiCard
          title="Strømkostnad i dag"
          value={kpis.totalCostToday.toLocaleString('nb-NO')}
          unit="kr"
          delta="14.5% spart"
          deltaUp={true}
          icon={<BarChart3 size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          sub="vs. uten optimalisering"
        />
        <KpiCard
          title="Nord Pool — nå"
          value={currentPrice.toFixed(2)}
          unit="kr/kWh"
          delta={currentPrice > 1.2 ? 'Dyr sone' : currentPrice < 0.5 ? 'Billig sone' : 'Normal sone'}
          deltaUp={currentPrice < 0.5}
          icon={<TrendingDown size={18} className="text-amber-600" />}
          iconBg="bg-amber-50"
          sub="NO1 — dag-ahead"
        />
        <KpiCard
          title="Aktive alarmer"
          value={kpis.activeAlarms.toString()}
          delta={`${kpis.criticalAlarms} kritiske`}
          deltaUp={false}
          icon={<BellRing size={18} className="text-red-500" />}
          iconBg="bg-red-50"
          sub={`${kpis.buildings} bygg overvåkes`}
        />
      </div>
      <PriceChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <EnergyChart />
        <EnergyBarChart />
      </div>
      <BuildingGrid onSelect={() => setPage('buildings')} />
      <AlarmTable compact />
    </div>
  )
}

function EnergyPage() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <KpiCard
          title="Gjennomsnittlig COP"
          value={kpis.avgCop.toFixed(2)}
          icon={<ThermometerSun size={18} className="text-orange-500" />}
          iconBg="bg-orange-50"
          sub="Alle varmepumper"
          delta="↑ vs. forrige uke"
          deltaUp={true}
        />
        <KpiCard
          title="Totalt bespart i dag"
          value={kpis.savingsToday.toLocaleString('nb-NO')}
          unit="kr"
          delta={`${kpis.savingsPct}% reduksjon`}
          deltaUp={true}
          icon={<TrendingDown size={18} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          sub="Nord Pool-optimalisert"
        />
        <KpiCard
          title="Enheter online"
          value={`${kpis.buildings * 4 - 1}/${kpis.buildings * 4}`}
          icon={<Cpu size={18} className="text-brand-600" />}
          iconBg="bg-brand-50"
          sub="1 enhet frakoblet"
        />
      </div>
      <EnergyChart />
      <EnergyBarChart />
      <DeviceTable />
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('overview')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setLastUpdated(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  const navigate = (p: string) => {
    setPage(p)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-brand-600 text-white py-2 px-3 text-sm flex flex-wrap items-center justify-center gap-2 md:gap-4">
        <span className="text-xs md:text-sm text-center">
          🚀 <strong>Dette er en demo</strong>
          <span className="hidden sm:inline"> — Se hvordan NordSense optimaliserer energikostnadene dine i sanntid.</span>
        </span>
        <div className="flex items-center gap-2">
          <a
            href="tel:+4791375775"
            className="bg-white text-brand-700 font-semibold px-3 py-0.5 rounded-full text-xs hover:bg-brand-50 transition-colors whitespace-nowrap"
          >
            📞 913 75 775
          </a>
          <a
            href="mailto:stiskjer@gmail.com?subject=Tilbud NordSense energioptimalisering"
            className="bg-white/20 text-white font-semibold px-3 py-0.5 rounded-full text-xs hover:bg-white/30 transition-colors whitespace-nowrap"
          >
            E-post →
          </a>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-9 bottom-0 left-0 z-40 w-64 transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar page={page} setPage={navigate} />
      </div>

      {/* Main */}
      <div className="md:ml-64 flex flex-col min-h-screen pt-9">
        <Topbar page={page} lastUpdated={lastUpdated} onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-3 md:p-6">
          {page === 'overview'      && <Overview setPage={navigate} />}
          {page === 'buildings'     && <div className="space-y-4 md:space-y-6"><BuildingGrid onSelect={() => {}} /><DeviceTable /></div>}
          {page === 'energy'        && <EnergyPage />}
          {page === 'optimization'  && <OptimizationLog />}
          {page === 'alarms'        && <AlarmTable />}
          {page === 'canbus'        && <CanDashboard />}
          {page === 'settings'      && (
            <div className="card p-8 text-center text-slate-400">
              <p className="text-sm">Innstillinger — kommer snart</p>
            </div>
          )}
          {page === 'contact'       && <ContactForm onPrivacy={() => navigate('privacy')} />}
          {page === 'privacy'       && <PrivacyPolicy />}
          {page === 'about'         && <AboutPage />}
        </main>
        <footer className="px-4 md:px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>NordSense HVAC Platform v1.0</span>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('privacy')} className="hover:text-brand-600 transition-colors">Personvern</button>
            <span className="hidden sm:inline">Data oppdateres hvert 60. sek · Nord Pool NO1</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
