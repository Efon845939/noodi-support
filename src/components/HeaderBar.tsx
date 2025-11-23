'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

type HeaderBarProps = {
  title?: string
  showBack?: boolean
  rightSlot?: ReactNode
}

export default function HeaderBar({
  title,
  showBack = false,
  rightSlot,
}: HeaderBarProps) {
  const router = useRouter()

  return (
    <header className="h-14 bg-[#0B3B7A] text-white flex items-center justify-between px-3 shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 shrink-0"
          >
            {/* İstersen lucide-react ile ikon ekleriz, şimdilik basit ok */}
            <span className="text-lg leading-none">←</span>
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <div className="relative w-7 h-7 shrink-0">
            <Image
              src="/logos/noodi-support.png"
              alt="Noodi Support"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-semibold text-sm truncate">
            {title || 'Noodi Support'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {rightSlot}
      </div>
    </header>
  )
}
