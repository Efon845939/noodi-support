'use client'

import { useRouter } from 'next/navigation'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'

export default function AdminHomePage() {
  const router = useRouter()

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="Yönetim Paneli" />

      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[#0B3B7A]"
        >
          ← Geri dön
        </button>
      </div>

      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-4">
        <p className="text-sm text-gray-600">
          Bu alan yalnızca <strong>admin</strong> kullanıcılar içindir. Buradan
          ihbarları, kurumları ve kullanıcıları yönetebilirsin.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/admin/reports')}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold"
          >
            İhbarlar
          </button>
          <button
            onClick={() => router.push('/admin/organizations')}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold"
          >
            Kurumlar
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold"
          >
            Kullanıcılar
          </button>
        </div>
      </main>

      <BottomTabs />
    </div>
  )
}
