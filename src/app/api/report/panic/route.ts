// src/app/api/report/panic/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/firebase-server'
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const db = getServerDb()

  const { geo } = await req.json()
  // TODO: Burayı auth bağlayınca gerçek kullanıcı ID'siyle değiştir
  const uid = 'CURRENT_UID'

  const reportRef = doc(collection(db, 'reports'))
  const rid = reportRef.id

  try {
    await setDoc(reportRef, {
      uid,
      phase: 'panic',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(geo ? { geo } : {}),
    })

    return NextResponse.json({ reportId: rid })
  } catch (error) {
    console.error('Error creating panic report:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
