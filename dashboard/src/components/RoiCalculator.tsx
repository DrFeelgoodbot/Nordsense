import { useState } from 'react'
import { Calculator, TrendingDown, Handshake, Mail, Sparkles } from 'lucide-react'
import { track } from '../lib/analytics'

function nok(n: number) {
  return n.toLocaleString('nb-NO', { maximumFractionDigits: 0 })
}

export function RoiCalculator({ onContact }: { onContact: () => void }) {
  const [kwh, setKwh] = useState(800_000)
  const [price, setPrice] = useState(1.10)
  const [savingsPct, setSavingsPct] = useState(10)
  const [nordsenseShare, setNordsenseShare] = useState(50)

  const annualCost = kwh * price
  const annualSavings = annualCost * (savingsPct / 100)
  const customerKeeps = annualSavings * (1 - nordsenseShare / 100)
  const nordsenseEarns = annualSavings * (nordsenseShare / 100)
  const fiveYear = customerKeeps * 5

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Calculator size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">ROI-kalkulator</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
          Beregn hvor mye bygget eller eiendomsporteføljen din kan spare med NordSense.
        </p>
      </div>

      <div className="card p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
            <Sparkles size={18} className="text-brand-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Dine forutsetninger</h2>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">Årlig strømforbruk</label>
              <span className="text-sm tabular-nums font-bold text-brand-700">{nok(kwh)} kWh</span>
            </div>
            <input
              type="range" min={50_000} max={5_000_000} step={10_000}
              value={kwh} onChange={e => setKwh(+e.target.value)}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>50 000 kWh (lite kontor)</span>
              <span>5 000 000 kWh (kjøpesenter)</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">Snittpris strøm (inkl. nettleie og MVA)</label>
              <span className="text-sm tabular-nums font-bold text-brand-700">{price.toFixed(2)} kr/kWh</span>
            </div>
            <input
              type="range" min={0.50} max={2.50} step={0.05}
              value={price} onChange={e => setPrice(+e.target.value)}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.50</span>
              <span>2.50</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">Forventet besparelse</label>
              <span className="text-sm tabular-nums font-bold text-brand-700">{savingsPct} %</span>
            </div>
            <input
              type="range" min={5} max={18} step={1}
              value={savingsPct} onChange={e => setSavingsPct(+e.target.value)}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>5 % (konservativt)</span>
              <span>10 % (typisk)</span>
              <span>18 % (godt egnet anlegg)</span>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700">NordSense sin andel av besparelsen</label>
              <span className="text-sm tabular-nums font-bold text-brand-700">{nordsenseShare} %</span>
            </div>
            <input
              type="range" min={20} max={70} step={5}
              value={nordsenseShare} onChange={e => setNordsenseShare(+e.target.value)}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>Kunde 80 % / NS 20 %</span>
              <span>50/50</span>
              <span>Kunde 30 % / NS 70 %</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6 space-y-2 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Du sparer per år</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-emerald-700 tabular-nums">{nok(customerKeeps)}</span>
            <span className="text-sm text-emerald-600 font-medium">kr/år</span>
          </div>
          <div className="text-xs text-emerald-700/80">{nok(fiveYear)} kr over 5 år</div>
        </div>

        <div className="card p-6 space-y-2">
          <div className="flex items-center gap-2">
            <Handshake size={16} className="text-brand-600" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">NordSense honorar</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold text-slate-700 tabular-nums">{nok(nordsenseEarns)}</span>
            <span className="text-sm text-slate-500 font-medium">kr/år</span>
          </div>
          <div className="text-xs text-slate-500">Kun betalt av faktiske besparelser</div>
        </div>
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Grunnlag</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">Årskostnad i dag</div>
            <div className="font-semibold text-slate-700 tabular-nums mt-1">{nok(annualCost)} kr</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">Total besparelse</div>
            <div className="font-semibold text-slate-700 tabular-nums mt-1">{nok(annualSavings)} kr</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">Investering</div>
            <div className="font-semibold text-emerald-700 mt-1">0 kr</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">Tilbakebetalingstid</div>
            <div className="font-semibold text-emerald-700 mt-1">Umiddelbar</div>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pt-2">
          Beregningen er et estimat basert på automatisk styring av setpunkter mot Nord Pool-priser.
          Faktisk besparelse avhenger av anleggets utforming, driftsmønster og prissvingninger i markedet.
          Ta kontakt for en konkret vurdering av ditt anlegg.
        </p>
      </div>

      <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-brand-50 border-brand-100">
        <div className="text-center sm:text-left">
          <div className="text-base font-bold text-slate-800">Vil du ha et konkret tilbud?</div>
          <div className="text-xs text-slate-500 mt-0.5">Vi gjør en gratis vurdering av besparelsespotensialet ditt.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { track('roi_request_quote', { kwh, savings_pct: savingsPct }); onContact() }}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            <Mail size={15} />
            Be om tilbud
          </button>
        </div>
      </div>
    </div>
  )
}
