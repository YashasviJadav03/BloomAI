import { useState } from 'react'
import { api } from '../api/client'
import type { Template } from '../api/types'
import { useAsync } from '../hooks/useAsync'
import { IconTile } from '../theme/icons'
import { BigButton, ErrorState, Loading, Modal } from './ui'

function summary(t: Template) {
  if (t.type === 'schedule') {
    const tasks = t.data.tasks ?? []
    const mins = Math.round(tasks.reduce((s, x) => s + (x.expected_seconds ?? 0), 0) / 60)
    return `${tasks.length} thing${tasks.length === 1 ? '' : 's'}${mins ? ` · about ${mins} min` : ''}`
  }
  const n = (t.data.items ?? []).length
  return `${n} thing${n === 1 ? '' : 's'} to remember`
}

/** Pick a preset template (or start blank). Calls onCreated with the new item's id. */
export function TemplatePicker({ open, type, onClose, onCreated }: { open: boolean; type: 'schedule' | 'checklist'; onClose: () => void; onCreated: (id: number) => void }) {
  const { data, loading, error, retry } = useAsync(() => (open ? api.templates(type) : Promise.resolve([] as Template[])), [open, type])
  const [busy, setBusy] = useState<number | 'blank' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function create(templateId?: number) {
    setBusy(templateId ?? 'blank'); setErr(null)
    try {
      const made = type === 'schedule'
        ? await api.createSchedule(templateId ? { template_id: templateId } : { name: 'My new schedule', color: '#6AA9D8', icon: 'star' })
        : await api.createChecklist(templateId ? { template_id: templateId } : { name: 'My new checklist' })
      onCreated(made.id)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong') } finally { setBusy(null) }
  }

  return (
    <Modal open={open} onClose={onClose} title={type === 'schedule' ? 'Pick a routine' : 'Pick a checklist'}>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={retry} /> : (
        <div className="flex flex-col gap-3">
          {(data ?? []).map((t) => (
            <button key={t.id} disabled={busy !== null} onClick={() => void create(t.id)}
              className="flex min-h-20 items-center gap-4 rounded-card border-2 border-line bg-card p-3 text-left shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60">
              <IconTile name={t.icon} color={t.color || '#9B8AD1'} size="md" />
              <span><span className="block text-xl font-extrabold">{t.name}</span><span className="text-base text-ink-soft">{summary(t)}</span></span>
            </button>
          ))}
          <BigButton variant="secondary" disabled={busy !== null} onClick={() => void create()} icon="pencil">Start from blank</BigButton>
          {err && <p role="alert" className="font-bold text-berry">{err}</p>}
        </div>
      )}
    </Modal>
  )
}
