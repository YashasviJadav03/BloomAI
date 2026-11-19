import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { PageShell } from '../components/PageShell'
import { TemplatePicker } from '../components/TemplatePicker'
import { BigButton, Card, EmptyState, ErrorState, Loading } from '../components/ui'
import { useApp } from '../hooks/app'
import { useAsync } from '../hooks/useAsync'
import { AVATARS, Icon, tint } from '../theme/icons'

const totalMin = (secs: number) => Math.max(1, Math.round(secs / 60))

export default function HomePage() {
  const { profile } = useApp()
  const nav = useNavigate()
  const sched = useAsync(() => api.listSchedules())
  const lists = useAsync(() => api.listChecklists())
  const [picker, setPicker] = useState(false)

  const nowHHMM = new Date().toTimeString().slice(0, 5)
  const due = (lists.data ?? []).filter((c) => c.reminder_time && c.reminder_time <= nowHHMM && c.items.length > 0 && c.items.some((i) => !i.checked))

  return (
    <PageShell title={`${AVATARS[profile?.avatar ?? 'fox'] ?? '🌱'} Hi, ${profile?.name ?? 'friend'}!`}>
      {due.length > 0 && (
        <Link to={`/checklists/${due[0].id}`} className="mb-5 flex items-center gap-4 rounded-card border-2 border-sun bg-sun-light p-4 animate-wiggle">
          <span className="text-4xl" aria-hidden>🎒</span>
          <span className="text-lg font-extrabold">Time to pack up! Check “{due[0].name}”</span>
        </Link>
      )}

      <h2 className="mb-3 text-xl font-extrabold text-ink-soft">My day</h2>
      {sched.loading ? <Loading /> : sched.error ? <ErrorState message={sched.error} onRetry={sched.retry} /> :
        (sched.data ?? []).length === 0 ? (
          <EmptyState icon="calendar" title="No schedules yet" hint="Pick a ready-made one and change it however you like."
            action={<BigButton onClick={() => setPicker(true)} icon="star">Pick a schedule</BigButton>} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {(sched.data ?? []).map((s) => {
              const secs = (s.tasks ?? []).reduce((a, t) => a + t.expected_seconds, 0)
              return (
                <li key={s.id}>
                  <Link to={`/schedule/${s.id}`} style={{ background: tint(s.color), borderColor: s.color }}
                    className="flex min-h-36 items-center gap-4 rounded-card border-4 p-5 transition-transform hover:scale-[1.02] active:scale-95">
                    <Icon name={s.icon} className="text-7xl" />
                    <span>
                      <span className="block text-3xl font-extrabold">{s.name}</span>
                      <span className="text-lg text-ink-soft">{(s.tasks ?? []).length} things · about {totalMin(secs)} min</span>
                    </span>
                  </Link>
                </li>
              )
            })}
            <li>
              <button onClick={() => setPicker(true)} className="flex min-h-36 w-full items-center justify-center gap-3 rounded-card border-4 border-dashed border-line bg-card p-5 text-xl font-bold text-ink-soft hover:bg-sage-light">
                <span className="text-4xl" aria-hidden>➕</span> New schedule
              </button>
            </li>
          </ul>
        )}

      <h2 className="mb-3 mt-8 text-xl font-extrabold text-ink-soft">Never forget</h2>
      {lists.loading ? <Loading label="Loading checklists…" /> : lists.error ? <ErrorState message={lists.error} onRetry={lists.retry} /> : (
        <Link to="/checklists" className="block">
          <Card className="flex items-center gap-4 hover:bg-sage-light">
            <span className="text-5xl" aria-hidden>🎒</span>
            <span className="flex-1">
              <span className="block text-2xl font-extrabold">My checklists</span>
              <span className="text-ink-soft">{(lists.data ?? []).length} list{(lists.data ?? []).length === 1 ? '' : 's'}</span>
            </span>
            <span className="text-3xl" aria-hidden>›</span>
          </Card>
        </Link>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <BigButton variant="secondary" icon="cloud" onClick={() => nav('/calm')}>Calm break</BigButton>
        <BigButton variant="secondary" icon="star" onClick={() => nav('/progress')}>My progress</BigButton>
        <BigButton variant="secondary" icon="pencil" onClick={() => nav('/workspace')}>Focus desk</BigButton>
      </div>

      <TemplatePicker open={picker} type="schedule" onClose={() => setPicker(false)} onCreated={(id) => { setPicker(false); nav(`/schedule/${id}`) }} />
    </PageShell>
  )
}
