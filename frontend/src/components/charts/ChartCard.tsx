import type { ReactNode } from 'react'
import { Card } from '../ui'

/** Every chart starts from a question the child might ask, and ends with a plain-language footnote. */
export function ChartCard({ question, title, controls, footnote, children }: {
  question: string
  title: string
  controls?: ReactNode
  footnote?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-sm font-extrabold uppercase tracking-wide text-lav-deep">{question}</p>
      <div className="mb-4 mt-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        {controls}
      </div>
      {children}
      {footnote && <p className="mt-4 rounded-2xl bg-lav-mist p-3 text-base text-ink-soft">{footnote}</p>}
    </Card>
  )
}
