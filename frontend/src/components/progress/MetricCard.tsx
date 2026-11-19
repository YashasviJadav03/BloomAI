import type { ReactNode } from 'react'
import { Icon } from '../../theme/icons'

/** One meaningful number with a short label and (optional) one-line context. */
export function MetricCard({ icon, tint = 'lav', value, label, hint, children }: {
  icon: string
  tint?: 'lav' | 'mint' | 'peach' | 'sky'
  value: ReactNode
  label: string
  hint?: string
  children?: ReactNode
}) {
  const bg = { lav: 'bg-lav-soft', mint: 'bg-mint-soft', peach: 'bg-sun-light', sky: 'bg-sky-light' }[tint]
  return (
    <div className="rounded-card border border-line bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${bg}`}><Icon name={icon} /></span>
        <div className="min-w-0">
          <p className="text-3xl font-extrabold leading-none tabular-nums">{value}</p>
          <p className="mt-1 text-base font-bold text-ink-soft">{label}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-base text-ink-soft">{hint}</p>}
      {children}
    </div>
  )
}
