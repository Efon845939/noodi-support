'use client'

import { useRouter } from 'next/navigation'
import HeaderBar from '@/components/HeaderBar'
import { Tile } from '@/components/Tile'
import BottomTabs from '@/components/BottomTabs'
import AssistantPanel from '@/components/AssistantPanel'

const items = ['Deprem', 'Yangın', 'Sel', 'Fırtına', 'Heyelan', 'İhbar']

export default function Disaster() {
  const r = useRouter()

  const click = (t: string) =>
    t === 'İhbar'
      ? r.push('/ihbar-olustur')
      : r.push(
          `/status?category=disaster&subtype=${encodeURIComponent(
            t.toLowerCase()
          )}`
        )

  return (
    <div className="min-h-[100svh] bg-white pb-[68px]">
      <HeaderBar title="Afetler" />
      <div className="mt-4 px-4">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-4">
          {items.map((t) => (
            <Tile key={t} label={t} onClick={() => click(t)} />
          ))}
        </div>
      </div>
      <BottomTabs />
      <AssistantPanel />
    </div>
  )
}
