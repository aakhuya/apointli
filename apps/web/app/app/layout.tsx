'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Loader } from '@/app/components/Loader'
import { useAuth } from '@/app/providers/auth-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 text-[#0a1628]" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}
