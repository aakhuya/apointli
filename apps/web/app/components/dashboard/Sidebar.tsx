'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  HomeIcon,
  MapPinIcon,
  Squares2X2Icon,
  StarIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'

const nav = [
  { label: 'Dashboard', href: '/app', icon: HomeIcon, exact: true },
  { label: 'Bookings', href: '/app/appointments', icon: Squares2X2Icon },
  { label: 'My Business', href: '/app/business', icon: MapPinIcon },
  { label: 'Services', href: '/app/services', icon: WrenchScrewdriverIcon },
  { label: 'Staff', href: '/app/staff', icon: UserGroupIcon },
  { label: 'Customers', href: '/app/customers', icon: UsersIcon },
  { label: 'Calendar', href: '/app/calendar', icon: CalendarIcon },
  { label: 'Analytics', href: '/app/analytics', icon: ChartBarIcon },
  { label: 'Reviews', href: '/app/reviews', icon: StarIcon },
  { label: 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800">
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-gray-100 dark:border-gray-800">
        <Link href="/app">
          <ApointliLogo size="md" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#0a1628] dark:bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="p-3">
        <div className="rounded-xl bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] dark:from-blue-900 dark:to-blue-700 p-4 text-white">
          <p className="text-xs font-semibold mb-1">Grow your business</p>
          <p className="text-xs text-blue-100/80 mb-3">
            More bookings. More customers.
          </p>
          <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-xs font-medium py-2 rounded-lg transition-colors">
            Upgrade plan
          </button>
        </div>
      </div>
    </aside>
  )
}
