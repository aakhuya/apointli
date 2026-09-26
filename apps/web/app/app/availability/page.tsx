'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  CalendarDaysIcon,
  ClockIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import { Card, CardHeader } from '@/app/components/ui/Card'
import {
  scheduleApi,
  staffApi,
  type Schedule,
  type Staff,
} from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface StaffWithSchedule {
  staff: Staff
  schedule: Schedule | null
  isLoading: boolean
}

export default function AvailabilityPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [items, setItems] = useState<StaffWithSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      const staff = await staffApi.list(currentOrg.id)
      const initial: StaffWithSchedule[] = staff.map((s) => ({
        staff: s,
        schedule: null,
        isLoading: true,
      }))
      setItems(initial)

      // Fetch each staff's schedule in parallel
      const schedules = await Promise.all(
        staff.map((s) => scheduleApi.get(currentOrg.id, s.id).catch(() => null)),
      )

      setItems(
        staff.map((s, i) => ({
          staff: s,
          schedule: schedules[i],
          isLoading: false,
        })),
      )
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg])

  useEffect(() => {
    if (!orgLoading && currentOrg) void load()
    else if (!orgLoading) setIsLoading(false)
  }, [orgLoading, currentOrg, load])

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
          Availability
        </h1>
        <p className="text-sm text-gray-500 dark:text-ink-400 mt-1">
          Working hours and schedules for your team
        </p>
      </div>

      {isLoading || orgLoading ? (
        <div className="flex items-center gap-3 text-gray-500 dark:text-ink-400">
          <Loader className="w-5 h-5" /> Loading availability...
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center">
          <ClockIcon className="w-12 h-12 text-gray-300 dark:text-ink-600 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 dark:text-ink-100">
            No staff yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-ink-400 mt-1 mb-4">
            Add staff members to configure their schedules.
          </p>
          <Link
            href="/app/staff"
            className="inline-flex items-center px-5 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Manage staff
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map(({ staff, schedule, isLoading: itemLoading }) => (
            <Card key={staff.id}>
              <div className="p-5 flex items-center gap-4 border-b border-gray-100 dark:border-ink-800">
                <div className="w-11 h-11 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {(staff.first_name?.[0] || '') + (staff.last_name?.[0] || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-ink-100 truncate">
                    {staff.first_name} {staff.last_name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-ink-400 truncate">
                    {staff.title || staff.email}
                  </p>
                </div>
                <Link
                  href={`/app/staff/${staff.id}/schedule`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0a1628] dark:text-blue-400 border border-[#0a1628]/20 dark:border-blue-500/30 rounded-lg hover:bg-[#0a1628]/5 dark:hover:bg-blue-500/10 transition-colors"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                  Edit
                </Link>
              </div>

              <div className="p-5">
                {itemLoading ? (
                  <div className="text-xs text-gray-400 dark:text-ink-500 flex items-center gap-2">
                    <Loader className="w-3.5 h-3.5" /> Loading schedule...
                  </div>
                ) : !schedule ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      No schedule set — this staff member can't be booked yet.
                    </p>
                    <Link
                      href={`/app/staff/${staff.id}/schedule`}
                      className="text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline"
                    >
                      Set schedule →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {DAY_LABELS.map((label, idx) => {
                      const rule = schedule.rules.find(
                        (r) => r.day_of_week === idx,
                      )
                      const isActive = rule?.is_active && rule.start_time
                      return (
                        <div key={label} className="text-center">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-ink-500 mb-1.5">
                            {label}
                          </p>
                          {isActive ? (
                            <div className="px-1 py-2 rounded-lg bg-[#0a1628]/5 dark:bg-blue-950/40 border border-[#0a1628]/10 dark:border-blue-900/40">
                              <p className="text-[10px] font-semibold text-[#0a1628] dark:text-blue-300 leading-tight">
                                {rule.start_time}
                              </p>
                              <p className="text-[9px] text-[#0a1628]/70 dark:text-blue-400/70 leading-tight">
                                {rule.end_time}
                              </p>
                            </div>
                          ) : (
                            <div className="px-1 py-2 rounded-lg bg-gray-50 dark:bg-ink-900 border border-gray-100 dark:border-ink-800">
                              <p className="text-[10px] text-gray-400 dark:text-ink-600">
                                Off
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info card */}
      <Card className="mt-6 p-5 bg-gray-50 dark:bg-ink-900">
        <div className="flex items-start gap-3">
          <CalendarDaysIcon className="w-5 h-5 text-gray-400 dark:text-ink-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-ink-400">
            <p className="font-medium text-gray-900 dark:text-ink-100 mb-1">
              How availability works
            </p>
            <p>
              Working hours, breaks, and time-off are configured per staff member.
              The availability engine computes bookable slots based on these rules
              — no manual slot entry needed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
