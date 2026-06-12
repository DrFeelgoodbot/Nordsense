import { GraduationCap, Wrench, Cpu, Zap, Github } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Hero */}
      <div className="card p-8 flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Zap size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Om NordSense</h1>
        <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
          NordSense er et system for intelligent energistyring av varmepumper og kjøleanlegg —
          utviklet for å kutte strømkostnader ved å utnytte svingningene i Nord Pool-markedet.
        </p>
      </div>

      {/* Bakgrunn */}
      <div className="card p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <GraduationCap size={18} className="text-amber-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Bakgrunn</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          NordSense startet som et universitetsprosjekt og er utviklet av en autorisert kuldetekniker
          som videreutdanner seg innenfor digitalisering og IT. Kombinasjonen av faglig bakgrunn fra
          kulde- og varmepumpebransjen og ny kompetanse innen programvareutvikling og IoT har gitt
          et unikt utgangspunkt for å løse et reelt problem i bransjen.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Idéen kom fra mange år i felt — der man så at anlegg kjørte for fullt uansett om strømmen
          kostet 20 øre eller 3 kroner per kWh. Med NordSense styres setpunktene automatisk basert
          på faktiske Nord Pool-priser, slik at anlegget bruker energi når det er billig og sparer
          når det er dyrt — uten at komforten forringes.
        </p>
      </div>

      {/* Teknologi */}
      <div className="card p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
            <Cpu size={18} className="text-brand-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Teknologi</h2>
        </div>
        <figure className="rounded-xl overflow-hidden border border-slate-200">
          <img
            src="/styretavle.jpg"
            alt="NordSense edge-kontroller montert på DIN-skinne i et styreskap, med RS485- og CAN-tilkoblinger til feltbus og 24 V strømforsyning"
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          <figcaption className="text-[11px] text-slate-400 px-3 py-2 bg-slate-50 border-t border-slate-200">
            Edge-kontroller installert i kundens styretavle — DIN-skinne, RS485/CAN-tilkobling og 24 V DC strømforsyning.
          </figcaption>
        </figure>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Edge-kontroller', desc: 'Raspberry Pi Zero 2 WH med RS485/CAN HAT og 4G-tilkobling' },
            { label: 'Kommunikasjon', desc: 'Modbus RTU over RS485 og CAN-bus — støtter Carel, Danfoss, Swegon, Eliwell, SystemAir' },
            { label: 'Strømpris', desc: 'Nord Pool day-ahead priser NO1–NO5, oppdatert hver time' },
            { label: 'Dashboard', desc: 'React + Vite, sanntidsvisning av forbruk, alarmer og optimalisering' },
            { label: 'Backend', desc: 'FastAPI + InfluxDB + MQTT på Hetzner — skalerbart og containerbasert' },
            { label: 'Optimalisering', desc: 'Automatisk justering av setpunkt basert på pristerskel og komfortgrenser' },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4 space-y-1">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">{label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hvem er dette for */}
      <div className="card p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
            <Wrench size={18} className="text-emerald-600" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Hvem er dette for?</h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          NordSense er laget for eiendomsselskaper, driftsavdelinger og tekniske forvaltere som
          ønsker å redusere energikostnadene uten å bytte ut eksisterende anlegg. Systemet kobles
          på via RS485 eller CAN-bus — det samme grensesnittet teknikere jobber med til daglig.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Varmepumper', 'Kjøleanlegg', 'Ventilasjon', 'Eiendomsporteføljer', 'Næringsbygg', 'Borettslag'].map(tag => (
            <span key={tag} className="text-xs bg-brand-50 text-brand-700 font-medium px-3 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="card p-6 flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold text-slate-700">Prosjektstatus</div>
          <div className="text-xs text-slate-400">Aktiv utvikling · Demo tilgjengelig · Pilotinstallasjon planlegges</div>
        </div>
        <a
          href="https://github.com/DrFeelgoodbot/Nordsense"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-600 transition-colors bg-slate-50 px-3 py-2 rounded-xl border border-slate-200"
        >
          <Github size={14} />
          GitHub
        </a>
      </div>

    </div>
  )
}
