// src/lib/notificationPrefs.ts
'use client'

export type NotificationSound = 'silent' | 'soft' | 'standard' | 'urgent'
export type FlashMode = 'off' | 'screen'
export type NotificationPrefs = {
  sound: NotificationSound
  flash: FlashMode
  vibration: boolean
}

const KEY = 'noodi_notification_prefs_v1'

const DEFAULT_PREFS: NotificationPrefs = {
  sound: 'standard',
  flash: 'screen',
  vibration: true,
}

export function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PREFS
    const parsed = JSON.parse(raw)
    return {
      sound: parsed.sound ?? DEFAULT_PREFS.sound,
      flash: parsed.flash ?? DEFAULT_PREFS.flash,
      vibration: typeof parsed.vibration === 'boolean'
        ? parsed.vibration
        : DEFAULT_PREFS.vibration,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(prefs))
}
