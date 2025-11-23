'use client'

import { useRouter } from 'next/navigation'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import AssistantPanel from '@/components/AssistantPanel'

export default function HomePage() {
  const r = useRouter()

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar />

      <main className="flex-1 px-4 pt-6 pb-4">
        <div className="max-w-md mx-auto space-y-5">

          {/* KİŞİSEL YARDIM */}
          <button
            onClick={() => r.push('/personal')}
            className="
              w-full
              bg-[#D73333]
              text-white
              rounded-2xl
              shadow-md
              py-12               /* ← daha dik */
              text-xl
              font-semibold
              active:scale-95
              transition
            "
          >
            KİŞİSEL YARDIM
          </button>

          {/* ACİL DURUM */}
          <button
            onClick={() => r.push('/disaster')}
            className="
              w-full
              bg-[#D73333]
              text-white
              rounded-2xl
              shadow-md
              py-12               /* ← daha dik */
              text-xl
              font-semibold
              active:scale-95
              transition
            "
          >
            ACİL DURUM
          </button>

        </div>
      </main>

      <BottomTabs />
      <AssistantPanel />
    </div>
  )
}
