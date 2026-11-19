import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { BigButton, Card, Segmented } from '../components/ui'
import { Bloomi } from '../components/mascot/Bloomi'
import type { BloomiArms } from '../components/mascot/BloomiArt'
import { useSettings } from '../hooks/settings'

/**
 * Calm-down break: breathing animation + movement prompts.
 * Integration hooks for Member C's check-in result (see docs/frontend-api-assumptions.md):
 *   navigate('/calm?activity=breathing|movement', { state: { message: '<calm-reply text>' } })
 */
export default function CalmPage() {
  const [params, setParams] = useSearchParams()
  const loc = useLocation()
  const message = (loc.state as { message?: string } | null)?.message
  const tab = params.get('activity') === 'movement' ? 'movement' : 'breathing'
  return (
    <PageShell title="Calm break" subtitle="A little pause, just for you" back mode="plain">
      {message && <p className="mb-4 rounded-card bg-lav-soft p-4 text-center text-xl font-bold text-lav-ink" role="status">{message}</p>}
      <div className="mb-6 flex justify-center">
        <Segmented label="Calm activities" value={tab} onChange={(t) => setParams({ activity: t }, { replace: true })}
          options={[{ value: 'breathing', label: 'Breathe', icon: 'cloud' }, { value: 'movement', label: 'Move', icon: 'sparkles' }]} />
      </div>
      {tab === 'breathing' ? <Breathing /> : <Movement />}
      <p className="mt-10 text-center text-lg text-ink-soft">
        Feeling really sad or scared? <Link to="/safe" className="inline-flex min-h-12 items-center font-extrabold text-sage-dark underline">Talk to a trusted adult</Link>
      </p>
    </PageShell>
  )
}

const CYCLE = [
  { label: 'Breathe in…', secs: 4, scale: 1 },
  { label: 'Hold…', secs: 2, scale: 1 },
  { label: 'Breathe out…', secs: 5, scale: 0.6 },
] as const
const ROUNDS = 5

function Breathing() {
  const nav = useNavigate()
  const { reduceMotion } = useSettings()
  const [running, setRunning] = useState(false)
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState(2)       // start "small" (out) so the first inhale grows
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (!running) return
    let p = 0, r = 1
    setPhase(0); setRound(1)
    let t: ReturnType<typeof setTimeout>
    const tick = () => {
      t = setTimeout(() => {
        p += 1
        if (p === CYCLE.length) {
          p = 0; r += 1
          if (r > ROUNDS) { setRunning(false); setFinished(true); setPhase(2); return }
          setRound(r)
        }
        setPhase(p); tick()
      }, CYCLE[p].secs * 1000)
    }
    tick()
    return () => clearTimeout(t)
  }, [running])

  const cur = CYCLE[phase]
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative flex h-80 w-80 items-center justify-center" aria-hidden>
        <div className="absolute h-72 w-72 rounded-full bg-gradient-to-br from-sky-light to-mint shadow-soft opacity-80"
          style={{ transform: `scale(${running ? cur.scale : 0.7})`, transition: reduceMotion ? 'none' : `transform ${running ? cur.secs : 0.6}s ease-in-out` }} />
        <div className="relative"><Bloomi pose="calm" arms={running && phase === 0 ? 'up' : 'hug'} size={150} animate="none" /></div>
      </div>
      {running ? (
        <>
          <p className="text-4xl font-extrabold text-lav-ink" aria-live="polite">{CYCLE[phase].label}</p>
          <p className="text-lg text-ink-soft">Breath {round} of {ROUNDS}</p>
          {reduceMotion && <p className="text-ink-soft">Follow the words. Breathe slowly.</p>}
          <BigButton variant="secondary" onClick={() => { setRunning(false); setPhase(2) }}>Stop</BigButton>
        </>
      ) : finished ? (
        <>
          <p className="text-3xl font-extrabold">Nice breathing!</p>
          <div className="flex w-full flex-col gap-3">
            <BigButton size="lg" onClick={() => nav('/')}>I feel better</BigButton>
            <BigButton variant="secondary" onClick={() => { setFinished(false); setRunning(true) }}>Breathe again</BigButton>
          </div>
        </>
      ) : (
        <>
          <p className="text-xl text-ink-soft">Watch the bubble. Breathe in as it grows, out as it shrinks.</p>
          <BigButton size="lg" className="w-full" onClick={() => setRunning(true)}>Start breathing</BigButton>
        </>
      )}
    </div>
  )
}

const MOVES: { icon: string; title: string; text: string; arms: BloomiArms }[] = [
  { icon: '🌳', title: 'Tall tree', text: 'Stand up and stretch your arms high. Reach for the sky!', arms: 'up' },
  { icon: '🙌', title: 'Shake it out', text: 'Shake your hands, then your arms, then your legs.', arms: 'wave' },
  { icon: '🧱', title: 'Push the wall', text: 'Push a wall with both hands as hard as you can. Count to 10.', arms: 'out' },
  { icon: '🐸', title: 'Frog jumps', text: 'Squat down low, then jump up. Do it 5 times.', arms: 'down' },
  { icon: '🐢', title: 'Turtle shoulders', text: 'Lift your shoulders to your ears, hold, then drop them slowly.', arms: 'chin' },
  { icon: '🧘', title: 'Big hug', text: 'Wrap your arms around yourself and squeeze. Breathe slowly.', arms: 'hug' },
]
function Movement() {
  const [i, setI] = useState(0)
  const m = MOVES[i]
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
      <Card className="w-full">
        <p className="text-lg font-bold text-ink-soft">Move {i + 1} of {MOVES.length}</p>
        <div className="my-3 flex items-center justify-center gap-4" key={i}>
          <Bloomi pose="happy" arms={m.arms} size={130} animate="none" />
          <span className="text-7xl" aria-hidden>{m.icon}</span>
        </div>
        <h2 className="text-3xl font-extrabold">{m.title}</h2>
        <p className="mt-2 text-xl" aria-live="polite">{m.text}</p>
      </Card>
      <div className="grid w-full grid-cols-2 gap-3">
        <BigButton variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</BigButton>
        <BigButton disabled={i === MOVES.length - 1} onClick={() => setI(i + 1)}>Next →</BigButton>
      </div>
      {i === MOVES.length - 1 && <p className="text-xl font-extrabold text-sage-dark">Great moving!</p>}
    </div>
  )
}
