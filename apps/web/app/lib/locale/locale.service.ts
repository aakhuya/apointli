import axios from 'axios'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export interface Country {
  code: string
  name: string
  currency: string | null
  timezone: string | null
}

export interface Currency {
  code: string
  name: string
  symbol: string
}

export interface TimezoneGroup {
  region: string
  zones: string[]
}

let countriesCache: Country[] | null = null
let currenciesCache: Currency[] | null = null
let timezonesCache: TimezoneGroup[] | null = null

export const localeService = {
  async getCountries(): Promise<Country[]> {
    if (countriesCache) return countriesCache
    const res = await axios.get<Country[]>(`${API_URL}/locales/countries`)
    countriesCache = res.data
    return res.data
  },

  async getCurrencies(): Promise<Currency[]> {
    if (currenciesCache) return currenciesCache
    const res = await axios.get<Currency[]>(`${API_URL}/locales/currencies`)
    currenciesCache = res.data
    return res.data
  },

  async getTimezones(): Promise<TimezoneGroup[]> {
    if (timezonesCache) return timezonesCache
    const res = await axios.get<TimezoneGroup[]>(`${API_URL}/locales/timezones`)
    timezonesCache = res.data
    return res.data
  },

  formatMoney(
    amount: number,
    currency: string,
    locale: string = 'en-US',
  ): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount)
    } catch {
      return `${currency} ${amount.toFixed(2)}`
    }
  },
}
