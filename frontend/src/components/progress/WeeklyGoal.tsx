import { useState } from 'react'
import { BigButton, Card } from '../ui'
import { ProgressRing } from './ProgressRing'

const KEY = 'bloomai-weekly-goal'
const load = () => { try { const n = Number(localStorage.getItem(KEY)); return n >= 1 && n <= 30 ? n : 5 } catch { return 5 } }

/** The goal is the child's own (or a parent's). It is saved on this device only and is never judged. */
export function WeeklyGoal({ done }: { done: number }) {
  const [goal, setGoal] = useState(load)
  const set = (n: number) => { const g = Math.max(1, Math.min(30, n)); setGoal(g); try { localStorage.setItem(KEY, String(g)) } catch { /* ignore */ } }
  const reached = done >= goal
  return (
    <Card>
      <p className="text-sm font-extrabold uppercase tracking-wide text-lav-deep">How is my week going?</p>
      <h2 className="mb-3 mt-1 text-2xl font-extrabold">My Weekly Goal</h2>
      <div className="flex items-center gap-4">
        <ProgressRing size={104} stroke={12} value={done / goal} color={reached ? 'var(--color-sun)' : 'var(--color-sage)'} label={`${done} of ${goal} tasks this week`}>
          <span className="text-3xl font-extrabold tabular-nums leading-none">{Math.min(done, goal)}</span>
          <span className="text-sm font-bold text-ink-soft">of {goal}</span>
        </ProgressRing>
        <p className="text-xl font-extrabold leading-snug" aria-live="polite">
          {reached ? 'Goal reached! Wonderful effort!' : done > 0 ? `${goal - done} more to reach your goal.` : 'Every task you finish fills the ring.'}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 rounded-2xl bg-lav-mist p-2">
        <span className="pl-2 text-base font-bold text-ink-soft">My goal: tasks per week</span>
        <span className="flex items-center gap-1">
          <BigButton size="sm" variant="secondary" aria-label="Lower my goal" disabled={goal <= 1} onClick={() => set(goal - 1)}>−</BigButton>
          <span className="w-8 text-center text-xl font-extrabold tabular-nums">{goal}</span>
          <BigButton size="sm" variant="secondary" aria-label="Raise my goal" disabled={goal >= 30} onClick={() => set(goal + 1)}>+</BigButton>
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">Your goal is saved on this device only.</p>
    </Card>
  )
}
