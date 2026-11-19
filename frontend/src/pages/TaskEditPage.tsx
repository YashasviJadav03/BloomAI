import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Step } from '../api/types'
import { PageShell } from '../components/PageShell'
import { BigButton, Card, EmptyState, ErrorState, Field, IconButton, IconPicker, Loading, inputClass } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { IconTile } from '../theme/icons'

/** Edit one task: title, picture, time, and its micro-steps (add, edit, remove, reorder). */
export default function TaskEditPage() {
  const sid = Number(useParams().id)
  const tid = Number(useParams().taskId)
  const nav = useNavigate()
  const { data: sched, loading, error, retry, reload } = useAsync(() => api.getSchedule(sid), [sid])
  const task = sched?.tasks.find((t) => t.id === tid)

  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('star')
  const [minutes, setMinutes] = useState(5)
  const [picking, setPicking] = useState(false)
  const [steps, setSteps] = useState<Step[]>([])
  const [newStep, setNewStep] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (task) { setTitle(task.title); setIcon(task.icon); setMinutes(Math.max(1, Math.round(task.expected_seconds / 60))); setSteps(task.steps) }
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function guard(fn: () => Promise<unknown>) {
    setErr(null)
    try { await fn() } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong'); void reload() }
  }
  const saveTask = () => guard(async () => {
    await api.updateTask(tid, { title: title.trim() || 'Task', icon, expected_seconds: Math.max(1, minutes) * 60 })
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  })
  const addStep = () => {
    const text = newStep.trim(); if (!text) return
    void guard(async () => { const st = await api.addStep(tid, { text, icon: 'check' }); setSteps((s) => [...s, st]); setNewStep('') })
  }
  const editStep = (st: Step, text: string) => guard(async () => { await api.updateStep(st.id, { text }) })
  const removeStep = (st: Step) => guard(async () => { setSteps((s) => s.filter((x) => x.id !== st.id)); await api.deleteStep(st.id) })
  // The backend does not renumber steps, so a move swaps the two `order` values explicitly.
  const moveStep = (i: number, dir: -1 | 1) => {
    const j = i + dir; if (j < 0 || j >= steps.length) return
    const a = steps[i], b = steps[j]
    const next = [...steps]
    next[i] = { ...b, order: a.order }; next[j] = { ...a, order: b.order }
    ;[next[i], next[j]] = [next[j], next[i]]
    setSteps(next)
    void guard(async () => { await api.updateStep(a.id, { order: b.order }); await api.updateStep(b.id, { order: a.order }) })
  }

  if (loading) return <PageShell title="…" back><Loading /></PageShell>
  if (error || !sched) return <PageShell title="Oops" back><ErrorState message={error} onRetry={retry} /></PageShell>
  if (!task) return <PageShell title="Not found" backTo={`/schedule/${sid}`}><EmptyState pose="sleepy" title="I can't find that task" action={<BigButton onClick={() => nav(`/schedule/${sid}`)}>Back</BigButton>} /></PageShell>

  return (
    <PageShell title="Edit task" backTo={`/schedule/${sid}`}>
      {err && <p role="alert" className="mb-3 rounded-btn bg-berry-light p-3 font-bold">{err}</p>}
      <Card className="mb-6">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => setPicking((p) => !p)} aria-label="Change picture" aria-expanded={picking} className="rounded-3xl focus-visible:outline-offset-2"><IconTile name={icon} color={sched.color} size="lg" /></button>
          <div className="min-w-0 flex-1"><Field label="Task name"><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} /></Field></div>
        </div>
        {picking && <div className="mb-4"><IconPicker value={icon} onChange={(v) => { setIcon(v); setPicking(false) }} /></div>}
        <Field label="How many minutes?">
          <div className="flex items-center gap-3">
            <IconButton label="Fewer minutes" onClick={() => setMinutes((m) => Math.max(1, m - 1))}>−</IconButton>
            <span className="w-24 text-center text-3xl font-extrabold tabular-nums">{minutes}</span>
            <IconButton label="More minutes" onClick={() => setMinutes((m) => Math.min(120, m + 1))}>+</IconButton>
          </div>
        </Field>
        <BigButton onClick={saveTask} className="w-full">{saved ? '✓ Saved' : 'Save task'}</BigButton>
      </Card>

      <h2 className="mb-1 text-2xl font-extrabold">Tiny steps</h2>
      <p className="mb-3 text-base text-ink-soft">Small steps are easier to start. Keep each one short.</p>
      {steps.length === 0 && <p className="mb-3 text-ink-soft">No steps yet. Add the first tiny step!</p>}
      <ol className="mb-4 flex flex-col gap-3">
        {steps.map((st, i) => (
          <li key={st.id} className="flex items-center gap-2">
            <span className="flex h-10 w-10 min-w-10 items-center justify-center rounded-full bg-lav-soft font-extrabold text-lav-ink">{i + 1}</span>
            <input aria-label={`Step ${i + 1}`} className={`${inputClass} min-w-0 flex-1`} defaultValue={st.text} maxLength={80} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== st.text) void editStep(st, v) }} />
            <IconButton label={`Move step ${i + 1} up`} disabled={i === 0} onClick={() => moveStep(i, -1)}>▲</IconButton>
            <IconButton label={`Move step ${i + 1} down`} disabled={i === steps.length - 1} onClick={() => moveStep(i, 1)}>▼</IconButton>
            <IconButton label={`Remove step ${i + 1}`} onClick={() => void removeStep(st)}>🗑️</IconButton>
          </li>
        ))}
      </ol>
      <form onSubmit={(e) => { e.preventDefault(); addStep() }} className="flex gap-2">
        <input aria-label="New step" className={`${inputClass} flex-1`} value={newStep} onChange={(e) => setNewStep(e.target.value)} placeholder="Add a tiny step…" maxLength={80} />
        <BigButton type="submit" disabled={!newStep.trim()}>Add</BigButton>
      </form>
    </PageShell>
  )
}
