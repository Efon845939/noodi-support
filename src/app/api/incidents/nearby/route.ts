// src/app/api/incidents/nearby/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/firebase-server'
import { collection, getDocs } from 'firebase/firestore'

const MIN_REPORTS_FOR_EVENT = 1  // ÖNCE 3’TÜ, ARTIK 1

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
      window = '24h',
      // lat, lng, radiusKm, categories şu an filtrelemede kullanılmıyor
    } = body as {
      lat?: number
      lng?: number
      radiusKm?: number
      window?: '24h' | '3d' | '7d'
      categories?: string[]
    }

    const now = Date.now()
    const maxAgeMs =
      window === '24h'
        ? 24 * 3600 * 1000
        : window === '3d'
        ? 3 * 24 * 3600 * 1000
        : 7 * 24 * 3600 * 1000

    const snap = await getDocs(collection(db, 'reports'))

    type Cluster = {
      key: string
      type: string
      label: string
      reports: {
        ts: number
        severity: 'low' | 'medium' | 'high'
      }[]
    }

    const clusters = new Map<string, Cluster>()

    snap.forEach((docSnap) => {
      const data: any = docSnap.data()

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

      const type = (data.type || 'other').toString()
      const loc = data.location || {}
      const label = (loc.label || loc.address || '') as string

      const key = `${normalize(type)}__${normalize(label)}`
      const severity: 'low' | 'medium' | 'high' =
        data.severity === 'high'
          ? 'high'
          : data.severity === 'low'
          ? 'low'
          : 'medium'

      const existing = clusters.get(key)
      if (existing) {
        existing.reports.push({ ts: createdAtMs, severity })
      } else {
        clusters.set(key, {
          key,
          type,
          label: label || 'Konum belirtilmemiş',
          reports: [{ ts: createdAtMs, severity }],
        })
      }
    })

    const items = Array.from(clusters.values())
      .filter((c) => c.reports.length >= MIN_REPORTS_FOR_EVENT)
      .map((c) => {
        const count = c.reports.length
        const latestTs = Math.max(...c.reports.map((r) => r.ts))
        const sev: 'low' | 'medium' | 'high' = c.reports.some(
          (r) => r.severity === 'high'
        )
          ? 'high'
          : c.reports.some((r) => r.severity === 'low')
          ? 'low'
          : 'medium'

        return {
          id: c.key,
          type: c.type,
          title: `${c.label}`,
          ts: latestTs,
          distKm: 0, // şimdilik mesafe yok
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
    return NextResponse.json(
      { items: [], error: 'api exploded' },
      { status: 200 }
    )
  }
}
