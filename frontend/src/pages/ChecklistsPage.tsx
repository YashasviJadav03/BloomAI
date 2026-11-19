import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PageShell } from '../components/PageShell'
import { ProgressRing } from '../components/progress/ProgressRing'
import { TemplatePicker } from '../components/TemplatePicker'
import { BigButton, EmptyState, ErrorState, Loading } from '../components/ui'
import { useAsync } from '../hooks/useAsync'

export function fmtTime(hhmm: string | null | undefined) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function ChecklistsPage() {
  const nav = useNavigate()
  const { data, loading, error, retry } = useAsync(() => api.listChecklists())
  const [picker, setPicker] = useState(false)
  return (
    <PageShell title="Pack-up lists" subtitle="Things to remember before you go">
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={retry} /> : (data ?? []).length === 0 ? (
        <EmptyState pose="thinking" title="No lists yet" hint="Make a list of things to bring home or take to school."
          action={<BigButton onClick={() => setPicker(true)} icon="backpack">Pick a checklist</BigButton>} />
      ) : (
        <ul className="flex flex-col gap-4">
          {(data ?? []).map((c) => {
            const done = c.items.filter((i) => i.is_checked).length
            const all = c.items.length > 0 && done === c.items.length
            return (
              <li key={c.id}>
                <Link to={`/checklists/${c.id}`} className="flex min-h-28 items-center gap-4 rounded-card border border-line bg-card p-4 shadow-soft transition-transform hover:-translate-y-0.5">
                  <ProgressRing size={72} stroke={9} value={c.items.length ? done / c.items.length : 0} color="var(--color-sage)" label={`${done} of ${c.items.length} packed`}>
                    <span className="text-lg font-extrabold tabular-nums">{done}/{c.items.length}</span>
                  </ProgressRing>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-2xl font-extrabold">{c.name}</span>
                    <span className="text-base text-ink-soft">{all ? '✓ All packed' : `${c.items.length - done} left to pack`}{c.reminder_time ? ` · reminder ${fmtTime(c.reminder_time)}` : ''}</span>
                  </span>
                  <span className="text-3xl text-lav" aria-hidden>›</span>
                </Link>
              </li>
            )
          })}
          <li><BigButton variant="secondary" className="w-full" icon="sparkles" onClick={() => setPicker(true)}>New checklist</BigButton></li>
        </ul>
      )}
      <TemplatePicker open={picker} type="checklist" onClose={() => setPicker(false)} onCreated={(id) => { setPicker(false); nav(`/checklists/${id}`) }} />
    </PageShell>
  )
}
