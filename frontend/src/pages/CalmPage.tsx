import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { BigButton, Card } from '../components/ui'
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
    <PageShell title="Calm break" back hideCalm tint="var(--color-sky-light)">
      {message && <p className="mb-4 rounded-card border-2 border-sky bg-card p-4 text-center text-xl font-bold" role="status">{message}</p>}
      <div role="tablist" aria-label="Calm activities" className="mb-6 grid grid-cols-2 gap-3">
        {(['breathing', 'movement'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setParams({ activity: t }, { replace: true })}
            className={`min-h-16 rounded-btn border-2 text-xl font-extrabold ${tab === t ? 'border-sky bg-sky text-white' : 'border-line bg-card'}`}>
            {t === 'breathing' ? '🫧 Breathe' : '🤸 Move'}
          </button>
        ))}
      </div>
      {tab === 'breathing' ? <Breathing /> : <Movement />}
      <p className="mt-10 text-center text-ink-soft">
        Feeling really sad or scared? <Link to="/safe" className="font-extrabold text-sage-dark underline">Talk to a trusted adult</Link>
      </p>
    </PageShell>
  )
}

const CYCLE = [
  { label: 'Breathe in… 🌬️', secs: 4, scale: 1 },
  { label: 'Hold… ✋', secs: 2, scale: 1 },
  { label: 'Breathe out… 😮‍💨', secs: 5, scale: 0.55 },
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
      <div className="flex h-72 w-72 items-center justify-center" aria-hidden>
        <div className="h-64 w-64 rounded-full bg-gradient-to-br from-sky-light to-sky shadow-lg"
          style={{ transform: `scale(${running ? cur.scale : 0.7})`, transition: `transform ${running ? cur.secs : 0.6}s ease-in-out` }} />
      </div>
      {running ? (
        <>
          <p className="text-4xl font-extrabold" aria-live="polite">{CYCLE[phase].label}</p>
          <p className="text-lg text-ink-soft">Breath {round} of {ROUNDS}</p>
          {reduceMotion && <p className="text-ink-soft">Follow the words. Breathe slowly.</p>}
          <BigButton variant="secondary" onClick={() => { setRunning(false); setPhase(2) }}>Stop</BigButton>
        </>
      ) : finished ? (
        <>
          <p className="text-3xl font-extrabold">Nice breathing! 🌟</p>
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

const MOVES = [
  { icon: '🌳', title: 'Tall tree', text: 'Stand up and stretch your arms high. Reach for the sky!' },
  { icon: '🙌', title: 'Shake it out', text: 'Shake your hands, then your arms, then your legs.' },
  { icon: '🧱', title: 'Push the wall', text: 'Push a wall with both hands as hard as you can. Count to 10.' },
  { icon: '🐸', title: 'Frog jumps', text: 'Squat down low, then jump up. Do it 5 times.' },
  { icon: '🐢', title: 'Turtle shoulders', text: 'Lift your shoulders to your ears, hold, then drop them slowly.' },
  { icon: '🧘', title: 'Big hug', text: 'Wrap your arms around yourself and squeeze. Breathe slowly.' },
]
function Movement() {
  const [i, setI] = useState(0)
  const m = MOVES[i]
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <Card className="w-full" style={{ borderColor: 'var(--color-sky)', borderWidth: 4 }}>
        <p className="text-lg font-bold text-ink-soft">Move {i + 1} of {MOVES.length}</p>
        <div className="my-3 text-9xl animate-wiggle" key={i} aria-hidden>{m.icon}</div>
        <h2 className="text-3xl font-extrabold">{m.title}</h2>
        <p className="mt-2 text-xl" aria-live="polite">{m.text}</p>
      </Card>
      <div className="grid w-full grid-cols-2 gap-3">
        <BigButton variant="secondary" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</BigButton>
        <BigButton disabled={i === MOVES.length - 1} onClick={() => setI(i + 1)}>Next →</BigButton>
      </div>
      {i === MOVES.length - 1 && <p className="text-xl font-extrabold">Great moving! 🌟</p>}
    </div>
  )
}
