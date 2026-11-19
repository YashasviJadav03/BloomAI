import { useState } from 'react'
import { api } from '../api/client'
import type { Template } from '../api/types'
import { useAsync } from '../hooks/useAsync'
import { Icon, tint } from '../theme/icons'
import { BigButton, ErrorState, Loading, Modal } from './ui'

/** Pick a preset template (or start blank). Calls onCreate with the new item's id. */
export function TemplatePicker({ open, type, onClose, onCreated }: { open: boolean; type: 'schedule' | 'checklist'; onClose: () => void; onCreated: (id: number) => void }) {
  const { data, loading, error, retry } = useAsync(() => (open ? api.templates(type) : Promise.resolve([] as Template[])), [open, type])
  const [busy, setBusy] = useState<number | 'blank' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function create(templateId?: number) {
    setBusy(templateId ?? 'blank'); setErr(null)
    try {
      const made = type === 'schedule'
        ? await api.createSchedule(templateId ? { template_id: templateId } : { name: 'My new schedule', color: '#6AA9D8', icon: 'star' })
        : await api.createChecklist(templateId ? { name: '', template_id: templateId } : { name: 'My new checklist', icon: 'check' })
      onCreated(made.id)
    } catch (e) { setErr(e instanceof Error ? e.message : 'Something went wrong') } finally { setBusy(null) }
  }

  return (
    <Modal open={open} onClose={onClose} title={type === 'schedule' ? 'Pick a schedule' : 'Pick a checklist'}>
      {loading ? <Loading /> : error ? <ErrorState message={error} onRetry={retry} /> : (
        <div className="flex flex-col gap-3">
          {(data ?? []).map((t) => (
            <button key={t.id} disabled={busy !== null} onClick={() => void create(t.id)}
              style={{ background: tint(t.color ?? '#3E8E7E', 0.82) }}
              className="flex min-h-20 items-center gap-4 rounded-card border-2 border-line p-4 text-left hover:brightness-95 disabled:opacity-60">
              <Icon name={t.icon} className="text-5xl" />
              <span><span className="block text-xl font-extrabold">{t.name}</span>{t.description && <span className="text-ink-soft">{t.description}</span>}</span>
            </button>
          ))}
          <BigButton variant="secondary" disabled={busy !== null} onClick={() => void create()} icon="pencil">Start from blank</BigButton>
          {err && <p role="alert" className="text-danger">{err}</p>}
        </div>
      )}
    </Modal>
  )
}
