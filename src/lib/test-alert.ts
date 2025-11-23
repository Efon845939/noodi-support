'use client'

/**
 * test-alert.ts
 *
 * Settings ekranındaki "Uyarıyı Test Et" butonunun çağırdığı fonksiyon.
 * Amaç:
 *  - Farklı ses profilleri (Alarm / Siren / Beep / sessiz)
 *  - İsteğe bağlı titreşim
 *  - İsteğe bağlı ekran flaşı
 *  - İsteğe bağlı TTS (Bu bir test uyarısıdır...)
 *
 * NOT: Bu fonksiyon sadece tarayıcıda çalışır, SSR ortamında hiçbir şey yapmaz.
 */

export type TestAlertOptions = {
  /**
   * Ses modu:
   *  - string: 'Alarm' | 'Siren' | 'Beep' (veya küçük harfli)
   *  - boolean:
   *      true  -> varsayılan 'Beep'
   *      false -> sessiz
   *  - undefined -> varsayılan 'Beep'
   */
  sound?: string | boolean
  /** Titreşim olsun mu */
  vibrate?: boolean
  /** Ekran flaşı olsun mu (kamera flashına erişim yok, yalnızca ekran beyaz parlama) */
  flash?: boolean
  /** TTS açıksa test cümlesi okunsun mu */
  tts?: boolean | string
}

const audioCache: Record<string, HTMLAudioElement> = {}

/**
 * Verilen moda göre Audio elementini hazırlar ve çalar.
 */
function playSound(mode: string | boolean | undefined) {
  if (typeof window === 'undefined') return

  let resolved: 'silent' | 'alarm' | 'siren' | 'beep' = 'beep'

  if (mode === false) {
    resolved = 'silent'
  } else if (typeof mode === 'string') {
    const m = mode.toLowerCase()
    if (m.includes('alarm')) resolved = 'alarm'
    else if (m.includes('siren')) resolved = 'siren'
    else if (m.includes('beep')) resolved = 'beep'
    else resolved = 'beep'
  } else if (mode === true || mode === undefined) {
    resolved = 'beep'
  }

  if (resolved === 'silent') return

  if (!audioCache[resolved]) {
    let src = '/sounds/alert-beep.mp3'
    if (resolved === 'alarm') src = '/sounds/alert-alarm.mp3'
    if (resolved === 'siren') src = '/sounds/alert-siren.mp3'

    const a = new Audio(src)
    a.preload = 'auto'
    audioCache[resolved] = a
  }

  const audio = audioCache[resolved]
  try {
    audio.currentTime = 0
    void audio.play().catch(() => {
      // Kullanıcı etkileşimi yoksa tarayıcı engelleyebilir, patlatma
    })
  } catch {
    // Yine de sessiz fail
  }
}

/**
 * Basit bir ekran flaşı: body'ye .noodi-flash class'ı ekler
 * CSS tarafında noodi-flash animasyonunu tanımladık.
 */
function doFlash() {
  if (typeof document === 'undefined') return
  document.body.classList.add('noodi-flash')
  setTimeout(() => {
    document.body.classList.remove('noodi-flash')
  }, 300)
}

/**
 * Titreşim desteği varsa hafif bir pattern uygular.
 */
function doVibrate() {
  if (typeof navigator === 'undefined') return
  // @ts-ignore
  if (navigator.vibrate) {
    // 200ms titreşim, 100ms ara, 200ms titreşim
    // @ts-ignore
    navigator.vibrate([200, 100, 200])
  }
}

/**
 * Basit TTS (SpeechSynthesis API)
 */
function doTTS(tts: boolean | string | undefined) {
  if (!tts) return
  if (typeof window === 'undefined') return
  if (!('speechSynthesis' in window)) return

  const text =
    typeof tts === 'string'
      ? tts
      : 'Bu bir test uyarısıdır. Noodi bildirim ayarları çalışıyor.'

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'tr-TR'
  utterance.rate = 1
  utterance.pitch = 1

  try {
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  } catch {
    // boş geç
  }
}

/**
 * Ana fonksiyon: Settings ekranından çağrılan test bildirimi.
 * Usage:
 *   triggerTestAlertWeb({ sound: 'Alarm', vibrate: true, flash: true, tts: true })
 * veya senin eski koduna göre:
 *   triggerTestAlertWeb({ sound: st[tab].tts || true, vibrate: st[tab].vibrate, tts: st[tab].tts })
 */
export function triggerTestAlertWeb(options: TestAlertOptions = {}) {
  if (typeof window === 'undefined') {
    return
  }

  const { sound, vibrate, flash, tts } = options

  // Ses
  playSound(sound)

  // Titreşim
  if (vibrate) {
    doVibrate()
  }

  // Ekran flaşı
  if (flash) {
    doFlash()
  }

  // TTS
  doTTS(tts)
}
