'use client'

import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import AssistantPanel from '@/components/AssistantPanel'

type EmergencyLine = {
  id: string
  label: string
  number: string
  info?: string
}

type Org = {
  id: string
  name: string
  role: string
  phone?: string
  phoneLabel?: string
  website?: string
  logo?: string
}

type DisasterConfig = {
  title: string
  question: string
  description: string
  emergencyLines: EmergencyLine[]
  orgs: Org[]
}

/**
 * Genel acil çağrı numaraları:
 * 112: tek acil numara, hepsi bunun altında birleşiyor
 * 110: Yangın
 * 122: AFAD
 * 155: Polis
 * 156: Jandarma
 * 177: Orman Yangını
 * 158: Sahil Güvenlik
 * 183: Sosyal Destek (şiddet / çocuk / aile vb.)
 */
const GENERAL_EMERGENCY_NUMBERS: EmergencyLine[] = [
  {
    id: '112',
    label: '112 Acil Çağrı',
    number: '112',
    info: 'Tüm acil durumlar için tek numara',
  },
  {
    id: '110',
    label: '110 Yangın İhbar',
    number: '110',
    info: 'Yangın ve kurtarma',
  },
  {
    id: '122',
    label: '122 Alo AFAD',
    number: '122',
    info: 'Afet ve acil durum ihbarı',
  },
  {
    id: '155',
    label: '155 Polis İmdat',
    number: '155',
    info: 'Polis ve güvenlik',
  },
  {
    id: '156',
    label: '156 Jandarma İmdat',
    number: '156',
    info: 'Jandarma sorumluluk bölgeleri',
  },
  {
    id: '177',
    label: '177 Orman Yangını',
    number: '177',
    info: 'Orman yangını ihbarı',
  },
  {
    id: '158',
    label: '158 Sahil Güvenlik',
    number: '158',
    info: 'Deniz ve kıyı hattı acil durumları',
  },
]

const OTHER_IMPORTANT_LINES: EmergencyLine[] = [
  {
    id: '183',
    label: '183 Sosyal Destek Hattı',
    number: '183',
    info: 'Şiddet, istismar, sosyal destek ve danışmanlık',
  },
]

const BASE_LINES: EmergencyLine[] = [
  { id: '112-base', label: '112 Acil Çağrı', number: '112', info: 'Tüm acil durumlar' },
  { id: '122-base', label: '122 Alo AFAD', number: '122', info: 'Afet ve acil durum ihbarı' },
]

const DISASTER_CONFIG: Record<string, DisasterConfig> = {
  sel: {
    title: 'Sel Yardımı',
    question: 'Şu anda selden etkilendiğiniz bölgedeyseniz hemen yardım isteyin.',
    description:
      'Can güvenliği her şeyden önce gelir. Bulunduğunuz konumu mümkünse yüksek ve güvenli bir noktaya taşıyın. Ardından aşağıdaki acil hatları arayarak durumu bildirin.',
    emergencyLines: [
      ...BASE_LINES,
      { id: '110-sel', label: '110 İtfaiye', number: '110', info: 'Kurtarma / tahliye' },
    ],
    orgs: [
      {
        id: 'afad',
        name: 'AFAD',
        role: 'Afet koordinasyonu, tahliye ve resmi yardım',
        phone: '122',
        phoneLabel: '122 Alo AFAD',
        website: 'https://www.afad.gov.tr',
        logo: '/logos/afad.png',
      },
      {
        id: 'itfaiye',
        name: 'İtfaiye',
        role: 'Kurtarma, su baskını ve mahsur kalma durumları',
        phone: '110',
        phoneLabel: '110 İtfaiye',
        logo: '/logos/itfaiye.png',
      },
      {
        id: 'akut',
        name: 'AKUT',
        role: 'Gönüllü arama kurtarma desteği',
        website: 'https://www.akut.org.tr',
        logo: '/logos/akut.png',
      },
    ],
  },
  heyelan: {
    title: 'Heyelan Yardımı',
    question: 'Toprak kayması / heyelan bölgesinde misiniz?',
    description:
      'Çöken yamaçlardan ve riskli binalardan uzaklaşın. Güvenli bir alanda bekleyip konumunuzu paylaşarak yardım isteyin.',
    emergencyLines: BASE_LINES,
    orgs: [
      {
        id: 'afad',
        name: 'AFAD',
        role: 'Heyelan bölgesi koordinasyonu ve tahliye',
        phone: '122',
        phoneLabel: '122 Alo AFAD',
        website: 'https://www.afad.gov.tr',
        logo: '/logos/afad.png',
      },
      {
        id: 'akut',
        name: 'AKUT',
        role: 'Gönüllü arama kurtarma desteği',
        website: 'https://www.akut.org.tr',
        logo: '/logos/akut.png',
      },
    ],
  },
  deprem: {
    title: 'Deprem Yardımı',
    question: 'Deprem sonrası güvende misiniz?',
    description:
      'Artçı sarsıntılar devam edebilir. Güvenli bir toplanma alanına geçin ve göçük, gaz kaçağı, yangın gibi durumları acil hatlara bildirin.',
    emergencyLines: [
      ...BASE_LINES,
      { id: '110-deprem', label: '110 İtfaiye', number: '110', info: 'Kurtarma / yangın' },
    ],
    orgs: [
      {
        id: 'afad',
        name: 'AFAD',
        role: 'Deprem koordinasyonu, barınma ve resmi yardım',
        phone: '122',
        phoneLabel: '122 Alo AFAD',
        website: 'https://www.afad.gov.tr',
        logo: '/logos/afad.png',
      },
      {
        id: 'akut',
        name: 'AKUT',
        role: 'Enkaz altı ve arama kurtarma',
        website: 'https://www.akut.org.tr',
        logo: '/logos/akut.png',
      },
    ],
  },
  'fırtına': {
    title: 'Fırtına / Şiddetli Rüzgar',
    question: 'Şiddetli fırtına nedeniyle risk altında mısınız?',
    description:
      'Pencere kenarlarından uzak durun, düşebilecek nesnelerden ve elektrik hatlarından uzaklaşın. Yaralanma veya ciddi hasar varsa acil hatları arayın.',
    emergencyLines: BASE_LINES,
    orgs: [
      {
        id: 'afad',
        name: 'AFAD',
        role: 'Şiddetli hava olayı ve afet koordinasyonu',
        phone: '122',
        phoneLabel: '122 Alo AFAD',
        website: 'https://www.afad.gov.tr',
        logo: '/logos/afad.png',
      },
    ],
  },
  yangın: {
    title: 'Yangın Yardımı',
    question: 'Aktif yangın tehlikesi altındaysanız önce uzaklaşın.',
    description:
      'Can güvenliği her şeyden önce gelir. Yangın bölgesinden uzaklaşıp güvenli bir noktaya geçin, ardından itfaiye ve acil çağrı merkezini arayın.',
    emergencyLines: [
      { id: '110-yangin', label: '110 İtfaiye', number: '110', info: 'Yangın ve kurtarma' },
      ...BASE_LINES,
      { id: '177', label: '177 Orman Yangını', number: '177', info: 'Orman yangını ihbarı' },
    ],
    orgs: [
      {
        id: 'itfaiye',
        name: 'İtfaiye',
        role: 'Yangın söndürme ve kurtarma',
        phone: '110',
        phoneLabel: '110 İtfaiye',
        logo: '/logos/itfaiye.png',
      },
      {
        id: 'afad',
        name: 'AFAD',
        role: 'Geniş çaplı yangın ve afet koordinasyonu',
        phone: '122',
        phoneLabel: '122 Alo AFAD',
        website: 'https://www.afad.gov.tr',
        logo: '/logos/afad.png',
      },
    ],
  },
  'diğer': {
    title: 'Diğer Afet / Acil Durum',
    question: 'Afet veya riskli bir durum mu yaşıyorsunuz?',
    description:
      'Durumunuzu mümkün olduğunca net tarif edip konumunuzla birlikte acil hatlara bildirin. Yetkili kurumlar size en uygun yönlendirmeyi yapacaktır.',
    emergencyLines: BASE_LINES,
    orgs: [
      {
        id: 'afad',
        name: 'AFAD',
        role: 'Tüm afet türlerinde resmi koordinasyon',
        phone: '122',
        phoneLabel: '122 Alo AFAD',
        website: 'https://www.afad.gov.tr',
        logo: '/logos/afad.png',
      },
    ],
  },
}

const FALLBACK_CONFIG: DisasterConfig = {
  title: 'Acil Durum Yardımı',
  question: 'Bir afet / acil durum yaşıyorsanız hemen yardım isteyin.',
  description:
    'Bulunduğunuz konumu güvenli hale getirin ve ardından acil hatlara durumu bildirin. Gerekirse çevrenizdekilerden de yardım isteyin.',
  emergencyLines: [
    ...BASE_LINES,
    { id: '110-fallback', label: '110 İtfaiye', number: '110', info: 'Yangın ve kurtarma' },
  ],
  orgs: [
    {
      id: 'afad',
      name: 'AFAD',
      role: 'Afet ve acil durum koordinasyonu',
      phone: '122',
      phoneLabel: '122 Alo AFAD',
      website: 'https://www.afad.gov.tr',
      logo: '/logos/afad.png',
    },
  ],
}

export default function StatusPage() {
  const searchParams = useSearchParams()
  const subtypeRaw = (searchParams.get('subtype') || '').toLowerCase()

  const config =
    DISASTER_CONFIG[subtypeRaw as keyof typeof DISASTER_CONFIG] ?? FALLBACK_CONFIG

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title={config.title} showBack />

      <main className="flex-1 px-4 pt-4 pb-4">
        <div className="max-w-md mx-auto space-y-6">

          {/* Durum kartı */}
          <section className="bg-[#D73333] text-white rounded-3xl shadow-xl p-4 space-y-2">
            <h1 className="text-xl font-bold">Acil Durum</h1>
            <p className="text-sm font-semibold">{config.question}</p>
            <p className="text-xs text-white/90">{config.description}</p>
          </section>

          {/* O duruma özel hızlı hatlar */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Bu duruma özel acil hatlar
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {config.emergencyLines.map((line) => (
                <a
                  key={line.id}
                  href={`tel:${line.number}`}
                  className="bg-[#0B3B7A] text-white rounded-2xl shadow-md px-3 py-3 flex flex-col justify-center items-start active:scale-95 transition"
                >
                  <span className="text-sm font-bold">{line.label}</span>
                  <span className="text-xs text-white/80">{line.number}</span>
                  {line.info && (
                    <span className="text-[11px] text-white/70 mt-1">
                      {line.info}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>

          {/* GENEL ACİL NUMARALAR BLOKU */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Genel acil çağrı numaraları
            </h2>
            <p className="text-[11px] text-gray-500">
              Türkiye’de tüm acil çağrılar için tek numara <strong>112</strong>’dir.
              Aşağıdaki numaralar da aynı sistem altında çalışır ve çoğu durumda
              112’yi aramanız yeterlidir.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {GENERAL_EMERGENCY_NUMBERS.map((line) => (
                <a
                  key={line.id}
                  href={`tel:${line.number}`}
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 shadow-sm flex flex-col justify-center active:scale-95 transition"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {line.label}
                  </span>
                  <span className="text-xs text-gray-700">{line.number}</span>
                  {line.info && (
                    <span className="text-[11px] text-gray-500 mt-1">
                      {line.info}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>

          {/* Diğer önemli hatlar (183 vs) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Diğer önemli hatlar
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {OTHER_IMPORTANT_LINES.map((line) => (
                <a
                  key={line.id}
                  href={`tel:${line.number}`}
                  className="bg-[#F3F4FF] border border-[#D0D4FF] rounded-2xl px-3 py-3 shadow-sm flex flex-col justify-center active:scale-95 transition"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {line.label}
                  </span>
                  <span className="text-xs text-gray-700">{line.number}</span>
                  {line.info && (
                    <span className="text-[11px] text-gray-600 mt-1">
                      {line.info}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </section>

          {/* Yakın kurumlar / STK listesi */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Yakınınızdaki Kurumlar &amp; STK’lar
            </h2>

            <p className="text-xs text-gray-500">
              Konuma dayalı tam listeleme yakında eklenecek. Şu anda ülke
              genelinde en sık başvurulan kurumlar gösteriliyor.
            </p>

            <div className="space-y-3">
              {config.orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-3 shadow-sm"
                >
                  {org.logo && (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white border border-gray-200 shrink-0">
                      <Image
                        src={org.logo}
                        alt={org.name}
                        fill
                        className="object-contain p-1.5"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {org.role}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {org.phone && (
                        <a
                          href={`tel:${org.phone}`}
                          className="text-[11px] px-2 py-1 rounded-full bg-[#0B3B7A] text-white"
                        >
                          {(org.phoneLabel || org.phone) + ' Ara'}
                        </a>
                      )}
                      {org.website && (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] px-2 py-1 rounded-full bg-gray-200 text-gray-800"
                        >
                          Web sitesi
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <BottomTabs />
      <AssistantPanel />
    </div>
  )
}
