'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import {
  scheduleApi,
  staffApi,
  timeOffApi,
  type Staff,
  type TimeOff,
} from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

interface RuleDraft {
  day_of_week: number
  is_active: boolean
  start_time: string
  end_time: string
  break_start: string
  break_end: string
}

function defaultRules(): RuleDraft[] {
  return DAY_NAMES.map((_, i) => ({
    day_of_week: i,
    is_active: i < 5,
    start_time: i < 5 ? '09:00' : i === 5 ? '10:00' : '',
    end_time: i < 5 ? '17:00' : i === 5 ? '15:00' : '',
    break_start: i < 5 ? '13:00' : '',
    break_end: i < 5 ? '14:00' : '',
  }))
}

export default function ScheduleEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [rules, setRules] = useState<RuleDraft[]>(defaultRules())
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [showTimeOffForm, setShowTimeOffForm] = useState(false)
  const [toForm, setToForm] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentOrg || !params.id) return
    setIsLoading(true)
    try {
      const [allStaff, existing, toList] = await Promise.all([
        staffApi.list(currentOrg.id),
        scheduleApi.get(currentOrg.id, params.id),
        timeOffApi.list(currentOrg.id, params.id),
      ])
      const found = allStaff.find((s) => s.id === params.id) || null
      setStaff(found)
      setTimeOff(toList)

      if (existing && existing.rules.length > 0) {
        const mapped: RuleDraft[] = DAY_NAMES.map((_, i) => {
          const r = existing.rules.find((x) => x.day_of_week === i)
          return {
            day_of_week: i,
            is_active: r?.is_active ?? false,
            start_time: r?.start_time ?? '',
            end_time: r?.end_time ?? '',
            break_start: r?.break_start ?? '',
            break_end: r?.break_end ?? '',
          }
        })
        setRules(mapped)
      }
    } catch {
      setError('Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg, params.id])

  useEffect(() => {
    if (!orgLoading && currentOrg && params.id) {
      void load()
    }
  }, [orgLoading, currentOrg, params.id, load])

  const updateRule = (day: number, patch: Partial<RuleDraft>) => {
    setRules((prev) =>
      prev.map((r) => (r.day_of_week === day ? { ...r, ...patch } : r)),
    )
  }

  const toggleDay = (day: number) => {
    setRules((prev) =>
      prev.map((r) =>
        r.day_of_week === day
          ? {
              ...r,
              is_active: !r.is_active,
              start_time:
                !r.is_active && !r.start_time ? '09:00' : r.start_time,
              end_time: !r.is_active && !r.end_time ? '17:00' : r.end_time,
            }
          : r,
      ),
    )
  }

  const save = async () => {
    if (!currentOrg || !params.id) return
    setIsSaving(true)
    setError(null)
    try {
      const payload = rules.map((r) => ({
        day_of_week: r.day_of_week,
        is_active: r.is_active,
        start_time: r.is_active ? r.start_time : null,
        end_time: r.is_active ? r.end_time : null,
        break_start: r.is_active && r.break_start ? r.break_start : null,
        break_end: r.is_active && r.break_end ? r.break_end : null,
      }))
      await scheduleApi.update(currentOrg.id, params.id, payload)
      router.push('/app/staff')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } } }
      const detail = e.response?.data?.detail
      setError(
        typeof detail === 'string'
          ? detail
          : 'Failed to save schedule. Check your times.',
      )
    } finally {
      setIsSaving(false)
    }
  }


  const createTimeOff = async () => {
    if (!currentOrg || !params.id) return
    if (!toForm.start_date || !toForm.end_date) return
    setError(null)
    try {
      await timeOffApi.create(currentOrg.id, params.id, {
        start_date: toForm.start_date,
        end_date: toForm.end_date,
        start_time: toForm.start_time || undefined,
        end_time: toForm.end_time || undefined,
        reason: toForm.reason || undefined,
      })
      setToForm({ start_date: '', end_date: '', start_time: '', end_time: '', reason: '' })
      setShowTimeOffForm(false)
      const toList = await timeOffApi.list(currentOrg.id, params.id)
      setTimeOff(toList)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: unknown } } }
      const detail = e.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Failed to add time off')
    }
  }

  const deleteTimeOff = async (id: string) => {
    if (!currentOrg || !params.id) return
    if (!confirm('Delete this time off?')) return
    try {
      await timeOffApi.remove(currentOrg.id, params.id, id)
      const toList = await timeOffApi.list(currentOrg.id, params.id)
      setTimeOff(toList)
    } catch {
      setError('Failed to delete time off')
    }
  }


  if (orgLoading || isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-gray-500 dark:text-gray-400">
        <Loader className="w-5 h-5" /> Loading schedule...
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="p-8">
        <p className="text-gray-500 dark:text-gray-400">Staff member not found.</p>
        <Link
          href="/app/staff"
          className="mt-4 inline-flex items-center text-[#0a1628] dark:text-blue-400"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" /> Back to staff
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Link
        href="/app/staff"
        className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Staff
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Weekly Schedule
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Working hours for{' '}
        <span className="font-medium text-gray-900 dark:text-white">
          {staff.first_name} {staff.last_name}
        </span>
      </p>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
        {rules.map((rule) => (
          <div
            key={rule.day_of_week}
            className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          >
            <label className="flex items-center gap-3 flex-shrink-0 w-full sm:w-32">
              <input
                type="checkbox"
                checked={rule.is_active}
                onChange={() => toggleDay(rule.day_of_week)}
                className="w-4 h-4 rounded border-2 border-gray-300 text-[#0a1628] focus:ring-[#0a1628]"
              />
              <span
                className={`text-sm font-medium ${
                  rule.is_active
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {DAY_NAMES[rule.day_of_week]}
              </span>
            </label>

            {rule.is_active ? (
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="time"
                  value={rule.start_time}
                  onChange={(e) =>
                    updateRule(rule.day_of_week, { start_time: e.target.value })
                  }
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={rule.end_time}
                  onChange={(e) =>
                    updateRule(rule.day_of_week, { end_time: e.target.value })
                  }
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={rule.break_start}
                  placeholder="Break start"
                  onChange={(e) =>
                    updateRule(rule.day_of_week, { break_start: e.target.value })
                  }
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500"
                />
                <input
                  type="time"
                  value={rule.break_end}
                  placeholder="Break end"
                  onChange={(e) =>
                    updateRule(rule.day_of_week, { break_end: e.target.value })
                  }
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                Closed
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        Columns: Start · End · Break Start · Break End (leave break blank for no break)
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={save}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? <Loader className="w-4 h-4" /> : null}
          Save schedule
        </button>
        <Link
          href="/app/staff"
          className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          Cancel
        </Link>
      </div>

      {/* Time Off Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Time off
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Block specific dates (vacation, sick days, appointments)
            </p>
          </div>
          <button
            onClick={() => setShowTimeOffForm(!showTimeOffForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            {showTimeOffForm ? 'Cancel' : '+ Add time off'}
          </button>
        </div>

        {showTimeOffForm && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  From date
                </label>
                <input
                  type="date"
                  value={toForm.start_date}
                  onChange={(e) => setToForm({ ...toForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  To date
                </label>
                <input
                  type="date"
                  value={toForm.end_date}
                  onChange={(e) => setToForm({ ...toForm, end_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Leave times blank for a full-day block. Or specify times for a partial-day block.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Start time (optional)
                </label>
                <input
                  type="time"
                  value={toForm.start_time}
                  onChange={(e) => setToForm({ ...toForm, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  End time (optional)
                </label>
                <input
                  type="time"
                  value={toForm.end_time}
                  onChange={(e) => setToForm({ ...toForm, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Reason (optional)
              </label>
              <input
                type="text"
                value={toForm.reason}
                onChange={(e) => setToForm({ ...toForm, reason: e.target.value })}
                placeholder="Vacation"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <button
              onClick={createTimeOff}
              className="mt-4 inline-flex items-center px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium"
            >
              Add time off
            </button>
          </div>
        )}

        {timeOff.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No time off scheduled.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
            {timeOff.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t.start_date}
                    {t.start_date !== t.end_date && ` → ${t.end_date}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t.start_time && t.end_time
                      ? `${t.start_time} – ${t.end_time}`
                      : 'All day'}
                    {t.reason && ` · ${t.reason}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteTimeOff(t.id)}
                  className="text-rose-600 dark:text-rose-400 hover:text-rose-700 text-sm font-medium flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
