'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import {
  locationApi,
  staffApi,
  staffServiceApi,
  type AvailableService,
  type Location,
  type Staff,
  type StaffServiceItem,
} from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const schema = z.object({
  email: z.string().email('Valid email required'),
  title: z.string().optional(),
  bio: z.string().optional(),
  location_id: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function getInitials(first: string | null, last: string | null, email: string) {
  const f = first?.[0] ?? ''
  const l = last?.[0] ?? ''
  return (f + l).toUpperCase() || email[0].toUpperCase()
}

function getDisplayName(s: Staff) {
  const name = [s.first_name, s.last_name].filter(Boolean).join(' ')
  return name || s.email
}

// ─── Expandable staff card with service assignment ───
function StaffCard({
  staff,
  orgId,
  onRemove,
}: {
  staff: Staff
  orgId: string
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [assigned, setAssigned] = useState<StaffServiceItem[]>([])
  const [available, setAvailable] = useState<AvailableService[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [assignedList, availableList] = await Promise.all([
        staffServiceApi.listAssigned(orgId, staff.id),
        staffServiceApi.listAvailable(orgId, staff.id),
      ])
      setAssigned(assignedList)
      setAvailable(availableList)
    } catch {
      setError('Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [orgId, staff.id])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const onAssign = async (serviceId: string) => {
    setBusyId(serviceId)
    try {
      await staffServiceApi.assign(orgId, staff.id, serviceId)
      await load()
    } catch {
      setError('Failed to assign service')
    } finally {
      setBusyId(null)
    }
  }

  const onUnassign = async (serviceId: string) => {
    setBusyId(serviceId)
    try {
      await staffServiceApi.unassign(orgId, staff.id, serviceId)
      await load()
    } catch {
      setError('Failed to remove service')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center font-semibold flex-shrink-0">
          {getInitials(staff.first_name, staff.last_name, staff.email)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {getDisplayName(staff)}
            </h3>
            {!staff.accepts_bookings && (
              <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                Not booking
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {staff.title || staff.email}
          </p>
          {staff.location_name && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              📍 {staff.location_name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={`/app/staff/${staff.id}/schedule`}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0a1628] dark:text-blue-400 hover:underline"
          >
            Schedule
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#0a1628] dark:text-blue-400 hover:underline"
          >
            Services
            {open ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onRemove(staff.id)}
            className="text-rose-600 dark:text-rose-400 hover:text-rose-700 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/50">
          {error && (
            <div className="mb-3 p-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader className="w-4 h-4" /> Loading...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Assigned */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                  Assigned services ({assigned.length})
                </h4>
                {assigned.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Not assigned to any services yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {assigned.map((a) => (
                      <span
                        key={a.service_id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: a.color }}
                        />
                        <span className="text-gray-900 dark:text-white">
                          {a.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {a.effective_duration_minutes}m
                        </span>
                        <button
                          onClick={() => onUnassign(a.service_id)}
                          disabled={busyId === a.service_id}
                          className="text-gray-400 hover:text-rose-600 disabled:opacity-50"
                          aria-label={`Remove ${a.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Available */}
              {available.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Available to assign
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {available.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onAssign(s.id)}
                        disabled={busyId === s.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-[#0a1628] dark:hover:border-blue-500 hover:text-[#0a1628] dark:hover:text-blue-400 disabled:opacity-50 transition-colors"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        + {s.name}
                        <span className="text-xs text-gray-400">
                          {s.duration_minutes}m
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StaffPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [staff, setStaff] = useState<Staff[]>([])
  const [locations, setLocations] = useState<Location[]>([])
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
      const [staffList, locList] = await Promise.all([
        staffApi.list(currentOrg.id),
        locationApi.list(currentOrg.id),
      ])
      setStaff(staffList)
      setLocations(locList)
    } catch {
      setError('Failed to load staff')
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
    setError(null)
    try {
      await staffApi.create(currentOrg.id, {
        email: data.email,
        title: data.title,
        bio: data.bio,
        location_id: data.location_id || null,
      })
      reset()
      setShowCreate(false)
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Failed to add staff')
    }
  }

  const onRemove = async (id: string) => {
    if (!currentOrg) return
    if (!confirm('Remove this staff member?')) return
    try {
      await staffApi.remove(currentOrg.id, id)
      await load()
    } catch {
      setError('Failed to remove staff')
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
        <Loader className="w-5 h-5" /> Loading staff...
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Staff
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your team and their services
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-[#1a2a4a] dark:hover:bg-blue-700"
        >
          {showCreate ? 'Cancel' : '+ Add staff'}
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
            Add staff member
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            The user must already have an apointli account.
          </p>
          <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                  placeholder="stylist@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Title
                </label>
                <input
                  {...register('title')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                  placeholder="Senior Stylist"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Bio
              </label>
              <textarea
                {...register('bio')}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                placeholder="Short bio (optional)"
              />
            </div>

            {locations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Location
                </label>
                <select
                  {...register('location_id')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                >
                  <option value="">— None —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {isSubmitting ? <Loader className="w-4 h-4" /> : null}
                Add staff
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

      {staff.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            No staff yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Add team members and assign them to services.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {currentOrg &&
            staff.map((s) => (
              <StaffCard
                key={s.id}
                staff={s}
                orgId={currentOrg.id}
                onRemove={onRemove}
              />
            ))}
        </div>
      )}
    </div>
  )
}
