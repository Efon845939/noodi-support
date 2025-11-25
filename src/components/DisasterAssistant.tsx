'use client'

import { useState } from 'react'

type DisasterAssistantProps = {
  type: 'IHBAR' | 'DISASTER' | 'PERSONAL' | string
}

/**
 * İHBAR asistanı:
 * - Önce her zaman 112 / 110 gibi gerçek hatları hatırlatır.
 * - Kullanıcının yazdığını özetleyip, 112'ye söyleyebileceği cümleyi taslak olarak verir.
 * - Sonra da madde madde neyi hazır tutması gerektiğini söyler.
 *
 * Şu an tamamen local çalışıyor. İstersen backend AI ile de besleyebilirsin.
 */
export default function DisasterAssistant({ type }: DisasterAssistantProps) {
  const [input, setInput] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const text = input.trim()
    if (!text) return

    setLoading(true)

    try {
      // Eğer ileride backend AI bağlamak istersen, BURADA fetch yaparsın.
      // Şimdilik local fallback kullanalım ki her zaman çalışsın.
      const local = buildLocalReply(text, type)
      setAnswer(local)

      // Örnek backend entegrasyonu (şimdilik kapalı):
      /*
      const res = await fetch('/api/assistant/disaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message: text }),
      })

      if (!res.ok) throw new Error('assistant-failed')

      const data = await res.json()
      setAnswer(data.reply ?? local)
      */
    } catch (e: any) {
      console.error('DisasterAssistant error', e)
      setError('Asistan yanıt veremedi, lütfen bilgileri kendin hazırla.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-xs text-gray-600">
          Sorunu yaz; asistan <strong>{type === 'IHBAR' ? 'İHBAR' : 'ACİL DURUM'}</strong> bağlamına göre yanıt versin.
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
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D73333] text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {answer && (
        <div className="bg-[#F5F7FA] border border-[#E2E6F0] rounded-xl px-3 py-3 space-y-2 text-sm">
          <div className="font-semibold text-[#0B3B7A]">Cevap (asistan taslağı):</div>
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
      'Bu platform resmi bir acil çağrı hattı değildir. Gerçek acil durumda önce mutlaka **112 Acil Çağrı** veya ilgili hattı (110, 155 vb.) ara.',
      '',
      '112’ye telefonu açtığında aşağıdaki gibi net bir cümle söyleyebilirsin:',
      `• “Ben ${cleaned} ile ilgili ihbarda bulunmak istiyorum.”`,
      '',
      'Aramada şu bilgileri mümkün olduğunca net ver:',
      '1. Olayın türü (yangın, trafik kazası, kavga, gaz kaçağı vb.)',
      '2. Olayın tam adresi (il, ilçe, mahalle, sokak, yakın bir nokta)',
      '3. Varsa yaralı / mahsur kalan kişi sayısı',
      '4. Şu an güvenli bir bölgede olup olmadığın',
      '',
      'Bu asistan sadece sana cümlelerini toparlamanda yardımcı olur; ihbarı mutlaka **112 ile konuşarak** tamamlamalısın.'
    ].join('\n')
  }

  // Diğer modlar için daha genel ama yine bağlama uygun yanıt
  return [
    'Durumu kısaca netleştirelim:',
    `• Yazdığın ifade: “${cleaned}”`,
    '',
    'Bir acil durumda şunları mutlaka gözden geçir:',
    '1. Önce can güvenliğini sağla (tehlikeli alandan uzaklaş).',
    '2. Gerekliyse 112 Acil Çağrı, 110 İtfaiye, 155 Polis gibi resmi hatları ara.',
    '3. Olayın türünü, tam konumu ve varsa yaralı sayısını net şekilde ifade et.',
  ].join('\n')
}
