'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'
import {
  publicService,
  type PublicBusiness,
  type PublicService,
  type PublicSlot,
  type PublicStaff,
} from '@/app/lib/public/public.service'

type Step = 1 | 2 | 3 | 4

interface Selected {
  service: PublicService | null
  staff: PublicStaff | null
  slot: PublicSlot | null
  customerName: string
  customerEmail: string
  customerPhone: string
  notes: string
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDateLong(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatPrice(price: number | null, currency: string): string {
  if (price == null) return 'Free'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    return `${currency} ${price.toFixed(2)}`
  }
}

export default function PublicBookingPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const search = useSearchParams()

  const [business, setBusiness] = useState<PublicBusiness | null>(null)
  const [serviceStaff, setServiceStaff] = useState<PublicStaff[]>([])
  const [slots, setSlots] = useState<PublicSlot[]>([])
  const [timezone, setTimezone] = useState('UTC')

  const [step, setStep] = useState<Step>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [sel, setSel] = useState<Selected>({
    service: null,
    staff: null,
    slot: null,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
  })

  const [date, setDate] = useState(todayIso())

  // Load business
  useEffect(() => {
    if (!params.slug) return
    setIsLoading(true)
    publicService
      .getBusiness(params.slug)
      .then((data) => {
        setBusiness(data)
        // Pre-select from ?service= query
        const preService = search.get('service')
        if (preService) {
          const found = data.services.find((s) => s.id === preService)
          if (found) {
            setSel((prev) => ({ ...prev, service: found }))
            setStep(2)
          }
        }
      })
      .catch((err: unknown) => {
        const e = err as { response?: { status?: number } }
        if (e.response?.status === 404) setNotFound(true)
      })
      .finally(() => setIsLoading(false))
  }, [params.slug, search])

  // Load staff for the selected service
  const loadStaff = useCallback(async () => {
    if (!params.slug || !sel.service) return
    try {
      const staff = await publicService.getStaffForService(
        params.slug,
        sel.service.id,
      )
      setServiceStaff(staff)
      // If only one staff member, auto-select
      if (staff.length === 1) {
        setSel((prev) => ({ ...prev, staff: staff[0] }))
      }
    } catch {
      setError('Failed to load staff')
    }
  }, [params.slug, sel.service])

  useEffect(() => {
    if (step === 2 && sel.service) {
      void loadStaff()
    }
  }, [step, sel.service, loadStaff])

  // Load availability
  const loadSlots = useCallback(async () => {
    if (!params.slug || !sel.service || !sel.staff) return
    setIsLoadingSlots(true)
    setError(null)
    setSlots([])
    try {
      const res = await publicService.getAvailability(params.slug, {
        staff_id: sel.staff.id,
        service_id: sel.service.id,
        date,
      })
      setSlots(res.slots)
      setTimezone(res.timezone)
    } catch {
      setError('Failed to load available times')
    } finally {
      setIsLoadingSlots(false)
    }
  }, [params.slug, sel.service, sel.staff, date])

  useEffect(() => {
    if (step === 3 && sel.service && sel.staff) {
      void loadSlots()
    }
  }, [step, loadSlots])

  const canProceed = useMemo(() => {
    if (step === 1) return !!sel.service
    if (step === 2) return !!sel.staff
    if (step === 3) return !!sel.slot
    if (step === 4)
      return (
        sel.customerName.trim().length > 0 &&
        (sel.customerEmail.trim().length > 0 || sel.customerPhone.trim().length > 0)
      )
    return false
  }, [step, sel])

  const submit = async () => {
    if (!params.slug || !sel.service || !sel.staff || !sel.slot) return
    setIsSubmitting(true)
    setError(null)
    try {
      const appt = await publicService.book(params.slug, {
        staff_id: sel.staff.id,
        service_id: sel.service.id,
        start_time: sel.slot.start,
        customer_name: sel.customerName.trim(),
        customer_email: sel.customerEmail.trim() || undefined,
        customer_phone: sel.customerPhone.trim() || undefined,
        notes: sel.notes.trim() || undefined,
      })
      sessionStorage.setItem(
        `booking:${appt.id}`,
        JSON.stringify({
          id: appt.id,
          business_name: appt.business_name,
          business_slug: appt.business_slug,
          staff_name: appt.staff_name,
          service_name: appt.service_name,
          customer_name: appt.customer_name,
          start_time: appt.start_time,
          end_time: appt.end_time,
          timezone: appt.timezone,
          price: appt.price,
          currency: appt.currency,
          location_name: appt.location_name,
          location_address: appt.location_address,
        }),
      )
      router.push(`/b/${params.slug}/confirmed/${appt.id}`)
    } catch (err: unknown) {
      const e = err as {
        response?: { status?: number; data?: { detail?: string } }
      }
      if (e.response?.status === 409) {
        setError(
          'That time was just booked. Please pick another slot.',
        )
        setStep(3)
        setSel((prev) => ({ ...prev, slot: null }))
        void loadSlots()
      } else {
        setError(
          e.response?.data?.detail ||
            'Booking failed. Please try again or call the business.',
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 text-[#0a1628]" />
      </div>
    )
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-6">
            <ApointliLogo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business not found</h1>
          <Link
            href="/"
            className="inline-flex items-center mt-6 text-sm font-medium text-[#0a1628] hover:underline"
          >
            ← Back to apointli
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href={`/b/${business.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{business.name}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <ApointliLogo size="sm" />
        </div>
      </header>

      {/* Progress */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((n) => {
              const isActive = step === n
              const isDone = step > n
              return (
                <div key={n} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                      isActive
                        ? 'bg-[#0a1628] text-white'
                        : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {isDone ? '✓' : n}
                  </div>
                  {n < 4 && (
                    <div
                      className={`flex-1 h-0.5 rounded ${
                        step > n ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600">
            {error}
          </div>
        )}

        {/* STEP 1 — Service */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              What would you like to book?
            </h1>
            <p className="text-gray-500 mb-6">
              Pick a service to get started
            </p>

            {business.services.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  This business isn't accepting online bookings yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {business.services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() =>
                      setSel((prev) => ({ ...prev, service: s, staff: null, slot: null }))
                    }
                    className={`w-full text-left bg-white rounded-2xl border-2 p-4 sm:p-5 transition-all ${
                      sel.service?.id === s.id
                        ? 'border-[#0a1628] shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: s.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {s.name}
                        </h3>
                        {s.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {s.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5" />
                            {s.duration_minutes} min
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(s.price, s.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Staff */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Who would you like?
            </h1>
            <p className="text-gray-500 mb-6">
              Choose your preferred staff member
            </p>

            {serviceStaff.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  No staff available for this service.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {serviceStaff.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSel((prev) => ({ ...prev, staff: st, slot: null }))}
                    className={`w-full text-left bg-white rounded-2xl border-2 p-4 sm:p-5 transition-all ${
                      sel.staff?.id === st.id
                        ? 'border-[#0a1628] shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#0a1628] text-white flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden">
                        {st.avatar_url ? (
                          <img
                            src={st.avatar_url}
                            alt={st.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          st.name
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{st.name}</h3>
                        {st.title && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {st.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3 — Date + Time */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              When works for you?
            </h1>
            <p className="text-gray-500 mb-6">
              Pick a date and choose a time slot
            </p>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                min={todayIso()}
                onChange={(e) => {
                  setDate(e.target.value)
                  setSel((prev) => ({ ...prev, slot: null }))
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] text-base"
              />
              <p className="mt-2 text-xs text-gray-500">
                {formatDateLong(date)} · {timezone}
              </p>
            </div>

            {isLoadingSlots ? (
              <div className="flex items-center gap-3 text-gray-500 py-8 justify-center">
                <Loader className="w-5 h-5" />
                Loading times...
              </div>
            ) : slots.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <CalendarDaysIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No available times on this day.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try another date.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                  {slots.length} times available
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.start}
                      onClick={() =>
                        setSel((prev) => ({ ...prev, slot: s }))
                      }
                      className={`py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        sel.slot?.start === s.start
                          ? 'border-[#0a1628] bg-[#0a1628] text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {s.local_start}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 — Details + Review */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Almost done
            </h1>
            <p className="text-gray-500 mb-6">
              Enter your details to confirm the booking
            </p>

            {/* Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 mb-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Booking summary
              </h3>
              <div className="flex items-start gap-3 pb-3 border-b border-gray-100">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                  style={{ backgroundColor: sel.service?.color || '#0a1628' }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {sel.service?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sel.service?.duration_minutes} min ·{' '}
                    {formatPrice(sel.service?.price || null, sel.service?.currency || 'USD')}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span>{sel.staff?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                  <span>
                    {sel.slot ? formatDateLong(date) : ''} at{' '}
                    {sel.slot?.local_start}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sel.customerName}
                  onChange={(e) =>
                    setSel((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={sel.customerEmail}
                  onChange={(e) =>
                    setSel((prev) => ({ ...prev, customerEmail: e.target.value }))
                  }
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={sel.customerPhone}
                  onChange={(e) =>
                    setSel((prev) => ({ ...prev, customerPhone: e.target.value }))
                  }
                  placeholder="+254 700 000 000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={sel.notes}
                  onChange={(e) =>
                    setSel((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Anything the business should know?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a1628] text-base resize-none"
                />
              </div>

              <p className="text-xs text-gray-500">
                Provide at least an email or phone so we can confirm your booking.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 z-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              Back
            </button>
          ) : (
            <Link
              href={`/b/${business.slug}`}
              className="px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </Link>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canProceed}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a1628] hover:bg-[#1a2a4a] text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!canProceed || isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a1628] hover:bg-[#1a2a4a] text-white rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4" />
                  Booking...
                </>
              ) : (
                <>
                  Confirm booking
                  <CheckCircleIcon className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
