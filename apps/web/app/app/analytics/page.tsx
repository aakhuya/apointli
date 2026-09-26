'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BanknotesIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Loader } from '@/app/components/Loader'
import { Card, CardHeader } from '@/app/components/ui/Card'
import { StatCard } from '@/app/components/ui/StatCard'
import {
  analyticsApi,
  type AnalyticsResponse,
} from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

type RangeKey = '7d' | '30d' | '90d' | 'month' | 'year'

function getRangeDates(range: RangeKey): {
  start_date: string
  end_date: string
} {
  const today = new Date()
  const end = today.toISOString().split('T')[0]
  let start: Date

  if (range === '7d') {
    start = new Date(today)
    start.setDate(start.getDate() - 6)
  } else if (range === '30d') {
    start = new Date(today)
    start.setDate(start.getDate() - 29)
  } else if (range === '90d') {
    start = new Date(today)
    start.setDate(start.getDate() - 89)
  } else if (range === 'month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1)
  } else {
    // year
    start = new Date(today.getFullYear(), 0, 1)
  }

  return {
    start_date: start.toISOString().split('T')[0],
    end_date: end,
  }
}

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

function formatDayLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function AnalyticsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [range, setRange] = useState<RangeKey>('30d')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!currentOrg) return
    setIsLoading(true)
    setError(null)
    try {
      const { start_date, end_date } = getRangeDates(range)
      const res = await analyticsApi.get(currentOrg.id, {
        start_date,
        end_date,
      })
      setData(res)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string } } }
      setError(
        e.response?.data?.detail ||
          `Failed to load analytics (${e.response?.status ?? 'network error'})`,
      )
    } finally {
      setIsLoading(false)
    }
  }, [currentOrg, range])

  useEffect(() => {
    if (!orgLoading && currentOrg) void load()
    else if (!orgLoading) setIsLoading(false)
  }, [orgLoading, currentOrg, load])

  const currency = data?.overview.currency || currentOrg?.currency || 'USD'

  const trendData = useMemo(
    () =>
      (data?.daily_trend || []).map((d) => ({
        date: d.date,
        label: formatDayLabel(d.date),
        revenue: d.revenue,
        bookings: d.bookings,
      })),
    [data],
  )

  const maxHourly = useMemo(
    () => Math.max(1, ...(data?.hourly || []).map((h) => h.count)),
    [data],
  )

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
            Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Performance overview for {currentOrg?.name}
          </p>
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 flex">
          {(
            [
              { key: '7d', label: '7 days' },
              { key: '30d', label: '30 days' },
              { key: '90d', label: '90 days' },
              { key: 'month', label: 'This month' },
              { key: 'year', label: 'This year' },
            ] as const
          ).map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                range === r.key
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {isLoading || !data ? (
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Loader className="w-5 h-5" /> Loading analytics...
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              label="Revenue"
              value={formatMoney(data.overview.revenue, currency)}
              icon={BanknotesIcon}
              accent="emerald"
            />
            <StatCard
              label="Bookings"
              value={data.overview.total_appointments}
              icon={CalendarDaysIcon}
              accent="blue"
            />
            <StatCard
              label="Completed"
              value={`${data.overview.completed} (${data.overview.completion_rate}%)`}
              icon={CheckCircleIcon}
              accent="indigo"
            />
            <StatCard
              label="Cancellations"
              value={`${data.overview.cancelled} (${data.overview.cancellation_rate}%)`}
              icon={XCircleIcon}
              accent="amber"
            />
          </div>

          {/* Trend charts */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader title="Revenue trend" />
              <div className="p-5 pt-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v: number) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                        }
                      />
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
              </div>
            </Card>

            <Card>
              <CardHeader title="Bookings trend" />
              <div className="p-5 pt-2">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a1628',
                          border: 'none',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '12px',
                        }}
                        labelStyle={{ color: '#93c5fd', fontSize: '11px' }}
                        formatter={(value) => [Number(value), 'Bookings']}
                      />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5, fill: '#2563eb' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* Services + Staff */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader title="Top services" />
              {data.services.length === 0 ? (
                <p className="p-5 text-sm text-gray-500 dark:text-gray-400">
                  No data for this period.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.services.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {s.bookings} bookings
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatMoney(s.revenue, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader title="Top staff" />
              {data.staff.length === 0 ? (
                <p className="p-5 text-sm text-gray-500 dark:text-gray-400">
                  No data for this period.
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.staff.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                        {s.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {s.bookings} bookings
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatMoney(s.revenue, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Hourly heatmap */}
          <Card className="mb-6">
            <CardHeader title="Peak booking hours" />
            <div className="p-5 pt-2">
              <div className="flex items-end gap-0.5 sm:gap-1 h-40">
                {data.hourly.map((h) => {
                  const intensity = h.count / maxHourly
                  const bgColor =
                    h.count === 0
                      ? 'bg-gray-100 dark:bg-gray-800'
                      : intensity > 0.75
                        ? 'bg-[#0a1628] dark:bg-blue-500'
                        : intensity > 0.5
                          ? 'bg-[#1e40af] dark:bg-blue-600'
                          : intensity > 0.25
                            ? 'bg-blue-400 dark:bg-blue-700'
                            : 'bg-blue-200 dark:bg-blue-900'
                  return (
                    <div
                      key={h.hour}
                      className="flex-1 group relative"
                      title={`${h.hour}:00 — ${h.count} bookings`}
                    >
                      <div
                        className={`w-full rounded-t transition-all ${bgColor} hover:opacity-80`}
                        style={{
                          height: `${Math.max((h.count / maxHourly) * 100, h.count > 0 ? 8 : 4)}%`,
                          minHeight: '4px',
                        }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {h.hour}:00 · {h.count}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                {[0, 4, 8, 12, 16, 20, 23].map((h) => (
                  <span key={h}>{h}:00</span>
                ))}
              </div>
            </div>
          </Card>

          {/* Extra insights */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Completion rate
                </p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.overview.completion_rate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.overview.completed} of {data.overview.total_appointments}
              </p>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-3 mb-2">
                <XCircleIcon className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Cancellation rate
                </p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.overview.cancellation_rate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.overview.cancelled} cancellations
              </p>
            </Card>

            <Card className="p-5 col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-2">
                <XCircleIcon className="w-4 h-4 text-gray-400" />
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  No-show rate
                </p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.overview.no_show_rate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.overview.no_show} no-shows
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
