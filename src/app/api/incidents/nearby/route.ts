import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/firebase-server'
import { collection, getDocs } from 'firebase/firestore'

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

export async function POST(req: NextRequest) {
  try {
    const db = getServerDb()
    const body = (await req.json().catch(() => ({}))) as {
      lat?: number
      lng?: number
      radiusKm?: number
      window?: '24h' | '3d' | '7d'
      categories?: string[]
    }

    const { lat, lng, radiusKm = 500, window = '24h' } = body

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

        if (now - createdAtMs > maxAgeMs) return null

        const eventLat = data.location?.lat
        const eventLng = data.location?.lng

        if (
          typeof lat === 'number' &&
          typeof lng === 'number' &&
          typeof eventLat === 'number' &&
          typeof eventLng === 'number'
        ) {
          const dist = haversineKm(lat, lng, eventLat, eventLng)
          if (dist > radiusKm) return null

          return {
            id: d.id,
            type: data.type || 'other',
            title: data.title || 'Olay',
            ts: createdAtMs,
            distKm: Math.round(dist),
            severity:
              (data.severity as 'low' | 'medium' | 'high') || 'medium',
            meta: {
              address:
                data.location?.label || data.location?.address || '',
            },
          }
        }

        // koordinat yoksa gösterme
        return null
      })
      .filter(Boolean)

    return NextResponse.json({ items }, { status: 200 })
  } catch (e) {
    console.error('nearby error:', e)
    return NextResponse.json(
      { items: [], error: 'api exploded' },
      { status: 200 }
    )
  }
}
