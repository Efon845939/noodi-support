'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import GeoGate from '@/components/GeoGate'

export default function OtherInput() {
  const router = useRouter()
  const path = usePathname()
  const category = path.includes('/personal/') ? 'personal' : 'disaster'
  const [text, setText] = useState('')

  const go = () => {
    const t = text.trim()
    if (!t) return
    router.push(
      `/status?category=${category}&subtype=${encodeURIComponent(t)}`
    )
  }

  return (
    <GeoGate>
      <div className="min-h-[100svh] bg-white flex flex-col">
        <AppHeader userName={null} />
        <main className="flex-1 max-w-md mx-auto p-6 space-y-4">
          <h1 className="text-xl font-semibold text-[#0B3B7A]">Diğer</h1>
          <p className="text-sm text-gray-700">
            Kısaca durumu yazın (ör. “göğüs ağrısı”, “gaz kaçağı”).
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full border rounded-xl p-3"
            placeholder="Durumunuz…"
          />
          <button
            onClick={go}
            className="w-full bg-[#D32F2F] text-white rounded-lg py-2 font-semibold"
          >
            Devam et
          </button>
        </main>
        <BottomNav />
      </div>
    </GeoGate>
  )
}
