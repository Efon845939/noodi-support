// src/app/api/incidents/nearby/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/firebase-server'
import { collection, getDocs } from 'firebase/firestore'
import ilData from '@/data/raw/il.json' assert { type: 'json' }
import ilceData from '@/data/raw/ilce.json' assert { type: 'json' }

export const runtime = 'nodejs'

type Il = {
  plaka: number
  il_adi: string
  lat: number
  lon: number
}

type Ilce = {
  ilce_id: number
  il_plaka: number
  ilce_adi: string
  lat: number
  lon: number
}

const ILLER = ilData as Il[]
const ILCELER = ilceData as Ilce[]

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

function nearestProvince(lat: number, lon: number): Il {
  let best = ILLER[0]
  let bestD = Infinity
  for (const il of ILLER) {
    const d =
      (il.lat - lat) * (il.lat - lat) +
      (il.lon - lon) * (il.lon - lon)
    if (d < bestD) {
      bestD = d
      best = il
    }
  }
  return best
}

function nearestDistrict(lat: number, lon: number): Ilce {
  let best = ILCELER[0]
  let bestD = Infinity
  for (const ilce of ILCELER) {
    const d =
      (ilce.lat - lat) * (ilce.lat - lat) +
      (ilce.lon - lon) * (ilce.lon - lon)
    if (d < bestD) {
      bestD = d
      best = ilce
    }
  }
  return best
}

function nearestNeighborProvinces(base: Il, count: number): Il[] {
  const arr = ILLER.filter((i) => i.plaka !== base.plaka).map((il) => ({
    il,
    d: haversineKm(base.lat, base.lon, il.lat, il.lon),
  }))
  arr.sort((a, b) => a.d - b.d)
  return arr.slice(0, count).map((x) => x.il)
}

export async function POST(req: NextRequest) {
  try {
    const db = getServerDb()
    const body = (await req.json().catch(() => ({}))) as {
      lat?: number
      lng?: number
      radiusKm?: number
      window?: '24h' | '3d' | '7d'
    }

    const { lat, lng, radiusKm = 50, window = '24h' } = body

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json(
        { items: [], error: 'NO_LOCATION' },
        { status: 200 }
      )
    }

    // Kullanıcının il / ilçe’si
    const userProv = nearestProvince(lat, lng)
    const userIlce = nearestDistrict(lat, lng)

    // 50km => ilçe, 250km => il, 500km => il + en yakın 3 il
    type Mode = 'district' | 'province' | 'province_with_neighbors'
    let mode: Mode
    if (radiusKm <= 50) mode = 'district'
    else if (radiusKm <= 250) mode = 'province'
    else mode = 'province_with_neighbors'

    const allowedPlaka = new Set<number>()
    allowedPlaka.add(userProv.plaka)

    if (mode === 'province_with_neighbors') {
      const neighbors = nearestNeighborProvinces(userProv, 3)
      for (const n of neighbors) allowedPlaka.add(n.plaka)
    }

    // zaman filtresi
    const now = Date.now()
    const maxAgeMs =
      window === '24h'
        ? 24 * 3600 * 1000
        : window === '3d'
        ? 3 * 24 * 3600 * 1000
        : 7 * 24 * 3600 * 1000

    const snap = await getDocs(collection(db, 'reports'))

    type Item = {
      id: string
      type: string
      title: string
      ts: number
      distKm: number
      severity: 'low' | 'medium' | 'high'
      meta: {
        address?: string
        province?: string
        district?: string
      }
    }

    const items: Item[] = []

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

      const rProv = nearestProvince(rLat, rLng)
      if (!allowedPlaka.has(rProv.plaka)) return

      const rIlce = nearestDistrict(rLat, rLng)
      if (mode === 'district' && rIlce.ilce_id !== userIlce.ilce_id) return

      const distKm = Math.round(haversineKm(lat, lng, rLat, rLng))

      const severity: 'low' | 'medium' | 'high' =
        data.severity === 'high'
          ? 'high'
          : data.severity === 'low'
          ? 'low'
          : 'medium'

      items.push({
        id: docSnap.id,
        type: data.type || 'other',
        title:
          data.title ||
          loc.address ||
          `${rIlce.ilce_adi}, ${rProv.il_adi}`,
        ts: createdAtMs,
        distKm,
        severity,
        meta: {
          address: loc.address || undefined,
          province: rProv.il_adi,
          district: rIlce.ilce_adi,
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
