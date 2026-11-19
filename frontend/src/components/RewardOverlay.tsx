import { useEffect, useMemo } from 'react'
import { REWARDS } from '../theme/icons'
import { BigButton } from './ui'

/**
 * Instant reward: points + animation show immediately; `message` is the praise text.
 * Pass `message={null}` while the praise request is still loading — a built-in line shows meanwhile.
 * Props are deliberately plain so Member C's praise result can be passed straight in.
 */
export function RewardOverlay({ message, points, bonus, rewards, big, onClose, autoCloseMs = 3200, defaultMessage = 'Great job!' }: {
  message: string | null
  points: number
  bonus?: number
  rewards: string[]
  big?: boolean
  onClose: () => void
  autoCloseMs?: number
  defaultMessage?: string
}) {
  const chars = rewards.length ? rewards.map((r) => REWARDS[r] ?? r) : ['⭐', '🌈', '🎈']
  const pieces = useMemo(() => Array.from({ length: big ? 28 : 16 }, (_, i) => ({
    ch: chars[i % chars.length], left: 4 + ((i * 37) % 92), delay: (i % 7) * 0.12, size: 1.6 + ((i * 13) % 10) / 6,
  })), [big]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(onClose, autoCloseMs)
    return () => clearTimeout(t)
  }, [onClose, autoCloseMs])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/35 p-4" role="dialog" aria-modal="true" aria-label="Reward" onClick={onClose}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((p, i) => (
          <span key={i} className="absolute bottom-0 animate-float-up" style={{ left: `${p.left}%`, fontSize: `${p.size}rem`, animationDelay: `${p.delay}s` }}>{p.ch}</span>
        ))}
      </div>
      <div className="relative w-full max-w-sm animate-pop rounded-card bg-card p-8 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-7xl animate-wiggle" aria-hidden>{big ? '🏆' : chars[0]}</div>
        <p className="mt-3 text-4xl font-extrabold text-sage-dark" aria-live="polite">+{points} ⭐{bonus ? <span className="text-2xl"> (+{bonus} bonus)</span> : null}</p>
        <p className="mt-3 min-h-[3.5rem] text-xl font-bold" aria-live="polite">{message ?? defaultMessage}</p>
        <BigButton className="mt-5" onClick={onClose}>Keep going</BigButton>
      </div>
    </div>
  )
}
