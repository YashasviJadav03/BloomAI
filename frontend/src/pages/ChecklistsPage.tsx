import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PageShell } from '../components/PageShell'
import { TemplatePicker } from '../components/TemplatePicker'
import { BigButton, EmptyState, ErrorState, Loading } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../theme/icons'

export function fmtTime(hhmm: string | null) {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function ChecklistsPage() {
  const nav = useNavigate()
  const { data, loading, error, retry } = useAsync(() => api.listChecklists())
  const [picker, setPicker] = useState(false)
  return (
    <PageShell title="Never forget" backTo="/">
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={retry} /> : (data ?? []).length === 0 ? (
        <EmptyState icon="bag" title="No checklists yet" hint="Make a list of things to bring home or take to school."
          action={<BigButton onClick={() => setPicker(true)} icon="star">Pick a checklist</BigButton>} />
      ) : (
        <ul className="flex flex-col gap-4">
          {(data ?? []).map((c) => {
            const left = c.items.filter((i) => !i.checked).length
            return (
              <li key={c.id}>
                <Link to={`/checklists/${c.id}`} className="flex min-h-28 items-center gap-4 rounded-card border-4 border-sky bg-sky-light p-4 hover:brightness-95">
                  <Icon name={c.icon} className="text-6xl" />
                  <span className="flex-1">
                    <span className="block text-2xl font-extrabold">{c.name}</span>
                    <span className="text-ink-soft">{left === 0 && c.items.length > 0 ? '✅ All packed' : `${left} to pack`}{c.reminder_time ? ` · reminder ${fmtTime(c.reminder_time)}` : ''}</span>
                  </span>
                </Link>
              </li>
            )
          })}
          <li><BigButton variant="secondary" className="w-full" onClick={() => setPicker(true)}>➕ New checklist</BigButton></li>
        </ul>
      )}
      <TemplatePicker open={picker} type="checklist" onClose={() => setPicker(false)} onCreated={(id) => { setPicker(false); nav(`/checklists/${id}`) }} />
    </PageShell>
  )
}
