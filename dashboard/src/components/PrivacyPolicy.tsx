import { Shield } from 'lucide-react'

export function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="card p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-brand-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Personvernerklæring</h1>
            <p className="text-xs text-slate-400">Sist oppdatert: mai 2026</p>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Behandlingsansvarlig</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            NordSense v/ Stian Skjerven er behandlingsansvarlig for personopplysningene som samles inn via dette kontaktskjemaet.
            Kontakt: <a href="mailto:stiskjer@gmail.com" className="text-brand-600 hover:underline">stiskjer@gmail.com</a> · <a href="tel:+4791375775" className="text-brand-600 hover:underline">913 75 775</a>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Hvilke opplysninger samles inn</h2>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Navn</li>
            <li>Selskap</li>
            <li>Telefonnummer</li>
            <li>E-postadresse</li>
            <li>Antall bygg i porteføljen</li>
            <li>Melding / forespørsel</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Formål og rettslig grunnlag</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Opplysningene brukes utelukkende for å behandle din henvendelse og gi deg et tilbud på energioptimalisering.
            Rettslig grunnlag er ditt samtykke (GDPR art. 6 nr. 1 a), som du gir ved å sende inn skjemaet.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Lagring og sletting</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Opplysningene lagres i inntil 12 måneder etter siste kontakt, og slettes deretter med mindre det er inngått avtale.
            Skjemadata lagres hos Netlify (USA) under EU-US Data Privacy Framework.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dine rettigheter</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Du har rett til innsyn, retting og sletting av dine opplysninger, samt rett til å trekke samtykket tilbake når som helst.
            Ta kontakt på <a href="mailto:stiskjer@gmail.com" className="text-brand-600 hover:underline">stiskjer@gmail.com</a> for å benytte dine rettigheter.
            Du kan også klage til <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Datatilsynet</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Deling av opplysninger</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Opplysningene deles ikke med tredjeparter utover Netlify (skjemahåndtering). Det utføres ingen automatisert beslutningstaking eller profilering.
          </p>
        </section>
      </div>
    </div>
  )
}
