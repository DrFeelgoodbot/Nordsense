import { Handshake, Mail } from 'lucide-react'

export function PartnersPage({ onContact: _onContact }: { onContact: () => void }) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-8 flex flex-col items-center text-center space-y-5">
        <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Handshake size={28} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Samarbeid</h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Er du interessert i et samarbeid med NordSense? Ta kontakt — så avtaler vi en prat.
        </p>
        <a
          href="mailto:stiskjer@gmail.com?subject=Samarbeid med NordSense"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Mail size={15} />
          stiskjer@gmail.com
        </a>
      </div>
    </div>
  )
}
