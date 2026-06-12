import { Sparkles, Brain, CloudSun, LineChart, Wrench, MessageSquare, Compass, CheckCircle2, Clock, Map } from 'lucide-react'
import { ReactNode } from 'react'

type Status = 'live' | 'soon' | 'roadmap'

const statusMeta: Record<Status, { label: string; cls: string; icon: ReactNode }> = {
  live:    { label: 'Aktiv',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',         icon: <CheckCircle2 size={11} /> },
  soon:    { label: 'Kommer 2026',   cls: 'bg-amber-50 text-amber-700 border-amber-200',               icon: <Clock size={11} /> },
  roadmap: { label: 'På roadmap',    cls: 'bg-slate-100 text-slate-600 border-slate-200',              icon: <Map size={11} /> },
}

type Capability = {
  icon: ReactNode
  title: string
  status: Status
  desc: string
}

const capabilities: Capability[] = [
  {
    icon: <Sparkles size={18} className="text-brand-600" />,
    title: 'Spotpris-styring',
    status: 'live',
    desc: 'Automatisk justering av setpunkter på varmepumper, ventilasjon og kjøleanlegg basert på timesvise Nord Pool-priser. Forvarmer i billige timer, demper i dyre.',
  },
  {
    icon: <CloudSun size={18} className="text-brand-600" />,
    title: 'Værbasert lastprognose',
    status: 'soon',
    desc: 'Maskinlæringsmodell som forutsier byggets effektbehov 24–48 timer fram basert på værmelding, kalender og historisk forbruk per sone.',
  },
  {
    icon: <LineChart size={18} className="text-brand-600" />,
    title: 'Prediktiv driftsplanlegging',
    status: 'soon',
    desc: 'NordSense legger en optimal driftsplan for hele neste døgn — utnytter byggets termiske treghet og prissvingninger, ikke bare "billig nå".',
  },
  {
    icon: <Wrench size={18} className="text-brand-600" />,
    title: 'Prediktivt vedlikehold',
    status: 'soon',
    desc: 'Anomalideteksjon på telemetri fanger feil 2–4 uker før de blir kritiske — kompressorslitasje, viftelagre, sensordrift og kjølemiddellekkasjer.',
  },
  {
    icon: <MessageSquare size={18} className="text-brand-600" />,
    title: 'Naturlig språk-rapporter',
    status: 'roadmap',
    desc: 'Spør dashboardet om hva du vil: «Lag en rapport over alle alarmer denne uka» eller «Forklar hvorfor Storgata 12 brukte mer energi tirsdag».',
  },
  {
    icon: <Compass size={18} className="text-brand-600" />,
    title: 'Selvlærende komfortprofil',
    status: 'roadmap',
    desc: 'Systemet lærer faktisk bruksmønster per sone — kontorlandskap fra 08, møterom etter behov, lager med svakere krav — og tilpasser styringen automatisk.',
  },
]

export function NordSenseAI() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-8 flex flex-col items-center text-center space-y-4 bg-gradient-to-br from-brand-50 via-white to-white">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Brain size={32} className="text-white" />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900">NordSense AI</h1>
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100 border border-brand-200 px-1.5 py-0.5 rounded">Beta</span>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
          NordSense er bygget rundt en intelligent kjerne som forutser, planlegger og optimaliserer energibruken
          — ikke bare reagerer på prisene. Her er hva som er aktivt i dag og hva som kommer.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {capabilities.map(({ icon, title, status, desc }) => {
          const meta = statusMeta[status]
          return (
            <div key={title} className="card p-5 space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${meta.cls}`}>
                  {meta.icon}
                  {meta.label}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed flex-1">{desc}</p>
            </div>
          )
        })}
      </div>

      <div className="card p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Slik bygger vi det opp</h3>
        <ol className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
            <span><strong className="text-slate-700">Datainnsamling</strong> — telemetri fra hver enhet via Modbus og CAN-bus, sammenstilt med Nord Pool-priser og værdata.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
            <span><strong className="text-slate-700">Mønstergjenkjenning</strong> — modeller læres opp på 3–6 måneder reell drift per bygg, slik at de forstår akkurat dette byggets oppførsel.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
            <span><strong className="text-slate-700">Optimering</strong> — NordSense regner ut den billigste driftsplanen som fortsatt holder komfortgrensene, og sender setpunkter ut til hver enhet automatisk.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">4</span>
            <span><strong className="text-slate-700">Tilbakekobling</strong> — systemet sammenligner faktisk resultat mot prognose og forbedrer modellen kontinuerlig.</span>
          </li>
        </ol>
      </div>

      <div className="card p-5 flex items-center gap-3 bg-slate-50 border-slate-200">
        <Sparkles size={16} className="text-amber-500 shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-700">Personvern:</strong> NordSense AI trener kun på anonymisert teknisk telemetri (temperaturer, effekt, ventiltilstand).
          Vi behandler aldri personopplysninger om bygningens brukere.
        </p>
      </div>
    </div>
  )
}
