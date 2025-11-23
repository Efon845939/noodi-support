'use client'
import { useRouter } from 'next/navigation'

export default function AppHeader({ userName }: { userName?: string | null }) {
  const router = useRouter()
  const logged = Boolean(userName?.trim())

  return (
    <header className="bg-[#0B3B7A] text-white text-center py-3 font-sans font-semibold">
      <div className="text-lg">Hoşgeldiniz</div>
      {logged ? (
        <div className="text-sm border-t border-white/40 mt-1 pt-1">
          {userName}
        </div>
      ) : (
        <button
          onClick={() => router.push('/profile')}  // <-- /login DEĞİL, /profile
          className="w-full text-sm border-t border-white/40 mt-1 pt-1 hover:opacity-90"
        >
          Giriş yapın
        </button>
      )}
    </header>
  )
}
