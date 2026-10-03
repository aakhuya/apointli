'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRightIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { Loader } from '@/app/components/Loader'
import { Badge } from '@/app/components/ui/Badge'
import { Card, CardHeader } from '@/app/components/ui/Card'
import { StatCard } from '@/app/components/ui/StatCard'
import {
  analyticsApi,
  appointmentApi,
  type AnalyticsResponse,
  type Appointment,
} from '@/app/lib/auth/auth.service'
import { useAuth } from '@/app/providers/auth-provider'
import { useOrganization } from '@/app/providers/organization-provider'

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(0)}`
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function getStatusVariant(status: string) {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'SCHEDULED') return 'warning'
  if (status === 'COMPLETED') return 'info'
  if (status === 'CANCELLED' || status === 'NO_SHOW') return 'danger'
  return 'neutral'
}

export default function AppHome() {
  const { user } = useAuth()
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      const today = new Date()
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      )
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)

      const [analyticsRes, appts] = await Promise.all([
        analyticsApi.get(currentOrg.id, {
          start_date: new Date(
            today.getFullYear(),
            today.getMonth(),
            1,
          )
            .toISOString()
            .split('T')[0],
          end_date: today.toISOString().split('T')[0],
        }),
        appointmentApi.list(currentOrg.id, {
          from_date: startOfDay.toISOString(),
          to_date: endOfDay.toISOString(),
        }),
      ])

      setAnalytics(analyticsRes)
      setTodayAppts(appts)
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg])

  useEffect(() => {
    if (!orgLoading && currentOrg) void load()
    else if (!orgLoading) setIsLoading(false)
  }, [orgLoading, currentOrg, load])

  const firstName = user?.first_name || 'there'
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const currency = analytics?.overview.currency || currentOrg?.currency || 'USD'

  const trendData = useMemo(
    () =>
      (analytics?.daily_trend || []).slice(-14).map((d) => ({
        label: new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        revenue: d.revenue,
      })),
    [analytics],
  )

  if (!orgLoading && !currentOrg) {
    return (
      <div className="p-6 sm:p-8 max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ink-100">
          Welcome, {firstName}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-ink-400">
          Create a workspace to get started.
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
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-ink-100">
          {greeting}, {firstName} <span className="inline-block">👋</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-ink-400 mt-1">
          Here's what's happening at {currentOrg?.name} this month.
        </p>
      </div>

      {/* Stats — real data */}
      {isLoading ? (
        <div className="flex items-center gap-3 text-gray-500 dark:text-ink-400 mb-6">
          <Loader className="w-5 h-5" /> Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <StatCard
            label="Revenue this month"
            value={formatMoney(analytics?.overview.revenue || 0, currency)}
            icon={BanknotesIcon}
            accent="emerald"
          />
          <StatCard
            label="Bookings this month"
            value={analytics?.overview.total_appointments || 0}
            icon={CalendarDaysIcon}
            accent="blue"
          />
          <StatCard
            label="Today's appointments"
            value={todayAppts.length}
            icon={ClockIcon}
            accent="indigo"
          />
          <StatCard
            label="Completion rate"
            value={`${analytics?.overview.completion_rate || 0}%`}
            icon={CheckCircleIcon}
            accent="amber"
          />
        </div>
      )}

      {/* Today's appointments + Revenue trend */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader
            title="Today's appointments"
            action={
              <Link
                href="/app/appointments"
                className="text-xs font-medium text-[#0a1628] dark:text-blue-400 hover:underline"
              >
                View all →
              </Link>
            }
          />
          {todayAppts.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500 dark:text-ink-400">
              No appointments today.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-ink-800">
              {todayAppts.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-ink-800/40"
                >
                  <span className="text-xs font-medium text-gray-500 dark:text-ink-400 w-14 flex-shrink-0">
                    {formatTime(a.start_time)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-ink-800 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-ink-300 flex-shrink-0">
                    {(a.customer?.name || '?')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-ink-100 truncate">
                      {a.customer?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-ink-400 truncate">
                      {a.service_name} · {a.staff_name}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(a.status) as never}>
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Revenue trend" />
          <div className="p-5 pt-2">
            {trendData.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-ink-400 py-6 text-center">
                No revenue data yet.
              </p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a1628',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#93c5fd', fontSize: '11px' }}
                      formatter={(value) => [
                        formatMoney(Number(value), currency),
                        'Revenue',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0a1628"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, fill: '#0a1628' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-ink-500 mt-2 text-center">
              Last 14 days
            </p>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-ink-100 mb-3">
          Quick actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Add a service', href: '/app/services' },
            { label: 'Manage staff', href: '/app/staff' },
            { label: 'Add a location', href: '/app/locations' },
            { label: 'View calendar', href: '/app/calendar' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-xl p-4 hover:border-[#0a1628]/30 dark:hover:border-blue-500/40 hover:shadow-sm transition-all text-sm font-medium text-gray-700 dark:text-ink-200 flex items-center justify-between"
            >
              {a.label}
              <ArrowRightIcon className="w-4 h-4 text-gray-300 dark:text-ink-600 group-hover:text-[#0a1628] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-ink-100">
            Manage your business, anytime, anywhere
          </h3>
          <p className="text-sm text-gray-600 dark:text-ink-400 mt-0.5">
            View your schedule, bookings, and analytics in one place.
          </p>
        </div>
        <Link
          href="/app/calendar"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 hover:bg-[#1a2a4a] dark:hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
        >
          View calendar
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
