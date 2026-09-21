'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import {
  appointmentApi,
  availabilityApi,
  serviceApi,
  staffApi,
  type Appointment,
  type Service,
  type Staff,
} from '@/app/lib/auth/auth.service'
import { localeService } from '@/app/lib/locale/locale.service'

interface Props {
  open: boolean
  onClose: () => void
  orgId: string
  onCreated?: (appointment: Appointment) => void
}

interface Slot {
  start: string
  end: string
  local_start: string
  local_end: string
}

interface FormState {
  serviceId: string
  staffId: string
  date: string
  slotStart: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes: string
}

const initialForm: FormState = {
  serviceId: '',
  staffId: '',
  date: '',
  slotStart: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  notes: '',
}

function todayIso(): string {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export function BookingModal({ open, onClose, orgId, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [form, setForm] = useState<FormState>({
    ...initialForm,
    date: todayIso(),
  })

  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [timezone, setTimezone] = useState('UTC')

  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load services + staff when modal opens
  useEffect(() => {
    if (!open) return
    setStep(1)
    setForm({ ...initialForm, date: todayIso() })
    setSlots([])
    setError(null)

    setIsLoadingServices(true)
    Promise.all([serviceApi.list(orgId), staffApi.list(orgId)])
      .then(([s, st]) => {
        setServices(s)
        setStaff(st)
      })
      .catch(() => setError('Failed to load services or staff'))
      .finally(() => setIsLoadingServices(false))
  }, [open, orgId])

  // Load slots when we have service + staff + date
  useEffect(() => {
    if (step !== 3) return
    if (!form.serviceId || !form.staffId || !form.date) return

    setIsLoadingSlots(true)
    setSlots([])
    setError(null)

    availabilityApi
      .list(orgId, {
        staff_id: form.staffId,
        service_id: form.serviceId,
        date: form.date,
      })
      .then((res) => {
        setSlots(res.slots)
        setTimezone(res.timezone)
      })
      .catch(() => setError('Failed to load available slots'))
      .finally(() => setIsLoadingSlots(false))
  }, [step, form.serviceId, form.staffId, form.date, orgId])

  const selectedService = services.find((s) => s.id === form.serviceId)
  const selectedStaff = staff.find((s) => s.id === form.staffId)

  const canProceedFrom1 = !!form.serviceId
  const canProceedFrom2 = !!form.staffId
  const canProceedFrom3 = !!form.slotStart
  const canSubmitFrom4 =
    form.customerName.trim().length > 0 || form.customerEmail.trim().length > 0

  const submit = async () => {
    if (!selectedService || !selectedStaff || !form.slotStart) return
    setIsSubmitting(true)
    setError(null)
    try {
      const appointment = await appointmentApi.create(orgId, {
        staff_id: form.staffId,
        service_id: form.serviceId,
        customer_name: form.customerName || undefined,
        customer_email: form.customerEmail || undefined,
        customer_phone: form.customerPhone || undefined,
        start_time: form.slotStart,
        notes: form.notes || undefined,
      })
      onCreated?.(appointment)
      onClose()
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { detail?: string } } }
      if (e.response?.status === 409) {
        setError('That slot was just booked. Please pick another.')
        setStep(3)
      } else {
        setError(
          e.response?.data?.detail ||
            `Booking failed (${e.response?.status ?? 'network error'})`,
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] bg-white dark:bg-gray-950 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              New booking
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Step {step} of 4
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800 flex-shrink-0">
          <div
            className="h-full bg-[#0a1628] dark:bg-blue-600 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Step 1 — Service */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Choose a service
              </h3>
              {isLoadingServices ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader className="w-4 h-4" /> Loading services...
                </div>
              ) : services.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You don't have any services yet. Add one first.
                </p>
              ) : (
                <div className="space-y-2">
                  {services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setForm({ ...form, serviceId: s.id })}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        form.serviceId === s.id
                          ? 'border-[#0a1628] dark:border-blue-500 bg-gray-50 dark:bg-gray-900'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {s.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {s.duration_minutes} min
                            {s.price != null && ` · ${s.currency} ${s.price.toFixed(2)}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Staff */}
          {step === 2 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Choose a staff member
              </h3>
              {staff.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No staff members yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setForm({ ...form, staffId: s.id })}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        form.staffId === s.id
                          ? 'border-[#0a1628] dark:border-blue-500 bg-gray-50 dark:bg-gray-900'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                          {(s.first_name?.[0] || '') + (s.last_name?.[0] || '')}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {s.first_name} {s.last_name}
                          </p>
                          {s.title && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {s.title}
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

          {/* Step 3 — Date + Time */}
          {step === 3 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Pick a date and time
              </h3>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  min={todayIso()}
                  onChange={(e) => setForm({ ...form, date: e.target.value, slotStart: '' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {isLoadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader className="w-4 h-4" /> Loading slots...
                </div>
              ) : slots.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No available slots for this day. Try another date.
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {slots.length} slots available — {timezone}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => setForm({ ...form, slotStart: slot.start })}
                        className={`py-2 px-3 rounded-lg border-2 text-xs font-medium transition-all ${
                          form.slotStart === slot.start
                            ? 'border-[#0a1628] dark:border-blue-500 bg-[#0a1628] dark:bg-blue-600 text-white'
                            : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600'
                        }`}
                      >
                        {slot.local_start}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4 — Customer + Confirm */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Customer details
              </h3>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Alice Kamau"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  placeholder="alice@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="+254 700 000 000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Service</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {selectedService?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Staff</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {selectedStaff?.first_name} {selectedStaff?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Duration</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {selectedService?.duration_minutes} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Price</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {selectedService?.price != null
                      ? localeService.formatMoney(
                          selectedService.price,
                          selectedService.currency,
                        )
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
            disabled={step === 1}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-40"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3 | 4))}
              disabled={
                (step === 1 && !canProceedFrom1) ||
                (step === 2 && !canProceedFrom2) ||
                (step === 3 && !canProceedFrom3)
              }
              className="px-5 py-2.5 bg-[#0a1628] dark:bg-blue-600 hover:bg-[#1a2a4a] dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={isSubmitting || !canSubmitFrom4}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a1628] dark:bg-blue-600 hover:bg-[#1a2a4a] dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? <Loader className="w-4 h-4" /> : null}
              Confirm booking
            </button>
          )}
        </div>
      </div>
    </>
  )
}
