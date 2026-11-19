import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { Schedule } from '../api/types'
import { DailyJourney, buildJourney } from '../components/journey/DailyJourney'
import { Bloomi } from '../components/mascot/Bloomi'
import { PageShell } from '../components/PageShell'
import { ProgressRing } from '../components/progress/ProgressRing'
import { TemplatePicker } from '../components/TemplatePicker'
import { BigButton, Card, EmptyState, ErrorState, Loading, SectionHeading } from '../components/ui'
import { useApp } from '../hooks/app'
import { useAsync } from '../hooks/useAsync'
import { gardenState } from '../lib/garden'
import { getDoneToday } from '../lib/doneToday'
import { IconTile } from '../theme/icons'

const mins = (secs: number) => Math.max(1, Math.round(secs / 60))
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }

export default function HomePage() {
  const { profile } = useApp()
  const nav = useNavigate()
  const sched = useAsync(() => api.listSchedules())
  const lists = useAsync(() => api.listChecklists())
  const prog = useAsync(() => api.progressSummary())
  const [picker, setPicker] = useState(false)
  const doneIds = useMemo(() => getDoneToday(), [])

  const schedules = sched.data ?? []
  // The routine to show is the first one that still has something to do today.
  const current: Schedule | undefined = schedules.find((s) => s.tasks.length > 0 && buildJourney(s, doneIds).some((i) => i.state !== 'done')) ?? schedules[0]
  const nextTask = current ? buildJourney(current, doneIds).find((i) => i.state === 'current')?.task : undefined
  const others = schedules.filter((s) => s.id !== current?.id)

  const nowHHMM = new Date().toTimeString().slice(0, 5)
  const due = (lists.data ?? []).filter((c) => c.reminder_time && c.reminder_time <= nowHHMM && c.items.some((i) => !i.is_checked))
  const garden = prog.data ? gardenState(prog.data.total_points, prog.data.best_streak) : null

  return (
    <PageShell title={`${greeting()}, ${profile?.name ?? 'friend'}!`}>
      <section className="mb-6 flex items-center gap-4 rounded-card bg-lav-soft p-4 sm:p-5">
        <Bloomi pose={nextTask ? 'welcome' : 'happy'} arms={nextTask ? 'wave' : 'up'} size={112} animate="idle" />
        <p className="text-xl font-extrabold leading-snug text-lav-ink">
          {sched.loading ? 'Let me see your day…' : nextTask ? 'Ready when you are. One small step at a time.' : schedules.length ? 'You have done everything for today. Lovely work!' : 'Hi! Let’s set up your first routine.'}
        </p>
      </section>

      {due.length > 0 && (
        <Link to={`/checklists/${due[0].id}`} className="mb-6 flex min-h-16 items-center gap-4 rounded-card border-2 border-sun bg-sun-light p-4">
          <span className="text-4xl" aria-hidden>🎒</span>
          <span className="text-lg font-extrabold">Time to pack up! Open “{due[0].name}”</span>
        </Link>
      )}

      {sched.loading ? <Loading /> : sched.error ? <ErrorState message={sched.error} onRetry={sched.retry} /> :
        schedules.length === 0 ? (
          <EmptyState pose="thinking" title="No routines yet" hint="Pick a ready-made one and change it however you like."
            action={<BigButton size="lg" onClick={() => setPicker(true)} icon="sparkles">Pick a routine</BigButton>} />
        ) : current && (
          <section aria-labelledby="journey-h">
            <SectionHeading title="My day" hint={current.name} className="" />
            <h2 id="journey-h" className="sr-only">My day: {current.name}</h2>
            <DailyJourney schedule={current} doneIds={doneIds} compact
              action={(t) => (
                <BigButton size="lg" variant="sun" className="w-full" icon="rocket" onClick={() => nav(`/schedule/${current.id}/task/${t.id}`)}>Start</BigButton>
              )} />
            <Link to={`/schedule/${current.id}`} className="mt-1 inline-flex min-h-12 items-center text-lg font-extrabold text-lav-deep underline-offset-4 hover:underline">See the whole routine ›</Link>
          </section>
        )}

      {others.length > 0 && (
        <section className="mt-8">
          <SectionHeading title="Other routines" />
          <ul className="grid gap-3 sm:grid-cols-2">
            {others.map((s) => (
              <li key={s.id}>
                <Link to={`/schedule/${s.id}`} className="flex min-h-20 items-center gap-4 rounded-card border border-line bg-card p-3 shadow-soft transition-transform hover:-translate-y-0.5">
                  <IconTile name={s.icon} color={s.color} />
                  <span className="min-w-0"><span className="block truncate text-xl font-extrabold">{s.name}</span>
                    <span className="text-base text-ink-soft">{s.tasks.length} thing{s.tasks.length === 1 ? '' : 's'} · about {mins(s.tasks.reduce((a, t) => a + t.expected_seconds, 0))} min</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {schedules.length > 0 && <div className="mt-4"><BigButton variant="ghost" icon="sparkles" onClick={() => setPicker(true)}>Add a routine</BigButton></div>}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/progress" className="block">
          <Card className="flex h-full items-center gap-4 transition-transform hover:-translate-y-0.5">
            <ProgressRing size={84} stroke={10} value={garden?.nextPointsProgress ?? 0} label="Progress to your next garden reward">
              <span className="text-2xl" aria-hidden>🌱</span>
            </ProgressRing>
            <span className="min-w-0">
              <span className="block text-xl font-extrabold">My garden</span>
              {prog.data ? (
                <span className="text-base text-ink-soft">{prog.data.total_points} points · {prog.data.current_streak}-day streak{garden?.nextPoints ? ` · ${garden.pointsToNext} to next flower` : ''}</span>
              ) : <span className="text-base text-ink-soft">{prog.error ? 'Open to see your garden' : 'Loading…'}</span>}
            </span>
          </Card>
        </Link>
        <Link to="/checklists" className="block">
          <Card className="flex h-full items-center gap-4 transition-transform hover:-translate-y-0.5">
            <IconTile name="backpack" color="#6AA9D8" size="lg" />
            <span><span className="block text-xl font-extrabold">Pack-up lists</span>
              <span className="text-base text-ink-soft">{lists.data ? `${lists.data.length} list${lists.data.length === 1 ? '' : 's'}` : lists.error ? 'Tap to open' : 'Loading…'}</span></span>
          </Card>
        </Link>
      </section>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <BigButton variant="soft" icon="cloud" onClick={() => nav('/calm')}>Calm break</BigButton>
        <BigButton variant="soft" icon="pencil" onClick={() => nav('/workspace')}>Focus desk</BigButton>
      </div>

      <TemplatePicker open={picker} type="schedule" onClose={() => setPicker(false)} onCreated={(id) => { setPicker(false); nav(`/schedule/${id}`) }} />
    </PageShell>
  )
}
