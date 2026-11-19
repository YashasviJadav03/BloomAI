// Tiny synthesised sounds (Web Audio), so there are no audio files to ship or license.
// Every play function is a no-op when muted. Browsers need a user gesture first; all our
// sounds are triggered by taps, so that is fine.
import { useCallback, useRef } from 'react'
import { useSettings } from './settings'

type Note = [freq: number, start: number, dur: number]

export function useSound() {
  const { muted } = useSettings()
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback((notes: Note[], type: OscillatorType = 'sine', gain = 0.15) => {
    if (muted) return
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AC) return
      const ctx = (ctxRef.current ??= new AC())
      if (ctx.state === 'suspended') void ctx.resume()
      const t0 = ctx.currentTime
      for (const [freq, start, dur] of notes) {
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        osc.type = type
        osc.frequency.value = freq
        g.gain.setValueAtTime(0, t0 + start)
        g.gain.linearRampToValueAtTime(gain, t0 + start + 0.02)
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur)
        osc.connect(g).connect(ctx.destination)
        osc.start(t0 + start)
        osc.stop(t0 + start + dur + 0.05)
      }
    } catch { /* sound is a nice-to-have, never crash */ }
  }, [muted])

  return {
    /** Short happy ding after a step. */
    ding: useCallback(() => play([[784, 0, 0.18], [1175, 0.1, 0.3]]), [play]),
    /** Bigger fanfare when a whole task is finished. */
    fanfare: useCallback(() => play([[523, 0, 0.2], [659, 0.12, 0.2], [784, 0.24, 0.2], [1047, 0.36, 0.5]], 'triangle'), [play]),
    /** Soft bell: timer finished (gentle, not alarming). */
    bell: useCallback(() => play([[659, 0, 0.6], [523, 0.35, 0.9]], 'sine', 0.12), [play]),
    /** Soft tick when ticking a checklist item. */
    tick: useCallback(() => play([[880, 0, 0.09]], 'sine', 0.1), [play]),
  }
}
