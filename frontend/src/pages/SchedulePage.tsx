import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Task } from '../api/types'
import { PageShell } from '../components/PageShell'
import { BigButton, ColorPicker, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, IconPicker, Loading, Modal, inputClass } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { getDoneToday } from '../lib/doneToday'
import { IconTile, tint } from '../theme/icons'
import { Bloomi } from '../components/mascot/Bloomi'
import { DailyJourney } from '../components/journey/DailyJourney'

export default function SchedulePage() {
  const sid = Number(useParams().id)
  const nav = useNavigate()
  const { data: sched, setData, loading, error, retry, reload } = useAsync(() => api.getSchedule(sid), [sid])
  const [editing, setEditing] = useState(false)
  const [meta, setMeta] = useState(false)
  const [removeTask, setRemoveTask] = useState<Task | null>(null)
  const [removeSched, setRemoveSched] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const done = getDoneToday()

  async function guard(fn: () => Promise<unknown>) {
    setErr(null)
    try { await fn() } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong'); void reload() }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!sched) return
    const tasks = [...sched.tasks]
    const j = index + dir
    if (j < 0 || j >= tasks.length) return
    ;[tasks[index], tasks[j]] = [tasks[j], tasks[index]]
    setData({ ...sched, tasks })                                   // optimistic
    await guard(() => api.reorderTasks(sid, tasks.map((t) => t.id)))
  }
  async function addTask() {
    await guard(async () => {
      const t = await api.addTask(sid, { title: 'New task', icon: 'star', expected_seconds: 300 })
      nav(`/schedule/${sid}/task/${t.id}/edit`)
    })
  }

  if (loading) return <PageShell title="…" back><Loading /></PageShell>
  if (error || !sched) return <PageShell title="Oops" backTo="/"><ErrorState message={error} onRetry={retry} /></PageShell>

  const firstTodo = sched.tasks.find((t) => !done.includes(t.id))
  return (
    <PageShell title={sched.name} subtitle={editing ? 'Edit mode' : undefined} backTo="/"
      right={<BigButton size="sm" variant={editing ? 'primary' : 'secondary'} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>{editing ? '✓ Done' : '✏️ Edit'}</BigButton>}>
      {err && <p role="alert" className="mb-3 rounded-btn bg-berry-light p-3 font-bold">{err}</p>}

      {sched.tasks.length === 0 ? (
        <EmptyState pose="thinking" title="Nothing here yet" hint="Add the things you do, in the order you do them." action={<BigButton onClick={addTask} icon="star">Add a task</BigButton>} />
      ) : !editing ? (
        <DailyJourney schedule={sched} doneIds={done}
          action={(t) => <BigButton size="lg" variant="sun" className="w-full" icon="rocket" onClick={() => nav(`/schedule/${sid}/task/${t.id}`)}>Start</BigButton>} />
      ) : (
        <ol className="flex flex-col gap-3">
          {sched.tasks.map((t, i) => {
            const isDone = done.includes(t.id)
            const card = (
              <>
                <IconTile name={t.icon} color={sched.color} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xl font-extrabold">{t.title}</span>
                  <span className="text-base text-ink-soft">about {Math.max(1, Math.round(t.expected_seconds / 60))} min · {t.steps.length} step{t.steps.length === 1 ? '' : 's'}{isDone ? ' · done today' : ''}</span>
                </span>
              </>
            )
            const style = { borderColor: tint(sched.color, 0.5) }
            return (
              <li key={t.id} className="flex items-stretch gap-2">
                {editing ? (
                  <>
                    <div style={style} className="flex min-w-0 flex-1 items-center gap-3 rounded-card border-2 bg-card p-3 shadow-soft">{card}</div>
                    <div className="flex flex-col justify-between gap-1">
                      <div className="flex gap-1">
                        <IconButton label={`Move ${t.title} up`} disabled={i === 0} onClick={() => void move(i, -1)}>▲</IconButton>
                        <IconButton label={`Move ${t.title} down`} disabled={i === sched.tasks.length - 1} onClick={() => void move(i, 1)}>▼</IconButton>
                      </div>
                      <div className="flex gap-1">
                        <IconButton label={`Edit ${t.title}`} onClick={() => nav(`/schedule/${sid}/task/${t.id}/edit`)}>✏️</IconButton>
                        <IconButton label={`Remove ${t.title}`} onClick={() => setRemoveTask(t)}>🗑️</IconButton>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link to={`/schedule/${sid}/task/${t.id}`} style={style}
                    className="flex min-h-20 flex-1 items-center gap-4 rounded-card border-2 bg-card p-3">{card}</Link>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {editing ? (
        <div className="mt-6 flex flex-col gap-3">
          <BigButton variant="secondary" onClick={addTask} icon="star">Add a task</BigButton>
          <BigButton variant="secondary" onClick={() => setMeta(true)} icon="paint">Change name, colour and picture</BigButton>
          <BigButton variant="danger" onClick={() => setRemoveSched(true)}>Delete this schedule</BigButton>
        </div>
      ) : sched.tasks.length > 0 && !firstTodo ? (
        <div className="mt-4 flex items-center gap-4 rounded-card bg-mint-soft p-4">
          <Bloomi pose="sleepy" size={90} />
          <p className="text-xl font-extrabold text-sage-dark">All done for today. Time to rest!</p>
        </div>
      ) : null}

      <ScheduleMetaModal open={meta} onClose={() => setMeta(false)} initial={{ name: sched.name, color: sched.color, icon: sched.icon }}
        onSave={(v) => guard(async () => { setData({ ...sched, ...v }); await api.updateSchedule(sid, v); setMeta(false) })} />
      <ConfirmDialog open={!!removeTask} title={`Remove “${removeTask?.title}”?`} message="Its steps will go too." onCancel={() => setRemoveTask(null)}
        onConfirm={() => guard(async () => { const id = removeTask!.id; setRemoveTask(null); setData({ ...sched, tasks: sched.tasks.filter((t) => t.id !== id) }); await api.deleteTask(id) })} />
      <ConfirmDialog open={removeSched} title={`Delete “${sched.name}”?`} message="All the tasks in it will go too." confirmLabel="Yes, delete" onCancel={() => setRemoveSched(false)}
        onConfirm={() => guard(async () => { await api.deleteSchedule(sid); nav('/', { replace: true }) })} />
    </PageShell>
  )
}

function ScheduleMetaModal({ open, onClose, initial, onSave }: { open: boolean; onClose: () => void; initial: { name: string; color: string; icon: string }; onSave: (v: { name: string; color: string; icon: string }) => void }) {
  const [v, setV] = useState(initial)
  return (
    <Modal open={open} onClose={onClose} title="My schedule">
      <form onSubmit={(e) => { e.preventDefault(); if (v.name.trim()) onSave({ ...v, name: v.name.trim() }) }}>
        <Field label="Name"><input className={inputClass} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} maxLength={30} /></Field>
        <p className="mb-2 font-bold text-ink-soft">Colour</p><div className="mb-4"><ColorPicker value={v.color} onChange={(color) => setV({ ...v, color })} /></div>
        <p className="mb-2 font-bold text-ink-soft">Picture</p><div className="mb-5"><IconPicker value={v.icon} onChange={(icon) => setV({ ...v, icon })} /></div>
        <BigButton type="submit" className="w-full">Save</BigButton>
      </form>
    </Modal>
  )
}
