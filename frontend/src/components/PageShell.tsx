import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../hooks/app'
import { IconButton } from './ui'
import { SettingsModal } from './SettingsModal'

export function PageShell({ title, back, backTo, right, children, tint, hideCalm, hideHeaderExtras }: {
  title: string
  back?: boolean
  backTo?: string
  right?: ReactNode
  children: ReactNode
  tint?: string
  hideCalm?: boolean
  hideHeaderExtras?: boolean
}) {
  const nav = useNavigate()
  const { points, profile } = useApp()
  const [settings, setSettings] = useState(false)
  return (
    <div className="min-h-dvh" style={tint ? { background: `linear-gradient(${tint} 0, var(--color-cream) 14rem)` } : undefined}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-card focus:p-3">Skip to content</a>
      <header className="mx-auto max-w-3xl px-4 pb-2 pt-4">
        {/* Row 1: navigation + always-available tools. Row 2: the page title (never squeezed on phones). */}
        <div className="flex items-center gap-2 sm:gap-3">
          {(back || backTo) ? <IconButton label="Go back" onClick={() => (backTo ? nav(backTo) : nav(-1))}>←</IconButton> : null}
          <div className="flex-1" />
          {!hideHeaderExtras && (
            <>
              {!hideCalm && (
                <Link to="/calm" aria-label="I need a calm break" title="I need a calm break"
                  className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-line bg-card px-3 text-lg font-bold hover:bg-sky-light">
                  <span aria-hidden>🫧</span><span>Calm</span>
                </Link>
              )}
              <span className="inline-flex h-12 items-center gap-1 rounded-full bg-sun-light px-4 text-lg font-extrabold" aria-label={`${points} points`}>
                <span aria-hidden>⭐</span>{points}
              </span>
              <IconButton label={`Settings${profile ? ` for ${profile.name}` : ''}`} onClick={() => setSettings(true)}>⚙️</IconButton>
            </>
          )}
        </div>
        {(title || right) && (
          <div className="mt-3 flex items-center gap-3">
            <h1 className="min-w-0 flex-1 text-3xl font-extrabold leading-tight">{title}</h1>
            {right}
          </div>
        )}
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 pb-24 pt-2 animate-fade-in">{children}</main>
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
