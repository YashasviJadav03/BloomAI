import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type TextSize = 'normal' | 'large' | 'xlarge'
interface Settings { muted: boolean; textSize: TextSize; reduceMotion: boolean }
interface Ctx extends Settings { setMuted: (v: boolean) => void; setTextSize: (v: TextSize) => void; setReduceMotion: (v: boolean) => void }

const KEY = 'bloomai-settings'
const DEFAULTS: Settings = { muted: false, textSize: 'normal', reduceMotion: false }
const SettingsContext = createContext<Ctx | null>(null)

function read(): Settings {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return DEFAULTS }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(read)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
    const el = document.documentElement
    el.dataset.textSize = s.textSize === 'normal' ? '' : s.textSize
    el.dataset.reduceMotion = String(s.reduceMotion)
  }, [s])
  const setMuted = useCallback((muted: boolean) => setS((p) => ({ ...p, muted })), [])
  const setTextSize = useCallback((textSize: TextSize) => setS((p) => ({ ...p, textSize })), [])
  const setReduceMotion = useCallback((reduceMotion: boolean) => setS((p) => ({ ...p, reduceMotion })), [])
  const value = useMemo(() => ({ ...s, setMuted, setTextSize, setReduceMotion }), [s, setMuted, setTextSize, setReduceMotion])
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
export function useSettings() {
  const c = useContext(SettingsContext)
  if (!c) throw new Error('useSettings outside SettingsProvider')
  return c
}
