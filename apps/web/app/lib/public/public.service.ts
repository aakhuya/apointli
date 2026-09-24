import axios from 'axios'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export interface PublicLocation {
  id: string
  name: string
  address: string | null
  city: string | null
  country_code: string | null
  timezone: string
  currency: string
}

export interface PublicService {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number | null
  currency: string
  color: string
}

export interface PublicStaff {
  id: string
  name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
}

export interface PublicBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  timezone: string
  currency: string
  is_active: boolean
  locations: PublicLocation[]
  services: PublicService[]
  staff: PublicStaff[]
}

export interface PublicSlot {
  start: string
  end: string
  local_start: string
  local_end: string
  timezone: string
}

export interface PublicAppointment {
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

export const publicService = {
  async getBusiness(slug: string): Promise<PublicBusiness> {
    const res = await axios.get<PublicBusiness>(
      `${API_URL}/public/businesses/${slug}`,
    )
    return res.data
  },

  async getStaffForService(
    slug: string,
    serviceId: string,
  ): Promise<PublicStaff[]> {
    const res = await axios.get<PublicStaff[]>(
      `${API_URL}/public/businesses/${slug}/services/${serviceId}/staff`,
    )
    return res.data
  },

  async getAvailability(
    slug: string,
    params: { staff_id: string; service_id: string; date: string },
  ): Promise<{ date: string; timezone: string; slots: PublicSlot[] }> {
    const res = await axios.get(
      `${API_URL}/public/businesses/${slug}/availability`,
      { params },
    )
    return res.data
  },

  async book(
    slug: string,
    data: {
      staff_id: string
      service_id: string
      start_time: string
      customer_name: string
      customer_email?: string
      customer_phone?: string
      notes?: string
    },
  ): Promise<PublicAppointment> {
    const res = await axios.post<PublicAppointment>(
      `${API_URL}/public/businesses/${slug}/appointments`,
      data,
    )
    return res.data
  },
}
