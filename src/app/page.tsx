'use client'

import { useRouter } from 'next/navigation'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import AssistantPanel from '@/components/AssistantPanel'

export default function HomePage() {
  const r = useRouter()

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="Noodi Support" />

      <main className="flex-1 px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto space-y-8">

          {/* KİŞİSEL YARDIM */}
          <button
            onClick={() => r.push('/personal')}
            className="
              w-full
              bg-[#D73333]
              text-white
              rounded-3xl
              shadow-lg
              py-16                        /* ← DİKKAT: YÜKSEKLİĞİ UZATAN KISIM */
              text-2xl                     /* yazıyı da büyüttüm */
              font-bold
              tracking-wide
              active:scale-95
              transition-all
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
              rounded-3xl
              shadow-lg
              py-16                        /* ← BURASI DİKEY UZUNLUK */
              text-2xl
              font-bold
              tracking-wide
              active:scale-95
              transition-all
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
