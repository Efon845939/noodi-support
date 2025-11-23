'use client'
import HeaderBar from '@/components/HeaderBar'
import { Tile } from '@/components/Tile'
import BottomTabs from '@/components/BottomTabs'
import { useRouter } from 'next/navigation'
import AssistantPanel from '@/components/AssistantPanel'

const items = ['Sel','Heyelan','Deprem','Fırtına','Yangın','İhbar'] 

export default function Disaster() {
  const r = useRouter()

  const click = (t: string) =>
    t === 'İhbar'
      ? r.push('/ihbar-olustur') // ← SADECE BURAYI DEĞİŞTİRDİK
      : r.push(
          `/status?category=disaster&subtype=${encodeURIComponent(
            t.toLowerCase()
          )}`
        )

  return (
    <div className="min-h-[100svh] bg-white pb-[68px]">
      <HeaderBar />
      <div className="mt-4 px-4">
        <div
          className="grid grid-cols-2 gap-y-8 gap-x-6 place-items-center
                     max-w-[800px] mx-auto"
        >
          {items.map(t => (
            <Tile key={t} label={t} onClick={() => click(t)} />
          ))}
        </div>
      </div>
      <BottomTabs />
      <AssistantPanel />
    </div>
  )
}
