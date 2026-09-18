import { apiClient, tokenStore } from '../api-client'

// ─── Types ───
export interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  email_verified: boolean
}

export interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  website: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  timezone: string
  currency: string
  is_active: boolean
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'RECEPTIONIST'
}

export interface OrganizationSummary {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface RegisterData {
  email: string
  password: string
  first_name?: string
  last_name?: string
}

export interface LoginData {
  email: string
  password: string
}

// ─── Auth service ───
export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data)
    tokenStore.set(res.data.access_token, res.data.refresh_token)
    return res.data
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data)
    tokenStore.set(res.data.access_token, res.data.refresh_token)
    return res.data
  },

  async logout(): Promise<void> {
    const refresh = tokenStore.getRefresh()
    if (refresh) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refresh })
      } catch {
        // ignore network errors on logout
      }
    }
    tokenStore.clear()
  },

  async me(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me')
    return res.data
  },

  isAuthenticated(): boolean {
    return !!tokenStore.getAccess()
  },
}

// ─── Organization service ───
export const orgService = {
  async list(): Promise<OrganizationSummary[]> {
    const res = await apiClient.get<OrganizationSummary[]>('/organizations')
    return res.data
  },

  async create(data: {
    name: string
    description?: string
    timezone?: string
    currency?: string
  }): Promise<Organization> {
    const res = await apiClient.post<Organization>('/organizations', data)
    return res.data
  },

  async get(id: string): Promise<Organization> {
    const res = await apiClient.get<Organization>(`/organizations/${id}`)
    return res.data
  },
}

// ─── Service domain ───
export interface Service {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number | null
  currency: string
  color: string
  buffer_before_minutes: number
  buffer_after_minutes: number
  is_active: boolean
  is_bookable_online: boolean
}

export interface CreateServiceData {
  name: string
  description?: string
  duration_minutes: number
  price?: number
  currency?: string
  color?: string
  buffer_before_minutes?: number
  buffer_after_minutes?: number
  is_bookable_online?: boolean
}

export const serviceApi = {
  async list(orgId: string): Promise<Service[]> {
    const res = await apiClient.get<Service[]>(
      `/organizations/${orgId}/services`,
    )
    return res.data
  },

  async create(orgId: string, data: CreateServiceData): Promise<Service> {
    const res = await apiClient.post<Service>(
      `/organizations/${orgId}/services`,
      data,
    )
    return res.data
  },

  async update(
    orgId: string,
    serviceId: string,
    data: Partial<CreateServiceData> & { is_active?: boolean },
  ): Promise<Service> {
    const res = await apiClient.patch<Service>(
      `/organizations/${orgId}/services/${serviceId}`,
      data,
    )
    return res.data
  },

  async remove(orgId: string, serviceId: string): Promise<void> {
    await apiClient.delete(`/organizations/${orgId}/services/${serviceId}`)
  },
}
