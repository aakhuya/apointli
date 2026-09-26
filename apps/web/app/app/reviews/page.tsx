'use client'

import Link from 'next/link'
import { StarIcon } from '@heroicons/react/24/outline'

import { Card } from '@/app/components/ui/Card'
import { useOrganization } from '@/app/providers/organization-provider'

export default function ReviewsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()

  if (!orgLoading && !currentOrg) {
    return (
      <div className="p-6 sm:p-8 max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ink-100">
          Welcome to apointli
        </h1>
        <p className="mt-2 text-gray-600 dark:text-ink-400">
          Create a workspace first.
        </p>
        <Link
          href="/app/settings/organizations/new"
          className="mt-4 inline-flex items-center px-5 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          Create workspace
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-ink-100">
          Reviews
        </h1>
        <p className="text-sm text-gray-500 dark:text-ink-400 mt-1">
          What your customers are saying
        </p>
      </div>

      {/* Empty state */}
      <Card className="p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
          <StarIcon className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-ink-100">
          Reviews coming soon
        </h3>
        <p className="text-sm text-gray-500 dark:text-ink-400 mt-2 max-w-md mx-auto">
          After a customer completes an appointment, they'll receive a link to
          leave a review. Reviews will appear here for you to read and respond
          to.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-xs text-gray-400 dark:text-ink-500">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Feature in development
        </div>
      </Card>

      {/* Feature preview */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          {
            title: 'Verified reviews',
            desc: 'Only customers who completed a booking can leave a review.',
          },
          {
            title: 'Star ratings',
            desc: '1 to 5 stars per review, aggregated into your business rating.',
          },
          {
            title: 'Public visibility',
            desc: 'Reviews appear on your public booking page for trust.',
          },
        ].map((f) => (
          <Card key={f.title} className="p-5">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-ink-100 mb-1">
              {f.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-ink-400">{f.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
