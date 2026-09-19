'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from '@/app/providers/auth-provider'
import { useOrganization } from '@/app/providers/organization-provider'
import { useTheme } from '@/app/providers/theme-provider'

interface Props {
  onOpenMobileMenu: () => void
}

export function TopBar({ onOpenMobileMenu }: Props) {
  const { user, logout } = useAuth()
  const { currentOrg } = useOrganization()
  const { resolvedTheme, toggle } = useTheme()
  const router = useRouter()
  const [userOpen, setUserOpen] = useState(false)

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
  const displayName = fullName || user?.email || 'User'
  const initials =
    ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?'

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-3 sm:px-6 gap-3">
      {/* Mobile menu button */}
      <button
        onClick={onOpenMobileMenu}
        aria-label="Open menu"
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
      >
        <Bars3Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Search - hidden on very small screens */}
      <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings, customers, or services..."
            className="w-full pl-10 pr-12 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500"
          />
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded">
            ⌘ K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <SunIcon className="w-[18px] h-[18px] text-gray-400" />
          ) : (
            <MoonIcon className="w-[18px] h-[18px] text-gray-400" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <BellIcon className="w-[18px] h-[18px] text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-gray-950" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2.5 sm:pl-2 pr-1 sm:pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0a1628] to-[#2a44e8] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                {currentOrg?.role
                  ? currentOrg.role.charAt(0) + currentOrg.role.slice(1).toLowerCase()
                  : 'Owner'}
              </p>
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {userOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-20">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    router.push('/app/settings')
                    setUserOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  Settings
                </button>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-rose-600 dark:text-rose-400"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
