import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { ChecklistItem } from '../api/types'
import { PageShell } from '../components/PageShell'
import { BigButton, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, Loading, inputClass } from '../components/ui'
import { useSound } from '../hooks/sound'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../theme/icons'
import { Bloomi } from '../components/mascot/Bloomi'
import { ProgressRing } from '../components/progress/ProgressRing'

export default function ChecklistPage() {
  const cid = Number(useParams().id)
  const nav = useNavigate()
  const sound = useSound()
  const { data: list, setData, loading, error, retry, reload } = useAsync(() => api.listChecklists().then((all) => all.find((c) => c.id === cid) ?? null), [cid])
  const [editing, setEditing] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [removeList, setRemoveList] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const celebrated = useRef(false)

  const allDone = !!list && list.items.length > 0 && list.items.every((i) => i.is_checked)
  useEffect(() => {
    if (allDone && !celebrated.current) { celebrated.current = true; sound.fanfare() }
    if (!allDone) celebrated.current = false
  }, [allDone]) // eslint-disable-line react-hooks/exhaustive-deps

  async function guard(fn: () => Promise<unknown>) {
    setErr(null)
    try { await fn() } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong'); void reload() }
  }
  const patchItems = (fn: (i: ChecklistItem) => ChecklistItem | null) => list && setData({ ...list, items: list.items.map(fn).filter(Boolean) as ChecklistItem[] })

  const toggle = (it: ChecklistItem) => {
    if (!it.is_checked) sound.tick()
    patchItems((i) => (i.id === it.id ? { ...i, is_checked: !i.is_checked } : i))       // optimistic
    void guard(() => api.updateChecklistItem(it.id, { is_checked: !it.is_checked }))
  }
  const reset = () => guard(async () => { patchItems((i) => ({ ...i, is_checked: false })); await api.resetChecklist(cid) })
  const add = () => {
    const text = newItem.trim(); if (!text || !list) return
    void guard(async () => { const it = await api.addChecklistItem(cid, { text, icon: 'check' }); setData({ ...list, items: [...list.items, it] }); setNewItem('') })
  }
  const remove = (it: ChecklistItem) => guard(async () => { patchItems((i) => (i.id === it.id ? null : i)); await api.deleteChecklistItem(it.id) })
  const setReminder = (v: string) => guard(async () => { if (list) setData({ ...list, reminder_time: v }); await api.updateChecklist(cid, { reminder_time: v }) })

  if (loading) return <PageShell title="…" back><Loading /></PageShell>
  if (error) return <PageShell title="Oops" backTo="/checklists"><ErrorState message={error} onRetry={retry} /></PageShell>
  if (!list) return <PageShell title="Not found" backTo="/checklists"><EmptyState pose="sleepy" title="I can't find that list" action={<BigButton onClick={() => nav('/checklists')}>Back</BigButton>} /></PageShell>

  const doneCount = list.items.filter((i) => i.is_checked).length
  const left = list.items.length - doneCount
  return (
    <PageShell title={list.name} backTo="/checklists"
      right={<BigButton size="sm" variant={editing ? 'primary' : 'secondary'} aria-pressed={editing} onClick={() => setEditing((e) => !e)}>{editing ? '✓ Done' : '✏️ Edit'}</BigButton>}>
      {err && <p role="alert" className="mb-3 rounded-btn bg-berry-light p-3 font-bold">{err}</p>}

      {allDone ? (
        <div role="status" className="mb-5 flex animate-pop items-center gap-4 rounded-card border-2 border-sage bg-mint-soft p-4">
          <Bloomi pose="happy" arms="up" size={96} />
          <p className="text-2xl font-extrabold text-sage-dark">All packed! Great remembering!</p>
        </div>
      ) : list.items.length > 0 && (
        <div className="mb-5 flex items-center gap-4 rounded-card border border-line bg-card p-4 shadow-soft">
          <ProgressRing size={76} stroke={10} value={doneCount / list.items.length} label={`${doneCount} of ${list.items.length} packed`}>
            <span className="text-lg font-extrabold tabular-nums">{doneCount}/{list.items.length}</span>
          </ProgressRing>
          <p className="text-xl font-extrabold" aria-live="polite">{left} thing{left === 1 ? '' : 's'} left to pack</p>
        </div>
      )}

      {list.items.length === 0 ? (
        <EmptyState pose="thinking" title="Nothing on this list" hint="Tap Edit to add the things you must remember." />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.items.map((it) => (
            <li key={it.id} className="flex items-center gap-2">
              <button role="checkbox" aria-checked={it.is_checked} onClick={() => !editing && toggle(it)} disabled={editing}
                className={`flex min-h-20 flex-1 items-center gap-4 rounded-card border-2 p-4 text-left transition-colors ${it.is_checked ? 'border-mint bg-mint-soft' : 'border-line bg-card shadow-soft hover:bg-lav-mist'}`}>
                <span className={`flex h-12 w-12 min-w-12 items-center justify-center rounded-xl border-4 text-3xl font-extrabold transition-colors ${it.is_checked ? 'border-sage bg-sage text-white' : 'border-ink-soft bg-card'}`} aria-hidden>
                  {it.is_checked ? <span className="animate-pop">✓</span> : ''}
                </span>
                <Icon name={it.icon} className="text-4xl" />
                <span className={`flex-1 text-2xl font-bold ${it.is_checked ? 'text-ink-soft line-through' : ''}`}>{it.text}</span>
                <span className="sr-only">{it.is_checked ? 'packed' : 'not packed yet'}</span>
              </button>
              {editing && <IconButton label={`Remove ${it.text}`} onClick={() => void remove(it)}>🗑️</IconButton>}
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="mt-6 flex flex-col gap-4">
          <form onSubmit={(e) => { e.preventDefault(); add() }} className="flex gap-2">
            <input aria-label="New item" className={`${inputClass} flex-1`} value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add something to remember…" maxLength={40} />
            <BigButton type="submit" disabled={!newItem.trim()}>Add</BigButton>
          </form>
          <Field label="Pack-up reminder time">
            <input type="time" className={inputClass} value={list.reminder_time ?? ''} onChange={(e) => void setReminder(e.target.value)} />
          </Field>
          <BigButton variant="danger" onClick={() => setRemoveList(true)}>Delete this list</BigButton>
        </div>
      ) : list.items.length > 0 && (
        <BigButton variant="secondary" className="mt-6 w-full" onClick={reset}>↺ Start over</BigButton>
      )}

      <ConfirmDialog open={removeList} title={`Delete “${list.name}”?`} confirmLabel="Yes, delete" onCancel={() => setRemoveList(false)}
        onConfirm={() => guard(async () => { await api.deleteChecklist(cid); nav('/checklists', { replace: true }) })} />
    </PageShell>
  )
}
