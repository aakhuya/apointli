'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Loader } from '@/app/components/Loader'
import { orgService } from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  timezone: z.string().min(1),
})

type FormData = z.infer<typeof schema>

export default function NewOrgPage() {
  const router = useRouter()
  const { refresh } = useOrganization()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', timezone: 'UTC' },
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      const org = await orgService.create({
        name: data.name,
        timezone: data.timezone,
      })
      if (typeof window !== 'undefined') {
        localStorage.setItem('apointli.currentOrgId', org.id)
      }
      await refresh()
      router.push('/app')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Could not create workspace')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Create workspace
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        A workspace is your business on apointli.
      </p>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Business name
          </label>
          <input
            {...register('name')}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
            placeholder="Bright Cuts Barbershop"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Timezone
          </label>
          <select
            {...register('timezone')}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
          >
            <option value="UTC">UTC</option>
            <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
            <option value="America/New_York">America/New York (ET)</option>
            <option value="Europe/London">Europe/London (GMT/BST)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center gap-2 py-2.5 bg-[#0a1628] dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-[#1a2a4a] dark:hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? <Loader className="w-4 h-4" /> : null}
          Create workspace
        </button>
      </form>
    </div>
  )
}
