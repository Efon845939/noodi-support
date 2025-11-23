'use client'
import { useEffect, useState } from 'react'

type Item = {
  id: string
  type: string
  title: string
  ts: number
  distKm: number
  severity: 'low' | 'medium' | 'high'
  meta?: any
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
          const r = await fetch('/api/incidents/nearby', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              radiusKm,
              window: windowRange,
              categories,
            }),
          }).catch(() => null)

          if (!r) {
            // Ağ hatası: kullanıcıya “yakın olay yok” gibi davran
            setItems([])
            return
          }

          const j = await r.json().catch(() => null)
          const live = ((j?.items || []) as Item[]) || []
          setItems(live)
        } finally {
          if (!cancelled) setLoading(false)
        }
      },
      (error) => {
        if (cancelled) return
        console.warn('Geolocation error:', error)
        // Sadece gerçekten konum reddedildiyse hata göster
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
            className={`text-xs px-2 py-1 rounded-full ${sev(x.severity)}`}
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
    case 'earthquake':
      return 'Deprem'
    case 'fire':
      return 'Yangın'
    case 'flood':
      return 'Sel'
    case 'landslide':
      return 'Heyelan'
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
