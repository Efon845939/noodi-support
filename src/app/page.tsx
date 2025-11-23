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

      <main className="flex-1 px-4 pt-8 pb-4">
        <div className="max-w-md mx-auto space-y-10">

          {/* KİŞİSEL YARDIM */}
          <button
            onClick={() => r.push('/personal')}
            className="
              w-full
              h-[230px]
              sm:h-[260px]             /* ← GERÇEK DEV DİKEY YÜKSEKLİK */
              bg-[#D73333]
              text-white
              rounded-3xl
              shadow-xl
              flex
              items-center
              justify-center
              text-4xl
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
              h-[230px]
              sm:h-[260px]             /* ← DİREKT DEV BOYUT */
              bg-[#D73333]
              text-white
              rounded-3xl
              shadow-xl
              flex
              items-center
              justify-center
              text-4xl
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
