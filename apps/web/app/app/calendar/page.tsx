'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

import { BookingModal } from '@/app/components/booking/BookingModal'
import { AppointmentBlock } from '@/app/components/calendar/AppointmentBlock'
import { AppointmentDetailDrawer } from '@/app/components/calendar/AppointmentDetailDrawer'
import { Loader } from '@/app/components/Loader'
import { Button } from '@/app/components/ui/Button'
import {
  appointmentApi,
  staffApi,
  type Appointment,
  type Staff,
} from '@/app/lib/auth/auth.service'
import {
  addDays,
  addMonths,
  endOfDay,
  formatIsoDate,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from '@/app/lib/calendar/time'
import { useOrganization } from '@/app/providers/organization-provider'

type ViewMode = 'day' | 'week' | 'month'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 56

function isSameDayLocal(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function CalendarPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [view, setView] = useState<ViewMode>('week')
  const [anchor, setAnchor] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffFilter, setStaffFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [bookingOpen, setBookingOpen] = useState(false)

  const range = useMemo(() => {
    if (view === 'day') {
      return {
        fromDate: startOfDay(anchor),
        toDate: endOfDay(anchor),
        title: anchor.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      }
    }
    if (view === 'week') {
      const start = startOfWeek(anchor)
      const end = endOfDay(addDays(start, 6))
      return {
        fromDate: start,
        toDate: end,
        title: `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
      }
    }
    const start = startOfMonth(anchor)
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59)
    return {
      fromDate: start,
      toDate: end,
      title: anchor.toLocaleDateString([], { month: 'long', year: 'numeric' }),
    }
  }, [view, anchor])

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    setError(null)
    try {
      const [appts, staffList] = await Promise.all([
        appointmentApi.list(currentOrg.id, {
          from_date: range.fromDate.toISOString(),
          to_date: range.toDate.toISOString(),
          staff_id: staffFilter || undefined,
        }),
        staffApi.list(currentOrg.id),
      ])
      setAppointments(appts)
      setStaff(staffList)
    } catch {
      setError('Failed to load appointments')
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg, range.fromDate, range.toDate, staffFilter])

  useEffect(() => {
    if (!orgLoading && currentOrg) void load()
    else if (!orgLoading) setIsLoading(false)
  }, [orgLoading, currentOrg, load])

  const navigate = (dir: -1 | 1) => {
    if (view === 'day') setAnchor(addDays(anchor, dir))
    else if (view === 'week') setAnchor(addDays(anchor, dir * 7))
    else setAnchor(addMonths(anchor, dir))
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
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white truncate">
            {range.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
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

          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex">
            {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  view === v
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <Button variant="primary" size="md" onClick={() => setBookingOpen(true)}>
            <PlusIcon className="w-4 h-4" />
            New
          </Button>
        </div>
      </div>

      {error && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader className="w-5 h-5" /> Loading calendar...
          </div>
        ) : view === 'day' ? (
          <DayView date={anchor} appointments={appointments} onSelect={setSelected} />
        ) : view === 'week' ? (
          <WeekView
            startDate={startOfWeek(anchor)}
            appointments={appointments}
            onSelect={setSelected}
          />
        ) : (
          <MonthView
            month={anchor}
            appointments={appointments}
            onSelect={setSelected}
          />
        )}
      </div>

      {currentOrg && (
        <>
          <BookingModal
            open={bookingOpen}
            onClose={() => setBookingOpen(false)}
            orgId={currentOrg.id}
            onCreated={() => void load()}
          />
          <AppointmentDetailDrawer
            appointment={selected}
            orgId={currentOrg.id}
            onClose={() => setSelected(null)}
            onUpdated={() => void load()}
          />
        </>
      )}
    </div>
  )
}

function DayView({
  date,
  appointments,
  onSelect,
}: {
  date: Date
  appointments: Appointment[]
  onSelect: (a: Appointment) => void
}) {
  const dayAppts = appointments.filter((a) =>
    isSameDayLocal(new Date(a.start_time), date),
  )

  return (
    <div className="h-full overflow-auto">
      <div className="relative" style={{ minHeight: `${HOUR_HEIGHT * 24}px` }}>
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-800"
            style={{ top: `${h * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
          >
            <span className="absolute -top-2 left-2 sm:left-4 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-950 px-1">
              {String(h).padStart(2, '0')}:00
            </span>
          </div>
        ))}

        <div className="absolute left-16 sm:left-20 right-4 top-0 bottom-0">
          {dayAppts.map((a) => {
            const start = new Date(a.start_time)
            const top = (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT
            const height = Math.max((a.duration_minutes / 60) * HOUR_HEIGHT, 24)
            return (
              <div
                key={a.id}
                className="absolute left-0 right-0 pr-2"
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <AppointmentBlock appointment={a} onClick={onSelect} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WeekView({
  startDate,
  appointments,
  onSelect,
}: {
  startDate: Date
  appointments: Appointment[]
  onSelect: (a: Appointment) => void
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="flex">
          <div className="w-16 sm:w-20 flex-shrink-0" />
          {days.map((d) => {
            const today = isToday(d)
            return (
              <div
                key={formatIsoDate(d)}
                className={`flex-1 min-w-0 px-2 py-2 text-center border-l border-gray-100 dark:border-gray-800 ${
                  today ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {d.toLocaleDateString([], { weekday: 'short' })}
                </p>
                <p
                  className={`text-lg font-semibold ${
                    today
                      ? 'text-[#0a1628] dark:text-blue-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {d.getDate()}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="flex" style={{ minHeight: `${HOUR_HEIGHT * 24}px` }}>
          <div className="w-16 sm:w-20 flex-shrink-0 relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-t border-gray-100 dark:border-gray-800"
                style={{ height: `${HOUR_HEIGHT}px` }}
              >
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 pl-2 block -mt-2">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {days.map((d) => {
            const dayAppts = appointments.filter((a) =>
              isSameDayLocal(new Date(a.start_time), d),
            )
            return (
              <div
                key={formatIsoDate(d)}
                className={`flex-1 min-w-0 relative border-l border-gray-100 dark:border-gray-800 ${
                  isToday(d) ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                }`}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-t border-gray-100 dark:border-gray-800"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {dayAppts.map((a) => {
                  const start = new Date(a.start_time)
                  const top = (start.getHours() + start.getMinutes() / 60) * HOUR_HEIGHT
                  const height = Math.max((a.duration_minutes / 60) * HOUR_HEIGHT, 22)
                  return (
                    <div
                      key={a.id}
                      className="absolute left-0.5 right-0.5"
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <AppointmentBlock
                        appointment={a}
                        onClick={onSelect}
                        compact={height < 32}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MonthView({
  month,
  appointments,
  onSelect,
}: {
  month: Date
  appointments: Appointment[]
  onSelect: (a: Appointment) => void
}) {
  const start = startOfWeek(startOfMonth(month))
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i))

  return (
    <div className="h-full overflow-auto p-3">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = d.getMonth() === month.getMonth()
          const today = isToday(d)
          const dayAppts = appointments.filter((a) =>
            isSameDayLocal(new Date(a.start_time), d),
          )

          return (
            <div
              key={formatIsoDate(d)}
              className={`rounded-lg border min-h-[100px] p-1.5 ${
                today
                  ? 'border-[#0a1628] dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/10'
                  : inMonth
                    ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                    : 'border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-950/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold ${
                    today
                      ? 'text-[#0a1628] dark:text-blue-400'
                      : inMonth
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {d.getDate()}
                </span>
                {dayAppts.length > 0 && (
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                    {dayAppts.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => onSelect(a)}
                    className="w-full text-left text-[10px] font-medium truncate px-1.5 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <span className="tabular-nums opacity-70">
                      {new Date(a.start_time).getHours()}:
                      {String(new Date(a.start_time).getMinutes()).padStart(2, '0')}
                    </span>{' '}
                    {a.customer?.name || 'Unknown'}
                  </button>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 px-1.5">
                    +{dayAppts.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
