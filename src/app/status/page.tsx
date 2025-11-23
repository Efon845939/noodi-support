'use client'

import HeaderBar from '@/components/HeaderBar'
import BottomTabs from '@/components/BottomTabs'
import DisasterStatus from '@/components/DisasterStatus'
import { useSearchParams } from 'next/navigation'

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
    // Sel’de yardımcı olarak AKOM yeterli, itfaiyeyi karıştırmıyoruz
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

export default function StatusPage() {
  const sp = useSearchParams()
  const subtypeRaw = (sp.get('subtype') || 'deprem').toString().toUpperCase()

  const TYPE = ['DEPREM', 'SEL', 'YANGIN', 'HEYELAN', 'FIRTINA'].includes(
    subtypeRaw,
  )
    ? (subtypeRaw as any)
    : ('DEPREM' as const)

  const map =
    ORGS[TYPE] || { primary: { name: 'AFAD', logo: '/logos/afad.png' }, support: [] }

  return (
    <div className="min-h-[100svh] bg-white pb-[68px]">
      <HeaderBar title="Durum" />
      <DisasterStatus
        type={TYPE}
        primaryOrg={map.primary}
        supportOrgs={map.support}
      />
      <BottomTabs />
    </div>
  )
}
