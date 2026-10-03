'use client'

import { useState } from 'react'

import { Button } from '@/app/components/ui/Button'
import { Card, CardHeader } from '@/app/components/ui/Card'
import { useOrganization } from '@/app/providers/organization-provider'

export default function DangerSettingsPage() {
  const { currentOrg } = useOrganization()
  const [confirmText, setConfirmText] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  if (!currentOrg) return null

  const canDelete =
    currentOrg.role === 'OWNER' && confirmText === currentOrg.name

  const handleDelete = () => {
    setMessage(
      'Workspace deletion requires a manual approval step. Please contact support@apointli.com to schedule deletion of this workspace.',
    )
  }

  const handleExport = () => {
    setMessage(
      'Data export is available via the API. Contact support@apointli.com for a full data export.',
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          {message}
        </div>
      )}

      <Card>
        <CardHeader title="Export workspace data" />
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-600 dark:text-ink-400">
            Download a copy of all your appointments, customers, services, and
            staff records.
          </p>
          <Button variant="secondary" onClick={handleExport}>
            Request export
          </Button>
        </div>
      </Card>

      {currentOrg.role === 'OWNER' && (
        <Card className="border-rose-200 dark:border-rose-900/50">
          <CardHeader title="Delete workspace" />
          <div className="p-5 space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
                This action cannot be undone.
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                All appointments, customers, staff, services, and settings will
                be permanently deleted.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                Type <strong>{currentOrg.name}</strong> to confirm
              </label>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              />
            </div>

            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={!canDelete}
            >
              Delete workspace permanently
            </Button>

            <p className="text-xs text-gray-500 dark:text-ink-500">
              For safety, deletion requires a support ticket. Contact
              support@apointli.com.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
