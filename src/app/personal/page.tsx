'use client'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import AssistantPanel from '@/components/AssistantPanel'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Personal() {
  const [open, setOpen] = useState(false)
  const r = useRouter()
  useEffect(()=>{ setOpen(true) },[])
  return (
    <div className="min-h-[100svh] bg-white pb-[68px]">
      <HeaderBar title="Kişisel Yardım" />
      <AssistantPanel open={open} onClose={()=>{ setOpen(false); r.push('/') }} mode="personal" />
      <BottomTabs />
    </div>
  )
}
