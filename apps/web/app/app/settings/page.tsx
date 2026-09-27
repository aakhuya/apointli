'use client'

import Link from 'next/link'
import {
  ArrowRightIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

import { Card } from '@/app/components/ui/Card'
import { useOrganization } from '@/app/providers/organization-provider'

const items = [
  {
    href: '/app/settings/general',
    icon: Cog6ToothIcon,
    title: 'General',
    description: 'Business name, logo, description, contact info',
  },
  {
    href: '/app/settings/account',
    icon: UserCircleIcon,
    title: 'Account',
    description: 'Your email, name, and password',
  },
  {
    href: '/app/settings/team',
    icon: UserGroupIcon,
    title: 'Team',
    description: 'Members, roles, and invitations',
  },
  {
    href: '/app/settings/billing',
    icon: CreditCardIcon,
    title: 'Billing',
    description: 'Plan, invoices, and payment methods',
  },
  {
    href: '/app/settings/danger',
    icon: ExclamationTriangleIcon,
    title: 'Danger zone',
    description: 'Delete workspace, export data',
  },
]

export default function SettingsHome() {
  const { currentOrg } = useOrganization()

  return (
    <div className="space-y-3">
      {currentOrg && (
        <Card className="p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#2a44e8] text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              {currentOrg.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-ink-100">
                {currentOrg.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-ink-400">
                {currentOrg.slug} · {currentOrg.role}
              </p>
            </div>
          </div>
        </Card>
      )}

      {items.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group block bg-white dark:bg-ink-900 border border-gray-200 dark:border-ink-800 rounded-xl p-5 hover:border-[#0a1628]/30 dark:hover:border-blue-500/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-ink-800 flex items-center justify-center flex-shrink-0 group-hover:bg-[#0a1628]/5 dark:group-hover:bg-blue-950/40 transition-colors">
                <Icon className="w-5 h-5 text-gray-500 dark:text-ink-400 group-hover:text-[#0a1628] dark:group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-ink-100">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-ink-400 truncate">
                  {item.description}
                </p>
              </div>
              <ArrowRightIcon className="w-4 h-4 text-gray-300 dark:text-ink-600 group-hover:text-[#0a1628] dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
