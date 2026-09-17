'use client'

import { useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  authService,
  type LoginData,
  type RegisterData,
  type User,
} from '@/app/lib/auth/auth.service'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginData) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const me = await authService.me()
      setUser(me)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load user on mount
  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    async (data: LoginData) => {
      const res = await authService.login(data)
      setUser(res.user)
      router.push('/app')
    },
    [router],
  )

  const register = useCallback(
    async (data: RegisterData) => {
      const res = await authService.register(data)
      setUser(res.user)
      router.push('/app')
    },
    [router],
  )

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    router.push('/auth/login')
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
