import Image from 'next/image'
import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import AssistantPanel from '@/components/AssistantPanel'

type EmergencyLine = {
  id: string
  label: string
  number: string
}

type Org = {
  id: string
  name: string
  role: string
  website?: string
  logo?: string
}

type DisasterConfig = {
  title: string
  question: string
  description: string
  orgs: Org[]
}

/** TÜRKİYE ACİL VE ÖNEMLİ NUMARALAR */
const EMERGENCY_LINES: EmergencyLine[] = [
  { id: '112', label: '112 Acil Çağrı', number: '112' },
  { id: '110', label: '110 Yangın İhbar', number: '110' },
  { id: '122', label: '122 Alo AFAD', number: '122' },
  { id: '155', label: '155 Polis İmdat', number: '155' },
  { id: '156', label: '156 Jandarma İmdat', number: '156' },
  { id: '177', label: '177 Orman Yangını', number: '177' },
  { id: '158', label: '158 Sahil Güvenlik', number: '158' },
  { id: '168', label: '168 Türk Kızılay', number: '168' },
  { id: '115', label: '115 Yeşilay YEDAM', number: '115' },
  { id: '114', label: '114 UZEM Zehir Danışma', number: '114' },
  { id: '183', label: '183 Sosyal Destek', number: '183' },
]

const BASE_ORGS: Org[] = [
  {
    id: 'afad',
    name: 'AFAD',
    role: 'Afet ve acil durum koordinasyonu, tahliye, barınma',
    website: 'https://www.afad.gov.tr',
    logo: '/logos/afad.png',
  },
  {
    id: 'kizilay',
    name: 'Türk Kızılay',
    role: 'Barınma, temel yardım, kan bağışı, psiko-sosyal destek',
    website: 'https://www.kizilay.org.tr',
  },
  {
    id: 'akut',
    name: 'AKUT',
    role: 'Gönüllü arama kurtarma desteği',
    website: 'https://www.akut.org.tr',
    logo: '/logos/akut.png',
  },
]

const DISASTER_CONFIG: Record<string, DisasterConfig> = {
  sel: {
    title: 'Sel Yardımı',
    question: 'Şu anda selden etkilendiğiniz bir bölgede misiniz?',
    description:
      'Önce kendi can güvenliğinizi sağlayın. Mümkünse daha yüksek ve güvenli bir noktaya geçin, ardından acil hatları arayarak konumunuzu bildirin.',
    orgs: BASE_ORGS,
  },
  heyelan: {
    title: 'Heyelan Yardımı',
    question: 'Toprak kayması / heyelan riski olan bir bölgede misiniz?',
    description:
      'Çöken yamaçlardan ve riskli binalardan uzaklaşın. Güvenli bir alanda bekleyip yetkili kurumlara haber verin.',
    orgs: BASE_ORGS,
  },
  deprem: {
    title: 'Deprem Yardımı',
    question: 'Deprem sonrası güvende misiniz?',
    description:
      'Artçı sarsıntılar devam edebilir. Güvenli bir toplanma alanına geçip göçük, gaz kaçağı, yangın gibi durumları acil hatlara bildirin.',
    orgs: BASE_ORGS,
  },
  'fırtına': {
    title: 'Fırtına Yardımı',
    question: 'Şiddetli rüzgar / fırtına nedeniyle risk altında mısınız?',
    description:
      'Pencere kenarlarından ve düşebilecek nesnelerden uzak durun. Elektrik hatlarına yaklaşmayın, hasarı acil hatlara bildirin.',
    orgs: BASE_ORGS,
  },
  yangın: {
    title: 'Yangın Yardımı',
    question: 'Aktif yangın tehlikesi altındaysanız önce uzaklaşın.',
    description:
      'Yangın bölgesinden uzaklaşıp güvenli bir noktaya geçin, ardından itfaiye ve acil çağrı merkezini arayın.',
    orgs: BASE_ORGS,
  },
  'diğer': {
    title: 'Diğer Afet / Acil Durum',
    question: 'Afet veya riskli bir durum mu yaşıyorsunuz?',
    description:
      'Durumu ve konumunuzu mümkün olduğunca net şekilde acil hatlara bildirin. Yetkili kurumlar gerekli yönlendirmeyi yapacaktır.',
    orgs: BASE_ORGS,
  },
}

const FALLBACK_CONFIG: DisasterConfig = {
  title: 'Acil Durum Yardımı',
  question: 'Bir afet / acil durum yaşıyorsanız hemen yardım isteyin.',
  description:
    'Önce bulunduğunuz yeri güvenli hale getirin, ardından acil hatlara durumu bildirin.',
  orgs: BASE_ORGS,
}

type SearchParams = { [key: string]: string | string[] | undefined }

export default function StatusPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const raw = searchParams.subtype
  const subtype =
    typeof raw === 'string'
      ? raw.toLowerCase()
      : Array.isArray(raw)
      ? (raw[0] || '').toLowerCase()
      : ''

  const config = DISASTER_CONFIG[subtype] ?? FALLBACK_CONFIG

  return (
    <div className="min-h-[100svh] bg-white pb-[68px] flex flex-col">
      <HeaderBar title={config.title} showBack />

      <main className="flex-1 px-4 pt-4 pb-4">
        <div className="max-w-md mx-auto space-y-6">

          {/* KIRMIZI ANA KART (ESKİ LAYOUTA BENZER) */}
          <section className="bg-[#D73333] text-white rounded-3xl shadow-xl p-4 space-y-2">
            <h1 className="text-xl font-bold">Acil Durum</h1>
            <p className="text-sm font-semibold">{config.question}</p>
            <p className="text-xs text-white/90">{config.description}</p>
          </section>

          {/* YANDA SCROLLABLE KÜÇÜK LİSTE */}
          <section>
            <div className="flex items-start gap-3">
              <p className="flex-1 text-[11px] text-gray-600">
                Aşağıdaki listede Türkiye’deki başlıca acil çağrı numaraları
                yer alıyor. Dokunarak doğrudan arayabilirsiniz.
              </p>
              <div className="w-40 max-h-40 overflow-y-auto bg-gray-50 border border-gray-200 rounded-2xl p-2 space-y-1">
                {EMERGENCY_LINES.map((line) => (
                  <a
                    key={line.id}
                    href={`tel:${line.number}`}
                    className="flex flex-col rounded-xl px-2 py-1 hover:bg-gray-100 active:bg-gray-200"
                  >
                    <span className="text-[11px] font-semibold text-gray-900 truncate">
                      {line.label}
                    </span>
                    <span className="text-[11px] font-mono text-gray-700">
                      {line.number}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* KURUMLAR / STK’LAR (AFAD, KIZILAY, AKUT…) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Kurumlar &amp; STK’lar
            </h2>
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
                    {org.website && (
                      <a
                        href={org.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-[11px] px-2 py-1 rounded-full bg-gray-200 text-gray-800"
                      >
                        Web sitesi
                      </a>
                    )}
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
