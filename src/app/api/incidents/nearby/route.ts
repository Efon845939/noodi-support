// src/app/api/incidents/nearby/route.ts
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
    const body = await req.json().catch(() => ({}))

    const {
      lat,
      lng,
      radiusKm = 50,
    }: { lat?: number; lng?: number; radiusKm?: number } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { items: [], error: 'NO_LOCATION' },
        { status: 200 }
      )
    }

    const snap = await getDocs(collection(db, 'reports'))

    const now = Date.now()
    const maxAgeMs = 7 * 24 * 3600 * 1000 // son 7 gün

    const items: any[] = []

    snap.forEach((docSnap) => {
      const data: any = docSnap.data()
      const loc = data.location || {}
      const rLat = typeof loc.lat === 'number' ? loc.lat : null
      const rLng = typeof loc.lng === 'number' ? loc.lng : null
      if (rLat == null || rLng == null) return

      // zaman filtresi
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

      items.push({
        id: docSnap.id,
        type: data.type || 'other',
        title: data.title || loc.address || 'Yakın ihbar',
        ts: createdAtMs,
        distKm: Math.round(dist),
        severity,
        meta: {
          address: loc.address || '',
        },
      })
    })

    items.sort((a, b) => b.ts - a.ts)

    return NextResponse.json({ items }, { status: 200 })
  } catch (e) {
    console.error('nearby error:', e)
    return NextResponse.json(
      { items: [], error: 'INTERNAL' },
      { status: 200 }
    )
  }
}
