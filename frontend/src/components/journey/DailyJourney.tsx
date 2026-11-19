import { useMemo, type ReactNode } from 'react'
import type { Schedule, Task } from '../../api/types'
import { JourneyMilestone, type MilestoneState } from './JourneyMilestone'

export interface JourneyItem { task: Task; state: MilestoneState }

/** Pure helper: first not-done task is "current". Uses the device-local done list (the API has no per-task done flag). */
export function buildJourney(schedule: Schedule, doneIds: number[]): JourneyItem[] {
  const tasks = [...schedule.tasks].sort((a, b) => a.order - b.order)
  const firstOpen = tasks.findIndex((t) => !doneIds.includes(t.id))
  return tasks.map((task, i) => ({ task, state: doneIds.includes(task.id) ? 'done' : i === firstOpen ? 'current' : 'upcoming' }))
}

export function remainingMinutes(items: JourneyItem[]) {
  return Math.max(1, Math.round(items.filter((i) => i.state !== 'done').reduce((s, i) => s + i.task.expected_seconds, 0) / 60))
}

/** compact: collapses finished tasks and shows only the current + the next couple, so it never turns into a long list. */
export function DailyJourney({ schedule, doneIds, compact, action }: { schedule: Schedule; doneIds: number[]; compact?: boolean; action?: (task: Task) => ReactNode }) {
  const items = useMemo(() => buildJourney(schedule, doneIds), [schedule, doneIds])
  const done = items.filter((i) => i.state === 'done')
  const open = items.filter((i) => i.state !== 'done')
  const shown = compact ? open.slice(0, 3) : items
  const hiddenOpen = compact ? open.length - shown.length : 0

  if (items.length === 0) return null
  return (
    <div>
      {compact && done.length > 0 && (
        <p className="mb-3 flex items-center gap-2 rounded-2xl bg-mint-soft px-4 py-2 text-lg font-bold text-sage-dark">
          <span aria-hidden>✓</span> {done.length} of {items.length} done today. Nice work!
        </p>
      )}
      {open.length === 0 ? (
        <p className="rounded-card bg-mint-soft p-5 text-center text-xl font-extrabold text-sage-dark">Everything in this routine is done. Time to rest!</p>
      ) : (
        <ol aria-label={`${schedule.name} journey`}>
          {shown.map((it, i) => (
            <JourneyMilestone key={it.task.id} state={it.state} title={it.task.title} icon={it.task.icon} color={schedule.color}
              minutes={Math.max(1, Math.round(it.task.expected_seconds / 60))} last={i === shown.length - 1 && hiddenOpen === 0}
              action={it.state === 'current' ? action?.(it.task) : undefined} />
          ))}
          {hiddenOpen > 0 && <li className="pl-16 text-lg font-bold text-ink-soft">+ {hiddenOpen} more later</li>}
        </ol>
      )}
      {open.length > 0 && <p className="mt-1 text-base text-ink-soft">About {remainingMinutes(items)} min left in this routine</p>}
    </div>
  )
}
