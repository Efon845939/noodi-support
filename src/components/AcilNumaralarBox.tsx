'use client'

type Line = { id: string; label: string; number: string }

const LINES: Line[] = [
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

export default function AcilNumaralarBox({ className = '' }: { className?: string }) {
  const base =
    'bg-[#F5F7FB] border border-[#E0E4F0] rounded-2xl shadow-sm px-3 py-2 max-h-[280px] overflow-y-auto'
  return (
    <div className={`${base} ${className}`}>
      <p className="text-[11px] font-semibold text-gray-700 mb-1">
        Acil Numaralar
      </p>
      <div className="space-y-1">
        {LINES.map((line) => (
          <a
            key={line.id}
            href={`tel:${line.number}`}
            className="block rounded-lg px-2 py-1 hover:bg-white active:bg-gray-100 transition"
          >
            <div className="text-[11px] font-semibold text-gray-900 truncate">
              {line.label}
            </div>
            <div className="text-[11px] font-mono text-gray-700">
              {line.number}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
