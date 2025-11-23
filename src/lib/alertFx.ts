// src/lib/alertFx.ts
'use client'

import { loadNotificationPrefs, type NotificationPrefs, type NotificationSound } from './notificationPrefs'

const audioCache: Partial<Record<NotificationSound, HTMLAudioElement>> = {}

function getAudio(sound: NotificationSound): HTMLAudioElement | null {
  if (sound === 'silent') return null

  if (!audioCache[sound]) {
    const src =
      sound === 'soft'
        ? '/sounds/alert-soft.mp3'
        : sound === 'urgent'
        ? '/sounds/alert-urgent.mp3'
        : '/sounds/alert-standard.mp3'

    const a = new Audio(src)
    a.preload = 'auto'
    audioCache[sound] = a
  }
  return audioCache[sound] || null
}

/**
 * Tercihlere göre ses çal + ekran flaşı + titreşim.
 * Bunu panic / ciddi ihbar vb. yerlerden çağırabilirsin.
 */
export function triggerAlert(prefs?: NotificationPrefs) {
  const effective = prefs ?? loadNotificationPrefs()

  // Ses
  try {
    const audio = getAudio(effective.sound)
    if (audio) {
      // Aynı sesi üst üste çalabilmek için başa sar
      audio.currentTime = 0
      // Kullanıcı en az bir kez tıklamışsa tarayıcı izin verir
      void audio.play().catch(() => {})
    }
  } catch {
    // boşver
  }

  // Titreşim (destek varsa)
  try {
    if (effective.vibration && 'vibrate' in navigator) {
      navigator.vibrate([120, 80, 120])
    }
  } catch {
    // sallama
  }

  // Ekran flaşı
  if (effective.flash === 'screen' && typeof document !== 'undefined') {
    document.body.classList.add('noodi-flash')
    setTimeout(() => {
      document.body.classList.remove('noodi-flash')
    }, 300)
  }
}
