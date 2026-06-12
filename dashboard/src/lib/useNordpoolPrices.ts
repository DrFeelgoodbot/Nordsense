import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { nordpoolPrices as fallbackPrices } from './mockData'

export type PricePoint = { hour: number; price: number; date: string }
export type Zone = 'NO1' | 'NO2' | 'NO3' | 'NO4' | 'NO5'

type ApiEntry = { NOK_per_kWh: number; time_start: string }

const MVA = 1.25

function url(date: Date, zone: Zone) {
  const y = date.getFullYear()
  const md = format(date, 'MM-dd')
  return `https://www.hvakosterstrommen.no/api/v1/prices/${y}/${md}_${zone}.json`
}

export function useNordpoolPrices(zone: Zone = 'NO1') {
  const [prices, setPrices] = useState<PricePoint[]>(fallbackPrices)
  const [live, setLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    const today = new Date()
    const dateStr = format(today, 'yyyy-MM-dd')

    fetch(url(today, zone))
      .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: ApiEntry[]) => {
        if (cancelled || !Array.isArray(data)) return
        const mapped: PricePoint[] = data.map(d => ({
          hour: new Date(d.time_start).getHours(),
          price: +(d.NOK_per_kWh * MVA).toFixed(4),
          date: dateStr,
        }))
        if (mapped.length) {
          setPrices(mapped)
          setLive(true)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [zone])

  const now = new Date().getHours()
  const current = prices.find(p => p.hour === now)?.price ?? prices[0]?.price ?? 0.85

  return { prices, current, live }
}
