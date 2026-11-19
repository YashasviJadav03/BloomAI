// Check-in: pick a feeling, optionally say more (by typing OR by speaking).
// Contract with the session screen: /checkin?session=<id>.
//  - POST /api/checkins; if safe_mode === true we go straight to /safe and never call /api/calm-reply.
//  - otherwise POST /api/calm-reply and show Bloomi's message (raw scores are never shown to the child).
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api/client'
import type { CalmReplyResponse, Emoji } from '../../api/types'
import { Bloomi } from '../../components/mascot/Bloomi'
import { MOOD_LABEL, MOODS, MoodFace } from '../../components/mascot/MoodFace'
import { PageShell } from '../../components/PageShell'
import { BigButton, Field, inputClass } from '../../components/ui'
import { useApp } from '../../hooks/app'
import { useSpeechInput } from '../../hooks/useSpeechInput'

const FALLBACK: CalmReplyResponse = {
  message: 'Thank you for telling me. Whatever you feel is okay. I am glad you are here.',
  suggested_activity: 'none',
  source: 'fallback',
}

/** Mic button — shows recording state; hidden when Web Speech API is unavailable. */
function MicButton({ onResult }: { onResult: (t: string) => void }) {
  const { supported, listening, start, stop, error } = useSpeechInput({ onResult })
  if (!supported) return null
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-label={listening ? 'Stop recording' : 'Speak your answer'}
        onClick={listening ? stop : start}
        className={`inline-flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl transition-all
          ${listening
            ? 'animate-pulse border-berry bg-berry-light text-danger shadow-lift'
            : 'border-line bg-card text-lav-ink shadow-soft hover:bg-lav-soft'
          }`}
      >
        {listening ? '⏹' : '🎙'}
      </button>
      {listening && (
        <span className="text-sm font-bold text-danger" aria-live="polite">Listening…</span>
      )}
      {error && (
        <span className="max-w-[14rem] text-right text-sm text-ink-soft" role="alert">{error}</span>
      )}
    </div>
  )
}

/** Shows where Bloomi's reply came from — only when the LLM generated it. */
function AiSourceBadge({ source }: { source: string }) {
  if (source !== 'llm') return null
  return (
    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-lav-soft px-3 py-1 text-sm font-bold text-lav-ink">
      ✨ Bloomi wrote this just for you
    </span>
  )
}

export default function CheckInPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const { profile } = useApp()
  const sessionParam = Number(params.get('session'))
  const sessionId = Number.isFinite(sessionParam) && sessionParam > 0 ? sessionParam : null
  const [mood, setMood] = useState<Emoji | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [reply, setReply] = useState<CalmReplyResponse | null>(null)

  async function submit() {
    if (!mood || busy) return
    setBusy(true); setErr(null)
    try {
      const note = text.trim() || undefined
      const ci = await api.submitCheckin({ session_id: sessionId, emoji: mood, text: note })
      if (ci.safe_mode) { nav('/safe', { replace: true }); return }
      let r = FALLBACK
      try {
        r = await api.calmReply({
          child_name: profile?.name ?? 'friend',
          emoji: mood,
          text: note,
          focus_score: ci.focus_score,
          emotion_score: ci.emotion_score,
        })
      } catch { /* a friendly default is better than an error after a check-in was saved */ }
      setReply(r)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally { setBusy(false) }
  }

  // ── Reply screen ──────────────────────────────────────────────────────────
  if (reply) {
    const act = reply.suggested_activity
    const calmActivity = act === 'breathing' ? 'breathing' : act === 'movement' || act === 'stretching' ? 'movement' : null
    return (
      <PageShell title="Thank you" mode="plain">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 pt-4 text-center">
          <Bloomi pose="happy" arms="hug" size={170} animate="idle" />
          <div className="flex flex-col items-center gap-2">
            <p role="status" className="rounded-card bg-lav-soft p-5 text-2xl font-extrabold leading-snug text-lav-ink">
              {reply.message}
            </p>
            <AiSourceBadge source={reply.source} />
          </div>
          {calmActivity ? (
            <>
              <BigButton size="lg" className="w-full" icon="cloud"
                onClick={() => nav(`/calm?activity=${calmActivity}`, { state: { message: reply.message } })}>
                {calmActivity === 'breathing' ? 'Breathe with Bloomi' : 'Stretch with Bloomi'}
              </BigButton>
              <BigButton variant="ghost" onClick={() => nav('/', { replace: true })}>Not now, back home</BigButton>
            </>
          ) : (
            <BigButton size="lg" className="w-full" onClick={() => nav('/', { replace: true })}>Back home</BigButton>
          )}
        </div>
      </PageShell>
    )
  }

  // ── Input screen ──────────────────────────────────────────────────────────
  return (
    <PageShell title="How do you feel?" subtitle="Tap the face that fits best. There is no wrong answer." back>
      {/* Mood grid */}
      <div role="radiogroup" aria-label="How do you feel?" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MOODS.map((m) => {
          const on = mood === m
          return (
            <button key={m} type="button" role="radio" aria-checked={on} onClick={() => setMood(m)}
              className={`flex min-h-36 flex-col items-center justify-center gap-1 rounded-card border-4 p-3 transition-all
                ${on ? 'border-lav-deep bg-lav-soft shadow-lift' : 'border-line bg-card shadow-soft hover:-translate-y-0.5'}`}>
              <MoodFace mood={m} size={84} />
              <span className="text-xl font-extrabold">{MOOD_LABEL[m]}{on && <span aria-hidden> ✓</span>}</span>
            </button>
          )
        })}
      </div>

      {/* Text + mic */}
      <div className="mt-6">
        <Field label="Want to tell me more? (you can skip this)">
          <div className="flex items-start gap-3">
            <textarea
              className={`${inputClass} min-h-28 flex-1`}
              rows={3}
              maxLength={300}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type here, or tap 🎙 to speak…"
            />
            {/* Mic appends transcript to whatever is already typed */}
            <MicButton onResult={(t) => setText((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t))} />
          </div>
        </Field>
        <p className="mt-1 text-sm text-ink-soft">
          🎙 Tap the microphone to speak your answer instead of typing.
        </p>
      </div>

      {err && <p role="alert" className="mt-3 rounded-btn bg-berry-light p-3 font-bold">{err}</p>}

      <BigButton size="lg" className="mt-5 w-full" disabled={!mood || busy} onClick={() => void submit()} icon="check">
        {busy ? 'Bloomi is thinking…' : 'Tell Bloomi'}
      </BigButton>
      <div className="mt-2 text-center">
        <BigButton variant="ghost" onClick={() => nav('/', { replace: true })}>Skip for now</BigButton>
      </div>
    </PageShell>
  )
}
