'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'

export default function Other() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'personal'
  const [msg, setMsg] = useState('')

  const handleContinue = () => {
    const trimmed = msg.trim()
    if (!trimmed) return
    router.push(
      `/status?category=${category}&subtype=${encodeURIComponent(trimmed)}`
    )
  }

  return (
    <div className="min-h-[100svh] bg-white pb-[68px]">
      <HeaderBar />
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-[#0B3B7A] font-semibold text-lg mb-2">Diğer</h1>
        <p className="text-sm text-gray-700 mb-3">Kısaca durumu yazın.</p>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          rows={4}
          className="w-full border rounded-xl p-3 mb-3"
          placeholder="Örn. göğüs ağrısı, gaz kaçağı..."
        />
        <button
          onClick={handleContinue}
          className="w-full bg-[#D73333] text-white rounded-lg py-3 font-semibold"
        >
          Devam et
        </button>
      </div>
      <BottomTabs />
    </div>
  )
}
