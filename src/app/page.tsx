'use client'
import HeaderBar from '@/components/HeaderBar'
import { Tile } from '@/components/Tile'
import BottomTabs from '@/components/BottomTabs'
import { useRouter } from 'next/navigation'

export default function Home() {
  const r = useRouter()
  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar />
      
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        <Tile label={'KİŞİSEL\nYARDIM'} size="lg" onClick={()=>r.push('/personal')} />
        <Tile label={'ACİL DURUM'} size="xl" onClick={()=>r.push('/disaster')} />
      </main>

      <BottomTabs />
    </div>
  )
}
