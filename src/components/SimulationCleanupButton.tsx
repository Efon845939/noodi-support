// src/components/SimulationCleanupButton.tsx
'use client'

import { useState } from 'react'
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase'
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore'

export default function SimulationCleanupButton() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const handleClear = async () => {
    const db = getFirebaseDb()
    const auth = getFirebaseAuth()
    if (!db || !auth?.currentUser) {
      alert('Önce giriş yapmalısın.')
      return
    }

    const ok = confirm(
      'Tüm simülasyon ihbarlarını silmek istediğine emin misin?'
    )
    if (!ok) return

    try {
      setBusy(true)
      setMsg('')

      const uid = auth.currentUser.uid

      const qReports = query(
        collection(db, 'reports'),
        where('userId', '==', uid),
        where('source', '==', 'simulation')
      )

      const snap = await getDocs(qReports)
      if (snap.empty) {
        setMsg('Silinecek simülasyon ihbarı yok.')
        return
      }

      const batch = writeBatch(db)
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref)
      })

      await batch.commit()
      setMsg(`Toplam ${snap.size} simülasyon ihbarı silindi.`)
    } catch (e) {
      console.error(e)
      setMsg('Simülasyon ihbarları silinirken hata oluştu.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClear}
        disabled={busy}
        className="px-3 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm disabled:opacity-60"
      >
        {busy ? 'Siliniyor…' : 'Simülasyon ihbarlarını sil'}
      </button>
      {msg && <div className="text-xs text-gray-600">{msg}</div>}
    </div>
  )
}
