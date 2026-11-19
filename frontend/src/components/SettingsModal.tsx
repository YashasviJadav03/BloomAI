import { useNavigate } from 'react-router-dom'
import { api, isMockMode } from '../api/client'
import { useSettings, type TextSize } from '../hooks/settings'
import { BigButton, Modal, Toggle } from './ui'

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useSettings()
  const nav = useNavigate()
  const sizes: { v: TextSize; label: string }[] = [{ v: 'normal', label: 'A' }, { v: 'large', label: 'A+' }, { v: 'xlarge', label: 'A++' }]
  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="flex flex-col gap-4">
        <Toggle checked={!s.muted} onChange={(on) => s.setMuted(!on)} label={s.muted ? '🔇 Sounds are off' : '🔊 Sounds are on'} />
        <Toggle checked={s.reduceMotion} onChange={s.setReduceMotion} label="Calm screen (less movement)" />
        <div>
          <p className="mb-2 font-bold text-ink-soft">Text size</p>
          <div role="radiogroup" aria-label="Text size" className="grid grid-cols-3 gap-3">
            {sizes.map((z) => (
              <button key={z.v} role="radio" aria-checked={s.textSize === z.v} onClick={() => s.setTextSize(z.v)}
                className={`min-h-14 rounded-btn border-2 text-xl font-extrabold ${s.textSize === z.v ? 'border-lav-deep bg-lav-soft text-lav-ink' : 'border-line bg-card'}`}>{z.label}</button>
            ))}
          </div>
        </div>
        <BigButton variant="secondary" onClick={() => { onClose(); nav('/setup?edit=1') }} icon="face">Change my profile</BigButton>
        <BigButton variant="secondary" onClick={() => { onClose(); nav('/workspace') }} icon="pencil">My focus desk guide</BigButton>
        {isMockMode && (
          <details className="rounded-btn border-2 border-dashed border-line p-3 text-base text-ink-soft">
            <summary className="cursor-pointer font-bold">Demo tools (mock mode)</summary>
            <div className="mt-3 flex flex-wrap gap-2">
              <BigButton size="sm" variant="secondary" onClick={async () => { await api.seedDemo(); location.assign('/') }}>Load demo data</BigButton>
              <BigButton size="sm" variant="danger" onClick={async () => { await api.reset(); location.assign('/') }}>Reset everything</BigButton>
            </div>
          </details>
        )}
      </div>
    </Modal>
  )
}
