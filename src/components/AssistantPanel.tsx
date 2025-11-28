'use client'

import { useEffect, useRef, useState } from 'react'

type Msg = { role: 'user' | 'assistant'; text: string }

type HistoryEntry = {
  id: string
  ts: number
  msgs: Msg[]
}

type AssistantPanelProps = {
  open: boolean
  onClose: () => void
  mode?: 'personal' | 'disaster'
}

const WELCOME: Msg = {
  role: 'assistant',
  text: 'Size yardımcı olacağım. Kısaca durumu yazın veya üstteki hazır seçeneklerden birini seçin.',
}

function safeParse<T = any>(raw: string | null): T | null {
  try {
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function HistoryDropdown({
  sessions,
  load,
}: {
  sessions: Record<string, HistoryEntry>
  load: (id: string) => void
}) {
  const entries = Object.values(sessions || {})
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 20)

  return (
    <div className="relative">
      <details
        className="text-xs"
        onToggle={(e) => {
          if (e.currentTarget.open) {
            const btn = e.currentTarget.querySelector('button')
            if (btn) btn.focus()
          }
        }}
      >
        <summary className="cursor-pointer select-none px-2 py-1.5 rounded-lg bg-gray-100">
          Geçmiş
        </summary>
        <div className="absolute z-10 mt-1 w-60 max-h-64 overflow-auto bg-white border rounded-lg shadow">
          {entries.length === 0 && (
            <div className="px-3 py-2 text-gray-500 text-xs">Kayıt yok</div>
          )}
          {entries.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                load(s.id)
                ;(document.activeElement as HTMLElement | null)?.blur()
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-xs"
            >
              {new Date(s.ts).toLocaleString('tr-TR', { hour12: false })} —{' '}
              {s.msgs?.[1]?.text?.slice(0, 40) ||
                s.msgs?.[0]?.text?.slice(0, 40) ||
                'Sohbet'}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}

export default function AssistantPanel({
  open,
  onClose,
  mode = 'personal',
}: AssistantPanelProps) {
  const [sid, setSid] = useState<string>('')
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ttsOn, setTtsOn] = useState(true)
  const [sessions, setSessions] = useState<Record<string, HistoryEntry>>({})

  const [speechSupported, setSpeechSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  const scRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // panel açıldığında session yükle
  useEffect(() => {
    if (!open) return

    try {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('chat_sessions')
          : null
      const all = safeParse<Record<string, HistoryEntry>>(raw) || {}

      const lastId =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('chat_last_sid')
          : null

      setSessions(all)

      if (lastId && all[lastId]) {
        setSid(lastId)
        setMsgs(all[lastId].msgs)
      } else {
        const id = crypto.randomUUID()
        const initial = [WELCOME]
        setSid(id)
        setMsgs(initial)
        const updated: Record<string, HistoryEntry> = {
          ...all,
          [id]: { id, ts: Date.now(), msgs: initial },
        }
        setSessions(updated)
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            'chat_sessions',
            JSON.stringify(updated)
          )
          window.localStorage.setItem('chat_last_sid', id)
        }
      }

      const savedTts =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('tts_enabled')
          : null
      setTtsOn(savedTts !== 'false')

      if (typeof window !== 'undefined') {
        const SR =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        setSpeechSupported(!!SR)
      }
    } catch {
      const id = crypto.randomUUID()
      setSid(id)
      setMsgs([WELCOME])
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

  // mesajlar değişince scroll
  useEffect(() => {
    if (!scRef.current) return
    scRef.current.scrollTo({
      top: scRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [msgs, busy])

  const saveSession = (id: string, list: Msg[]) => {
    try {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('chat_sessions')
          : null
      const all = safeParse<Record<string, HistoryEntry>>(raw) || {}
      all[id] = { id, ts: Date.now(), msgs: list }
      setSessions(all)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('chat_sessions', JSON.stringify(all))
        window.localStorage.setItem('chat_last_sid', id)
      }
    } catch {}
  }

  const loadChat = (id: string) => {
    try {
      const raw =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('chat_sessions')
          : null
      const all = safeParse<Record<string, HistoryEntry>>(raw) || {}
      const entry = all[id]
      if (!entry) return
      setSid(id)
      setMsgs(entry.msgs)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('chat_last_sid', id)
      }
    } catch {}
  }

  const handleNewChat = () => {
    const id = crypto.randomUUID()
    const initial = [WELCOME]
    setSid(id)
    setMsgs(initial)
    saveSession(id, initial)
  }

  async function gatherContext() {
    const profile =
      typeof window !== 'undefined'
        ? safeParse<any>(localStorage.getItem('profile_health'))
        : null
    const settings =
      typeof window !== 'undefined'
        ? safeParse<any>(localStorage.getItem('alert_settings_v3'))
        : null

    const location =
      typeof navigator === 'undefined' || !navigator.geolocation
        ? safeParse<any>(
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
                  safeParse<any>(
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
                } catch {}
                resolve(geoData)
              },
              () => {
                if (resolved) return
                resolved = true
                clearTimeout(timer)
                resolve(
                  safeParse<any>(
                    typeof window !== 'undefined'
                      ? localStorage.getItem('lastGeo')
                      : null
                  )
                )
              },
              { enableHighAccuracy: true, timeout: 6000 }
            )
          })

    return {
      profile: profile || {},
      settings: settings || {},
      location,
    }
  }

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || busy) return

    setErr('')
    setBusy(true)

    const newMsgs: Msg[] = [...msgs, { role: 'user', text: msg }]
    setMsgs(newMsgs)
    setInput('')
    saveSession(sid, newMsgs)

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
        'Şu an yanıt üretemedim. Biraz sonra tekrar denemeyi düşün.',
    }

    const finalMsgs: Msg[] = [...newMsgs, assistantMsg]
    setMsgs(finalMsgs)
    saveSession(sid, finalMsgs)

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
      } catch {}
    }

    if (j?.error) {
      setErr(
        j.detail ||
          'Asistan şu anda tutarsız yanıt veriyor. Bir süre sonra tekrar dene.'
      )
    }

    setBusy(false)
  }

  const handleMicClick = () => {
    if (!speechSupported) {
      alert(
        'Tarayıcın sesle yazmayı desteklemiyor. Sesle yazmak için Chromium tabanlı bir tarayıcı kullanabilirsin.'
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
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('tts_enabled', String(v))
      }
    } catch {}
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
          {/* ÜST BAR */}
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

          {/* ACİL NUMARALAR */}
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

          {/* HIZLI SEÇENEKLER + GEÇMİŞ */}
          <div className="px-5 pt-1 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                className="px-3 py-1.5 rounded-lg bg-[#0B3B7A] text-white text-xs"
                type="button"
              >
                Yeni sohbet
              </button>
              <HistoryDropdown sessions={sessions} load={loadChat} />
            </div>
          </div>

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

          {/* HATA BANDI */}
          {err && (
            <div className="mx-5 my-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs">
              Asistan geçici olarak tutarsız yanıt veriyor.
              <details className="mt-1 text-[11px] text-red-600/80">
                <summary>Detayı göster</summary>
                <pre className="whitespace-pre-wrap break-words">{err}</pre>
              </details>
            </div>
          )}

          {/* MESAJ LİSTESİ */}
          <div
            ref={scRef}
            className="px-4 pb-2 max-h-[40vh] overflow-y-auto space-y-2"
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

          {/* GİRİŞ ALANI */}
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

          {/* TEK SATIR UYARI – INPUT ALTINDA */}
          <div className="px-4 pb-3 text-center bg-white">
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md py-1 px-2 inline-block">
              Bu asistan hata yapabilir; gerçek acil durumda her zaman 112’yi arayın.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
