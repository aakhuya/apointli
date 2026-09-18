'use client'

import { useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import {
  orgService,
  type Organization,
  type OrganizationSummary,
} from '@/app/lib/auth/auth.service'
import { useAuth } from './auth-provider'

interface OrgContextValue {
  organizations: OrganizationSummary[]
  currentOrg: Organization | null
  isLoading: boolean
  refresh: () => Promise<void>
  switchOrg: (id: string) => Promise<void>
  reloadCurrentOrg: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | undefined>(undefined)

const STORAGE_KEY = 'apointli.currentOrgId'

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadOrg = useCallback(async (orgId: string) => {
    try {
      const org = await orgService.get(orgId)
      setCurrentOrg(org)
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, orgId)
      }
    } catch {
      setCurrentOrg(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setOrganizations([])
      setCurrentOrg(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const list = await orgService.list()
      setOrganizations(list)

      if (list.length === 0) {
        setCurrentOrg(null)
        setIsLoading(false)
        return
      }

      const saved =
        typeof window !== 'undefined'
          ? localStorage.getItem(STORAGE_KEY)
          : null
      const target = list.find((o) => o.id === saved) || list[0]
      await loadOrg(target.id)
    } catch {
      setOrganizations([])
      setCurrentOrg(null)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, loadOrg])

  const switchOrg = useCallback(
    async (id: string) => {
      await loadOrg(id)
      router.refresh()
    },
    [loadOrg, router],
  )

  const reloadCurrentOrg = useCallback(async () => {
    if (currentOrg) {
      await loadOrg(currentOrg.id)
    }
  }, [currentOrg, loadOrg])

  useEffect(() => {
    if (!authLoading) {
      void refresh()
    }
  }, [authLoading, refresh])

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        isLoading,
        refresh,
        switchOrg,
        reloadCurrentOrg,
      }}
    >
      {children}
    </OrgContext.Provider>
  )
}

export function useOrganization(): OrgContextValue {
  const ctx = useContext(OrgContext)
  if (!ctx) {
    throw new Error('useOrganization must be used inside <OrganizationProvider>')
  }
  return ctx
}
