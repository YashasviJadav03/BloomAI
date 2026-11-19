import { useEffect, useMemo, useState } from 'react'
import { REWARDS } from '../theme/icons'
import { useBloomiSpeech } from '../hooks/useBloomiSpeech'
import { useSpeechInput } from '../hooks/useSpeechInput'
import { api } from '../api/client'
import { Bloomi } from './mascot/Bloomi'
import { BigButton } from './ui'
import { inputClass } from './ui'

/**
 * Instant reward: points + animation show immediately; `message` is the praise text.
 * The overlay does NOT auto-close — the child must tap "Next step" to proceed.
 *
 * After Bloomi's praise is shown (and read aloud), an optional "Reply to Bloomi"
 * toggle lets the child type or speak a reply. Bloomi responds with a short
 * conversational message (via POST /api/chat), also read aloud.
 */
export function RewardOverlay({ message, points, bonus, rewards, big, unlocked, onClose, defaultMessage = 'Great job!', messageSource, childName }: {
  message: string | null
  points: number
  bonus?: number
  rewards: string[]
  big?: boolean
  unlocked?: string | null
  onClose: () => void
  defaultMessage?: string
  messageSource?: string
  childName?: string
}) {
  const { speak, speaking, supported: voiceSupported } = useBloomiSpeech()
  const chars = rewards.length ? rewards.map((r) => REWARDS[r] ?? r) : ['⭐', '🌈', '🎈']
  const pieces = useMemo(() => Array.from({ length: big ? 20 : 10 }, (_, i) => ({
    ch: chars[i % chars.length], left: 4 + ((i * 37) % 92), delay: (i % 7) * 0.12, size: 1.4 + ((i * 13) % 10) / 8,
  })), [big]) // eslint-disable-line react-hooks/exhaustive-deps

  // Speak the praise message as soon as it arrives
  useEffect(() => {
    if (message) speak(message)
  }, [message, speak])

  // ── Optional reply-to-Bloomi state ──────────────────────────────────────
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [chatReply, setChatReply] = useState<string | null>(null)
  const [chatBusy, setChatBusy] = useState(false)

  // Speak Bloomi's chat reply when it arrives
  useEffect(() => {
    if (chatReply) speak(chatReply)
  }, [chatReply, speak])

  async function sendReply() {
    if (!replyText.trim() || chatBusy) return
    setChatBusy(true)
    setChatReply(null)
    try {
      const res = await api.chat({
        child_name: childName ?? 'Friend',
        praise_message: message ?? defaultMessage,
        child_text: replyText.trim(),
      })
      setChatReply(res.message)
    } catch {
      setChatReply("I'm listening! Keep going!")
    } finally {
      setChatBusy(false)
    }
  }

  // Mic for voice input
  const { supported: micSupported, listening, start: micStart, stop: micStop } = useSpeechInput({
    onResult: (t) => setReplyText((prev) => (prev.trim() ? `${prev.trim()} ${t}` : t)),
  })

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/35 p-4" role="dialog" aria-modal="true" aria-label="Reward">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((p, i) => (
          <span key={i} className="absolute bottom-0 animate-float-up" style={{ left: `${p.left}%`, fontSize: `${p.size}rem`, animationDelay: `${p.delay}s` }}>{p.ch}</span>
        ))}
      </div>
      <div className="relative w-full max-w-sm animate-pop rounded-card bg-card p-6 text-center shadow-lift">
        <div className="flex justify-center"><Bloomi pose={unlocked ? 'growing' : 'happy'} arms="up" size={big ? 150 : 120} animate="bounce" /></div>
        <p className="mt-2 text-4xl font-extrabold text-sage-dark" aria-live="polite">+{points} ⭐{bonus ? <span className="text-2xl"> (+{bonus} bonus)</span> : null}</p>
        <p className="mt-3 min-h-[3.5rem] text-xl font-bold" aria-live="polite">{message ?? defaultMessage}</p>
        {messageSource === 'llm' && message && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-lav-soft px-3 py-1 text-sm font-bold text-lav-ink">
            ✨ Bloomi wrote this just for you
          </span>
        )}
        {unlocked && <p role="status" className="mt-2 rounded-2xl bg-mint-soft px-3 py-2 text-lg font-extrabold text-sage-dark">🌱 New in your garden: {unlocked}!</p>}

        {/* Bloomi speaking indicator */}
        {voiceSupported && speaking ? (
          <p className="mt-4 animate-pulse text-lg font-bold text-ink-soft" aria-live="polite">🔊 Bloomi is reading…</p>
        ) : null}

        {/* ── Optional reply to Bloomi ───────────────────────────────────── */}
        {!showReply && !chatReply && (
          <button
            type="button"
            onClick={() => setShowReply(true)}
            className="mt-4 text-base font-bold text-lav-deep underline-offset-4 hover:underline"
          >
            💬 Reply to Bloomi
          </button>
        )}

        {showReply && !chatReply && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <input
                className={`${inputClass} min-h-12 flex-1 text-base`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                placeholder="Type or speak your reply…"
                maxLength={200}
                autoFocus
              />
              {micSupported && (
                <button
                  type="button"
                  aria-label={listening ? 'Stop recording' : 'Speak your reply'}
                  onClick={listening ? micStop : micStart}
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-xl transition-all
                    ${listening ? 'animate-pulse border-berry bg-berry-light text-danger' : 'border-line bg-card text-lav-ink hover:bg-lav-soft'}`}
                >
                  {listening ? '⏹' : '🎙'}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <BigButton size="sm" className="flex-1" onClick={sendReply} disabled={!replyText.trim() || chatBusy}>
                {chatBusy ? 'Bloomi is thinking…' : 'Send'}
              </BigButton>
              <BigButton size="sm" variant="ghost" onClick={() => { setShowReply(false); setReplyText('') }}>Cancel</BigButton>
            </div>
          </div>
        )}

        {chatReply && (
          <div className="mt-4 rounded-2xl bg-lav-soft p-4 text-left">
            <p className="text-lg font-bold text-lav-ink" aria-live="polite">{chatReply}</p>
            <button
              type="button"
              onClick={() => { setChatReply(null); setReplyText(''); setShowReply(true) }}
              className="mt-2 text-sm font-bold text-lav-deep underline-offset-4 hover:underline"
            >
              💬 Reply again
            </button>
          </div>
        )}

        {/* Main action button — always visible */}
        <BigButton className="mt-4" onClick={onClose}>{big ? 'Keep going →' : 'Next step →'}</BigButton>
      </div>
    </div>
  )
}
