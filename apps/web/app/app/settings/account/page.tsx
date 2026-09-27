'use client'

import { useState } from 'react'

import { Loader } from '@/app/components/Loader'
import { Button } from '@/app/components/ui/Button'
import { Card, CardHeader } from '@/app/components/ui/Card'
import { useAuth } from '@/app/providers/auth-provider'

export default function AccountSettingsPage() {
  const { user } = useAuth()
  const [pwForm, setPwForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (pwForm.next.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setError("Passwords don't match")
      return
    }

    setSaving(true)
    try {
      // Note: backend endpoint for password change not yet implemented
      // Placeholder for Phase 11 or later
      await new Promise((r) => setTimeout(r, 600))
      setMessage(
        'Password change will be available in the next update. Contact support if urgent.',
      )
      setPwForm({ current: '', next: '', confirm: '' })
    } catch {
      setError('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Your profile" />
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
              Email
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-ink-800 rounded-lg bg-gray-50 dark:bg-ink-900/50 text-gray-500 dark:text-ink-400 text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-ink-500">
              Contact support to change your email address.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                First name
              </label>
              <input
                value={user?.first_name || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-ink-800 rounded-lg bg-gray-50 dark:bg-ink-900/50 text-gray-500 dark:text-ink-400 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                Last name
              </label>
              <input
                value={user?.last_name || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-ink-800 rounded-lg bg-gray-50 dark:bg-ink-900/50 text-gray-500 dark:text-ink-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Change password" />
        <form onSubmit={submitPassword} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-sm text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-sm text-blue-700 dark:text-blue-400">
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
              Current password
            </label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) =>
                setPwForm({ ...pwForm, current: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                New password
              </label>
              <input
                type="password"
                value={pwForm.next}
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                Confirm new password
              </label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) =>
                  setPwForm({ ...pwForm, confirm: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader className="w-4 h-4" /> : null}
              Update password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
