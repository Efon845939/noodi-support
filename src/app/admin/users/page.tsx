'use client'

import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'

export default function AdminUsersPage() {
  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="Kullanıcı Yönetimi" />
      <main className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <p className="text-sm text-gray-600">
          Kullanıcı yönetimi ekranı şu an için sadece taslak. İleride
          kullanıcı rollerini ve istatistikleri buradan yönetebilirsin.
        </p>
      </main>
      <BottomTabs />
    </div>
  )
}
