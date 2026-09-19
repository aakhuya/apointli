'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { Loader } from '@/app/components/Loader'
import {
  locationApi,
  type Location,
} from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

interface FormState {
  name: string
  address: string
  city: string
  country_code: string
  timezone: string
  currency: string
}

const emptyForm: FormState = {
  name: '',
  address: '',
  city: '',
  country_code: 'KE',
  timezone: 'Africa/Nairobi',
  currency: 'KES',
}

export default function LocationsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      setLocations(await locationApi.list(currentOrg.id))
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: unknown } } }
      const status = e.response?.status ?? 'network error'
      const detail = e.response?.data?.detail
      setError(
        `Failed to load locations (${status}): ${
          typeof detail === 'string'
            ? detail
            : detail
              ? JSON.stringify(detail)
              : 'no details'
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg])

  useEffect(() => {
    if (!orgLoading && currentOrg) {
      void load()
    } else if (!orgLoading) {
      setIsLoading(false)
    }
  }, [currentOrg, orgLoading, load])

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrg || !form.name.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await locationApi.create(currentOrg.id, {
        name: form.name,
        address: form.address || undefined,
        city: form.city || undefined,
        country_code: form.country_code || undefined,
        timezone: form.timezone,
        currency: form.currency,
      })
      setForm(emptyForm)
      setShowCreate(false)
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } } }
      const detail = e.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to create location. Check your inputs.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onDelete = async (id: string) => {
    if (!currentOrg) return
    if (!confirm('Delete this location?')) return
    try {
      await locationApi.remove(currentOrg.id, id)
      await load()
    } catch {
      setError('Failed to delete location')
    }
  }

  if (!orgLoading && !currentOrg) {
    return (
      <div className="p-6 sm:p-8 max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to apointli
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
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

  if (orgLoading || isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <Loader className="w-5 h-5" /> Loading locations...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Locations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Where you serve your customers
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-[#1a2a4a] dark:hover:bg-blue-700"
        >
          {showCreate ? 'Cancel' : '+ New location'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {showCreate && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            New location
          </h2>
          <form onSubmit={onCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                placeholder="Main Branch"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Country code
                </label>
                <input
                  value={form.country_code}
                  onChange={(e) =>
                    setForm({ ...form, country_code: e.target.value.toUpperCase() })
                  }
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm uppercase"
                  placeholder="KE"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Timezone
                </label>
                <input
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                  placeholder="Africa/Nairobi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Currency
                </label>
                <input
                  value={form.currency}
                  onChange={(e) =>
                    setForm({ ...form, currency: e.target.value.toUpperCase() })
                  }
                  maxLength={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm uppercase"
                  placeholder="KES"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                  placeholder="Nairobi"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                placeholder="123 Kenyatta Avenue"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? <Loader className="w-4 h-4" /> : null}
                Create location
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(emptyForm)
                  setShowCreate(false)
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {locations.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            No locations yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add your first location to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {loc.name}
                  </h3>
                  {loc.is_primary && (
                    <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                      Primary
                    </span>
                  )}
                </div>
                {(loc.address || loc.city) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                    {[loc.address, loc.city].filter(Boolean).join(', ')}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{loc.timezone}</span>
                  <span>·</span>
                  <span>{loc.currency}</span>
                </div>
              </div>
              <button
                onClick={() => onDelete(loc.id)}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-700 text-sm font-medium flex-shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
