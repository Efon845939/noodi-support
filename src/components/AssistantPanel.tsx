'use client'

import { useEffect, useRef, useState } from 'react'

type Msg = { role: 'user' | 'assistant'; text: string }

const welcome: Msg = {
  role: 'assistant',
  text: 'Size yardımcı olacağım. Kısaca durumu yazın veya üstteki hazır seçeneklerden birini seçin.',
}

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

type HistoryDropdownProps = {
  sessions: Record<string, HistoryEntry>
  load: (id: string) => void
}

function HistoryDropdown({ sessions, load }: HistoryDropdownProps) {
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
              {new Date(s.ts).toLocaleString('tr-TR', {
                hour12: false,
              })}{' '}
              —{' '}
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
  const [msgs, setMsgs] = useState<Msg[]>([welcome])
  const [input, setInput] = useState('')
  const [busy, setBusy] = use state(false)
  const [err, setErr] = useState('')
  const [ttsOn, setTtsOn] = useState(true)
  const [sessions, setSessions] = useState<Record<string, HistoryEntry>>({})

  const scRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mikrofon durumu
  const [speechSupported, setSpeechSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<SpeechRecognition | null>(null)

  // Panel açıldığında geçmiş ve ayarları yükle
  useEffect(() => {
    if (!open) return

    try {
      const raw = localStorage.getItem('chat_sessions')
      if (raw) {
        setSessions(JSON.parse(raw))
      }

      const lastId = localStorage.getItem('chat_last_sid')
      if (lastId) {
        const all: Record<string, HistoryEntry> = raw ? JSON.parse(raw) : {}
        if (all[lastId]) {
          setSid(lastId)
          setMsgs(all[lastId].msgs)
        } else {
          const id = crypto.randomUUID()
          setSid(id)
          setMsgs([welcome])
          const updated: Record<string, HistoryEntry> = {
            ...all,
            [id]: { id, ts: Date.now(), msgs: [welcome] },
          }
          setSessions(updated)
          localStorage.setItem('chat_sessions', JSON.stringify(updated))
          localStorage.setItem('chat_last_sid', id)
        }
      } else {
        const id = crypto.randomUUID()
        setSid(id)
        setMsgs([welcome])
        const updated: Record<string, HistoryEntry> = {
          [id]: { id, ts: Date.now(), msgs: [welcome] },
        }
        setSessions(updated)
        localStorage.setItem('chat_sessions', JSON.stringify(updated))
        localStorage.setItem('chat_last_sid', id)
      }

      const savedTts = localStorage.getItem('tts_enabled')
      setTtsOn(savedTts !== 'false')
    } catch {
      // sessizce geç
      const id = crypto.randomUUID()
      setSid(id)
      setMsgs([welcome])
    }

    if (typeof window !== 'undefined') {
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
      } else if (e.key === 'Enter' && !(e.metaKey || e.ctrlKey)) {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return
        e.preventDefault()
        handleSend()
      }
    }

    window.addEventListener('keydown', handleKey)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    return () => {
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  // Mesaj gelince aşağıya kaydır
  useEffect(() => {
    if (!scRef.current) return
    scRef.current.scrollTo({
      top: scRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [msgs, busy])

  const saveSession = (id: string, currentMsgs: Msg[]) => {
    try {
      const raw = localStorage.getItem('chat_sessions')
      const all: Record<string, HistoryEntry> = raw ? JSON.parse(raw) : {}
      all[id] = { id, ts: Date.now(), msgs: currentMsgs }
      localStorage.setItem('chat_sessions', JSON.stringify(all))
      setSessions(all)
      localStorage.setItem('chat_last_sid', id)
    } catch {
      // geç
    }
  }

  const loadChat = (id: string) => {
    try {
      const raw = localStorage.getItem('chat_sessions')
      const all: Record<string, HistoryEntry> = raw ? JSON.parse(raw) : {}
      const entry = all.id
      if (entry) {
        setSid(id)
        setMsgs(entry.msgs)
        localStorage.setItem('chat_last_sid', id)
      }
    } catch {
      // ignore
    }
  }

  const handleNewChat = () => {
    const id = crypto.randomUUID()
    const initial = [welcome]
    setSid(id)
    setMsgs(initial)
    saveSession(id, initial)
  }

  const safeParseJson = (raw: string | null) => {
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const gatherContext = async () => {
    const profile =
      typeof window !== 'undefined'
        ? safeParseJson(localStorage.getItem('profile_health'))
        : null
    const settings =
      typeof window !== 'undefined'
        ? safeParseJson(localStorage.getItem('alert_settings_v3'))
        : null

    const location =
      typeof navigator === 'undefined' || !navigator.geolocation
        ? safeParseJson(
            typeof window !== 'undefined'
              ? localStorage.getItem('lastGeo')
              : null
          )
        : await new Promise<any>((resolve) => {
            let done = false
            const timer = setTimeout(() => {
              if (!done) {
                done = true
                resolve(
                  safeParseJson(
                    typeof window !== 'undefined'
                      ? localStorage.getItem('lastGeo')
                      : null
                  )
                )
              }
            }, 7000)

            navigator.geolocation.getCurrentPosition(
              (p) => {
                if (done) return
                done = true
                clearTimeout(timer)
                const g = {
                  lat: p.coords.latitude,
                  lng: p.coords.longitude,
                  acc: p.coords.accuracy,
                  t: Date.now(),
                }
                try {
                  localStorage.setItem('lastGeo', JSON.stringify(g))
                } catch {
                  // ignore
                }
                resolve(g)
              },
              () => {
                if (done) return
                done = true
                clearTimeout(timer)
                resolve(
                  safeParseJson(
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

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim()
    if (!message || busy) return

    setErr('')
    setBusy(true)

    const newMessages: Msg[] = [...msgs, { role: 'user', text: message }]
    setMsgs(newMessages)
    setInput('')
    saveSession(sid, newMessages)

    const context = await gatherContext()

    const resp = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    }).catch(() => null)

    if (!resp) {
      setErr('Bağlantı sorunu. Lütfen tekrar deneyin.')
      setBusy(false)
      return
    }

    const data = await resp.json().catch(() => ({ error: true, detail: 'JSON_PARSE' }))

    const combined = [
      data?.reply,
      ...(Array.isArray(data?.nextSteps) ? data.nextSteps : []),
    ]
      .filter(Boolean)
      .join('\n')

    let toPush: Msg

    if (combined) {
      toPush = { role: 'assistant', text: combined }
    } else {
      toPush = {
        role: 'assistant',
        text: 'Şu an yanıt üretemedim. Biraz sonra tekrar deneyin.',
      }
    }

    const finalMessages = [...newMessages, toPush]
    setMsgs(finalMessages)
    saveSession(sid, finalMessages)

    if (!data?.error && combined && ttsOn) {
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

    if (data?.error) {
      setErr(data.detail || 'Bilinmeyen bir hata oluştu.')
    }

    setBusy(false)
  }

  const handleMicClick = () => {
    if (!speechSupported) {
      alert(
        'Tarayıcın sesle yazmayı desteklemiyor. Sesli giriş için Chromium tabanlı bir tarayıcı kullanabilirsin.'
      )
      return
    }

    if (listening) {
      if (recRef.current) {
        recRef.current.stop()
      }
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

    const rec: SpeechRecognition = new SR()
    rec.lang = 'tr-TR'
    rec.continuous = false
    rec.interimResults = false

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)

    recRef.current = rec
    setListening(true)
    rec.start()
  }

  const handleTtsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const on = e.target.checked
    setTtsOn(on)
    try {
      localStorage.setItem('tts_enabled', String(on))
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
                  onChange={handleTtsChange}
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

          {/* Araç çubuğu */}
          <div className="px-5 pt-2 pb-1 flex items-center justify-between">
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
              Asistan geçici olarak yanıt veremedi.
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
              <div className="px-3 py-2 text-sm text-gray-500">yazıyor…</div>
            )}
          </div>

          {/* UYARI BANDI */}
          <div className="px-5 pb-2">
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 leading-snug">
              <strong>Uyarı:</strong> Bu asistan resmi bir acil çağrı hattı
              değildir ve tıbbi muayene, teşhis veya tedavi yerine geçmez.
              Yanıtlar yapay zeka tarafından üretilir ve her zaman eksiksiz
              veya doğru olmayabilir.
              <strong className="block mt-1">
                Hayati tehlike veya acil durum söz konusuysa derhal 112 Acil
                Çağrı Merkezi’ni arayın veya en yakın sağlık kuruluşuna
                başvurun.
              </strong>
            </div>
          </div>

          {/* Giriş alanı */}
          <div className=" p-4 border-t bg-white">
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
