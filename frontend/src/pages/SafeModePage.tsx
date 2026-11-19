import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { SafetyResources } from '../api/types'
import { PageShell } from '../components/PageShell'
import { BigButton, Card, Loading } from '../components/ui'
import { useAsync } from '../hooks/useAsync'
import { useBloomiSpeech } from '../hooks/useBloomiSpeech'
import { Bloomi } from '../components/mascot/Bloomi'

// Shown if the server can't be reached: this screen must NEVER be blocked by an error.
const FALLBACK: SafetyResources = {
  message: 'It sounds like today is hard. Please talk to a trusted adult.',
  resources: [],
}
const looksLikePhone = (s: string) => /^\+?[\d][\d\s()-]{4,}$/.test(s.trim())

/**
 * Opens when the check-in response has safe_mode === true (decided by A's rule, not the LLM).
 * Coaching is paused here: no points, no praise, no timers.
 */
export default function SafeModePage() {
  const nav = useNavigate()
  const { data, loading } = useAsync(() => api.safetyResources().catch(() => FALLBACK))
  const res = data ?? FALLBACK
  const { speak } = useBloomiSpeech()

  // Speak the safety message as soon as it's available
  useEffect(() => {
    if (!loading && res.message) speak(res.message)
  }, [loading, res.message, speak])
  return (
    <PageShell title="" mode="plain">
      {loading ? <Loading label="One moment…" /> : (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <Bloomi pose="calm" arms="hug" size={130} animate="none" />
          <h1 className="text-4xl font-extrabold text-lav-ink">You're not alone</h1>
          <p className="text-2xl font-bold leading-snug" role="status">{res.message}</p>
          <Card className="w-full text-left">
            <p className="mb-2 text-xl font-extrabold">A trusted adult can be:</p>
            <ul className="list-inside list-disc space-y-1 text-xl">
              <li>a parent or someone at home</li>
              <li>a teacher or school helper</li>
              <li>a grown-up in your family</li>
            </ul>
            <p className="mt-3 text-lg text-ink-soft">Tell them how you feel. You can say, “I need to talk.”</p>
          </Card>
          {res.resources.length > 0 && (
            <Card className="w-full text-left">
              <h3 className="mb-2 text-xl font-extrabold">Someone you can call or text</h3>
              <ul className="space-y-3">
                {res.resources.map((r) => (
                  <li key={r.name} className="text-xl">
                    <span className="font-bold">{r.name}</span>
                    <br />
                    {looksLikePhone(r.contact)
                      ? <a className="font-extrabold text-sage-dark underline" href={`tel:${r.contact.replace(/[^\d+]/g, '')}`}>{r.contact}</a>
                      : <span className="text-ink-soft">{r.contact}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <div className="flex w-full flex-col gap-3">
            <BigButton size="lg" variant="soft" onClick={() => nav('/calm')} icon="cloud">Take a calm breath</BigButton>
            <BigButton variant="secondary" onClick={() => nav('/')}>I've talked to someone</BigButton>
          </div>
        </div>
      )}
    </PageShell>
  )
}
