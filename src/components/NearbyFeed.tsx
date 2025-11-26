'use client'

import { useEffect, useState } from 'react'
import { getFirebaseDb } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

type Severity = 'low' | 'medium' | 'high'

type ReportDoc = {
  id: string
  type?: string
  createdAt?: any
  location?: {
    lat?: number | null
    lng?: number | null
    address?: string
  }
  severity?: Severity
}

type FeedItem = {
  id: string
  type: string
  title: string
  distKm: number | null
  count: number
  severity: Severity
  address: string
}

const MIN_REPORTS_FOR_EVENT = 10 // burada artır / azaltabilirsin

// Basit haversine
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // km
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

// türkçe karakterleri sadeleştir (fuzzy karşılaştırma için)
function normalize(str: string | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sevClass(s: Severity) {
  if (s === 'high') return 'bg-red-100 text-red-700'
  if (s === 'medium') return 'bg-amber-100 text-amber-700'
  return 'bg-gray-200 text-gray-700'
}

function badge(type: string) {
  switch (type) {
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
    case 'firtina':
    case 'storm':
      return 'Fırtına'
    case 'trafik':
      return 'Trafik'
    case 'kayip':
      return 'Kayıp'
    case 'gaz':
      return 'Gaz Kaçağı'
    default:
      return 'Olay'
  }
}

export default function NearbyFeed({
  radiusKm,
  windowRange,
  // şu an categories'i filtrelemede kullanmıyoruz; istersen sonra map’leriz
  categories,
}: {
  radiusKm: number
  windowRange: '24h' | '3d' | '7d'
  categories: string[]
}) {
  const [items, setItems] = useState<FeedItem[]>([])
  const [err, setErr] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setLoading(true)
      setErr('')
      setItems([])

      const db = getFirebaseDb()
      if (!db) {
        setErr('Firebase yapılandırması eksik.')
        setLoading(false)
        return
      }

      // 1) Konumu al (timeout + fallback)
      let lat: number | undefined
      let lng: number | undefined

      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        let resolved = false
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true
            const cached = window.localStorage.getItem('nearby_last_geo')
            if (cached) {
              try {
                const c = JSON.parse(cached)
                lat = c.lat
                lng = c.lng
              } catch {}
            }
          }
        }, 8000)

        await new Promise<void>((resolvePos) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!resolved) {
                resolved = true
                clearTimeout(timeoutId)
                lat = pos.coords.latitude
                lng = pos.coords.longitude
                try {
                  window.localStorage.setItem(
                    'nearby_last_geo',
                    JSON.stringify({
                      lat,
                      lng,
                      ts: Date.now(),
                    })
                  )
                } catch {}
              }
              resolvePos()
            },
            () => {
              if (!resolved) {
                resolved = true
                clearTimeout(timeoutId)
                const cached = window.localStorage.getItem('nearby_last_geo')
                if (cached) {
                  try {
                    const c = JSON.parse(cached)
                    lat = c.lat
                    lng = c.lng
                  } catch {}
                }
                resolvePos()
              }
            },
            { enableHighAccuracy: false, timeout: 7000 }
          )
        })
      }

      if (cancelled) return

      if (lat == null || lng == null) {
        // konum yoksa yine de çalıştırabiliriz ama radius filtresi yapamayız
        setErr('Konum alınamadı. Yakın olaylar listesi sınırlı gösteriliyor.')
      }

      // 2) Raporları çek
      const snap = await getDocs(collection(db, 'reports'))

      const now = Date.now()
      const maxAgeMs =
        windowRange === '24h'
          ? 24 * 3600 * 1000
          : windowRange === '3d'
          ? 3 * 24 * 3600 * 1000
          : 7 * 24 * 3600 * 1000

      const groups = new Map<string, ReportDoc[]>()

      snap.forEach((docSnap) => {
        const data = docSnap.data() as any as ReportDoc
        const createdRaw = data.createdAt
        let createdAtMs = 0
        if (createdRaw?.toDate) {
          createdAtMs = createdRaw.toDate().getTime()
        } else if (typeof createdRaw === 'number') {
          createdAtMs = createdRaw
        } else if (typeof createdRaw === 'string') {
          const p = Date.parse(createdRaw)
          createdAtMs = Number.isNaN(p) ? 0 : p
        }
        if (!createdAtMs || now - createdAtMs > maxAgeMs) return

        const type = data.type || 'other'
        const addr = data.location?.address || ''
        const key = `${type}__${normalize(addr)}`

        const arr = groups.get(key) || []
        arr.push({
          id: docSnap.id,
          type,
          createdAt: createdAtMs,
          location: data.location,
          severity: data.severity || 'medium',
        })
        groups.set(key, arr)
      })

      // 3) grupları feed item'lara çevir
      const result: FeedItem[] = []
      groups.forEach((reports, key) => {
        if (reports.length < MIN_REPORTS_FOR_EVENT) return

        // adres
        const sample = reports[0]
        const address = sample.location?.address || 'Konum belirtilmemiş'

        // mesafe
        let dist: number | null = null
        const rWithCoord = reports.filter(
          (r) => typeof r.location?.lat === 'number' && typeof r.location?.lng === 'number'
        )
        if (lat != null && lng != null && rWithCoord.length > 0) {
          const d = Math.min(
            ...rWithCoord.map((r) =>
              haversineKm(lat!, lng!, r.location!.lat as number, r.location!.lng as number)
            )
          )
          if (d <= radiusKm) {
            dist = Math.round(d)
          } else {
            // çok uzakta ise hiç ekleme
            return
          }
        } else if (lat != null && lng != null) {
          // hiç koordinat yoksa, mesafe hesaplayamıyoruz → gene de göster
          dist = null
        }

        // severity
        let sev: Severity = 'low'
        if (reports.some((r) => r.severity === 'high')) sev = 'high'
        else if (reports.some((r) => r.severity === 'medium')) sev = 'medium'

        const [type, addrNorm] = key.split('__')
        const title = `${badge(type)} – ${address}`

        result.push({
          id: key,
          type,
          title,
          distKm: dist,
          count: reports.length,
          severity: sev,
          address,
        })
      })

      if (cancelled) return

      result.sort((a, b) => b.count - a.count || (a.distKm ?? 999999) - (b.distKm ?? 999999))

      setItems(result)
      setLoading(false)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [radiusKm, windowRange, JSON.stringify(categories)])

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
        Yakın zamanda kriterlere uyan ihbar bulunamadı.
      </div>
    )
  }

  return (
    <div className="px-4 py-2 space-y-2">
      {err && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-1.5">
          {err}
        </div>
      )}
      {items.map((x) => (
        <div
          key={x.id}
          className="bg-white border border-[#E7EAF0] rounded-xl p-3 flex items-center justify-between"
        >
          <div>
            <div className="text-[13px] uppercase tracking-wide text-gray-500">
              {badge(x.type)} • {x.count} ihbar
              {x.distKm != null && <> • {x.distKm} km</>}
            </div>
            <div className="text-[15px] text-[#102A43] font-semibold">
              {x.title}
            </div>
            {x.address && (
              <div className="text-xs text-gray-500">{x.address}</div>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${sevClass(x.severity)}`}>
            {x.severity.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  )
}
