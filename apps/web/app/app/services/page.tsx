'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Loader } from '@/app/components/Loader'
import { serviceApi, type Service } from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().positive().max(1440),
  price: z.coerce.number().nonnegative().optional(),
})

type FormData = z.infer<typeof schema>

export default function ServicesPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      setServices(await serviceApi.list(currentOrg.id))
    } catch {
      setError('Failed to load services')
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

  const onCreate = async (data: FormData) => {
    if (!currentOrg) return
    try {
      await serviceApi.create(currentOrg.id, {
        name: data.name,
        description: data.description,
        duration_minutes: data.duration_minutes,
        price: data.price,
      })
      reset()
      setShowCreate(false)
      await load()
    } catch {
      setError('Failed to create service')
    }
  }

  const onDelete = async (id: string) => {
    if (!currentOrg) return
    if (!confirm('Delete this service?')) return
    try {
      await serviceApi.remove(currentOrg.id, id)
      await load()
    } catch {
      setError('Failed to delete service')
    }
  }

  if (!orgLoading && !currentOrg) {
    return (
      <div className="p-6 sm:p-8 max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome to apointli
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You need a workspace before you can add services.
        </p>
        <Link
          href="/app/settings/organizations/new"
          className="mt-4 inline-flex items-center px-5 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-[#1a2a4a] dark:hover:bg-blue-700"
        >
          Create your first workspace
        </Link>
      </div>
    )
  }

  if (orgLoading || isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <Loader className="w-5 h-5" /> Loading services...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Services
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            What your business offers
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-[#1a2a4a] dark:hover:bg-blue-700 transition-colors"
        >
          {showCreate ? 'Cancel' : '+ New service'}
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
            New service
          </h2>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Name
                </label>
                <input
                  {...register('name')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                  placeholder="Haircut"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  {...register('duration_minutes')}
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                  placeholder="45"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Price (USD)
              </label>
              <input
                {...register('price')}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                placeholder="35.00"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-[#1a2a4a] dark:hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader className="w-4 h-4" /> : null}
                Create service
              </button>
              <button
                type="button"
                onClick={() => {
                  reset()
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

      {services.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            No services yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add your first service to start accepting bookings.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">
                  Duration
                </th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">
                  Price
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {services.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {s.name}
                        </p>
                        {s.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                    {s.duration_minutes} min
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden md:table-cell">
                    {s.price != null ? `$${s.price.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(s.id)}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
