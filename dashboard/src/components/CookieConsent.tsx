import { useState, useEffect } from 'react'
import { Cookie } from 'lucide-react'
import { getConsent, grantConsent, denyConsent, isEnabled } from '../lib/analytics'

export function CookieConsent({ onPrivacy }: { onPrivacy?: () => void }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isEnabled() && getConsent() === null) setShow(true)
  }, [])

  if (!show) return null

  const accept = () => { grantConsent(); setShow(false) }
  const decline = () => { denyConsent(); setShow(false) }

  return (
    <div className="fixed bottom-3 left-3 right-3 md:left-auto md:right-4 md:bottom-4 md:max-w-sm z-50 card p-5 shadow-2xl border border-slate-200">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
          <Cookie size={18} className="text-brand-600" />
        </div>
        <div className="space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Vi bruker informasjonskapsler for analyse og markedsføring for å forbedre nettstedet.
            Du kan lese mer i{' '}
            <button type="button" onClick={onPrivacy} className="text-brand-600 hover:underline font-medium">
              personvernerklæringen
            </button>.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={accept}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              Godta alle
            </button>
            <button
              onClick={decline}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              Kun nødvendige
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
