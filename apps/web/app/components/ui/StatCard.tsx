import { ComponentType, SVGProps } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  icon: ComponentType<SVGProps<SVGSVGElement>>
  trend?: {
    value: string
    direction: 'up' | 'down'
  }
  accent?: 'blue' | 'emerald' | 'indigo' | 'amber'
}

const accentClasses = {
  blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = 'blue',
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
      {trend && (
        <p
          className={`text-xs font-medium mt-2 ${
            trend.direction === 'up'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
          <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">
            vs. yesterday
          </span>
        </p>
      )}
    </div>
  )
}
