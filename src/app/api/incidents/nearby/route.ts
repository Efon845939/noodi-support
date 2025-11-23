// src/app/api/incidents/nearby/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/firebase-server'
import {
  collection,
  getDocs,
} from 'firebase/firestore'

/**
 * İki koordinat arasındaki mesafeyi km cinsinden hesaplar (haversine).
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Dünya yarıçapı (km)
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

export async function POST(req: NextRequest) {
  try {
    const db = getServerDb()
    const body = await req.json().catch(() => ({}))

    const {
      lat,
      lng,
      radiusKm = 500,
      window = '24h',
    } = body as {
      lat?: number
      lng?: number
      radiusKm?: number
      window?: '24h' | '3d' | '7d'
    }

    const now = Date.now()
    const maxAgeMs =
      window === '24h'
        ? 24 * 3600 * 1000
        : window === '3d'
        ? 3 * 24 * 3600 * 1000
        : 7 * 24 * 3600 * 1000

    const snap = await getDocs(collection(db, 'nearbyEvents'))

    const items = snap.docs
      .map((d) => {
        const data: any = d.data()

        // createdAt'i sağlamca oku
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

        // Zaman filtresi
        if (now - createdAtMs > maxAgeMs) return null

        const eventLat = data.location?.lat
        const eventLng = data.location?.lng

        let distKm = 0

        // Hem kullanıcının hem olayın koordinatı varsa mesafeyi hesapla
        if (
          typeof lat === 'number' &&
          typeof lng === 'number' &&
          typeof eventLat === 'number' &&
          typeof eventLng === 'number'
        ) {
          distKm = haversineKm(lat, lng, eventLat, eventLng)
          if (distKm > radiusKm) return null // radius dışındakileri at
        } else {
          // Koordinat yoksa radius'a göre filtreleyemiyoruz,
          // istersen burada return null deyip tamamen gizleyebilirsin.
          return null
        }

        return {
          id: d.id,
          type: data.type || 'other',
          title: data.title || 'Olay',
          ts: createdAtMs,
          distKm: Math.round(distKm),
          severity: (data.severity as 'low' | 'medium' | 'high') || 'medium',
          meta: {
            address:
              data.location?.label ||
              data.location?.address ||
              '',
          },
        }
      })
      .filter(Boolean)

    return NextResponse.json({ items }, { status: 200 })
  } catch (e) {
    console.error('nearby error:', e)
    return NextResponse.json(
      { items: [], error: 'api exploded' },
      { status: 200 },
    )
  }
}
