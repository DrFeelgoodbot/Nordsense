// Central mapping between internal page ids, URL paths and per-page SEO metadata.

export type RouteMeta = {
  path: string
  title: string
  description: string
}

const SITE = 'NordSense'
const SUFFIX = ` | ${SITE} — Intelligent energioptimalisering`

export const routes: Record<string, RouteMeta> = {
  overview: {
    path: '/',
    title: 'NordSense — Intelligent energistyring av varmepumper og kjøleanlegg',
    description: 'NordSense kutter strømkostnadene ved å styre varmepumper, ventilasjon og kjøleanlegg automatisk etter Nord Pool-priser. Se live demo.',
  },
  buildings: {
    path: '/bygg',
    title: 'Bygg & enheter' + SUFFIX,
    description: 'Oversikt over bygningsportefølje og tilkoblede klima- og energienheter i NordSense.',
  },
  energy: {
    path: '/energianalyse',
    title: 'Energianalyse' + SUFFIX,
    description: 'Analyser energiforbruk, COP og besparelser på tvers av hele bygningsporteføljen.',
  },
  optimization: {
    path: '/optimalisering',
    title: 'Optimalisering' + SUFFIX,
    description: 'Se hvordan NordSense justerer setpunkter etter Nord Pool-priser for å redusere strømkostnadene.',
  },
  ai: {
    path: '/nordsense-ai',
    title: 'NordSense AI — prediktiv energistyring' + SUFFIX,
    description: 'NordSense AI forutser, planlegger og optimaliserer energibruken: lastprognose, prediktiv driftsplanlegging og prediktivt vedlikehold.',
  },
  alarms: {
    path: '/alarmer',
    title: 'Alarmer' + SUFFIX,
    description: 'Sanntids alarmovervåking av varmepumper, kjøleanlegg, ventilasjon og datarom.',
  },
  canbus: {
    path: '/can-bus',
    title: 'CAN-bus overvåking' + SUFFIX,
    description: 'Live CAN-bus feed, feilhistorikk og severitetsfordeling for tilkoblede enheter.',
  },
  settings: {
    path: '/innstillinger',
    title: 'Innstillinger' + SUFFIX,
    description: 'Konfigurasjon av NordSense-plattformen.',
  },
  roi: {
    path: '/roi-kalkulator',
    title: 'ROI-kalkulator — beregn din energibesparelse' + SUFFIX,
    description: 'Beregn hvor mye bygget eller eiendomsporteføljen din kan spare med automatisk spotpris-styring fra NordSense.',
  },
  contact: {
    path: '/kontakt',
    title: 'Kontakt / Tilbud' + SUFFIX,
    description: 'Ta kontakt for et tilbud på intelligent energioptimalisering fra NordSense.',
  },
  partners: {
    path: '/samarbeid',
    title: 'Samarbeid' + SUFFIX,
    description: 'Er du interessert i et samarbeid med NordSense? Ta kontakt.',
  },
  privacy: {
    path: '/personvern',
    title: 'Personvern' + SUFFIX,
    description: 'Personvernerklæring for NordSense — hvordan vi behandler dine opplysninger.',
  },
  about: {
    path: '/om-nordsense',
    title: 'Om NordSense' + SUFFIX,
    description: 'NordSense er bygget av en autorisert kuldetekniker for å kutte strømkostnader i næringsbygg uten å bytte ut eksisterende anlegg.',
  },
}

const pathToPage: Record<string, string> = Object.fromEntries(
  Object.entries(routes).map(([page, { path }]) => [path, page]),
)

export function pageFromPath(pathname: string): string {
  // Normalise trailing slash (except root)
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return pathToPage[clean] ?? pathToPage[pathname] ?? 'overview'
}

export function pathFromPage(page: string): string {
  return routes[page]?.path ?? '/'
}

export function applyMeta(page: string) {
  const meta = routes[page] ?? routes.overview
  document.title = meta.title

  const setMeta = (selector: string, attr: string, value: string) => {
    let el = document.head.querySelector(selector) as HTMLMetaElement | null
    if (!el) {
      el = document.createElement('meta')
      const [a, v] = attr.split('=')
      el.setAttribute(a, v.replace(/"/g, ''))
      document.head.appendChild(el)
    }
    el.setAttribute('content', value)
  }

  setMeta('meta[name="description"]', 'name="description"', meta.description)
  setMeta('meta[property="og:title"]', 'property="og:title"', meta.title)
  setMeta('meta[property="og:description"]', 'property="og:description"', meta.description)
  setMeta('meta[property="og:url"]', 'property="og:url"', 'https://nordsense.no' + pathFromPage(page))
  setMeta('meta[name="twitter:title"]', 'name="twitter:title"', meta.title)
  setMeta('meta[name="twitter:description"]', 'name="twitter:description"', meta.description)

  // Canonical link
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', 'https://nordsense.no' + pathFromPage(page))
}
