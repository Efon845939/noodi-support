'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/',         label: 'Ana',    icon: '🏠' },
  { href: '/settings', label: 'Ayarlar', icon: '⚙️' },
  { href: '/profile',  label: 'Profil', icon: '👤' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-40
        border-t border-[#E0E4EC]
        bg-white/95 backdrop-blur
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== '/' && pathname.startsWith(tab.href))

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="
                flex flex-col items-center justify-center
                flex-1 min-w-0
              "
            >
              <span
                className={`text-lg leading-none ${
                  active ? 'opacity-100' : 'opacity-60'
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`mt-0.5 text-[11px] ${
                  active ? 'text-[#0B3B7A] font-semibold' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
