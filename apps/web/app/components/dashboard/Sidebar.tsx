'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  CalendarIcon,
  ClockIcon,
  Cog6ToothIcon,
  HomeIcon,
  MapPinIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'

const nav = [
  { label: 'Dashboard',    href: '/app',              icon: HomeIcon },
  { label: 'Calendar',     href: '/app/calendar',     icon: CalendarIcon },
  { label: 'Appointments', href: '/app/appointments', icon: Squares2X2Icon },
  { label: 'Customers',    href: '/app/customers',    icon: UsersIcon },
  { label: 'Services',     href: '/app/services',     icon: WrenchScrewdriverIcon },
  { label: 'Staff',        href: '/app/staff',        icon: UserGroupIcon },
  { label: 'Locations',    href: '/app/locations',    icon: MapPinIcon },
  { label: 'Availability', href: '/app/availability', icon: ClockIcon },
  { label: 'Settings',     href: '/app/settings',     icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/app">
          <ApointliLogo size="md" />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/app'
              ? pathname === '/app'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#0a1628] dark:bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500">apointli v0.1</p>
      </div>
    </aside>
  )
}
