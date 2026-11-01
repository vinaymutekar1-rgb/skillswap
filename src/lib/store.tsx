/**
 * SkillSwap application store.
 *
 * One `bootstrap` fetch populates the whole app; every mutation goes through
 * here so a successful write always refreshes dependent views. Kept as a
 * context + hook rather than a state library because the data is
 * server-authoritative and the tree is shallow.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from './api'
import type { BootstrapData } from './types'

interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface StoreValue {
  data: BootstrapData | null
  loading: boolean
  error: string | null
  activeId: string
  setActiveId: (id: string) => void
  refresh: () => Promise<void>
  toasts: Toast[]
  toast: (message: string, tone?: Toast['tone']) => void
}

const StoreContext = createContext<StoreValue | null>(null)

const ACTIVE_KEY = 'skillswap.activeStudentId'

export function SkillSwapProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootstrapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveIdState] = useState<string>(
    () => localStorage.getItem(ACTIVE_KEY) ?? '',
  )
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, tone: Toast['tone'] = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3800)
  }, [])

  const load = useCallback(async (studentId: string) => {
    try {
      setError(null)
      const payload = await api.bootstrap(studentId || undefined)
      setData(payload)
      setActiveIdState(payload.activeId)
      localStorage.setItem(ACTIVE_KEY, payload.activeId)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load'
      // An empty database is an expected first-run state, not a failure.
      if (message.toLowerCase().includes('no students seeded')) {
        try {
          await api.seed()
          const payload = await api.bootstrap(studentId || undefined)
          setData(payload)
          setActiveIdState(payload.activeId)
          localStorage.setItem(ACTIVE_KEY, payload.activeId)
          setError(null)
          return
        } catch (seedError) {
          setError(seedError instanceof Error ? seedError.message : 'Failed to seed')
          return
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(localStorage.getItem(ACTIVE_KEY) ?? '')
  }, [load])

  const setActiveId = useCallback(
    (id: string) => {
      setActiveIdState(id)
      localStorage.setItem(ACTIVE_KEY, id)
      void load(id)
    },
    [load],
  )

  const refresh = useCallback(async () => {
    await load(activeId)
  }, [activeId, load])

  const value = useMemo<StoreValue>(
    () => ({ data, loading, error, activeId, setActiveId, refresh, toasts, toast }),
    [data, loading, error, activeId, setActiveId, refresh, toasts, toast],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useSkillSwap(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useSkillSwap must be used inside SkillSwapProvider')
  return ctx
}

/** Runs a mutation, toasts the outcome, and refreshes server state. */
export function useMutation() {
  const { refresh, toast } = useSkillSwap()

  return useCallback(
    async (fn: () => Promise<unknown>, successMessage: string) => {
      try {
        await fn()
        await refresh()
        toast(successMessage, 'success')
        return true
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Action failed', 'error')
        return false
      }
    },
    [refresh, toast],
  )
}
