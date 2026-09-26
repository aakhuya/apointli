'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { MagnifyingGlassIcon, UsersIcon } from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import { Card } from '@/app/components/ui/Card'
import { appointmentApi, type Appointment } from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

interface CustomerSummary {
  id: string
  name: string
  email: string | null
  phone: string | null
  appointments: number
  lastVisit: string | null
  totalSpent: number
}

export default function CustomersPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      // Fetch all appointments (limit to a window we can aggregate)
      const appointments = await appointmentApi.list(currentOrg.id)

      // Aggregate by customer
      const map = new Map<string, CustomerSummary>()
      for (const a of appointments) {
        if (!a.customer) continue
        const key = a.customer.id
        const existing = map.get(key)
        const isCompleted = a.status === 'COMPLETED'
        if (existing) {
          existing.appointments += 1
          if (isCompleted && a.price) existing.totalSpent += a.price
          if (
            !existing.lastVisit ||
            a.start_time > existing.lastVisit
          ) {
            existing.lastVisit = a.start_time
          }
        } else {
          map.set(key, {
            id: key,
            name: a.customer.name || 'Unknown',
            email: a.customer.email,
            phone: a.customer.phone,
            appointments: 1,
            lastVisit: a.start_time,
            totalSpent: isCompleted && a.price ? a.price : 0,
          })
        }
      }

      setCustomers(
        Array.from(map.values()).sort((a, b) =>
          (b.lastVisit || '').localeCompare(a.lastVisit || ''),
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg])

  useEffect(() => {
    if (!orgLoading && currentOrg) void load()
    else if (!orgLoading) setIsLoading(false)
  }, [orgLoading, currentOrg, load])

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search),
  )

  if (!orgLoading && !currentOrg) {
    return (
      <div className="p-6 sm:p-8 max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ink-100">
          Welcome to apointli
        </h1>
        <p className="mt-2 text-gray-600 dark:text-ink-400">
          Create a workspace first.
        </p>
        <Link
          href="/app/settings/organizations/new"
          className="mt-4 inline-flex items-center px-5 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          Create workspace
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ink-100">
          Customers
        </h1>
        <p className="text-sm text-gray-500 dark:text-ink-400 mt-1">
          {customers.length} {customers.length === 1 ? 'customer' : 'customers'}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-ink-800 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 placeholder-gray-400 dark:placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
        />
      </div>

      {isLoading || orgLoading ? (
        <div className="flex items-center gap-3 text-gray-500 dark:text-ink-400">
          <Loader className="w-5 h-5" /> Loading customers...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <UsersIcon className="w-12 h-12 text-gray-300 dark:text-ink-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-ink-100">
            {search ? 'No matching customers' : 'No customers yet'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-ink-400 mt-1">
            {search
              ? 'Try a different search term.'
              : 'Customers appear here automatically after their first booking.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-ink-900/50 border-b border-gray-200 dark:border-ink-800">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-ink-400">
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">
                  Contact
                </th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">
                  Visits
                </th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">
                  Total spent
                </th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">
                  Last visit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-ink-800">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 dark:hover:bg-ink-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {c.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-ink-100 truncate">
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-xs text-gray-500 dark:text-ink-400 truncate">
                      {c.email || c.phone || '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm font-medium text-gray-900 dark:text-ink-100">
                      {c.appointments}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm font-medium text-gray-900 dark:text-ink-100">
                      {c.totalSpent > 0
                        ? `${currentOrg?.currency || '$'} ${c.totalSpent.toFixed(0)}`
                        : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-gray-500 dark:text-ink-400">
                    {c.lastVisit
                      ? new Date(c.lastVisit).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
