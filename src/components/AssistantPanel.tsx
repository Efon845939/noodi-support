'use client'

import { useEffect, useRef, useState } from 'react'

type Msg = { role: 'user' | 'assistant'; text: string }

const WELCOME: Msg = {
  role: 'assistant',
  text: 'Size yardımcı olacağım. Kısaca durumu yazın veya üstteki hazır seçeneklerden birini seçin.',
}

type AssistantPanelProps = {
  open: boolean
  onClose: () => void
  mode?: 'personal' | 'disaster'
}

export default function AssistantPanel({
  open,
  onClose,
  mode = 'personal',
}: AssistantPanelProps) {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ttsOn, setTtsOn] = useState(true)

  const [speechSupported, setSpeechSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  const scRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Panel açılınca temel ayarları yükle
  useEffect(() => {
    if (!open) return

    setMsgs([WELCOME])
    setErr('')

    if (typeof window !== 'undefined') {
      const savedTts = localStorage.getItem('tts_enabled')
      setTtsOn(savedTts !== 'false')

      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      setSpeechSupported(!!SR)
    }

    const handleKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (
        e.key === 'Enter' &&
        !(e.metaKey || e.ctrlKey) &&
        (e.target as HTMLElement).tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        handleSend()
      }
    }

    window.addEventListener('keydown', handleKey)
    setTimeout(() => inputRef.current?.focus(), 100)

    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [open, onClose])

  // Mesaj geldikçe aşağı kay
  useEffect(() => {
    if (!scRef.current) return
    scRef.current.scrollTo({
      top: scRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [msgs, busy])

  const safeParse = (raw: string | null) => {
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  async function gatherContext() {
    const profile =
      typeof window !== 'undefined'
        ? safeParse(localStorage.getItem('profile_health'))
        : null
    const settings =
      typeof window !== 'undefined'
        ? safeParse(localStorage.getItem('alert_settings_v3'))
        : null

    const location =
      typeof navigator === 'undefined' || !navigator.geolocation
        ? safeParse(
            typeof window !== 'undefined'
              ? localStorage.getItem('lastGeo')
              : null
          )
        : await new Promise<any>((resolve) => {
            let resolved = false
            const timer = setTimeout(() => {
              if (!resolved) {
                resolved = true
                resolve(
                  safeParse(
                    typeof window !== 'undefined'
                      ? localStorage.getItem('lastGeo')
                      : null
                  )
                )
              }
            }, 7000)

            navigator.geolocation.getCurrentPosition(
              (p) => {
                if (resolved) return
                resolved = true
                clearTimeout(timer)
                const geoData = {
                  lat: p.coords.latitude,
                  lng: p.coords.longitude,
                  acc: p.coords.accuracy,
                  t: Date.now(),
                }
                try {
                  localStorage.setItem('lastGeo', JSON.stringify(geoData))
                } catch {
                  // ignore
                }
                resolve(geoData)
              },
              () => {
                if (resolved) return
                resolved = true
                clearTimeout(timer)
                resolve(
                  safeParse(
                    typeof window !== 'undefined'
                      ? localStorage.getItem('lastGeo')
                      : null
                  )
                )
              },
              { enableHighAccuracy: true, timeout: 6000 }
            )
          })

    return { profile: profile || {}, settings: settings || {}, location }
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || busy) return

    setErr('')
    setBusy(true)

    const newMsgs: Msg[] = [...msgs, { role: 'user', text: msg }]
    setMsgs(newMsgs)
    setInput('')

    const context = await gatherContext()

    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, context }),
    }).catch(() => null)

    if (!res) {
      setErr('Bağlantı sorunu. Lütfen tekrar deneyin.')
      setBusy(false)
      return
    }

    const j = await res.json().catch(() => ({ error: true }))

    const combined = [
      j?.reply,
      ...(Array.isArray(j?.nextSteps) ? j.nextSteps : []),
    ]
      .filter(Boolean)
      .join('\n')

    const assistantMsg: Msg = {
      role: 'assistant',
      text:
        combined ||
        'Şu an yanıt üretemedim. Biraz sonra tekrar deneyin.',
    }

    const finalMsgs = [...newMsgs, assistantMsg]
    setMsgs(finalMsgs)

    if (!j?.error && combined && ttsOn && typeof window !== 'undefined') {
      try {
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(combined)
          const voices = window.speechSynthesis.getVoices()
          const tr = voices.find((v) => /tr-|turkish/i.test(v.lang))
          if (tr) u.voice = tr
          u.lang = tr?.lang || 'tr-TR'
          window.speechSynthesis.cancel()
          window.speechSynthesis.speak(u)
        }
      } catch {
        // ignore
      }
    }

    if (j?.error) {
      setErr(j.detail || 'Asistan şu anda tutarsız yanıt veriyor.')
    }

    setBusy(false)
  }

  const handleMicClick = () => {
    if (!speechSupported) {
      alert(
        'Tarayıcın sesle yazmayı desteklemiyor. Sesle giriş için Chromium tabanlı bir tarayıcı kullanabilirsin.'
      )
      return
    }

    if (listening) {
      const rec = recRef.current
      if (rec) rec.stop()
      setListening(false)
      return
    }

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Bu tarayıcıda ses tanıma desteği yok.')
      return
    }

    const rec = new SR()
    rec.lang = 'tr-TR'
    rec.continuous = false
    rec.interimResults = false

    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)

    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const handleTtsToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.checked
    setTtsOn(v)
    try {
      localStorage.setItem('tts_enabled', String(v))
    } catch {
      // ignore
    }
  }

  const quick =
    mode === 'personal'
      ? [
          'Kanama var, ne yapmalıyım?',
          'Nefes almakta zorlanıyorum.',
          'Saldırı tehdidi var.',
          'Başım dönüyor.',
          'Bayılacak gibiyim.',
        ]
      : ['Deprem sonrası ilk adım?', 'Yangında ne yapmalıyım?', 'Selde ne yapmalıyım?']

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div className="min-h-[100svh] flex items-center justify-center p-4">
        <div
          className="w-full max-w-[720px] bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Üst bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div className="font-semibold text-[#0B3B7A]">
              {mode === 'personal' ? 'Kişisel Yardım Asistanı' : 'Asistan'}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <a
                href="tel:112"
                className="px-3 py-1.5 rounded-lg bg-[#D32F2F] text-white text-xs font-semibold"
              >
                112’yi Ara
              </a>
              <a
                href="tel:155"
                className="px-3 py-1.5 rounded-lg bg-[#0B3B7A] text-white text-xs font-semibold"
              >
                155’i Ara
              </a>
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                <input
                  type="checkbox"
                  checked={ttsOn}
                  onChange={handleTtsToggle}
                />
                <span>Sesli okuma</span>
              </label>
              <button
                onClick={onClose}
                className="text-xs text-gray-600 hover:underline"
                type="button"
              >
                Kapat
              </button>
            </div>
          </div>

          {/* Acil numaralar satırı */}
          <div className="px-5 pt-2 pb-2">
            <div className="bg-[#F5F7FB] border border-[#E0E4F0] rounded-xl px-3 py-2 text-[11px] text-gray-700">
              <div className="font-semibold mb-1">Acil Numaralar</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <a href="tel:112" className="underline">
                  112 Acil
                </a>
                <a href="tel:110" className="underline">
                  110 Yangın
                </a>
                <a href="tel:122" className="underline">
                  122 AFAD
                </a>
                <a href="tel:155" className="underline">
                  155 Polis
                </a>
                <a href="tel:156" className="underline">
                  156 Jandarma
                </a>
                <a href="tel:177" className="underline">
                  177 Orman Yangını
                </a>
              </div>
            </div>
          </div>

          {/* Hızlı seçenekler */}
          <div className="px-5 pt-1 pb-1 flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="px-3 py-1.5 rounded-full bg-[#E9EEF5] text-[#0B3B7A] text-xs active:scale-95"
                type="button"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Hata bandı */}
          {err && (
            <div className="mx-5 my-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">
              Asistan geçici olarak düzgün yanıt veremedi.
              <details className="mt-1 text-[11px] text-red-600/80">
                <summary>Detayı göster</summary>
                <pre className="whitespace-pre-wrap break-words">{err}</pre>
              </details>
            </div>
          )}

          {/* Mesaj listesi */}
          <div
            ref={scRef}
            className="px-4 pb-3 h-[46vh] overflow-y-auto space-y-2"
          >
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                    m.role === 'user'
                      ? 'bg-[#0B3B7A] text-white'
                      : 'bg-[#F6F7F9] text-[#102A43] border border-[#E7EAF0]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="px-3 py-2 text-sm text-gray-500">
                yazıyor…
              </div>
            )}
          </div>

          {/* Uyarı bandı */}
          <div className="px-5 pb-2">
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 leading-snug">
              <strong>Uyarı:</strong> Bu asistan, resmi bir acil çağrı hattı
              değildir ve tıbbi muayene, teşhis veya tedavi yerine geçmez.
              Yanıtlar yapay zeka tarafından otomatik üretilir ve her zaman
              eksiksiz veya doğru olmayabilir.
              <span className="block mt-1">
                <strong>
                  Hayati tehlike veya acil durum varsa derhal 112 Acil Çağrı
                  Merkezi’ni arayın veya en yakın sağlık kuruluşuna başvurun.
                </strong>
              </span>
            </div>
          </div>

          {/* Giriş alanı */}
          <div className="p-4 border-t bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Kısaca durumunuzu yazın…"
                aria-label="Mesaj"
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus-visible:outline-none focus:ring-2 focus:ring-[#0B3B7A]"
              />

              <button
                type="button"
                onClick={handleMicClick}
                disabled={busy}
                className={`px-3 py-2 rounded-xl text-sm border ${
                  listening
                    ? 'bg-red-50 border-red-400 text-red-700'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
                title={
                  speechSupported
                    ? 'Sesle yaz'
                    : 'Tarayıcın sesle yazmayı desteklemiyor'
                }
              >
                {listening ? 'Dinleniyor…' : '🎙'}
              </button>

              <button
                type="submit"
                disabled={busy || !input.trim()}
                className={`px-4 py-2 rounded-xl text-white ${
                  busy || !input.trim()
                    ? 'bg-gray-300'
                    : 'bg-[#D32F2F] active:scale-95'
                }`}
              >
                {busy ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
