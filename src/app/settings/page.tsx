'use client'

import { useEffect, useState } from 'react'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '@/lib/notificationPrefs'
import { triggerAlert } from '@/lib/alertFx'

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setPrefs(loadNotificationPrefs())
  }, [])

  const update = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    if (!prefs) return
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    saveNotificationPrefs(next)
  }

  if (!prefs) {
    return (
      <div className="min-h-[100svh] bg-white pb-[68px]">
        <HeaderBar title="Ayarlar" />
        <div className="max-w-md mx-auto p-4 text-sm text-gray-600">
          Ayarlar yükleniyor…
        </div>
        <BottomTabs />
      </div>
    )
  }

  const testAlert = () => {
    triggerAlert(prefs)
  }

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title="Ayarlar" />
      <main className="flex-1 max-w-md mx-auto p-4 space-y-6">
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#0B3B7A]">
            Bildirim Sesleri
          </h2>
          <p className="text-xs text-gray-500 -mt-1">
            Ciddi uyarılarda çalacak sesi seç.
          </p>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="notif-sound"
                checked={prefs.sound === 'silent'}
                onChange={() => update('sound', 'silent')}
              />
              <span>Ses yok</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="notif-sound"
                checked={prefs.sound === 'soft'}
                onChange={() => update('sound', 'soft')}
              />
              <span>Hafif uyarı</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="notif-sound"
                checked={prefs.sound === 'standard'}
                onChange={() => update('sound', 'standard')}
              />
              <span>Standart uyarı</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="notif-sound"
                checked={prefs.sound === 'urgent'}
                onChange={() => update('sound', 'urgent')}
              />
              <span>Yüksek öncelik (acil)</span>
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#0B3B7A]">
            Görsel Uyarı (Flash)
          </h2>
          <p className="text-xs text-gray-500 -mt-1">
            Telefonun flaşını kontrol edemiyoruz ama ekran kısa süreli
            parlayabilir.
          </p>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="flash-mode"
                checked={prefs.flash === 'off'}
                onChange={() => update('flash', 'off')}
              />
              <span>Kapalı</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="flash-mode"
                checked={prefs.flash === 'screen'}
                onChange={() => update('flash', 'screen')}
              />
              <span>Ekran flaşı</span>
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#0B3B7A]">
            Titreşim
          </h2>
          <div className="flex items-center justify-between text-sm">
            <span>Uyarılarda titreşim kullan</span>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.vibration}
                onChange={(e) => update('vibration', e.target.checked)}
              />
              <span>{prefs.vibration ? 'Açık' : 'Kapalı'}</span>
            </label>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-[#0B3B7A]">
            Test
          </h2>
          <p className="text-xs text-gray-500 -mt-1">
            Seçtiğin ayarlarla nasıl hissettirdiğini dene.
          </p>
          <button
            type="button"
            onClick={testAlert}
            className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 text-sm font-semibold"
          >
            Test bildirimi çal
          </button>
        </section>
      </main>
      <BottomTabs />
    </div>
  )
}
