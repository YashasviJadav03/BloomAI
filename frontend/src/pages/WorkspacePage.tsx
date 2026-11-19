import { useState } from 'react'
import { PageShell } from '../components/PageShell'
import { Bloomi } from '../components/mascot/Bloomi'
import { ProgressRing } from '../components/progress/ProgressRing'
import { IconTile } from '../theme/icons'

// Static guide (no backend). Ticks are remembered on this device only.
const TIPS = [
  { id: 'clear', icon: 'broom', title: 'Clear your desk', text: 'Only keep what you need: pencil, book, paper.' },
  { id: 'phone', icon: 'cloud', title: 'Phone and toys away', text: 'Put them in another room or a drawer.' },
  { id: 'light', icon: 'light', title: 'Good light', text: 'Sit near a window or turn on a lamp.' },
  { id: 'seat', icon: 'bed', title: 'Comfy seat', text: 'Feet flat on the floor. Back straight but relaxed.' },
  { id: 'water', icon: 'bottle', title: 'Water close by', text: 'Fill your bottle before you start.' },
  { id: 'quiet', icon: 'music', title: 'Keep it quiet', text: 'Switch off the TV. Ask for a quiet corner.' },
  { id: 'timer', icon: 'clock', title: 'Timer where you can see it', text: 'Use the BloomAI timer for one small job at a time.' },
]
const KEY = 'bloomai-workspace-ticks'
const read = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] } }

export default function WorkspacePage() {
  const [ticked, setTicked] = useState<string[]>(read)
  const toggle = (id: string) => setTicked((t) => {
    const n = t.includes(id) ? t.filter((x) => x !== id) : [...t, id]
    try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* ignore */ }
    return n
  })
  const all = ticked.length === TIPS.length
  return (
    <PageShell title="My focus desk" subtitle="Get your desk ready, one little thing at a time" back>
      <div className="mb-5 flex items-center gap-4 rounded-card bg-lav-soft p-4">
        <Bloomi pose={all ? 'happy' : 'focused'} arms={all ? 'up' : 'book'} size={96} />
        <div className="flex-1">
          <p className="text-xl font-extrabold text-lav-ink">{all ? 'Your desk is ready. Let\'s focus!' : 'A calm desk makes focus easier.'}</p>
          <p className="text-base text-ink-soft">Tick each one when it is done.</p>
        </div>
        <ProgressRing size={64} stroke={9} value={ticked.length / TIPS.length} label={`${ticked.length} of ${TIPS.length} ready`}><span className="text-base font-extrabold tabular-nums">{ticked.length}/{TIPS.length}</span></ProgressRing>
      </div>
      <ul className="flex flex-col gap-3">
        {TIPS.map((t) => {
          const on = ticked.includes(t.id)
          return (
            <li key={t.id}>
              <button role="checkbox" aria-checked={on} onClick={() => toggle(t.id)}
                className={`flex min-h-24 w-full items-center gap-4 rounded-card border-2 p-4 text-left transition-colors ${on ? 'border-mint bg-mint-soft' : 'border-line bg-card shadow-soft hover:bg-lav-mist'}`}>
                <span className={`flex h-12 w-12 min-w-12 items-center justify-center rounded-xl border-4 text-3xl font-extrabold ${on ? 'border-sage bg-sage text-white' : 'border-ink-soft'}`} aria-hidden>{on ? '✓' : ''}</span>
                <IconTile name={t.icon} color="#9B8AD1" />
                <span><span className="block text-2xl font-extrabold">{t.title}</span><span className="text-base text-ink-soft">{t.text}</span></span>
              </button>
            </li>
          )
        })}
      </ul>
    </PageShell>
  )
}
