// App-wide state: the one child profile and the points total shown in the header.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Profile } from '../api/types'
import { ApiError } from '../api/types'

interface Ctx {
  status: 'loading' | 'ready' | 'needs-setup' | 'error'
  error: string | null
  profile: Profile | null
  points: number
  setPoints: (n: number) => void
  setProfile: (p: Profile) => void
  reload: () => void
}
const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Ctx['status']>('loading')
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfileState] = useState<Profile | null>(null)
  const [points, setPoints] = useState(0)

  const reload = useCallback(() => {
    setStatus('loading'); setError(null)
    api.getProfile()
      .then(async (p) => {
        setProfileState(p)
        try { setPoints((await api.progressSummary()).total_points) } catch { /* points are optional */ }
        setStatus('ready')
      })
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) setStatus('needs-setup')   // first launch
        else { setError(e instanceof Error ? e.message : 'Something went wrong'); setStatus('error') }
      })
  }, [])
  useEffect(reload, [reload])

  const setProfile = useCallback((p: Profile) => { setProfileState(p); setStatus('ready') }, [])
  const value = useMemo(() => ({ status, error, profile, points, setPoints, setProfile, reload }), [status, error, profile, points, setProfile, reload])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
export function useApp() {
  const c = useContext(AppContext)
  if (!c) throw new Error('useApp outside AppProvider')
  return c
}
