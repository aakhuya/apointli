'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Sidebar } from '@/app/components/dashboard/Sidebar'
import { TopBar } from '@/app/components/dashboard/TopBar'
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader className="w-8 h-8 text-[#0a1628] dark:text-blue-500" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
