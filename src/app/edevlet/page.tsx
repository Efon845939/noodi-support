'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EDevletPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/profile')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-[100svh] bg-white flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-2xl font-bold text-[#0B3B7A] mb-4">
        e-Devlet ile Giriş
      </h1>

      <p className="text-gray-700 max-w-sm mb-6">
        Bu özellik şu anda geliştirme aşamasında.
        <br />
        <span className="font-semibold text-[#0B3B7A]">Yakında aktif olacak!</span>
      </p>

      <p className="text-sm text-gray-500">
        <span className="animate-pulse">Profil sayfasına yönlendiriliyorsunuz...</span>
      </p>
    </div>
  )
}
