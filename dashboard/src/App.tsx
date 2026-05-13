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
import { kpis, currentPrice } from './lib/mockData'
import {
  Zap, Building2, TrendingDown, BellRing, Cpu, BarChart3, ThermometerSun
} from 'lucide-react'

function Overview({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div className="space-y-6">
      {/* KPI-kort */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Priskart */}
      <PriceChart />

      {/* Energi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnergyChart />
        <EnergyBarChart />
      </div>

      {/* Bygg + alarmer */}
      <BuildingGrid onSelect={() => setPage('buildings')} />
      <AlarmTable compact />
    </div>
  )
}

function EnergyPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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

  useEffect(() => {
    const timer = setInterval(() => setLastUpdated(new Date()), 60_000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-brand-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-4">
        <span>🚀 <strong>Dette er en demo</strong> — Se hvordan NordSense optimaliserer energikostnadene dine i sanntid.</span>
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
      <Sidebar page={page} setPage={setPage} />
      <div className="ml-64 flex flex-col min-h-screen pt-9">
        <Topbar page={page} lastUpdated={lastUpdated} />
        <main className="flex-1 p-6">
          {page === 'overview'      && <Overview setPage={setPage} />}
          {page === 'buildings'     && <div className="space-y-6"><BuildingGrid onSelect={() => {}} /><DeviceTable /></div>}
          {page === 'energy'        && <EnergyPage />}
          {page === 'optimization'  && <OptimizationLog />}
          {page === 'alarms'        && <AlarmTable />}
          {page === 'canbus'        && <CanDashboard />}
          {page === 'settings'      && (
            <div className="card p-8 text-center text-slate-400">
              <p className="text-sm">Innstillinger — kommer snart</p>
            </div>
          )}
          {page === 'contact'       && <ContactForm onPrivacy={() => setPage('privacy')} />}
          {page === 'privacy'       && <PrivacyPolicy />}
        </main>
        <footer className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>NordSense HVAC Platform v1.0</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setPage('privacy')} className="hover:text-brand-600 transition-colors">Personvern</button>
            <span>Data oppdateres hvert 60. sek · Nord Pool NO1</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
