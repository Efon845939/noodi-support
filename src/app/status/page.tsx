import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import GeoGate from '@/components/GeoGate'
import DisasterStatus from '@/components/DisasterStatus'

const ORGS: Record<
  string,
  {
    primary: { name: string; logo?: string }
    support: { name: string; logo?: string }[]
  }
> = {
  DEPREM: {
    primary: { name: 'AFAD', logo: '/logos/afad.png' },
    support: [{ name: 'AKUT', logo: '/logos/akut.png' }],
  },
  SEL: {
    primary: { name: 'AFAD', logo: '/logos/afad.png' },
    support: [{ name: 'AKUT', logo: '/logos/akut.png' }],
  },
  YANGIN: {
    primary: { name: 'İtfaiye', logo: '/logos/itfaiye.png' },
    support: [{ name: 'AKUT', logo: '/logos/akut.png' }],
  },
  HEYELAN: {
    primary: { name: 'AFAD', logo: '/logos/afad.png' },
    support: [],
  },
  FIRTINA: {
    primary: { name: 'AFAD', logo: '/logos/afad.png' },
    support: [],
  },
}

type DisasterType = keyof typeof ORGS

type StatusPageProps = {
  searchParams?: {
    [key: string]: string | string[] | undefined
  }
}

/** TÜRKİYE ACİL VE ÖNEMLİ NUMARALAR – SAĞDAKİ SCROLLABLE LİSTE İÇİN */
const EMERGENCY_LINES: { id: string; label: string; number: string }[] = [
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

export default function StatusPage({ searchParams }: StatusPageProps) {
  const raw = searchParams?.subtype
  const subtype = (Array.isArray(raw) ? raw[0] : raw) || 'DEPREM'

  const subtypeRaw = subtype.toString().toUpperCase()

  const validTypes = Object.keys(ORGS) as DisasterType[]
  const TYPE: DisasterType = validTypes.includes(subtypeRaw as DisasterType)
    ? (subtypeRaw as DisasterType)
    : 'DEPREM'

  const map =
    ORGS[TYPE] ?? {
      primary: { name: 'AFAD', logo: '/logos/afad.png' },
      support: [],
    }

  return (
    <GeoGate>
      <div className="min-h-[100svh] bg-white flex flex-col">
        <AppHeader userName={null} />

        <main className="flex-1 max-w-md w-full mx-auto p-4">
          {/* BURASI ESKİ TASARIM + SAĞDA LİSTE */}
          <div className="flex items-start gap-3">
            {/* SOL: ESKİ DisasterStatus BLOĞU */}
            <div className="flex-1">
              <DisasterStatus
                type={TYPE}
                primaryOrg={map.primary}
                supportOrgs={map.support}
              />
            </div>

            {/* SAĞ: SCROLLABLE ACİL NUMARA LİSTESİ */}
            <div className="w-32 sm:w-40 max-h-40 overflow-y-auto bg-gray-50 border border-gray-200 rounded-2xl p-2 space-y-1">
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
        </main>

        <BottomNav />
      </div>
    </GeoGate>
  )
}
