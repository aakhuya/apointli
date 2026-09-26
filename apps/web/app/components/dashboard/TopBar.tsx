'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from '@/app/providers/auth-provider'
import { useOrganization } from '@/app/providers/organization-provider'
import { useTheme } from '@/app/providers/theme-provider'
import {
  notificationApi,
  type NotificationItem,
} from '@/app/lib/auth/auth.service'

interface Props {
  onOpenMobileMenu: () => void
}

function timeAgo(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function TopBar({ onOpenMobileMenu }: Props) {
  const { user, logout } = useAuth()
  const { currentOrg } = useOrganization()
  const { resolvedTheme, toggle } = useTheme()
  const router = useRouter()
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ')
  const displayName = fullName || user?.email || 'User'
  const initials =
    ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?'

  const loadNotifications = useCallback(async () => {
    if (!currentOrg) return
    setLoadingNotifs(true)
    try {
      const res = await notificationApi.list(currentOrg.id)
      setNotifications(res.items)
      setUnread(res.unread_count)
    } catch {
      // silently ignore
    } finally {
      setLoadingNotifs(false)
    }
  }, [currentOrg])

  // Load on mount + poll every 60s
  useEffect(() => {
    if (!currentOrg) return
    void loadNotifications()
    pollRef.current = setInterval(loadNotifications, 60_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [currentOrg, loadNotifications])

  return (
    <header className="h-16 border-b border-gray-200 dark:border-ink-800 bg-white dark:bg-ink-950 flex items-center justify-between px-3 sm:px-6 gap-3">
      {/* Mobile menu */}
      <button
        onClick={onOpenMobileMenu}
        aria-label="Open menu"
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-ink-800 transition-colors flex-shrink-0"
      >
        <Bars3Icon className="w-5 h-5 text-gray-700 dark:text-ink-300" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings, customers, or services..."
            className="w-full pl-10 pr-12 py-2 bg-gray-50 dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-lg text-sm text-gray-900 dark:text-ink-100 placeholder-gray-400 dark:placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500"
          />
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-white dark:bg-ink-800 border border-gray-200 dark:border-ink-700 rounded">
            ⌘ K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-ink-800 transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <SunIcon className="w-[18px] h-[18px] text-ink-400" />
          ) : (
            <MoonIcon className="w-[18px] h-[18px] text-gray-400" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen)
              if (!notifOpen) void loadNotifications()
            }}
            aria-label="Notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-ink-800 transition-colors"
          >
            <BellIcon className="w-[18px] h-[18px] text-gray-500 dark:text-ink-400" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-ink-950">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotifOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-24px)] bg-white dark:bg-ink-900 rounded-xl shadow-lg border border-gray-200 dark:border-ink-800 py-1 z-20">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-ink-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-ink-100">
                    Notifications
                  </p>
                  {unread > 0 && (
                    <span className="text-[10px] font-medium text-rose-500">
                      {unread} new
                    </span>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifs && notifications.length === 0 ? (
                    <p className="px-3 py-6 text-xs text-center text-gray-400 dark:text-ink-500">
                      Loading...
                    </p>
                  ) : notifications.length === 0 ? (
                    <p className="px-3 py-6 text-xs text-center text-gray-400 dark:text-ink-500">
                      You're all caught up.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (n.link) router.push(n.link)
                          setNotifOpen(false)
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-ink-800/50 transition-colors border-b border-gray-50 dark:border-ink-800/50 last:border-0"
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${
                              n.type === 'booking'
                                ? 'bg-emerald-500'
                                : n.type === 'cancellation'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-ink-100 truncate">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-xs text-gray-500 dark:text-ink-400 truncate mt-0.5">
                                {n.body}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 dark:text-ink-500 mt-1">
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      router.push('/app/appointments')
                      setNotifOpen(false)
                    }}
                    className="w-full text-center px-3 py-2 text-xs font-medium text-[#0a1628] dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-ink-800/50 border-t border-gray-100 dark:border-ink-800"
                  >
                    View all appointments
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2.5 sm:pl-2 pr-1 sm:pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-ink-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0a1628] to-[#2a44e8] text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 dark:text-ink-100 leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-ink-400 leading-tight">
                {currentOrg?.role
                  ? currentOrg.role.charAt(0) +
                    currentOrg.role.slice(1).toLowerCase()
                  : 'Owner'}
              </p>
            </div>
            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
          </button>

          {userOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-ink-900 rounded-xl shadow-lg border border-gray-200 dark:border-ink-800 py-1 z-20">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-ink-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-ink-100 truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-ink-400 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-ink-800 text-rose-600 dark:text-rose-400"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
