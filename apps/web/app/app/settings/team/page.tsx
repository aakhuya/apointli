'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Loader } from '@/app/components/Loader'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import { Card, CardHeader } from '@/app/components/ui/Card'
import { orgService, type Member } from '@/app/lib/auth/auth.service'
import { useOrganization } from '@/app/providers/organization-provider'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'RECEPTIONIST']),
})

type FormData = z.infer<typeof schema>

const ROLE_VARIANTS: Record<
  string,
  'success' | 'warning' | 'info' | 'neutral' | 'danger'
> = {
  OWNER: 'danger',
  ADMIN: 'warning',
  MANAGER: 'info',
  STAFF: 'neutral',
  RECEPTIONIST: 'neutral',
}

export default function TeamSettingsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'STAFF' },
  })

  const load = useCallback(async () => {
    if (!currentOrg) return
    setLoading(true)
    try {
      setMembers(await orgService.listMembers(currentOrg.id))
    } catch {
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }, [currentOrg])

  useEffect(() => {
    if (!orgLoading && currentOrg) void load()
    else if (!orgLoading) setLoading(false)
  }, [orgLoading, currentOrg, load])

  const onInvite = async (data: FormData) => {
    if (!currentOrg) return
    setError(null)
    setSuccess(null)
    try {
      await orgService.addMember(currentOrg.id, data.email, data.role)
      setSuccess(`Invited ${data.email} as ${data.role}`)
      reset()
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Failed to invite member')
    }
  }

  const onRemove = async (memberId: string) => {
    if (!currentOrg) return
    if (!confirm('Remove this member?')) return
    try {
      await orgService.removeMember(currentOrg.id, memberId)
      await load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setError(e.response?.data?.detail || 'Failed to remove member')
    }
  }

  if (!currentOrg) return null

  const canManage = ['OWNER', 'ADMIN'].includes(currentOrg.role)

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-lg text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      )}

      {canManage && (
        <Card>
          <CardHeader title="Invite member" />
          <form onSubmit={handleSubmit(onInvite)} className="p-5 space-y-4">
            <div className="grid sm:grid-cols-[1fr_160px_auto] gap-3 items-start">
              <div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <select
                {...register('role')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-ink-700 rounded-lg bg-white dark:bg-ink-900 text-gray-900 dark:text-ink-100 focus:outline-none focus:ring-2 focus:ring-[#0a1628] dark:focus:ring-blue-500 text-sm"
              >
                <option value="STAFF">Staff</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
                <option value="OWNER">Owner</option>
              </select>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader className="w-4 h-4" /> : null}
                Invite
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-ink-500">
              The person must already have an apointli account.
            </p>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader
          title={`Members (${members.length})`}
        />
        {loading ? (
          <div className="p-5 flex items-center gap-2 text-sm text-gray-500 dark:text-ink-400">
            <Loader className="w-4 h-4" /> Loading...
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-ink-800">
            {members.map((m) => (
              <div key={m.id} className="p-4 sm:p-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0a1628] dark:bg-blue-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {(m.first_name?.[0] || m.email[0])
                    .toString()
                    .toUpperCase()}
                  {(m.last_name?.[0] || '').toString().toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-ink-100 truncate">
                    {m.first_name} {m.last_name || m.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-ink-400 truncate">
                    {m.email}
                  </p>
                </div>
                <Badge variant={ROLE_VARIANTS[m.role] || 'neutral'}>
                  {m.role}
                </Badge>
                {canManage && m.role !== 'OWNER' && (
                  <button
                    onClick={() => onRemove(m.id)}
                    className="text-sm text-rose-600 dark:text-rose-400 hover:text-rose-700 ml-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
