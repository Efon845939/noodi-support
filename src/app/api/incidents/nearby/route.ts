// src/app/api/incidents/nearby/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/firebase-server'
import { collection, getDocs } from 'firebase/firestore'

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

// ufak normalize – tür+adres key’i için
function normalize(str: string | undefined): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
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

    // Tüm raporları çek
    const snap = await getDocs(collection(db, 'reports'))

    type Cluster = {
      key: string
      type: string
      label: string
      reports: {
        ts: number
        distKm: number | null
        severity: 'low' | 'medium' | 'high'
      }[]
    }

    const clusters = new Map<string, Cluster>()

    snap.forEach((d) => {
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

      if (now - createdAtMs > maxAgeMs) return

      const t = (data.type || 'other').toString()
      const loc = data.location || {}
      const eventLat = typeof loc.lat === 'number' ? loc.lat : null
      const eventLng = typeof loc.lng === 'number' ? loc.lng : null
      const label = loc.label || loc.address || ''

      // konum yoksa, radius filtresi yapamıyoruz → yine de gruplayabiliriz ama dist=null
      let distKm: number | null = null
      if (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        typeof eventLat === 'number' &&
        typeof eventLng === 'number'
      ) {
        distKm = haversineKm(lat, lng, eventLat, eventLng)
        if (distKm > radiusKm) return
      }

      const key = `${normalize(t)}__${normalize(label)}`
      const severity: 'low' | 'medium' | 'high' =
        data.severity === 'high' || data.severity === 'medium'
          ? data.severity
          : 'medium'

      const existing = clusters.get(key)
      if (existing) {
        existing.reports.push({ ts: createdAtMs, distKm, severity })
      } else {
        clusters.set(key, {
          key,
          type: t,
          label: label || 'Konum belirtilmemiş',
          reports: [{ ts: createdAtMs, distKm, severity }],
        })
      }
    })

    const items = Array.from(clusters.values())
      .filter((c) => c.reports.length >= MIN_REPORTS_FOR_EVENT)
      .map((c) => {
        const count = c.reports.length
        const latestTs = Math.max(...c.reports.map((r) => r.ts))
        const distVals = c.reports.map((r) => r.distKm).filter((x) => x != null) as number[]
        const minDist = distVals.length ? Math.round(Math.min(...distVals)) : 0
        const sev: 'low' | 'medium' | 'high' = c.reports.some((r) => r.severity === 'high')
          ? 'high'
          : c.reports.some((r) => r.severity === 'medium')
          ? 'medium'
          : 'low'

        return {
          id: c.key,
          type: c.type,
          title: `${c.label}`,
          ts: latestTs,
          distKm: minDist,
          severity: sev,
          meta: {
            address: c.label,
            count,
          },
        }
      })
      .sort((a, b) => b.ts - a.ts)

    return NextResponse.json({ items }, { status: 200 })
  } catch (e) {
    console.error('nearby error:', e)
    return NextResponse.json({ items: [], error: 'api exploded' }, { status: 200 })
  }
}
