// src/components/HeaderBar.tsx
'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

type HeaderBarProps = {
  title?: string
  name?: string | null
  avatarUrl?: string | null
  showBack?: boolean
}

export default function HeaderBar({
  title,
  name,
  avatarUrl,
  showBack = false,
}: HeaderBarProps) {
  const router = useRouter()

  return (
    <header className="h-14 bg-[#0B3B7A] text-white flex items-center justify-between px-3 shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-2 min-w-0">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-1.5 hover:bg-white/10 active:scale-95 transition"
          >
            <span className="text-lg leading-none">←</span>
          </button>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">
            {title || 'Noodi Support'}
          </span>
          {name && (
            <span className="text-[11px] text-white/80 truncate">
              {name}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* İleride bildirim ikonu vs. eklemek istersen buraya koy */}
        {avatarUrl && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 relative">
            <Image
              src={avatarUrl}
              alt="Profil"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}
      </div>
    </header>
  )
}
