import { useState } from 'react'
import { PageShell } from '../components/PageShell'
import { Card } from '../components/ui'
import { Icon } from '../theme/icons'

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
    <PageShell title="My focus desk" back tint="var(--color-sun-light)">
      <p className="mb-5 text-xl text-ink-soft">A calm desk makes it easier to focus. Tick each one when your desk is ready.</p>
      <ul className="flex flex-col gap-3">
        {TIPS.map((t) => {
          const on = ticked.includes(t.id)
          return (
            <li key={t.id}>
              <button role="checkbox" aria-checked={on} onClick={() => toggle(t.id)}
                className={`flex min-h-24 w-full items-center gap-4 rounded-card border-4 p-4 text-left ${on ? 'border-sage bg-sage-light' : 'border-line bg-card hover:bg-sun-light'}`}>
                <span className={`flex h-12 w-12 min-w-12 items-center justify-center rounded-xl border-4 text-3xl font-extrabold ${on ? 'border-sage bg-sage text-white' : 'border-ink-soft'}`} aria-hidden>{on ? '✓' : ''}</span>
                <Icon name={t.icon} className="text-5xl" />
                <span><span className="block text-2xl font-extrabold">{t.title}</span><span className="text-ink-soft">{t.text}</span></span>
              </button>
            </li>
          )
        })}
      </ul>
      {all && <Card className="mt-5 animate-pop text-center"><p className="text-2xl font-extrabold">🎯 Your desk is ready. Let's focus!</p></Card>}
    </PageShell>
  )
}
