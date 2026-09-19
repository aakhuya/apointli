'use client'

import Link from 'next/link'
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EllipsisVerticalIcon,
  SparklesIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

import { Badge } from '@/app/components/ui/Badge'
import { Card, CardHeader } from '@/app/components/ui/Card'
import { StatCard } from '@/app/components/ui/StatCard'
import { useAuth } from '@/app/providers/auth-provider'
import { useOrganization } from '@/app/providers/organization-provider'

// Demo data — will be replaced with real API calls later
const appointments = [
  { time: '09:00', name: 'Brian Mwangi', service: 'Haircut (30 min)', staff: 'Mike', status: 'Confirmed' },
  { time: '10:30', name: 'Mary Wanjiku', service: 'Beard trim (15 min)', staff: 'Jane', status: 'Pending' },
  { time: '12:00', name: 'Kevin Otieno', service: 'Full grooming (60 min)', staff: 'Mike', status: 'Completed' },
  { time: '14:30', name: 'David Kimani', service: 'Haircut (30 min)', staff: 'Jane', status: 'Confirmed' },
  { time: '16:00', name: 'Samuel Njoroge', service: 'Beard trim (15 min)', staff: 'Mike', status: 'Confirmed' },
]

const popularServices = [
  { name: 'Haircut', bookings: 142, price: 500, color: '#2a44e8' },
  { name: 'Beard trim', bookings: 98, price: 250, color: '#10b981' },
  { name: 'Full grooming', bookings: 76, price: 1000, color: '#f59e0b' },
  { name: 'Hair coloring', bookings: 45, price: 1500, color: '#ec4899' },
]

const chartData = [
  { day: 'Sep 6', value: 6200 },
  { day: 'Sep 7', value: 5800 },
  { day: 'Sep 8', value: 7400 },
  { day: 'Sep 9', value: 9100 },
  { day: 'Sep 10', value: 8600 },
  { day: 'Sep 11', value: 9200 },
  { day: 'Sep 12', value: 14500 },
]

function getStatusVariant(status: string) {
  if (status === 'Confirmed') return 'success'
  if (status === 'Pending') return 'warning'
  if (status === 'Completed') return 'info'
  return 'neutral'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function AppHome() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()

  const firstName = user?.first_name || 'there'
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px]">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {greeting}, {firstName} <span className="inline-block">👋</span>
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Business hero card */}
      {currentOrg && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-[#0a1628] dark:bg-gray-900 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628] via-[#0a1628]/95 to-[#1a2a4a]/50" />
          <div className="relative p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-lg flex-shrink-0">
                {currentOrg.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white truncate">
                    {currentOrg.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold uppercase tracking-wide rounded-full border border-emerald-500/30">
                    ✓ Verified
                  </span>
                </div>
                <p className="text-sm text-blue-100/70 mt-0.5">
                  {currentOrg.description ||
                    `Business · ${currentOrg.timezone.replace('_', ' ')}`}
                </p>
              </div>
            </div>
            <Link
              href="/b/preview"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-sm font-medium rounded-lg transition-colors self-start sm:self-auto"
            >
              View Business
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          label="Today's Appointments"
          value="18"
          icon={CalendarDaysIcon}
          trend={{ value: '12%', direction: 'up' }}
          accent="blue"
        />
        <StatCard
          label="Upcoming Appointments"
          value="42"
          icon={ClockIcon}
          trend={{ value: '8%', direction: 'up' }}
          accent="indigo"
        />
        <StatCard
          label="Today's Revenue"
          value="KSh 12,500"
          icon={CurrencyDollarIcon}
          trend={{ value: '15%', direction: 'up' }}
          accent="emerald"
        />
        <StatCard
          label="New Customers"
          value="7"
          icon={UserPlusIcon}
          trend={{ value: '40%', direction: 'up' }}
          accent="amber"
        />
      </div>

      {/* Appointments + Calendar */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Today's appointments */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader
            title="Today's Appointments"
            action={
              <Link
                href="/app/appointments"
                className="text-xs font-medium text-[#0a1628] dark:text-blue-400 hover:underline"
              >
                View all →
              </Link>
            }
          />
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {appointments.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-12 flex-shrink-0">
                  {a.time}
                </span>
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-semibold text-gray-600 dark:text-gray-300 flex-shrink-0">
                  {getInitials(a.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {a.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {a.service}
                  </p>
                </div>
                <span className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400">
                  {a.staff}
                </span>
                <Badge variant={getStatusVariant(a.status) as never}>
                  {a.status}
                </Badge>
                <button className="hidden sm:flex w-6 h-6 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
                  <EllipsisVerticalIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Mini calendar */}
        <Card>
          <CardHeader
            title="September 2025"
            action={
              <div className="flex gap-1">
                <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  ‹
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                  ›
                </button>
              </div>
            }
          />
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-medium uppercase text-gray-400 dark:text-gray-500"
                >
                  {d.slice(0, 3)}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((d) => (
                <button
                  key={d}
                  className="aspect-square text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {d}
                </button>
              ))}
              {[12].map((d) => (
                <button
                  key={d}
                  className="aspect-square text-xs font-semibold text-white bg-[#0a1628] dark:bg-blue-600 rounded-md shadow-sm"
                >
                  {d}
                </button>
              ))}
              {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((d) => (
                <button
                  key={d}
                  className="aspect-square text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Bookings
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0a1628] dark:bg-blue-600" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Today
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  Selected
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance + Popular Services */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Business Performance"
            action={
              <select className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 focus:outline-none">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
            }
          />
          <div className="p-5 pt-2">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a1628',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#93c5fd', fontSize: '11px' }}
                    formatter={(value) => [`KSh ${Number(value).toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2a44e8"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: '#2a44e8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-2">
              {chartData.map((d) => (
                <span key={d.day}>{d.day.split(' ')[1]}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Popular Services"
            action={
              <Link
                href="/app/services"
                className="text-xs font-medium text-[#0a1628] dark:text-blue-400 hover:underline"
              >
                View all →
              </Link>
            }
          />
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {popularServices.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${s.color}20` }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {s.bookings} bookings
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  KSh {s.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CTA bottom */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0a1628] dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Manage your business, anytime, anywhere
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Get more bookings, streamline your operations, and grow with Apointli.
            </p>
          </div>
        </div>
        <Link
          href="/app/calendar"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0a1628] dark:bg-blue-600 hover:bg-[#1a2a4a] dark:hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
        >
          View Calendar
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
