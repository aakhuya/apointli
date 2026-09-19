'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
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
  XMarkIcon,
} from '@heroicons/react/24/outline'

import { ApointliLogo } from '@/app/components/logo/ApointliLogo'

const nav = [
  { label: 'Dashboard', href: '/app', icon: HomeIcon, exact: true },
  { label: 'Bookings', href: '/app/appointments', icon: Squares2X2Icon },
  { label: 'Services', href: '/app/services', icon: WrenchScrewdriverIcon },
  { label: 'Staff', href: '/app/staff', icon: UserGroupIcon },
  { label: 'Locations', href: '/app/locations', icon: MapPinIcon },
  { label: 'Customers', href: '/app/customers', icon: UsersIcon },
  { label: 'Calendar', href: '/app/calendar', icon: CalendarIcon },
  { label: 'Availability', href: '/app/availability', icon: ClockIcon },
  { label: 'Analytics', href: '/app/analytics', icon: ChartBarIcon },
  { label: 'Reviews', href: '/app/reviews', icon: StarIcon },
  { label: 'Settings', href: '/app/settings', icon: Cog6ToothIcon },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname()

  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-transform duration-250 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
          <ApointliLogo size="md" />
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100vh-64px)]">
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
      </aside>
    </>
  )
}
