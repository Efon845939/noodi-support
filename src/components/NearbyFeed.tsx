'use client'

import { useEffect, useState } from 'react'
import { getFirebaseDb } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

type Item = {
  id: string
  type: string
  title: string
  ts: number
  distKm: number
  severity: 'low' | 'medium' | 'high'
  meta?: any
}

type ReportData = {
  type?: string
  location?: {
    lat?: number | null
    lng?: number | null
    address?: string
    label?: string
  }
  createdAt?: any
  severity?: 'low' | 'medium' | 'high'
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function NearbyFeed({
  radiusKm,
  windowRange,
  categories,
}: {
  radiusKm: number
  windowRange: '24h' | '3d' | '7d'
  categories: string[]
}) {
  const [items, setItems] = useState<Item[]>([])
  const [err, setErr] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setErr('Konum erişimi yok.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setErr('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return
        try {
          const db = getFirebaseDb()
          if (!db) {
            setErr('Sistem yapılandırması eksik.')
            setLoading(false)
            return
          }

          const snap = await getDocs(collection(db, 'reports'))
          const now = Date.now()
          const maxAgeMs =
            windowRange === '24h'
              ? 24 * 3600 * 1000
              : windowRange === '3d'
              ? 3 * 24 * 3600 * 1000
              : 7 * 24 * 3600 * 1000

          type Cluster = {
            key: string
            rawType: string
            label: string
            reports: {
              ts: number
              distKm: number
              severity: 'low' | 'medium' | 'high'
            }[]
          }

          const clusters = new Map<string, Cluster>()
          const userLat = pos.coords.latitude
          const userLng = pos.coords.longitude

          snap.forEach((docSnap) => {
            const data = docSnap.data() as ReportData
            const rawType = (data.type || 'other').toString()

            const loc = data.location || {}
            const lat = loc.lat
            const lng = loc.lng
            const address = loc.label || loc.address || ''

            if (typeof lat !== 'number' || typeof lng !== 'number') return

            // zaman filtresi
            let createdAtMs = now
            const rawCreated = data.createdAt
            if (rawCreated?.toDate) {
              createdAtMs = rawCreated.toDate().getTime()
            }
            if (now - createdAtMs > maxAgeMs) return

            const dist = haversineKm(userLat, userLng, lat, lng)
            if (dist > radiusKm) return

            const key = `${rawType}__${address || 'Konum belirtilmemiş'}`
            const severity = data.severity || 'medium'

            const c = clusters.get(key)
            if (c) {
              c.reports.push({
                ts: createdAtMs,
                distKm: dist,
                severity,
              })
            } else {
              clusters.set(key, {
                key,
                rawType,
                label: address || 'Konum belirtilmemiş',
                reports: [
                  {
                    ts: createdAtMs,
                    distKm: dist,
                    severity,
                  },
                ],
              })
            }
          })

          // CLUSTER EŞİĞİ: en az 10 ihbar
          const aggregated: Item[] = []

          clusters.forEach((c) => {
            const count = c.reports.length
            if (count < 10) return

            const sorted = [...c.reports].sort((a, b) => b.ts - a.ts)
            const latest = sorted[0]
            const minDist = Math.min(...c.reports.map((r) => r.distKm))
            const sev = calcClusterSeverity(c.reports.map((r) => r.severity))

            aggregated.push({
              id: c.key,
              type: c.rawType,
              title: `${badge(c.rawType)} – ${c.label}`,
              ts: latest.ts,
              distKm: Math.round(minDist),
              severity: sev,
              meta: {
                address: c.label,
                count,
              },
            })
          })

          aggregated.sort((a, b) => b.ts - a.ts)
          setItems(aggregated)
        } catch (e) {
          console.warn('nearby fetch error', e)
          setItems([])
        } finally {
          if (!cancelled) setLoading(false)
        }
      },
      (error) => {
        if (cancelled) return
        console.warn('Geolocation error:', error)
        setErr('Konum alınamadı veya reddedildi.')
        setLoading(false)
      }
    )

    return () => {
      cancelled = true
    }
  }, [radiusKm, windowRange, JSON.stringify(categories)])

  if (err) {
    return (
      <div className="text-sm text-red-600 px-4 py-2">
        {err}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-500 px-4 py-2">
        Yakın olaylar yükleniyor…
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-sm text-gray-500 px-4 py-2">
        Yakın gerçekleşen olay yok.
      </div>
    )
  }

  return (
    <div className="px-4 py-2 space-y-2">
      {items.map((x) => (
        <div
          key={x.id}
          className="bg-white border border-[#E7EAF0] rounded-xl p-3 flex items-center justify-between"
        >
          <div>
            <div className="text-[13px] uppercase tracking-wide text-gray-500">
              {badge(x.type)} • {x.distKm} km • {x.meta?.count || 0} ihbar
            </div>
            <div className="text-[15px] text-[#102A43] font-semibold">
              {x.title}
            </div>
            {x.meta?.address && (
              <div className="text-xs text-gray-500">
                {x.meta.address}
              </div>
            )}
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${sev(
              x.severity
            )}`}
          >
            {x.severity.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  )
}

function calcClusterSeverity(sevs: ('low' | 'medium' | 'high')[]): 'low' | 'medium' | 'high' {
  if (sevs.includes('high')) return 'high'
  if (sevs.includes('medium')) return 'medium'
  return 'low'
}

function badge(t: string) {
  switch (t) {
    case 'deprem':
    case 'earthquake':
      return 'Deprem'
    case 'yangin':
    case 'fire':
      return 'Yangın'
    case 'sel':
    case 'flood':
      return 'Sel'
    case 'heyelan':
    case 'landslide':
      return 'Heyelan'
    case 'fırtına':
    case 'firtina':
    case 'storm':
      return 'Fırtına'
    case 'assault':
      return 'Saldırı'
    case 'robbery':
      return 'Hırsızlık'
    case 'abduction':
      return 'Kayıp'
    default:
      return 'Olay'
  }
}

function sev(s: 'low' | 'medium' | 'high') {
  return s === 'high'
    ? 'bg-red-100 text-red-700'
    : s === 'medium'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-200 text-gray-700'
}
