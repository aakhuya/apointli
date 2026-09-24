'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  ClockIcon,
  GlobeAltIcon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

import { Loader } from '@/app/components/Loader'
import { ApointliLogo } from '@/app/components/logo/ApointliLogo'
import { publicService, type PublicBusiness } from '@/app/lib/public/public.service'

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

export default function PublicBusinessPage() {
  const params = useParams<{ slug: string }>()
  const [business, setBusiness] = useState<PublicBusiness | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async () => {
    if (!params.slug) return
    setIsLoading(true)
    try {
      const data = await publicService.getBusiness(params.slug)
      setBusiness(data)
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } }
      if (e.response?.status === 404) setNotFound(true)
    } finally {
      setIsLoading(false)
    }
  }, [params.slug])

  useEffect(() => {
    void load()
  }, [load])

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
          <h1 className="text-2xl font-bold text-gray-900">
            Business not found
          </h1>
          <p className="text-gray-500 mt-2">
            The business you're looking for doesn't exist or is not currently
            accepting bookings.
          </p>
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

  const primaryLocation = business.locations[0]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <ApointliLogo size="md" />
          </Link>
          <Link
            href={`/b/${business.slug}/book`}
            className="text-sm font-medium text-white bg-[#0a1628] hover:bg-[#1a2a4a] px-5 py-2.5 rounded-lg transition-colors"
          >
            Book now
          </Link>
        </div>
      </header>

      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-br from-[#0a1628] via-[#1a2a4a] to-[#2a3a5a]">
        {business.cover_url && (
          <img
            src={business.cover_url}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Business info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-12 sm:-mt-16 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-white dark:bg-gray-900 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-[#0a1628]">
                {business.name[0]}
              </span>
            )}
          </div>

          <div className="flex-1 pb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {business.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
              {primaryLocation?.city && (
                <span className="flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4" />
                  {primaryLocation.city}
                  {primaryLocation.country_code && `, ${primaryLocation.country_code}`}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                {business.timezone}
              </span>
              <span className="flex items-center gap-1.5">
                <StarIcon className="w-4 h-4 text-amber-500" />
                New on apointli
              </span>
            </div>
          </div>
        </div>

        {/* CTA card */}
        <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#1a2a4a] p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Ready to book?</h2>
              <p className="text-blue-100/80 text-sm mt-1">
                Choose a service and pick a time that works for you.
              </p>
            </div>
            <Link
              href={`/b/${business.slug}/book`}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#0a1628] font-medium rounded-xl hover:bg-gray-50 transition-colors self-start sm:self-auto"
            >
              Book appointment →
            </Link>
          </div>
        </div>

        {/* About + Contact */}
        {(business.description || business.phone || business.email || business.website) && (
          <div className="mt-12 grid lg:grid-cols-3 gap-8">
            {business.description && (
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {business.description}
                </p>
              </div>
            )}
            <div className={business.description ? '' : 'lg:col-span-3'}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
              <div className="space-y-3 text-sm">
                {business.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    {business.phone}
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="w-4 h-4 text-gray-400 text-center">@</span>
                    {business.email}
                  </div>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[#0a1628] hover:underline"
                  >
                    <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                    {business.website}
                  </a>
                )}
                {primaryLocation?.address && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>
                      {primaryLocation.address}
                      {primaryLocation.city && (
                        <>
                          <br />
                          {primaryLocation.city}
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Services */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Services</h2>
          {business.services.length === 0 ? (
            <p className="text-gray-500">No services listed yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {business.services.map((s) => (
                <Link
                  key={s.id}
                  href={`/b/${business.slug}/book?service=${s.id}`}
                  className="group bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-[#0a1628]/30 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: s.color }}
                    />
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#0a1628] transition-colors">
                      {s.name}
                    </h3>
                  </div>
                  {s.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                      {s.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <ClockIcon className="w-3.5 h-3.5" />
                      {s.duration_minutes} min
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(s.price, s.currency)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Staff */}
        {business.staff.length > 0 && (
          <div className="mt-12 pb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our team</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {business.staff.map((st) => (
                <div
                  key={st.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-[#0a1628] text-white flex items-center justify-center text-xl font-semibold mx-auto mb-3 overflow-hidden">
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
                  <h3 className="font-semibold text-gray-900">{st.name}</h3>
                  {st.title && (
                    <p className="text-xs text-gray-500 mt-0.5">{st.title}</p>
                  )}
                  {st.bio && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3">
                      {st.bio}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          Powered by{' '}
          <Link href="/" className="font-medium text-[#0a1628] hover:underline">
            apointli
          </Link>
        </div>
      </footer>
    </div>
  )
}
