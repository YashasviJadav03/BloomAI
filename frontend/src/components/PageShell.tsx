import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useApp } from '../hooks/app'
import { BottomNav } from './BottomNav'
import { SettingsModal } from './SettingsModal'
import { IconButton } from './ui'

/** Small BloomAI mark: lavender drop with a mint sprout. */
function BrandMark() {
  return (
    <span className="flex items-center gap-2" aria-label="BloomAI">
      <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden>
        <path d="M20 12 C 30 12 35 19 35 26 C 35 33 29 37 20 37 C 11 37 5 33 5 26 C 5 19 10 12 20 12 Z" fill="#9B8AD1" />
        <ellipse cx="14" cy="21" rx="4" ry="2.4" fill="#fff" opacity="0.4" />
        <path d="M20 13 V6" stroke="#69BE9C" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M20 8 C 15 2 8 3 7 8 C 12 11 18 11 20 8 Z" fill="#A9D9C4" /><path d="M20 7 C 25 1 32 2 33 7 C 28 10 22 10 20 7 Z" fill="#8FD3B3" />
        <circle cx="15" cy="26" r="2.2" fill="#2B2350" /><circle cx="25" cy="26" r="2.2" fill="#2B2350" />
      </svg>
      <span className="text-xl font-extrabold text-lav-ink">BloomAI</span>
    </span>
  )
}

/**
 * Page frame.
 *  mode "default": brand/back + points + settings, title, bottom navigation
 *  mode "focus":   only "leave" and a calm button (during a focus session)
 *  mode "plain":   no navigation at all (setup, safe mode)
 * Legacy props hideCalm/hideHeaderExtras/tint are accepted so older screens keep working.
 */
export function PageShell({ title, subtitle, back, backTo, right, children, tint, hideHeaderExtras, mode = 'default', wide = false, hideNav }: {
  title: string
  subtitle?: string
  back?: boolean
  backTo?: string
  right?: ReactNode
  children: ReactNode
  tint?: string
  hideCalm?: boolean
  hideHeaderExtras?: boolean
  mode?: 'default' | 'focus' | 'plain'
  wide?: boolean
  hideNav?: boolean
}) {
  const nav = useNavigate()
  const { points, profile } = useApp()
  const [settings, setSettings] = useState(false)
  const showExtras = mode === 'default' && !hideHeaderExtras
  const showNav = mode === 'default' && !hideNav
  const width = wide ? 'max-w-5xl' : 'max-w-2xl'
  const hasBack = back || backTo
  return (
    <div className="min-h-dvh" style={tint ? { background: `linear-gradient(${tint} 0, transparent 16rem)` } : undefined}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-xl focus:bg-card focus:p-3">Skip to content</a>
      <header className={`mx-auto px-4 pb-1 pt-4 ${width}`}>
        <div className="flex min-h-12 items-center gap-2 sm:gap-3">
          {hasBack ? (
            <IconButton label={mode === 'focus' ? 'Leave this task' : 'Go back'} onClick={() => (backTo ? nav(backTo) : nav(-1))}>{mode === 'focus' ? '✕' : '←'}</IconButton>
          ) : mode === 'default' ? <BrandMark /> : null}
          <div className="flex-1" />
          {mode === 'focus' && (
            <Link to="/calm" aria-label="I need a calm break" className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-line bg-card px-4 text-base font-extrabold text-lav-ink shadow-soft hover:bg-lav-soft">
              <span aria-hidden>🫧</span> Calm break
            </Link>
          )}
          {showExtras && (
            <>
              <span className="inline-flex h-12 items-center gap-1.5 rounded-full bg-sun-light px-4 text-lg font-extrabold" aria-label={`${points} points`}>
                <span aria-hidden>⭐</span><span className="tabular-nums">{points}</span>
              </span>
              <IconButton label={`Settings${profile ? ` for ${profile.name}` : ''}`} onClick={() => setSettings(true)}>⚙️</IconButton>
            </>
          )}
        </div>
        {(title || right) && mode !== 'focus' && (
          <div className="mt-3 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold leading-tight">{title}</h1>
              {subtitle && <p className="mt-0.5 text-lg text-ink-soft">{subtitle}</p>}
            </div>
            {right}
          </div>
        )}
      </header>
      <main id="main" className={`mx-auto px-4 pt-3 animate-fade-in ${width} ${showNav ? 'pb-32' : 'pb-16'}`}>{children}</main>
      {showNav && <BottomNav />}
      <SettingsModal open={settings} onClose={() => setSettings(false)} />
    </div>
  )
}
