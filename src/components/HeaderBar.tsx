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

        {/* Logo + title alanı */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative h-7 w-auto">
            <Image
              src="/logo-noodi-support.png"
              alt="Noodi Support"
              width={140}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </div>

          {/* Çok dar ekranlarda gerekirse text fallback */}
          {title && (
            <span className="ml-1 text-xs font-semibold truncate max-w-[100px] sm:max-w-[160px]">
              {title}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {name && (
          <span className="hidden sm:inline text-[11px] text-white/80 truncate max-w-[120px]">
            {name}
          </span>
        )}
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
