'use client'

import { Badge } from '@/app/components/ui/Badge'
import type { Appointment } from '@/app/lib/auth/auth.service'
import { formatTimeHHMM } from '@/app/lib/calendar/time'

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  SCHEDULED:   { bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-300 dark:border-amber-800',   text: 'text-amber-900 dark:text-amber-100', dot: 'bg-amber-500' },
  CONFIRMED:   { bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-100', dot: 'bg-emerald-500' },
  CHECKED_IN:  { bg: 'bg-blue-50 dark:bg-blue-950/40',     border: 'border-blue-300 dark:border-blue-800',     text: 'text-blue-900 dark:text-blue-100', dot: 'bg-blue-500' },
  IN_PROGRESS: { bg: 'bg-blue-50 dark:bg-blue-950/40',     border: 'border-blue-300 dark:border-blue-800',     text: 'text-blue-900 dark:text-blue-100', dot: 'bg-blue-500' },
  COMPLETED:   { bg: 'bg-gray-50 dark:bg-gray-900/60',     border: 'border-gray-300 dark:border-gray-700',     text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
  CANCELLED:   { bg: 'bg-rose-50 dark:bg-rose-950/40',     border: 'border-rose-300 dark:border-rose-800',     text: 'text-rose-900 dark:text-rose-100', dot: 'bg-rose-500' },
  NO_SHOW:     { bg: 'bg-rose-50 dark:bg-rose-950/40',     border: 'border-rose-300 dark:border-rose-800',     text: 'text-rose-900 dark:text-rose-100', dot: 'bg-rose-500' },
  RESCHEDULED: { bg: 'bg-gray-50 dark:bg-gray-900/60',     border: 'border-gray-300 dark:border-gray-700',     text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
}

interface Props {
  appointment: Appointment
  onClick?: (a: Appointment) => void
  compact?: boolean
}

export function AppointmentBlock({ appointment, onClick, compact = false }: Props) {
  const colors = STATUS_COLORS[appointment.status] || STATUS_COLORS.SCHEDULED
  const isFaded = appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW'

  return (
    <button
      onClick={() => onClick?.(appointment)}
      className={`w-full text-left rounded-lg border transition-all hover:shadow-md ${colors.bg} ${colors.border} ${isFaded ? 'opacity-60' : ''}`}
    >
      <div className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-2.5 py-1.5'}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
        <span className={`text-[10px] font-medium ${colors.text} tabular-nums flex-shrink-0`}>
          {formatTimeHHMM(appointment.start_time)}
        </span>
        <span className={`text-xs font-semibold truncate ${colors.text}`}>
          {appointment.customer?.name || 'Unknown'}
        </span>
      </div>
      {!compact && (
        <div className="px-2.5 pb-1.5 -mt-0.5">
          <p className={`text-[10px] truncate ${colors.text} opacity-80`}>
            {appointment.service_name} · {appointment.duration_minutes}m
          </p>
        </div>
      )}
    </button>
  )
}
