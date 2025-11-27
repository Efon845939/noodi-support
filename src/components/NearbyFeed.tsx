// src/components/NearbyFeed.tsx
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
  meta?: {
    address?: string
  }
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
  // imza bozulmasın diye alıyoruz ama kullanmıyoruz
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  categories,
}: {
  radiusKm: number
  windowRange: '24h' | '3d' | '7d'
  categories?: string[]
}) {
  const [items, setItems] = useState<Item[]>([])
  const [err, setErr] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr('')
    setItems([])

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
        const res: Item[] = []

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

          const severity: 'low' | 'medium' | 'high' =
            data.severity === 'high'
              ? 'high'
              : data.severity === 'low'
              ? 'low'
              : 'medium'

          res.push({
            id: docSnap.id,
            type: data.type || 'other',
            title: data.title || loc.address || 'Yakın ihbar',
            ts: createdAtMs,
            distKm: Math.round(dist),
            severity,
            meta: {
              address: loc.address || undefined,
            },
          })
        })

        res.sort((a, b) => b.ts - a.ts)

        if (!cancelled) {
          setItems(res)
          setLoading(false)
        }
      } catch (e) {
        console.error('NearbyFeed Firestore error:', e)
        if (!cancelled) {
          setErr('Yakın ihbarlar alınırken hata oluştu.')
          setItems([])
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
        Yakın ihbarlar yükleniyor…
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-sm text-gray-500 px-4 py-2">
        Yakınında seçilen zaman aralığında ihbar yok.
      </div>
    )
  }

  return (
    <div className="px-4 py-2 space-y-2">
      {items.map((x) => (
        <div
          key={x.id}
          className="bg-white border border-[#E7EAF0] rounded-xl p-3 flex items-center justify-between gap-3"
        >
          <div className="flex-1">
            <div className="text-[13px] uppercase tracking-wide text-gray-500">
              {badge(x.type)} • {x.distKm} km
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

function sev(s: 'low' | 'medium' | 'high') {
  return s === 'high'
    ? 'bg-red-100 text-red-700'
    : s === 'medium'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-200 text-gray-700'
}
