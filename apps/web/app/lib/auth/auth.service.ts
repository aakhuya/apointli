import { apiClient } from '../api-client'

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  },

  async getMe(): Promise<any> {
    const response = await apiClient.get('/auth/me')
    return response.data
  }
}
