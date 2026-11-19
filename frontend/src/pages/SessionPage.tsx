import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Schedule, SessionEnd, SessionStart, Task } from '../api/types'
import { CountdownRing, fmt, useCountdown } from '../components/CountdownRing'
import { PageShell } from '../components/PageShell'
import { RewardOverlay } from '../components/RewardOverlay'
import { BigButton, Card, ErrorState, Loading } from '../components/ui'
import { useApp } from '../hooks/app'
import { useSound } from '../hooks/sound'
import { useAsync } from '../hooks/useAsync'
import { markDoneToday } from '../lib/doneToday'
import { Icon, IconTile } from '../theme/icons'
import { Bloomi } from '../components/mascot/Bloomi'
import { newlyUnlockedByPoints } from '../lib/garden'

type Phase = 'ready' | 'steps' | 'finished' | 'transition'
interface Reward { points: number; bonus?: number; message: string | null; big?: boolean; unlocked?: string | null; then: () => void }

const DEFAULT_PRAISE = 'Great job!'
/** Praise must never block or break the flow: 4s limit, any failure -> built-in default. */
function fetchPraise(req: Parameters<typeof api.praise>[0]): Promise<string> {
  const timeout = new Promise<string>((res) => setTimeout(() => res(DEFAULT_PRAISE), 4000))
  const call = api.praise(req).then((r) => r.message || DEFAULT_PRAISE).catch(() => DEFAULT_PRAISE)
  return Promise.race([call, timeout])
}

// key={taskId} makes React reset all state when we move on to the next task
export default function SessionPage() {
  const { id, taskId } = useParams()
  return <Session key={taskId} sid={Number(id)} tid={Number(taskId)} />
}

function Session({ sid, tid }: { sid: number; tid: number }) {
  const nav = useNavigate()
  const { profile, points: pointsNow, setPoints } = useApp()
  const startPoints = useRef(pointsNow)
  const sound = useSound()
  const { data: sched, loading, error, retry } = useAsync(() => api.getSchedule(sid), [sid])
  const task = sched?.tasks.find((t) => t.id === tid)

  const [phase, setPhase] = useState<Phase>('ready')
  const [session, setSession] = useState<SessionStart | null>(null)
  const [idx, setIdx] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [reward, setReward] = useState<Reward | null>(null)
  const [result, setResult] = useState<SessionEnd | null>(null)

  const total = session?.expected_seconds ?? task?.expected_seconds ?? 60
  const { remaining, finished: timeUp } = useCountdown(total, phase === 'steps', sound.bell)

  const name = profile?.name ?? 'friend'
  const rewards = profile?.favourite_rewards ?? []

  // Close exactly once (tap, Escape and the auto-close timer can all fire): the ref guards double calls
  const rewardRef = useRef<Reward | null>(null)
  useEffect(() => { rewardRef.current = reward }, [reward])
  const closeReward = useCallback(() => {
    const r = rewardRef.current
    if (!r) return
    rewardRef.current = null
    setReward(null)
    r.then()
  }, [])

  async function start() {
    if (!task) return
    setBusy(true); setErr(null)
    try { startPoints.current = pointsNow; setSession(await api.startSession(task.id)); setPhase('steps') }
    catch (e) { setErr(e instanceof Error ? e.message : "Couldn't start") }
    finally { setBusy(false) }
  }

  async function finishTask(base: { points: number; praiseReq: Parameters<typeof api.praise>[0] }, t: Task, s: SessionStart) {
    const end = await api.endSession(s.session_id)
    setPoints(end.total_points); setResult(end); markDoneToday(t.id); sound.fanfare()
    const unlocked = newlyUnlockedByPoints(startPoints.current, end.total_points)?.name ?? null
    setReward({ points: base.points, bonus: end.bonus_points, message: null, big: true, unlocked, then: () => setPhase('finished') })
    void fetchPraise({ ...base.praiseReq, event: 'task_completed' }).then((m) => setReward((r) => (r ? { ...r, message: m } : r)))
  }

  async function done() {
    if (!task || !session || busy) return
    setBusy(true); setErr(null)
    try {
      const step = task.steps[idx]
      if (!step) {                                  // task has no steps: one big "I'm done"
        await finishTask({ points: 0, praiseReq: { event: 'task_completed', child_name: name, task_title: task.title, streak: 0 } }, task, session)
        return
      }
      const r = await api.completeStep(session.session_id, step.id)
      setPoints(r.total_points)
      const praiseReq = { event: 'step_completed' as const, child_name: name, task_title: task.title, step_text: step.text, streak: r.streak }
      if (r.steps_remaining > 0) {
        sound.ding()
        setReward({ points: r.points_awarded, message: null, then: () => setIdx((i) => i + 1) })
        void fetchPraise(praiseReq).then((m) => setReward((cur) => (cur ? { ...cur, message: m } : cur)))
      } else {
        await finishTask({ points: r.points_awarded, praiseReq }, task, session)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That didn't save. Try again")
    } finally { setBusy(false) }
  }

  // Skip the overlay on Escape for keyboard users
  useEffect(() => {
    if (!reward) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeReward() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [reward, closeReward])

  if (loading) return <PageShell title="…" back><Loading /></PageShell>
  if (error || !sched) return <PageShell title="Oops" backTo="/"><ErrorState message={error} onRetry={retry} /></PageShell>
  if (!task) return <PageShell title="Not found" backTo={`/schedule/${sid}`}><ErrorState message="I can't find that task" /></PageShell>

  const idxInSched = sched.tasks.findIndex((t) => t.id === tid)
  const next = sched.tasks[idxInSched + 1]
  const step = task.steps[idx]

  const active = phase === 'steps'
  return (
    <PageShell title={task.title} subtitle={active ? undefined : sched.name} backTo={`/schedule/${sid}`} mode={active ? 'focus' : 'default'} hideNav={phase === 'transition'}>
      {err && (
        <div role="alert" className="mb-4 rounded-btn bg-berry-light p-3 font-bold">
          {err} <button className="underline" onClick={() => setErr(null)}>OK</button>
        </div>
      )}

      {phase === 'ready' && <Ready task={task} sched={sched} busy={busy} onStart={start} />}

      {phase === 'steps' && (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <div className="flex items-center justify-center gap-3">
            <CountdownRing total={total} remaining={remaining} size={210} />
            <Bloomi pose="focused" arms="book" size={96} animate="idle" className="-ml-4 hidden sm:block" />
          </div>
          <p className="-mt-2 text-center text-lg font-bold text-ink-soft" aria-live="polite">
            {timeUp ? 'The timer is done. Take your time, you are doing fine.' : step ? `Step ${idx + 1} of ${task.steps.length}` : 'One thing to do'}
          </p>

          {task.steps.length > 1 && (
            <ol aria-label="Steps" className="flex flex-wrap justify-center gap-2">
              {task.steps.map((s, i) => (
                <li key={s.id} aria-current={i === idx ? 'step' : undefined} aria-label={`Step ${i + 1}${i < idx ? ' done' : i === idx ? ' now' : ''}`}
                  className={`flex h-8 items-center justify-center rounded-full text-sm font-extrabold transition-all ${i < idx ? 'w-8 bg-sage text-white' : i === idx ? 'w-14 bg-sun text-ink' : 'w-8 bg-lav-soft text-ink-soft'}`}>
                  {i < idx ? '✓' : i + 1}
                </li>
              ))}
            </ol>
          )}

          <Card className="w-full py-8 text-center">
            <div className="flex justify-center"><IconTile name={step?.icon ?? task.icon} color={sched.color} size="xl" /></div>
            <p className="mt-5 text-3xl font-extrabold leading-tight" aria-live="polite">{step ? step.text : task.title}</p>
          </Card>

          <BigButton size="lg" variant="success" className="w-full" onClick={done} disabled={busy || !!reward} icon="check">{busy ? '…' : step ? 'Done!' : "I'm finished!"}</BigButton>
        </div>
      )}

      {phase === 'finished' && result && (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
          <Bloomi pose="happy" arms="up" size={190} animate="bounce" />
          <h2 className="text-4xl font-extrabold">You did it, {name}!</h2>
          <p className="text-xl text-ink-soft">
            {task.title} took {fmt(result.duration_seconds)}.{' '}
            {result.duration_seconds <= result.expected_seconds ? 'Right on time!' : 'You kept going. That counts!'}
          </p>
          <div className="flex w-full flex-col gap-3">
            {next ? (
              <BigButton size="lg" onClick={() => setPhase('transition')} icon="clock">Next: {next.title}</BigButton>
            ) : (
              <BigButton size="lg" onClick={() => nav(`/schedule/${sid}`)} icon="check">All done for today!</BigButton>
            )}
            {session && <BigButton variant="soft" icon="face" onClick={() => nav(`/checkin?session=${session.session_id}`)}>How did that feel?</BigButton>}
            <BigButton variant="ghost" onClick={() => nav(`/schedule/${sid}`)}>Back to my routine</BigButton>
          </div>
        </div>
      )}

      {phase === 'transition' && next && <Transition next={next} color={sched.color} onGo={() => nav(`/schedule/${sid}/task/${next.id}`, { replace: true })} />}

      {reward && <RewardOverlay message={reward.message} defaultMessage={DEFAULT_PRAISE} points={reward.points} bonus={reward.bonus} big={reward.big} unlocked={reward.unlocked} rewards={rewards} onClose={closeReward} />}
    </PageShell>
  )
}

function Ready({ task, sched, busy, onStart }: { task: Task; sched: Schedule; busy: boolean; onStart: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
      <Bloomi pose="thinking" arms="chin" size={150} animate="idle" />
      <IconTile name={task.icon} color={sched.color} size="lg" />
      <h2 className="text-4xl font-extrabold">{task.title}</h2>
      <p className="text-xl text-ink-soft">
        {task.steps.length > 0 ? `${task.steps.length} tiny step${task.steps.length === 1 ? '' : 's'} · ` : ''}about {Math.max(1, Math.round(task.expected_seconds / 60))} min
      </p>
      {task.steps.length > 0 && (
        <ol className="flex w-full flex-col gap-2 text-left" aria-label="Steps preview">
          {task.steps.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2 shadow-soft">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-lav-soft text-base font-extrabold text-lav-ink">{i + 1}</span>
              <Icon name={s.icon} className="text-2xl" /><span className="text-lg font-bold">{s.text}</span>
            </li>
          ))}
        </ol>
      )}
      <BigButton size="lg" variant="sun" className="w-full" onClick={onStart} disabled={busy} icon="rocket">{busy ? 'Getting ready…' : "Let's go!"}</BigButton>
    </div>
  )
}

/** Transition screen between tasks: a short visual countdown to switch gently. */
function Transition({ next, color, onGo }: { next: Task; color: string; onGo: () => void }) {
  const sound = useSound()
  const SECS = 15
  const { remaining, finished } = useCountdown(SECS, true, sound.bell)
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 text-center">
      <p className="text-xl font-bold text-ink-soft">Next up</p>
      <IconTile name={next.icon} color={color} size="xl" />
      <h2 className="text-4xl font-extrabold">{next.title}</h2>
      <CountdownRing total={SECS} remaining={remaining} size={140}><span className="sr-only">getting ready</span></CountdownRing>
      <BigButton size="lg" className="w-full" onClick={onGo}>{finished ? "Let's go!" : "I'm ready"}</BigButton>
    </div>
  )
}
