// Google Analytics 4 + Consent Mode v2.
// Everything is gated on GA_MEASUREMENT_ID — while it is empty, no script loads,
// no cookies are set and the consent banner stays hidden. Set the ID once the
// GA4 property exists, e.g. 'G-XXXXXXXXXX', then redeploy.
export const GA_MEASUREMENT_ID = 'G-2XSREBKD18'

const CONSENT_KEY = 'ns_analytics_consent'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments)
}

let loaded = false

export function isEnabled() {
  return Boolean(GA_MEASUREMENT_ID)
}

export function getConsent(): 'granted' | 'denied' | null {
  const v = localStorage.getItem(CONSENT_KEY)
  return v === 'granted' || v === 'denied' ? v : null
}

// Sets Consent Mode v2 defaults (everything denied) before any tag fires.
export function initConsentMode() {
  if (!isEnabled()) return
  window.dataLayer = window.dataLayer || []
  window.gtag = gtag
  const stored = getConsent()
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: stored === 'granted' ? 'granted' : 'denied',
    wait_for_update: 500,
  })
  if (stored === 'granted') loadGtag()
}

function loadGtag() {
  if (loaded || !isEnabled()) return
  loaded = true
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(s)
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true })
}

export function grantConsent() {
  localStorage.setItem(CONSENT_KEY, 'granted')
  if (!isEnabled()) return
  gtag('consent', 'update', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  })
  loadGtag()
}

export function denyConsent() {
  localStorage.setItem(CONSENT_KEY, 'denied')
  if (!isEnabled()) return
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
}

// Track a conversion / custom event. No-op until GA is configured.
export function track(event: string, params: Record<string, unknown> = {}) {
  if (!isEnabled()) return
  gtag('event', event, params)
}

// Track an SPA page view on route change.
export function trackPageView(path: string, title: string) {
  if (!isEnabled()) return
  gtag('event', 'page_view', { page_path: path, page_title: title })
}
