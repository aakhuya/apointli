'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ChevronDownIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from '@/app/providers/auth-provider'
import { useOrganization } from '@/app/providers/organization-provider'
import { useTheme } from '@/app/providers/theme-provider'

export function TopBar() {
  const { user, logout } = useAuth()
  const { organizations, currentOrg, switchOrg } = useOrganization()
  const { resolvedTheme, toggle } = useTheme()
  const router = useRouter()
  const [orgOpen, setOrgOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const initials =
    ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?'

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between px-4 sm:px-6">
      {/* Workspace switcher */}
      <div className="relative">
        <button
          onClick={() => setOrgOpen(!orgOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[160px] sm:max-w-none">
            {currentOrg?.name ?? 'Select workspace'}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        {orgOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOrgOpen(false)}
            />
            <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-20">
              {organizations.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No workspaces yet
                </div>
              )}
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    void switchOrg(org.id)
                    setOrgOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                    currentOrg?.id === org.id ? 'bg-gray-50 dark:bg-gray-800 font-medium' : ''
                  }`}
                >
                  {org.name}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-800 my-1" />
              <button
                onClick={() => {
                  router.push('/app/settings/organizations/new')
                  setOrgOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-[#0a1628] dark:text-blue-400 font-medium"
              >
                + New workspace
              </button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <SunIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <ChevronDownIcon className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {userOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-20">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.first_name} {user?.last_name}
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
