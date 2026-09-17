import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
})

// ─── Token helpers ───
export const tokenStore = {
  getAccess(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  },
  getRefresh(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refreshToken')
  },
  set(access: string, refresh: string) {
    if (typeof window === 'undefined') return
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  },
  clear() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
}

// ─── Request interceptor: attach access token ───
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.getAccess()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ─── Response interceptor: refresh on 401 ───
let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

function flushQueue(token: string | null) {
  pendingQueue.forEach((cb) => cb(token))
  pendingQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // Only attempt refresh on 401, and only once
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true

      if (isRefreshing) {
        // Wait until the current refresh finishes
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) return reject(error)
            original.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(original))
          })
        })
      }

      isRefreshing = true
      const refreshToken = tokenStore.getRefresh()

      if (!refreshToken) {
        tokenStore.clear()
        isRefreshing = false
        flushQueue(null)
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const { access_token, refresh_token } = res.data

        tokenStore.set(access_token, refresh_token)

        isRefreshing = false
        flushQueue(access_token)

        original.headers.Authorization = `Bearer ${access_token}`
        return apiClient(original)
      } catch (refreshError) {
        tokenStore.clear()
        isRefreshing = false
        flushQueue(null)
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
