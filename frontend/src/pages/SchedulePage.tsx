import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Task } from '../api/types'
import { PageShell } from '../components/PageShell'
import { BigButton, ColorPicker, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, IconPicker, Loading, Modal, inputClass } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { getDoneToday } from '../lib/doneToday'
import { Icon, tint } from '../theme/icons'

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
    <PageShell title={`${sched.name}`} backTo="/" tint={tint(sched.color, 0.6)}
      right={<BigButton size="sm" variant={editing ? 'primary' : 'secondary'} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>{editing ? '✓ Done' : '✏️ Edit'}</BigButton>}>
      {err && <p role="alert" className="mb-3 rounded-btn bg-berry-light p-3 font-bold">{err}</p>}

      {sched.tasks.length === 0 ? (
        <EmptyState icon={sched.icon} title="Nothing here yet" hint="Add the things you do, in the order you do them." action={<BigButton onClick={addTask} icon="star">Add a task</BigButton>} />
      ) : (
        <ol className="flex flex-col gap-4">
          {sched.tasks.map((t, i) => {
            const isDone = done.includes(t.id)
            const card = (
              <>
                <span className="flex h-10 w-10 min-w-10 items-center justify-center rounded-full bg-white/80 text-lg font-extrabold">{isDone ? '✅' : i + 1}</span>
                <Icon name={t.icon} className="text-5xl sm:text-6xl" />
                <span className="min-w-0 flex-1">
                  <span className="block text-2xl font-extrabold">{t.title}</span>
                  <span className="text-ink-soft">about {Math.max(1, Math.round(t.expected_seconds / 60))} min · {t.steps.length} step{t.steps.length === 1 ? '' : 's'}</span>
                </span>
              </>
            )
            const style = { background: tint(sched.color, isDone ? 0.93 : 0.8), borderColor: sched.color }
            return (
              <li key={t.id} className="flex items-stretch gap-2">
                {editing ? (
                  <>
                    <div style={style} className="flex min-w-0 flex-1 items-center gap-3 rounded-card border-4 p-4">{card}</div>
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
                    className="flex min-h-28 flex-1 items-center gap-4 rounded-card border-4 p-4 transition-transform hover:scale-[1.01] active:scale-[0.98]">{card}</Link>
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
      ) : firstTodo ? (
        <BigButton size="lg" className="mt-6 w-full" onClick={() => nav(`/schedule/${sid}/task/${firstTodo.id}`)} icon="check">
          {done.length ? 'Next: ' : 'Start: '}{firstTodo.title}
        </BigButton>
      ) : sched.tasks.length > 0 ? (
        <p className="mt-6 text-center text-2xl font-extrabold text-sage-dark">🎉 All done for today!</p>
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
