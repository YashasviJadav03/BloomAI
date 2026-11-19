import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { ChecklistItem } from '../api/types'
import { PageShell } from '../components/PageShell'
import { BigButton, ConfirmDialog, EmptyState, ErrorState, Field, IconButton, Loading, inputClass } from '../components/ui'
import { useSound } from '../hooks/sound'
import { useAsync } from '../hooks/useAsync'
import { Icon } from '../theme/icons'

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

  const allDone = !!list && list.items.length > 0 && list.items.every((i) => i.checked)
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
    if (!it.checked) sound.tick()
    patchItems((i) => (i.id === it.id ? { ...i, checked: !i.checked } : i))       // optimistic
    void guard(() => api.updateChecklistItem(it.id, { checked: !it.checked }))
  }
  const reset = () => guard(async () => { patchItems((i) => ({ ...i, checked: false })); await api.resetChecklist(cid) })
  const add = () => {
    const text = newItem.trim(); if (!text || !list) return
    void guard(async () => { const it = await api.addChecklistItem(cid, { text, icon: 'check' }); setData({ ...list, items: [...list.items, it] }); setNewItem('') })
  }
  const remove = (it: ChecklistItem) => guard(async () => { patchItems((i) => (i.id === it.id ? null : i)); await api.deleteChecklistItem(it.id) })
  const setReminder = (v: string) => guard(async () => { if (list) setData({ ...list, reminder_time: v || null }); await api.updateChecklist(cid, { reminder_time: v || null }) })

  if (loading) return <PageShell title="…" back><Loading /></PageShell>
  if (error) return <PageShell title="Oops" backTo="/checklists"><ErrorState message={error} onRetry={retry} /></PageShell>
  if (!list) return <PageShell title="Not found" backTo="/checklists"><EmptyState icon="cloud" title="I can't find that list" action={<BigButton onClick={() => nav('/checklists')}>Back</BigButton>} /></PageShell>

  const left = list.items.filter((i) => !i.checked).length
  return (
    <PageShell title={list.name} backTo="/checklists" tint="var(--color-sky-light)"
      right={<BigButton size="sm" variant={editing ? 'primary' : 'secondary'} aria-pressed={editing} onClick={() => setEditing((e) => !e)}>{editing ? '✓ Done' : '✏️ Edit'}</BigButton>}>
      {err && <p role="alert" className="mb-3 rounded-btn bg-berry-light p-3 font-bold">{err}</p>}

      {allDone && (
        <div role="status" className="mb-5 animate-pop rounded-card border-4 border-sage bg-sage-light p-5 text-center">
          <p className="text-5xl" aria-hidden>🎒✨</p>
          <p className="mt-1 text-2xl font-extrabold">All packed! Great remembering!</p>
        </div>
      )}
      {!allDone && list.items.length > 0 && <p className="mb-3 text-lg font-bold text-ink-soft" aria-live="polite">{left} thing{left === 1 ? '' : 's'} left to pack</p>}

      {list.items.length === 0 ? (
        <EmptyState icon="bag" title="Nothing on this list" hint="Tap Edit to add the things you must remember." />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.items.map((it) => (
            <li key={it.id} className="flex items-center gap-2">
              <button role="checkbox" aria-checked={it.checked} onClick={() => !editing && toggle(it)} disabled={editing}
                className={`flex min-h-20 flex-1 items-center gap-4 rounded-card border-4 p-4 text-left transition-colors ${it.checked ? 'border-sage bg-sage-light' : 'border-line bg-card hover:bg-sky-light'}`}>
                <span className={`flex h-12 w-12 min-w-12 items-center justify-center rounded-xl border-4 text-3xl font-extrabold ${it.checked ? 'border-sage bg-sage text-white' : 'border-ink-soft bg-card'}`} aria-hidden>{it.checked ? '✓' : ''}</span>
                <Icon name={it.icon} className="text-4xl" />
                <span className={`text-2xl font-bold ${it.checked ? 'text-ink-soft line-through' : ''}`}>{it.text}</span>
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
