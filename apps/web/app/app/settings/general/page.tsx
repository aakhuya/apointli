'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Loader } from '@/app/components/Loader'
import { Button } from '@/app/components/ui/Button'
import { Card, CardHeader } from '@/app/components/ui/Card'
import { orgService, type Organization } from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().max(2000).optional().or(z.literal('')),
  website: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(255).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export default function GeneralSettingsPage() {
  const { currentOrg, refresh, reloadCurrentOrg } = useOrganization()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (currentOrg) {
      reset({
        name: currentOrg.name || '',
        description: currentOrg.description || '',
        website: currentOrg.website || '',
        phone: currentOrg.phone || '',
        email: currentOrg.email || '',
        address: currentOrg.address || '',
        city: currentOrg.city || '',
        country: currentOrg.country || '',
      })
    }
  }, [currentOrg, reset])

  if (!currentOrg) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-gray-500 dark:text-ink-400">
          Loading workspace...
        </p>
      </Card>
    )
  }

  const onSubmit = async (data: FormData) => {
    setError(null)
    setSaved(false)
    try {
      // Update via org service — we need to add this method to auth.service
      await orgService.update(currentOrg.id, {
        name: data.name,
        description: data.description || undefined,
        website: data.website || undefined,
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
      })
      await reloadCurrentOrg()
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Failed to save changes')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
          Changes saved.
        </div>
      )}

      <Card>
        <CardHeader title="Business information" />
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
              Business name
            </label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="A short description of your business"
              className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
              Website
            </label>
            <input
              {...register('website')}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
            />
            {errors.website && (
              <p className="mt-1 text-xs text-rose-600">
                {errors.website.message}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Contact" />
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                Phone
              </label>
              <input
                {...register('phone')}
                placeholder="+254 700 000 000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="hello@yourbusiness.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
              Address
            </label>
            <input
              {...register('address')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                City
              </label>
              <input
                {...register('city')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-ink-300 mb-1.5">
                Country
              </label>
              <input
                {...register('country')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader className="w-4 h-4" /> : null}
          Save changes
        </Button>
      </div>
    </form>
  )
}
