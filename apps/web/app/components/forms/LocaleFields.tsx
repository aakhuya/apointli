'use client'

import { useEffect, useState } from 'react'

import {
  localeService,
  type Country,
  type Currency,
  type TimezoneGroup,
} from '@/app/lib/locale/locale.service'

interface Props {
  countryCode?: string
  timezone?: string
  currency?: string
  onChange: (values: {
    country_code: string
    timezone: string
    currency: string
  }) => void
  showCurrency?: boolean
}

/**
 * Cascading country → timezone + currency picker.
 * When the user picks a country, we auto-suggest its timezone and currency.
 * The user can still override either field.
 */
export function LocaleFields({
  countryCode = '',
  timezone = 'UTC',
  currency = 'USD',
  onChange,
  showCurrency = true,
}: Props) {
  const [countries, setCountries] = useState<Country[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [timezoneGroups, setTimezoneGroups] = useState<TimezoneGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      localeService.getCountries(),
      localeService.getCurrencies(),
      localeService.getTimezones(),
    ]).then(([c, cur, tz]) => {
      if (cancelled) return
      setCountries(c)
      setCurrencies(cur)
      setTimezoneGroups(tz)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const handleCountryChange = (code: string) => {
    const country = countries.find((c) => c.code === code)
    onChange({
      country_code: code,
      timezone: country?.timezone || timezone,
      currency: country?.currency || currency,
    })
  }

  if (loading) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500">
        Loading locales...
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Country
          </label>
          <select
            value={countryCode}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
          >
            <option value="">— Select country —</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Timezone
          </label>
          <select
            value={timezone}
            onChange={(e) =>
              onChange({
                country_code: countryCode,
                timezone: e.target.value,
                currency,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
          >
            <option value="UTC">UTC</option>
            {timezoneGroups.map((group) => (
              <optgroup key={group.region} label={group.region}>
                {group.zones.map((tz: string) => (
                  <option key={tz} value={tz}>
                    {tz.replace(`${group.region}/`, '').replace(/_/g, ' ')}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {showCurrency && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) =>
              onChange({
                country_code: countryCode,
                timezone,
                currency: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  )
}
