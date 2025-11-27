// src/components/DisasterAssistant.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

type DisasterAssistantProps = {
  type: 'IHBAR' | 'DISASTER' | 'PERSONAL' | string
}

export default function DisasterAssistant({ type }: DisasterAssistantProps) {
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [speechSupported, setSpeechSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    setSpeechSupported(!!SR)
  }, [])

  const startListening = () => {
    if (!speechSupported || listening) return
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SR) return

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

  const stopListening = () => {
    const rec = recRef.current
    if (rec) rec.stop()
    setListening(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const text = input.trim()
    if (!text) return
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          context: { mode: type, source: 'inline-disaster' },
        }),
      })

      if (!res.ok) throw new Error('assistant-request-failed')

      const j = await res.json()
      const combined = [
        j?.reply,
        ...(Array.isArray(j?.nextSteps) ? j.nextSteps : []),
      ]
        .filter(Boolean)
        .join('\n')

      if (combined) {
        setAnswer(combined)
      } else {
        setAnswer(buildLocalReply(text, type))
      }
    } catch (e: any) {
      console.error('DisasterAssistant error', e)
      setError(
        'Asistanla bağlantı kurulamadı, genel bir yönlendirme gösteriyorum.'
      )
      setAnswer(buildLocalReply(text, type))
    } finally {
      setLoading(false)
    }
  }

  const handleMicClick = () => {
    if (!speechSupported) {
      alert(
        'Tarayıcın sesle yazmayı desteklemiyor. Chromium tabanlı bir tarayıcı kullanırsan mikrofon çalışır.'
      )
      return
    }
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-xs text-gray-600">
          Sorunu yaz; asistan{' '}
          <strong>
            {type === 'IHBAR' ? 'İHBAR' : 'ACİL DURUM'}
          </strong>{' '}
          bağlamına göre yanıt versin.
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B7A]/60"
          placeholder={
            type === 'IHBAR'
              ? 'Örn: Okulun bahçesinde büyük yangın var, içeride insanlar olabilir...'
              : 'Kısaca durumu yaz...'
          }
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMicClick}
            disabled={loading}
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
            disabled={loading}
            className="flex-1 bg-[#D73333] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? 'Gönderiliyor…' : 'Gönder'}
          </button>
        </div>

        {!speechSupported && (
          <p className="text-[11px] text-gray-500">
            Mikrofon için ses tanıma desteği olan bir tarayıcı (Chromium vb.)
            kullanman gerekir.
          </p>
        )}
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {answer && (
        <div className="bg-[#F5F7FA] border border-[#E2E4F0] rounded-2xl px-3 py-3 space-y-2 text-sm">
          <div className="font-semibold text-[#0B3B7A]">Cevap:</div>
          <div className="text-gray-800 whitespace-pre-line">{answer}</div>
        </div>
      )}
    </div>
  )
}

function buildLocalReply(message: string, type: string): string {
  const cleaned = message.replace(/\s+/g, ' ').trim()

  if (type === 'IHBAR') {
    return [
      'Bu platform resmi acil çağrı hattı değildir. Gerçek acil durumda önce mutlaka 112 Acil Çağrı (veya 110 / 155 vb.) numarasını arayın.',
      '',
      'Görüşmede aşağıdaki bilgileri net ve kısa şekilde verin:',
      '1. Olayın türü (örneğin: yangın, trafik kazası, kavga, gaz kaçağı vb.)',
      '2. Olayın tam adresi (il, ilçe, mahalle, sokak, mümkünse yakın bir referans nokta)',
      '3. Varsa yaralı / mahsur kalan kişi sayısı',
      '4. Şu anda güvende olup olmadığınız.',
      '',
      `İfade örneği: “${cleaned}”`,
    ].join('\n')
  }

  return [
    'Durumu kısaca netleştirelim:',
    `• Yazdığınız ifade: “${cleaned}”`,
    '',
    'Genel öneri:',
    '1. Önce kendi güvenliğinizi sağlayın.',
    '2. Gerekirse 112 Acil Çağrı’yı arayın.',
    '3. Olayın türünü, konumu ve şiddetini net şekilde ifade edin.',
  ].join('\n')
}
