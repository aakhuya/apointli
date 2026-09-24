'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'

interface ConfirmedData {
  id: string
  business_name: string
  business_slug: string
  staff_name: string
  service_name: string
  customer_name: string
  start_time: string
  end_time: string
  timezone: string
  price: number | null
  currency: string
  location_name: string | null
  location_address: string | null
}

export default function ConfirmationPage() {
  const params = useParams<{ slug: string; id: string }>()
  const [data, setData] = useState<ConfirmedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(`booking:${params.id}`)
    if (raw) {
      try {
        setData(JSON.parse(raw))
      } catch {
        setNotFound(true)
      }
    } else {
      setNotFound(true)
    }
    setIsLoading(false)
  }, [params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 text-[#0a1628]" />
      </div>
    )
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-900">
            Booking confirmation
          </h1>
          <p className="text-gray-500 mt-2">
            We couldn't find the booking details. Check your email or contact the
            business directly.
          </p>
          <Link
            href={`/b/${params.slug}`}
            className="inline-flex items-center mt-6 text-sm font-medium text-[#0a1628] hover:underline"
          >
            ← Back to {params.slug}
          </Link>
        </div>
      </div>
    )
  }

  const startDate = new Date(data.start_time)
  const dateStr = startDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const timeStr = startDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const priceStr =
    data.price != null
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: data.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(data.price)
      : null

  // Google Calendar link
  const gcalStart = new Date(data.start_time)
    .toISOString()
    .replace(/[-:]|\.\d{3}/g, '')
  const gcalEnd = new Date(data.end_time)
    .toISOString()
    .replace(/[-:]|\.\d{3}/g, '')
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `${data.service_name} at ${data.business_name}`,
  )}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent(
    `Staff: ${data.staff_name}\nCustomer: ${data.customer_name}`,
  )}${data.location_address ? `&location=${encodeURIComponent(data.location_address)}` : ''}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-center">
          <ApointliLogo size="sm" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Success badge */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            You're booked!
          </h1>
          <p className="text-gray-500 mt-2">
            A confirmation has been sent to{' '}
            <span className="font-medium text-gray-700">
              {data.customer_name}
            </span>
            .
          </p>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {data.business_name}
            </h2>
          </div>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <DetailRow icon={CalendarDaysIcon} label="When" value={`${dateStr} · ${timeStr}`} />
            <DetailRow icon={UserIcon} label="Service" value={data.service_name} />
            <DetailRow icon={UserIcon} label="With" value={data.staff_name} />
            {data.location_name && (
              <DetailRow
                icon={MapPinIcon}
                label="Where"
                value={`${data.location_name}${data.location_address ? ` · ${data.location_address}` : ''}`}
              />
            )}
            {priceStr && (
              <DetailRow
                icon={ClockIcon}
                label="Price"
                value={priceStr}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <a
            href={gcalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:border-gray-300 transition-colors"
          >
            <CalendarDaysIcon className="w-4 h-4" />
            Add to calendar
          </a>
          <Link
            href={`/b/${data.business_slug}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0a1628] hover:bg-[#1a2a4a] text-white rounded-xl text-sm font-medium transition-colors"
          >
            Back to {data.business_name}
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Need to make changes? Contact {data.business_name} directly.
        </p>
      </div>
    </div>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDaysIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
