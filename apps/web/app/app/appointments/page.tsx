'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

import { BookingModal } from '@/app/components/booking/BookingModal'
import { Loader } from '@/app/components/Loader'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import {
  appointmentApi,
  staffApi,
  type Appointment,
  type Staff,
} from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const STATUS_VARIANTS: Record<
  string,
  'success' | 'warning' | 'info' | 'neutral' | 'danger'
> = {
  SCHEDULED: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
  RESCHEDULED: 'neutral',
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function startOfWeek(d: Date): Date {
  const result = new Date(d)
  const day = result.getDay()
  const diff = result.getDate() - day + (day === 0 ? -6 : 1)
  result.setDate(diff)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + days)
  return result
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatDateLong(d: Date): string {
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function AppointmentsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [staffFilter, setStaffFilter] = useState<string>('')
  const [bookingOpen, setBookingOpen] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    setError(null)

    const from = weekStart
    const to = addDays(weekStart, 7)

    try {
      const [appts, staffList] = await Promise.all([
        appointmentApi.list(currentOrg.id, {
          from_date: from.toISOString(),
          to_date: to.toISOString(),
          staff_id: staffFilter || undefined,
        }),
        staffApi.list(currentOrg.id),
      ])
      setAppointments(appts)
      setStaff(staffList)
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { detail?: string } }
      }
      setError(
        `Failed to load appointments (${e.response?.status ?? 'network error'})`,
      )
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg, weekStart, staffFilter])

  useEffect(() => {
    if (!orgLoading && currentOrg) {
      void load()
    } else if (!orgLoading) {
      setIsLoading(false)
    }
  }, [orgLoading, currentOrg, load])

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {}
    for (const a of appointments) {
      const key = a.start_time.split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.start_time.localeCompare(b.start_time))
    }
    return map
  }, [appointments])

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const cancelAppointment = async (a: Appointment) => {
    if (!currentOrg) return
    if (!confirm(`Cancel ${a.customer?.name}'s appointment?`)) return
    try {
      await appointmentApi.cancel(
        currentOrg.id,
        a.id,
        'Cancelled from dashboard',
      )
      await load()
    } catch {
      setError('Failed to cancel appointment')
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Appointments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {appointments.length} appointment
            {appointments.length === 1 ? '' : 's'} this week
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All staff</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
              </option>
            ))}
          </select>
          <Button
            variant="primary"
            size="md"
            className="whitespace-nowrap"
            onClick={() => setBookingOpen(true)}
          >
            <PlusIcon className="w-4 h-4" />
            New booking
          </Button>
        </div>
      </div>

      {/* Week navigation */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDateLong(days[0])} — {formatDateLong(days[6])}
            </p>
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <button
          onClick={() => setWeekStart(startOfWeek(new Date()))}
          className="text-xs font-medium text-[#0a1628] dark:text-blue-400 hover:underline"
        >
          Today
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader className="w-5 h-5" /> Loading appointments...
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
            <CalendarDaysIcon className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            No appointments this week
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click <strong>New booking</strong> to create your first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const key = formatDate(day)
            const dayAppts = byDay[key] || []
            const isToday = formatDate(new Date()) === key

            return (
              <div
                key={key}
                className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden ${
                  isToday
                    ? 'border-[#0a1628] dark:border-blue-500 ring-1 ring-[#0a1628]/10 dark:ring-blue-500/20'
                    : 'border-gray-200 dark:border-gray-800'
                }`}
              >
                <div
                  className={`px-3 py-2 border-b ${
                    isToday
                      ? 'bg-[#0a1628] dark:bg-blue-600 text-white'
                      : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">
                    {day.toLocaleDateString([], { weekday: 'short' })}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isToday ? '' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {day.getDate()}
                  </p>
                </div>

                <div className="p-2 space-y-2 min-h-[120px]">
                  {dayAppts.length === 0 ? (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-4">
                      —
                    </p>
                  ) : (
                    dayAppts.map((a) => (
                      <div
                        key={a.id}
                        className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            {formatTime(a.start_time)}
                          </span>
                          <Badge variant={STATUS_VARIANTS[a.status] || 'neutral'}>
                            <span className="text-[9px]">
                              {a.status.slice(0, 3)}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {a.customer?.name || 'Unknown'}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {a.service_name}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                          {a.staff_name}
                        </p>
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              void cancelAppointment(a)
                            }}
                            className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {currentOrg && (
        <BookingModal
          open={bookingOpen}
          onClose={() => setBookingOpen(false)}
          orgId={currentOrg.id}
          onCreated={() => void load()}
        />
      )}
    </div>
  )
}
