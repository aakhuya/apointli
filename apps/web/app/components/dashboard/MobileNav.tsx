'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  CalendarIcon,
  HomeIcon,
  Squares2X2Icon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'

const tabs = [
  { label: 'Dashboard', href: '/app', icon: HomeIcon, exact: true },
  { label: 'Bookings', href: '/app/appointments', icon: Squares2X2Icon },
  { label: 'Calendar', href: '/app/calendar', icon: CalendarIcon },
  { label: 'Services', href: '/app/services', icon: WrenchScrewdriverIcon },
  { label: 'Staff', href: '/app/staff', icon: UserGroupIcon },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                active
                  ? 'text-[#0a1628] dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.8} />
              <span
                className={`text-[10px] font-medium ${
                  active ? 'font-semibold' : ''
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
