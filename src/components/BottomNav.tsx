'use client'
import Link from 'next/link'
import { Home, Bell, User2 } from 'lucide-react'

export default function BottomNav() {
  return (
    <nav className="fixed z-30 bottom-0 left-0 right-0 bg-[#0B3B7A] text-white h-14
                    flex items-center justify-around shadow-[0_-6px_16px_rgba(0,0,0,.15)]">
      <Link href="/" className="flex flex-col items-center text-xs gap-0.5"><Home size={18}/>Anasayfa</Link>
      <Link href="/settings" className="flex flex-col items-center text-xs gap-0.5"><Bell size={18}/>Ayarlar</Link>
      <Link href="/profile" className="flex flex-col items-center text-xs gap-0.5"><User2 size={18}/>Profil</Link>
    </nav>
  )
}
