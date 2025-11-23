'use client'

import { useSearchParams } from 'next/navigation'
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
    // Sel’de yardımcı olarak AKUT yeterli
    support: [{ name: 'AKUT', logo: '/logos/akut.png' }],
  },
  YANGIN: {
    primary: { name: 'İtfaiye', logo: '/logos/itfaiye.png' },
    // Yangında AFAD yerine AKUT destekçi
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

export default function StatusPage() {
  const sp = useSearchParams()
  const subtypeRaw = (sp.get('subtype') || 'DEPREM').toString().toUpperCase()

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
          <DisasterStatus
            type={TYPE}
            primaryOrg={map.primary}
            supportOrgs={map.support}
          />
        </main>
        <BottomNav />
      </div>
    </GeoGate>
  )
}
