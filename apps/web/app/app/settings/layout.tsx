'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { label: 'Overview', href: '/app/settings', exact: true },
  { label: 'General', href: '/app/settings/general' },
  { label: 'Account', href: '/app/settings/account' },
  { label: 'Team', href: '/app/settings/team' },
  { label: 'Billing', href: '/app/settings/billing' },
  { label: 'Danger zone', href: '/app/settings/danger' },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ink-100">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-ink-400 mt-1">
          Manage your workspace and account
        </p>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-6 lg:gap-8">
        {/* Settings sidebar — horizontal scroll on mobile, sticky on desktop */}
        <nav className="lg:sticky lg:top-4 lg:self-start -mx-4 px-4 lg:mx-0 lg:px-0 overflow-x-auto lg:overflow-x-visible">
          <ul className="flex lg:flex-col gap-1 pb-2 lg:pb-0 min-w-max lg:min-w-0">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(item.href + '/')
              return (
                <li key={item.href} className="flex-shrink-0">
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#0a1628] dark:bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-ink-400 hover:bg-gray-100 dark:hover:bg-ink-800'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Settings content — forces wrapping on mobile */}
        <div className="min-w-0 overflow-x-hidden">{children}</div>
      </div>
    </div>
  )
}
