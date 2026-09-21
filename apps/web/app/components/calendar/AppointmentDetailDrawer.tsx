'use client'

import { useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import { Badge } from '@/app/components/ui/Badge'
import {
  appointmentApi,
  type Appointment,
} from '@/app/lib/auth/auth.service'
import { formatTime12h } from '@/app/lib/calendar/time'
import { localeService } from '@/app/lib/locale/locale.service'

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  SCHEDULED: 'warning',
  CONFIRMED: 'success',
  CHECKED_IN: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
  RESCHEDULED: 'neutral',
}

interface Props {
  appointment: Appointment | null
  orgId: string | null
  onClose: () => void
  onUpdated: () => void
}

export function AppointmentDetailDrawer({ appointment, orgId, onClose, onUpdated }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!appointment || !orgId) return null

  const date = new Date(appointment.start_time)
  const dateStr = date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const cancel = async () => {
    if (!confirm('Cancel this appointment?')) return
    setBusy(true)
    setError(null)
    try {
      await appointmentApi.cancel(orgId, appointment.id, 'Cancelled from calendar')
      onUpdated()
      onClose()
    } catch {
      setError('Failed to cancel appointment')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[420px] bg-white dark:bg-gray-950 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Appointment
            </h2>
            <Badge variant={STATUS_VARIANTS[appointment.status] || 'neutral'}>
              {appointment.status}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Customer */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center font-semibold">
              {appointment.customer?.name
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {appointment.customer?.name || 'Unknown'}
              </p>
              {appointment.customer?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {appointment.customer.email}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow icon={CalendarIcon} label="Date" value={dateStr} />
            <DetailRow
              icon={ClockIcon}
              label="Time"
              value={`${formatTime12h(appointment.start_time)} — ${formatTime12h(appointment.end_time)}`}
            />
            <DetailRow icon={UserIcon} label="Service" value={appointment.service_name || '—'} />
            <DetailRow icon={UserIcon} label="Staff" value={appointment.staff_name} />
            {appointment.customer?.phone && (
              <DetailRow icon={PhoneIcon} label="Phone" value={appointment.customer.phone} />
            )}
            {appointment.location_id && (
              <DetailRow icon={MapPinIcon} label="Location" value="—" />
            )}
            <DetailRow
              icon={CurrencyDollarIcon}
              label="Price"
              value={
                appointment.price != null
                  ? localeService.formatMoney(appointment.price, appointment.currency)
                  : '—'
              }
            />
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Notes
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {appointment.status !== 'CANCELLED' &&
          appointment.status !== 'COMPLETED' &&
          appointment.status !== 'NO_SHOW' && (
            <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex gap-2">
              <button
                onClick={cancel}
                disabled={busy}
                className="flex-1 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-50"
              >
                {busy ? <Loader className="w-4 h-4 inline" /> : 'Cancel appointment'}
              </button>
            </div>
          )}
      </div>
    </>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  )
}
