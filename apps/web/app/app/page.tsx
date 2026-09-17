'use client'

import { useAuth } from '@/app/providers/auth-provider'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'

export default function AppHome() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <ApointliLogo size="md" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user?.email}
            </span>
            <button
              onClick={() => logout()}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="mt-2 text-gray-600">
          This is your dashboard. We&apos;ll build it out next.
        </p>
      </main>
    </div>
  )
}
