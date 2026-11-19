import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Wall-clock based countdown (does not drift if the tab is throttled). */
export function useCountdown(totalSeconds: number, running: boolean, onDone?: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const endRef = useRef<number | null>(null)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  // Reset when the total changes (new task)
  useEffect(() => { setRemaining(totalSeconds); endRef.current = null; doneRef.current = false }, [totalSeconds])

  useEffect(() => {
    if (!running) { endRef.current = null; return }
    endRef.current = Date.now() + remaining * 1000
    const iv = setInterval(() => {
      const left = Math.max(0, Math.ceil(((endRef.current ?? 0) - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0 && !doneRef.current) { doneRef.current = true; onDoneRef.current?.() }
    }, 250)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  return { remaining, elapsed: totalSeconds - remaining, finished: remaining === 0 }
}

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** Big visual countdown: a ring that empties plus the time. Colour moves green -> blue -> warm orange (never red). */
export function CountdownRing({ total, remaining, size = 220, label, children }: { total: number; remaining: number; size?: number; label?: string; children?: ReactNode }) {
  const r = 90, c = 2 * Math.PI * r
  const frac = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const color = frac > 0.5 ? 'var(--color-sage)' : frac > 0.2 ? 'var(--color-sky)' : 'var(--color-sun)'
  const minsLeft = Math.ceil(remaining / 60)
  return (
    <div role="timer" aria-label={`About ${minsLeft} minute${minsLeft === 1 ? '' : 's'} left`} className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 200 200" width={size} height={size} aria-hidden>
        <circle cx="100" cy="100" r={r} fill="var(--color-card)" stroke="var(--color-lav-soft)" strokeWidth="14" />
        <circle cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform="rotate(-90 100 100)" style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.6s' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
        <span className="font-extrabold tabular-nums" style={{ fontSize: size * 0.2 }}>{fmt(remaining)}</span>
        {label && <span className="text-base font-bold text-ink-soft">{label}</span>}
      </div>
    </div>
  )
}
