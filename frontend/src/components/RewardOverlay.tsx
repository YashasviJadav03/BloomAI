import { useEffect, useMemo } from 'react'
import { REWARDS } from '../theme/icons'
import { Bloomi } from './mascot/Bloomi'
import { BigButton } from './ui'

/**
 * Instant reward: points + animation show immediately; `message` is the praise text.
 * Pass `message={null}` while the praise request is still loading: a built-in line shows meanwhile.
 * `unlocked` (optional) names a garden reward that this effort just grew. It is a visual reward only.
 * `messageSource` ("llm" | "template") shows a sparkle badge when Bloomi personally wrote the praise.
 */
export function RewardOverlay({ message, points, bonus, rewards, big, unlocked, onClose, autoCloseMs = 3200, defaultMessage = 'Great job!', messageSource }: {
  message: string | null
  points: number
  bonus?: number
  rewards: string[]
  big?: boolean
  unlocked?: string | null
  onClose: () => void
  autoCloseMs?: number
  defaultMessage?: string
  messageSource?: string
}) {
  const chars = rewards.length ? rewards.map((r) => REWARDS[r] ?? r) : ['⭐', '🌈', '🎈']
  const pieces = useMemo(() => Array.from({ length: big ? 20 : 10 }, (_, i) => ({
    ch: chars[i % chars.length], left: 4 + ((i * 37) % 92), delay: (i % 7) * 0.12, size: 1.4 + ((i * 13) % 10) / 8,
  })), [big]) // eslint-disable-line react-hooks/exhaustive-deps

  // a new garden leaf deserves a little longer to read
  useEffect(() => {
    const t = setTimeout(onClose, unlocked ? autoCloseMs + 1800 : autoCloseMs)
    return () => clearTimeout(t)
  }, [onClose, autoCloseMs, unlocked])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/35 p-4" role="dialog" aria-modal="true" aria-label="Reward" onClick={onClose}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((p, i) => (
          <span key={i} className="absolute bottom-0 animate-float-up" style={{ left: `${p.left}%`, fontSize: `${p.size}rem`, animationDelay: `${p.delay}s` }}>{p.ch}</span>
        ))}
      </div>
      <div className="relative w-full max-w-sm animate-pop rounded-card bg-card p-6 text-center shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center"><Bloomi pose={unlocked ? 'growing' : 'happy'} arms="up" size={big ? 150 : 120} animate="bounce" /></div>
        <p className="mt-2 text-4xl font-extrabold text-sage-dark" aria-live="polite">+{points} ⭐{bonus ? <span className="text-2xl"> (+{bonus} bonus)</span> : null}</p>
        <p className="mt-3 min-h-[3.5rem] text-xl font-bold" aria-live="polite">{message ?? defaultMessage}</p>
        {messageSource === 'llm' && message && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-lav-soft px-3 py-1 text-sm font-bold text-lav-ink">
            ✨ Bloomi wrote this just for you
          </span>
        )}
        {unlocked && <p role="status" className="mt-2 rounded-2xl bg-mint-soft px-3 py-2 text-lg font-extrabold text-sage-dark">🌱 New in your garden: {unlocked}!</p>}
        <BigButton className="mt-4" onClick={onClose}>Keep going</BigButton>
      </div>
    </div>
  )
}
