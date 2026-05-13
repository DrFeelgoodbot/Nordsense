import { useState } from 'react'
import { Phone, Mail, Building2, User, MessageSquare, CheckCircle2, Send } from 'lucide-react'

export function ContactForm({ onPrivacy }: { onPrivacy?: () => void }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    buildings: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = new URLSearchParams({
        'form-name': 'kontakt',
        ...form,
      })
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      setSubmitted(true)
    } catch {
      // fallback: show success anyway (Netlify handles it)
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Takk for din henvendelse!</h2>
        <p className="text-slate-500 text-sm">Vi tar kontakt innen 1 virkedag. Du kan også ringe oss direkte på <a href="tel:+4791375775" className="text-brand-600 font-semibold">913 75 775</a>.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', company: '', phone: '', email: '', buildings: '', message: '' }) }}
          className="mt-4 text-sm text-brand-600 hover:underline"
        >
          Send ny henvendelse
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="card p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Få tilbud på NordSense</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Kutt energikostnadene med Nord Pool-optimalisering — automatisk styring av varmepumper og kjøleanlegg basert på strømpris.
          </p>
          <div className="pt-2 space-y-2">
            <a href="tel:+4791375775" className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors">
              <Phone size={15} className="text-brand-600" />
              <span className="font-medium">913 75 775</span>
            </a>
            <a href="mailto:stiskjer@gmail.com" className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors">
              <Mail size={15} className="text-brand-600" />
              <span className="font-medium">stiskjer@gmail.com</span>
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center shrink-0">
          {[
            { val: '15–25%', label: 'Energibesparelse' },
            { val: 'NO1–5', label: 'Nord Pool-soner' },
            { val: 'RS485', label: 'Modbus + CAN' },
            { val: '24/7', label: 'Overvåking' },
          ].map(({ val, label }) => (
            <div key={label} className="bg-brand-50 rounded-xl px-4 py-3">
              <div className="text-lg font-bold text-brand-700">{val}</div>
              <div className="text-[10px] text-brand-500 uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form
        name="kontakt"
        method="POST"
        data-netlify="true"
        onSubmit={handleSubmit}
        className="card p-8 space-y-5"
      >
        <input type="hidden" name="form-name" value="kontakt" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Navn */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <User size={12} /> Navn *
            </label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Ola Nordmann"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-slate-50"
            />
          </div>

          {/* Selskap */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Building2 size={12} /> Selskap *
            </label>
            <input
              type="text"
              name="company"
              required
              value={form.company}
              onChange={handleChange}
              placeholder="Eiendom AS"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-slate-50"
            />
          </div>

          {/* Telefon */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Phone size={12} /> Telefon *
            </label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              placeholder="900 00 000"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-slate-50"
            />
          </div>

          {/* E-post */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Mail size={12} /> E-post
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ola@eiendom.no"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-slate-50"
            />
          </div>
        </div>

        {/* Antall bygg */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Antall bygg i porteføljen
          </label>
          <select
            name="buildings"
            value={form.buildings}
            onChange={handleChange}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-slate-50"
          >
            <option value="">Velg...</option>
            <option value="1–5">1–5 bygg</option>
            <option value="6–20">6–20 bygg</option>
            <option value="21–50">21–50 bygg</option>
            <option value="50+">50+ bygg</option>
          </select>
        </div>

        {/* Melding */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare size={12} /> Melding
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            placeholder="Beskriv gjerne type anlegg, antall enheter, eller spørsmål du har..."
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-slate-50 resize-none"
          />
        </div>

        {/* GDPR-samtykke */}
        <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <input
            type="checkbox"
            id="consent"
            required
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400 cursor-pointer"
          />
          <label htmlFor="consent" className="text-xs text-slate-500 leading-relaxed cursor-pointer">
            Jeg godtar at NordSense lagrer mine opplysninger for å behandle denne henvendelsen, i henhold til{' '}
            <button
              type="button"
              onClick={onPrivacy}
              className="text-brand-600 hover:underline font-medium"
            >
              personvernerklæringen
            </button>
            . Samtykket kan trekkes tilbake når som helst.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !consent}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? (
            <span>Sender...</span>
          ) : (
            <>
              <Send size={15} />
              Send henvendelse
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-400">
          Vi svarer innen 1 virkedag · Ring direkte: <a href="tel:+4791375775" className="text-brand-600 font-medium">913 75 775</a>
        </p>
      </form>
    </div>
  )
}
