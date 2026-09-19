'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { MobileDrawer } from '@/app/components/dashboard/MobileDrawer'
import { MobileNav } from '@/app/components/dashboard/MobileNav'
import { Sidebar } from '@/app/components/dashboard/Sidebar'
import { TopBar } from '@/app/components/dashboard/TopBar'
import { Loader } from '@/app/components/Loader'
import { useAuth } from '@/app/providers/auth-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

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
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMobileMenu={() => setMobileOpen(true)} />

        {/* Main content — extra bottom padding on mobile for the fixed tab bar */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
