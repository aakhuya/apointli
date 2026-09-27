'use client'

import { CreditCardIcon } from '@heroicons/react/24/outline'

import { Card } from '@/app/components/ui/Card'
import { useOrganization } from '@/app/providers/organization-provider'

export default function BillingSettingsPage() {
  const { currentOrg } = useOrganization()

  if (!currentOrg) return null

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
            <CreditCardIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-ink-100">
              Free plan
            </h3>
            <p className="text-xs text-gray-500 dark:text-ink-400">
              1 staff member · 20 bookings/month
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-ink-800">
          <div>
            <p className="text-xs text-gray-500 dark:text-ink-500 uppercase tracking-wide font-medium mb-1">
              Plan
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-ink-100">
              Free
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-ink-500 uppercase tracking-wide font-medium mb-1">
              Next billing
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-ink-100">
              —
            </p>
          </div>
        </div>

        <button
          disabled
          className="mt-6 w-full sm:w-auto px-5 py-2.5 bg-gray-200 dark:bg-ink-800 text-gray-400 dark:text-ink-600 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Upgrade plan
        </button>
      </Card>

      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-gray-900 dark:text-ink-100 mb-1">
          Subscriptions coming soon
        </p>
        <p className="text-xs text-gray-500 dark:text-ink-400 max-w-md mx-auto">
          Paid plans with online payments (Stripe) will be available in a future
          update. The Free plan remains fully functional in the meantime.
        </p>
      </Card>
    </div>
  )
}
