import type { ReactNode } from 'react'
import { IconTile } from '../../theme/icons'

export type MilestoneState = 'done' | 'current' | 'upcoming'

/** One stop on the Daily Journey. Current is large and warm; done is marked with a check AND a word; upcoming is quiet. */
export function JourneyMilestone({ state, title, icon, color, minutes, last, action }: {
  state: MilestoneState
  title: string
  icon: string
  color: string
  minutes: number
  last?: boolean
  action?: ReactNode
}) {
  const current = state === 'current'
  return (
    <li className="relative flex gap-4" aria-current={current ? 'step' : undefined}>
      <div className="flex w-12 shrink-0 flex-col items-center">
        <span className={`relative z-10 flex items-center justify-center rounded-full border-4 font-extrabold ${
          state === 'done' ? 'h-10 w-10 border-sage bg-sage text-white'
          : current ? 'h-12 w-12 border-sun bg-card text-sun-deep shadow-soft'
          : 'h-9 w-9 border-line bg-lav-mist text-ink-soft'}`}>
          {state === 'done' ? <span aria-hidden>✓</span> : current ? <span aria-hidden className="h-4 w-4 rounded-full bg-sun" /> : null}
        </span>
        {!last && <span className={`w-1 grow rounded-full ${state === 'done' ? 'bg-mint' : 'bg-line'}`} aria-hidden />}
      </div>
      <div className={`mb-4 min-w-0 flex-1 rounded-card border p-4 ${
        current ? 'border-sun bg-sun-light shadow-soft' : state === 'done' ? 'border-mint bg-mint-soft/60' : 'border-line bg-card/70'}`}>
        <div className="flex items-center gap-3">
          <IconTile name={icon} color={color} size={current ? "lg" : "md"} />
          <div className="min-w-0 flex-1">
            <p className={`truncate font-extrabold ${current ? 'text-xl' : 'text-lg'} ${state === 'upcoming' ? 'text-ink-soft' : ''}`}>{title}</p>
            <p className="text-base text-ink-soft">
              {state === 'done' ? 'Done today' : state === 'current' ? 'Up next for you' : 'Later'} · about {minutes} min
            </p>
          </div>
        </div>
        {current && action && <div className="mt-3">{action}</div>}
      </div>
    </li>
  )
}
