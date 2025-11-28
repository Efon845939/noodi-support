// src/components/NearbyFeed.tsx
'use client'

import { useEffect, useState } from 'react'
import { getFirebaseDb } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'

type Report = {
  id: string
  type: string
  title: string
  ts: number
  distKm: number
  meta?: {
    address?: string
  }
}

type Cluster = {
  key: string
  type: string
  address: string
  count: number
  minDistKm: number
  latestTs: number
}

const MIN_REPORTS_FOR_EVENT = 10

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
}: {
  radiusKm: number
  windowRange: '24h' | '3d' | '7d'
  categories?: string[] // imza uyumu için, kullanılmıyor
}) {
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [err, setErr] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr('')
    setClusters([])

    const db = getFirebaseDb()
    if (!db) {
      setErr('Firebase yapılandırması eksik (db yok).')
      setLoading(false)
      return
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErr('Tarayıcın konum desteği vermiyor.')
      setLoading(false)
      return
    }

    const maxAgeMs =
      windowRange === '24h'
        ? 24 * 3600 * 1000
        : windowRange === '3d'
        ? 3 * 24 * 3600 * 1000
        : 7 * 24 * 3600 * 1000

    const fetchNearby = async (lat: number, lng: number) => {
      try {
        const snap = await getDocs(collection(db, 'reports'))
        const now = Date.now()
        const reports: Report[] = []

        snap.forEach((docSnap) => {
          const data: any = docSnap.data()
          const loc = data.location || {}
          const rLat = typeof loc.lat === 'number' ? loc.lat : null
          const rLng = typeof loc.lng === 'number' ? loc.lng : null
          if (rLat == null || rLng == null) return

          let createdAtMs = now
          const rawCreated = data.createdAt
          if (rawCreated?.toDate) {
            createdAtMs = rawCreated.toDate().getTime()
          } else if (typeof rawCreated === 'number') {
            createdAtMs = rawCreated
          } else if (typeof rawCreated === 'string') {
            const parsed = Date.parse(rawCreated)
            if (!Number.isNaN(parsed)) createdAtMs = parsed
          }
          if (now - createdAtMs > maxAgeMs) return

          const dist = haversineKm(lat, lng, rLat, rLng)
          if (dist > radiusKm) return

          reports.push({
            id: docSnap.id,
            type: data.type || 'other',
            title: data.title || loc.address || 'Yakın ihbar',
            ts: createdAtMs,
            distKm: Math.round(dist),
            meta: {
              address: loc.address || undefined,
            },
          })
        })

        // tür + adres bazlı cluster
        const map = new Map<string, Cluster>()

        for (const r of reports) {
          const addr =
            r.meta?.address?.trim() || 'Konum belirtilmemiş'
          const key = `${r.type}__${addr}`

          const existing = map.get(key)
          if (existing) {
            existing.count += 1
            if (r.distKm < existing.minDistKm) {
              existing.minDistKm = r.distKm
            }
            if (r.ts > existing.latestTs) {
              existing.latestTs = r.ts
            }
          } else {
            map.set(key, {
              key,
              type: r.type,
              address: addr,
              count: 1,
              minDistKm: r.distKm,
              latestTs: r.ts,
            })
          }
        }

        let cls = Array.from(map.values())

        // eşik: en az MIN_REPORTS_FOR_EVENT ihbar
        cls = cls.filter((c) => c.count >= MIN_REPORTS_FOR_EVENT)

        // yeni tarih en üstte
        cls.sort((a, b) => b.latestTs - a.latestTs)

        if (!cancelled) {
          setClusters(cls)
          setLoading(false)
        }
      } catch (e) {
        console.error('NearbyFeed Firestore error:', e)
        if (!cancelled) {
          setErr('Yakın olaylar alınırken hata oluştu.')
          setClusters([])
          setLoading(false)
        }
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        fetchNearby(lat, lng)
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
  }, [radiusKm, windowRange])

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

  if (!clusters.length) {
    return (
      <div className="text-sm text-gray-500 px-4 py-2">
        Yakınında eşik sayısına ulaşan (en az {MIN_REPORTS_FOR_EVENT} ihbar)
        olay yok.
      </div>
    )
  }

  return (
    <div className="px-4 py-2 space-y-2">
      {clusters.map((c) => (
        <div
          key={c.key}
          className="bg-white border border-[#E7EAF0] rounded-xl p-3 flex items-center justify-between gap-3"
        >
          <div className="flex-1">
            <div className="text-[13px] uppercase tracking-wide text-gray-500">
              {badge(c.type)} • {c.minDistKm} km
            </div>
            <div className="text-[15px] text-[#102A43] font-semibold">
              {c.address}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {c.count} ihbar
            </div>
          </div>
        </div>
      ))}
    </div>
  )
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
