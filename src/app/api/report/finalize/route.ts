// src/app/api/report/finalize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/firebase-server'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const db = getServerDb()

    const { reportId, decision } = await req.json()

    if (!reportId || !decision) {
      return new NextResponse('Missing reportId or decision', { status: 400 })
    }

    const { entities = {}, risk, confidence, nextSteps } = decision || {}

    await updateDoc(doc(db, 'reports', reportId), {
      phase: 'classified',
      category: entities.category || null,
      subtype: entities.subtype || null,
      aiSummary: JSON.stringify(decision),
      aiConfidence: confidence ?? null,
      risk: risk ?? 'medium',
      nextSteps: nextSteps || [],
      updatedAt: serverTimestamp(),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error finalizing report:', error)
    return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
  }
}
