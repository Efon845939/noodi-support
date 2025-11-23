'use client'
import Image from 'next/image'
import { useState } from 'react'
import DisasterAssistant from '@/components/DisasterAssistant'

type Org = { name: string; logo?: string }
type Props = {
  type: 'DEPREM' | 'SEL' | 'YANGIN' | 'HEYELAN' | 'FIRTINA' | string
  primaryOrg: Org
  supportOrgs?: Org[]
  tips?: string[]
}

// Afet türüne göre varsayılan yönergeler
const defaults: Record<string, string[]> = {
  DEPREM: [
    '1. **Sakin ol.** Panik yapmak, yanlış hareketlere neden olur.',
    '2. **_Çök – Kapan – Tutun_** kuralını uygula.',
    '3. Sarsıntı bitene kadar **bulunduğun yerde kal.**',
    '4. Pencere, cam, ayna ve dolaplardan **uzak dur.**',
  ],
  SEL: [
    '1. **Yüksek bölgeye geç.** Suya girme; akıntıyı hafife alma.',
    '2. Elektrik kaynaklarından **uzak dur.** Islak alanlarda priz/şalter kullanma.',
    '3. Araçla su basmış yollara **girme.**',
  ],
  YANGIN: [
    '1. **Duman alçakta birikir.** **Eğilerek** ilerle.',
    '2. Kapı sıcaksa **açma.** Aralıklara **ıslak bez** yerleştir.',
    '3. **Asansör kullanma.** Çıkışa yönel.',
  ],
  HEYELAN: [
    '1. **Eğimli ve gevşek zeminlerden uzak dur.** Yamaç altlarında bekleme.',
    '2. Dere yatağı, vadi içi, şev altı gibi alanlardan **hemen uzaklaş.**',
    '3. Yeni çatlaklar, kaya/çamur hareketi görürsen bölgeden çık ve 112’yi haberdar et.',
  ],
  FIRTINA: [
    '1. **Açık alanlardan ve ağaç altlarından uzak dur.** Mümkünse kapalı bir yapıya geç.',
    '2. Pencere ve camlardan **uzak dur.** Uçabilecek eşyaları güvene al.',
    '3. Metal direk, çit ve elektrik hatlarından uzaklaş; yıldırım riski varsa 112’yi bilgilendir.',
  ],
}

// Afet türüne göre acil numaralar
// 110 Yangın, 112 Acil, 122 Alo AFAD, 155 Polis, 156 Jandarma, 177 Orman, 158 Sahil Güvenlik
const phoneBook: Record<string, { label: string; number: string }[]> = {
  DEPREM: [
    { label: 'Alo AFAD', number: '122' },
    { label: '112 Acil Çağrı', number: '112' },
  ],
  SEL: [
    { label: 'Alo AFAD', number: '122' },
    { label: '112 Acil Çağrı', number: '112' },
  ],
  YANGIN: [
    { label: '110 Yangın İhbar', number: '110' },
    { label: '112 Acil Çağrı', number: '112' },
  ],
  HEYELAN: [
    { label: 'Alo AFAD', number: '122' },
    { label: '112 Acil Çağrı', number: '112' },
  ],
  FIRTINA: [
    { label: 'Alo AFAD', number: '122' },
    { label: '112 Acil Çağrı', number: '112' },
  ],
}

function md(s: string) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
}

export default function DisasterStatus({
  type,
  primaryOrg,
  supportOrgs = [],
  tips,
}: Props) {
  const upper = type.toUpperCase()
  const list =
    tips ??
    defaults[upper] ?? [
      '1. **Sakin ol** ve güvenli bir noktada kal.',
      '2. Çevrendekilerden **yardım iste.**',
      '3. Gerekirse **çıkış yoluna** ilerle.',
    ]

  const phoneList =
    phoneBook[upper] ?? [{ label: '112 Acil Çağrı', number: '112' }]

  const [assistantOpen, setAssistantOpen] = useState(false)

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      {/* Tür başlığı */}
      <div className="grid place-items-center">
        <div className="px-6 py-2 rounded-full bg-[#0B3B7A] text-white text-lg font-extrabold">
          {upper}
        </div>
      </div>

      {/* Acil telefonlar */}
      <div className="rounded-2xl bg-[#D73333] text-white font-semibold py-2 px-3 flex flex-wrap justify-center gap-2">
        {phoneList.map((p) => (
          <a
            key={p.label}
            href={`tel:${p.number}`}
            className="bg-white text-[#D73333] px-3 py-1 rounded-full text-xs sm:text-sm"
          >
            {p.label}: {p.number}
          </a>
        ))}
      </div>

      {/* Birincil kurum bandı */}
      <div className="w-full rounded-2xl bg-[#0B3B7A] text-white px-4 py-3 flex items-center justify-between">
        <div className="font-extrabold tracking-wide">{primaryOrg.name}</div>
        {primaryOrg.logo && (
          <div className="w-10 h-10 bg-white rounded-full grid place-items-center overflow-hidden">
            <Image
              src={primaryOrg.logo}
              alt={primaryOrg.name}
              width={40}
              height={40}
            />
          </div>
        )}
      </div>

      {/* Destekçi rozetleri */}
      {supportOrgs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {supportOrgs.map((o, i) => (
            <div
              key={i}
              className="flex items-center gap-2 border rounded-full px-3 py-1 bg-white"
            >
              {o.logo ? (
                <Image
                  src={o.logo}
                  alt={o.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <span className="text-sm text-[#0B3B7A]">{o.name}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Yönerge kartı */}
      <section className="rounded-2xl bg-[#D73333] text-white px-4 py-3">
        <div className="text-base font-extrabold mb-2">Bu süre zarfında:</div>
        <div className="space-y-2 text-sm">
          {list.map((line, i) => (
            <div key={i} className="bg-white/5 rounded-lg px-3 py-2">
              <span
                className="[&_strong]:font-extrabold [&_em]:italic"
                dangerouslySetInnerHTML={{ __html: md(line) }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Asistan Aç/Gizle */}
      <div className="space-y-3">
        <button
          onClick={() => setAssistantOpen((v) => !v)}
          className="w-full bg-[#0B3B7A] text-white rounded-lg py-2 font-semibold"
        >
          {assistantOpen ? 'Asistanı Gizle' : 'Asistanı Aç'}
        </button>
        {assistantOpen && <DisasterAssistant type={upper} />}
      </div>
    </div>
  )
}
