'use client'

import { useEffect, useState } from 'react'
import { getSimIncidents } from '@/lib/nearby-sim'

type Item = {
  id: string
  type: string
  title: string
  ts: number
  distKm: number
  severity: 'low' | 'medium' | 'high'
  meta?: {
    address?: string
    count?: number
  }
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
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErr('Konum erişimi yok.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setErr('')

    // konum alma için manuel timeout
    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        const cached = window.localStorage.getItem('nearby_last_geo')
        if (cached) {
          try {
            const c = JSON.parse(cached)
            // cached konumla devam et
            fetchNearby(c.lat, c.lng)
            return
          } catch {}
        }
        setErr('Konum alınamadı veya çok uzun sürdü.')
        setLoading(false)
      }
    }, 8000)

    const fetchNearby = async (lat: number, lng: number) => {
      try {
        const r = await fetch('/api/incidents/nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lng,
            radiusKm,
            window: windowRange,
            categories,
          }),
        }).catch(() => null)

        const live: Item[] =
          (await r?.json().catch(() => null))?.items || []

        const sims = getSimIncidents() as Item[]

        const merged = [...sims, ...live].sort((a, b) => b.ts - a.ts)

        if (!cancelled) {
          setItems(merged)
          setLoading(false)
        }
      } catch (e) {
        console.warn('nearby fetch error', e)
        if (!cancelled) {
          setItems([])
          setLoading(false)
        }
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return
        window.clearTimeout(timeoutId)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        try {
          window.localStorage.setItem(
            'nearby_last_geo',
            JSON.stringify({ lat, lng, ts: Date.now() })
          )
        } catch {}
        fetchNearby(lat, lng)
      },
      (error) => {
        if (cancelled) return
        window.clearTimeout(timeoutId)
        console.warn('Geolocation error:', error)
        const cached = window.localStorage.getItem('nearby_last_geo')
        if (cached) {
          try {
            const c = JSON.parse(cached)
            fetchNearby(c.lat, c.lng)
            return
          } catch {}
        }
        setErr('Konum alınamadı veya reddedildi.')
        setLoading(false)
      }
    )

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
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
              {badge(x.type)} • {x.distKm} km
              {typeof x.meta?.count === 'number' && x.meta.count > 0 && (
                <> • {x.meta.count} ihbar</>
              )}
            </div>
            <div className="text-[15px] text-[#102A43] font-semibold">
              {x.title}
            </div>
            {x.meta?.address && (
              <div className="text-xs text-gray-500">{x.meta.address}</div>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${sev(x.severity)}`}>
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

function sev(s: 'low' | 'medium' | 'high') {
  return s === 'high'
    ? 'bg-red-100 text-red-700'
    : s === 'medium'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-gray-200 text-gray-700'
}
