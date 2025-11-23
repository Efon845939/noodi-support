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
 * Türkiye'de acil çağrı numaraları:
 * 112: tek acil çağrı numarası (tümü bunun altında birleşmiş durumda)
 * 110: Yangın ihbar
 * 122: AFAD
 * 155: Polis
 * 156: Jandarma
 * 177: Orman yangını ihbar
 * 158: Sahil güvenlik
 * Ayrıca:
 * 168: Türk Kızılay çağrı / bağış ve danışma hattı
 * 115: Yeşilay YEDAM danışma hattı (bağımlılık)
 * 114: Ulusal Zehir Danışma Merkezi (UZEM)
 * 183: Aile / çocuk / şiddet / sosyal destek hattı
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
    id: '168',
    label: '168 Türk Kızılay Çağrı Merkezi',
    number: '168',
    info: 'Bağış, yardım talebi ve afetle ilgili danışma',
  },
  {
    id: '115',
    label: '115 Yeşilay YEDAM',
    number: '115',
    info: 'Bağımlılık konusunda psikososyal destek ve yönlendirme',
  },
  {
    id: '114',
    label: '114 Ulusal Zehir Danışma',
    number: '114',
    info: 'Zehirlenme ve madde maruziyetlerinde tıbbi danışma',
  },
  {
    id: '183',
    label: '183 Sosyal Destek Hattı',
    number: '183',
    info: 'Şiddet, istismar, çocuk, aile ve sosyal destek başvuruları',
  },
]

const BASE_LINES: EmergencyLine[] = [
  {
    id: '112-base',
    label: '112 Acil Çağrı',
    number: '112',
    info: 'Tüm acil durumlar',
  },
  {
    id: '122-base',
    label: '122 Alo AFAD',
    number: '122',
    info: 'Afet ve acil durum ihbarı',
  },
]

const DISASTER_CONFIG: Record<string, DisasterConfig> = {
  sel: {
    title: 'Sel Yardımı',
    question: 'Şu anda selden etkilendiğiniz bölgedeyseniz hemen yardım isteyin.',
    description:
      'Önce kendi can güvenliğinizi sağlayın. Mümkünse daha yüksek ve güvenli bir noktaya geçin, ardından acil hatları arayarak sel durumunu ve konumunuzu bildirin.',
    emergencyLines: [
      ...BASE_LINES,
      {
        id: '110-sel',
        label: '110 İtfaiye',
        number: '110',
        info: 'Kurtarma, tahliye ve su baskını durumları',
      },
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
      {
        id: 'kizilay',
        name: 'Türk Kızılay',
        role: 'Barınma, temel yardım, kan bağışı ve psiko-sosyal destek',
        phone: '168',
        phoneLabel: '168 Kızılay Çağrı Merkezi',
        website: 'https://www.kizilay.org.tr',
      },
    ],
  },
  heyelan: {
    title: 'Heyelan Yardımı',
    question: 'Toprak kayması / heyelan bölgesinde misiniz?',
    description:
      'Çöken yamaçlardan ve riskli binalardan uzaklaşın. Güvenli bir alanda bekleyip konumunuzu paylaşarak yardım isteyin.',
    emergencyLines: [...BASE_LINES],
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
      {
        id: 'kizilay',
        name: 'Türk Kızılay',
        role: 'Barınma, yardım ve psiko-sosyal destek',
        phone: '168',
        phoneLabel: '168 Kızılay Çağrı Merkezi',
        website: 'https://www.kizilay.org.tr',
      },
    ],
  },
  deprem: {
    title: 'Deprem Yardımı',
    question: 'Deprem sonrası güvende misiniz?',
    description:
      'Artçı sarsıntılar devam edebilir. Güvenli bir toplanma alanına geçin, göçük, gaz kaçağı, yangın gibi durumları acil hatlara bildirin, resmi uyarıları takip edin.',
    emergencyLines: [
      ...BASE_LINES,
      {
        id: '110-deprem',
        label: '110 İtfaiye',
        number: '110',
        info: 'Enkaz, yangın ve kurtarma',
      },
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
      {
        id: 'kizilay',
        name: 'Türk Kızılay',
        role: 'Deprem sonrası barınma, gıda, kan ve psiko-sosyal destek',
        phone: '168',
        phoneLabel: '168 Kızılay Çağrı Merkezi',
        website: 'https://www.kizilay.org.tr',
      },
      {
        id: 'yedam',
        name: 'Yeşilay YEDAM',
        role: 'Afet sonrası bağımlılık ve psikososyal destek danışmanlığı',
        phone: '115',
        phoneLabel: '115 YEDAM Danışma Hattı',
        website: 'https://www.yedam.org.tr',
      },
    ],
  },
  'fırtına': {
    title: 'Fırtına / Şiddetli Rüzgar',
    question: 'Şiddetli fırtına nedeniyle risk altında mısınız?',
    description:
      'Pencere kenarlarından ve düşebilecek nesnelerden uzak durun. Elektrik hatlarına yaklaşmayın, çatlak / kopma varsa acil hatlara bildirin.',
    emergencyLines: [...BASE_LINES],
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
      {
        id: 'kizilay',
        name: 'Türk Kızılay',
        role: 'Barınma ve temel ihtiyaç desteği',
        phone: '168',
        phoneLabel: '168 Kızılay Çağrı Merkezi',
        website: 'https://www.kizilay.org.tr',
      },
    ],
  },
  yangın: {
    title: 'Yangın Yardımı',
    question: 'Aktif yangın tehlikesi altındaysanız önce uzaklaşın.',
    description:
      'Can güvenliği her şeyden önce gelir. Yangın bölgesinden uzaklaşıp güvenli bir noktaya geçin, ardından itfaiye ve acil çağrı merkezini arayın.',
    emergencyLines: [
      {
        id: '110-yangin',
        label: '110 İtfaiye',
        number: '110',
        info: 'Yangın ve kurtarma',
      },
      ...BASE_LINES,
      {
        id: '177',
        label: '177 Orman Yangını',
        number: '177',
        info: 'Orman yangını ihbarı',
      },
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
      {
        id: 'kizilay',
        name: 'Türk Kızılay',
        role: 'Yangın sonrası barınma ve ihtiyaç desteği',
        phone: '168',
        phoneLabel: '168 Kızılay Çağrı Merkezi',
        website: 'https://www.kizilay.org.tr',
      },
    ],
  },
  'diğer': {
    title: 'Diğer Afet / Acil Durum',
    question: 'Afet veya riskli bir durum mu yaşıyorsunuz?',
    description:
      'Durumu ve konumunuzu mümkün olduğunca net şekilde anlatıp acil hatlara bildirin. Yetkili kurumlar size en uygun yönlendirmeyi yapacaktır.',
    emergencyLines: [...BASE_LINES],
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
      {
        id: 'kizilay',
        name: 'Türk Kızılay',
        role: 'Yardım, barınma ve psiko-sosyal destek',
        phone: '168',
        phoneLabel: '168 Kızılay Çağrı Merkezi',
        website: 'https://www.kizilay.org.tr',
      },
    ],
  },
}

const FALLBACK_CONFIG: DisasterConfig = {
  title: 'Acil Durum Yardımı',
  question: 'Bir afet / acil durum yaşıyorsanız hemen yardım isteyin.',
  description:
    'Bulunduğunuz konumu güvenli hale getirin ve ardından acil hatlara durumu bildirin. Çevrenizdekilerden de yardım isteyebilirsiniz.',
  emergencyLines: [
    ...BASE_LINES,
    {
      id: '110-fallback',
      label: '110 İtfaiye',
      number: '110',
      info: 'Yangın ve kurtarma',
    },
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
    {
      id: 'kizilay',
      name: 'Türk Kızılay',
      role: 'Yardım ve barınma desteği',
      phone: '168',
      phoneLabel: '168 Kızılay Çağrı Merkezi',
      website: 'https://www.kizilay.org.tr',
    },
  ],
}

type SearchParams = { [key: string]: string | string[] | undefined }

export default function StatusPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const raw = searchParams.subtype
  const subtype =
    typeof raw === 'string' ? raw.toLowerCase() : Array.isArray(raw) ? (raw[0] || '').toLowerCase() : ''

  const config = DISASTER_CONFIG[subtype] ?? FALLBACK_CONFIG

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title={config.title} showBack />

      <main className="flex-1 px-4 pt-4 pb-4">
        <div className="max-w-md mx-auto space-y-6">

          {/* DURUM KARTI */}
          <section className="bg-[#D73333] text-white rounded-3xl shadow-xl p-4 space-y-2">
            <h1 className="text-xl font-bold">Acil Durum</h1>
            <p className="text-sm font-semibold">{config.question}</p>
            <p className="text-xs text-white/90">{config.description}</p>
          </section>

          {/* O DURUMA ÖZEL HATLAR */}
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

          {/* GENEL ACİL NUMARALAR */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Genel acil çağrı numaraları
            </h2>
            <p className="text-[11px] text-gray-500">
              Türkiye’de tüm acil durumlar için tek numara <strong>112</strong>’dir.
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

          {/* DİĞER ÖNEMLİ HATLAR (KIZILAY / YEŞİLAY / UZEM / 183) */}
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

          {/* KURUMLAR & STK LİSTESİ */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Kurumlar &amp; STK’lar
            </h2>

            <p className="text-xs text-gray-500">
              Konuma dayalı tam listeleme daha sonra eklenecek. Şu anda ülke
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
