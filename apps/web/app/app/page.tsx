'use client'

import Link from 'next/link'

import { useAuth } from '@/app/providers/auth-provider'
import { useOrganization } from '@/app/providers/organization-provider'

export default function AppHome() {
  const { user } = useAuth()
  const { currentOrg, organizations } = useOrganization()

  const firstName = user?.first_name || 'there'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Welcome, {firstName}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
        {currentOrg
          ? `Managing ${currentOrg.name}`
          : 'Create a workspace to get started'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {[
          { label: 'Bookings today', value: '0' },
          { label: 'Upcoming', value: '0' },
          { label: 'Revenue', value: '$0.00' },
          { label: 'No-shows', value: '0' },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
          >
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {s.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Quick actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Add a service', href: '/app/services' },
            { label: 'Manage staff', href: '/app/staff' },
            { label: 'Workspace settings', href: '/app/settings' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-[#0a1628]/30 dark:hover:border-blue-500/40 hover:shadow-sm transition-all text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {a.label} →
            </Link>
          ))}
        </div>
      </div>

      {organizations.length > 1 && (
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          You belong to {organizations.length} workspaces. Switch from the top bar.
        </p>
      )}
    </div>
  )
}
