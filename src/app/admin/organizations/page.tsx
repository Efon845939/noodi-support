'use client'

import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'

export default function AdminOrganizationsPage() {
  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="Kurumlar" />
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <p className="text-sm text-gray-600">
          Sivil toplum kuruluşları ve kurumlar için yönetim ekranı daha sonra
          eklenecek. Şimdilik ihbar akışı ve Yakın Olaylar üzerinde çalışıyoruz.
        </p>
      </main>
      <BottomTabs />
    </div>
  )
}
