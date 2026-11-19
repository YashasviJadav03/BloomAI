/**
 * CaregiverPage — clinical insights, distress alerts and recommendations.
 * Wrapped in CaregiverPinGate so it cannot be opened without the caregiver's PIN.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { CaregiverInsights, SupportRecommendations } from '../api/types'
import { CaregiverPinGate } from '../components/CaregiverPinGate'
import { BigButton, Card, ErrorState, Loading } from '../components/ui'
import { useAsync } from '../hooks/useAsync'

// ─── small sub-components ────────────────────────────────────────────────────

function StatPill({ label, value, color = 'lav' }: { label: string; value: string | number; color?: 'lav' | 'sage' | 'sun' | 'sky' }) {
  const bg: Record<string, string> = {
    lav: 'bg-lav-soft text-lav-ink',
    sage: 'bg-mint-soft text-sage-dark',
    sun: 'bg-sun-light text-ink',
    sky: 'bg-sky-light text-ink',
  }
  return (
    <div className={`flex flex-col items-center rounded-2xl px-4 py-3 ${bg[color]}`}>
      <span className="text-2xl font-extrabold tabular-nums">{value}</span>
      <span className="mt-0.5 text-sm font-bold">{label}</span>
    </div>
  )
}

function InsightsPanel({ data, days, onDaysChange }: {
  data: CaregiverInsights
  days: number
  onDaysChange: (d: number) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Time range selector */}
      <div className="flex items-center gap-3">
        <span className="text-base font-bold text-ink-soft">Showing last</span>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => onDaysChange(d)}
            className={`min-h-10 rounded-full px-4 text-base font-extrabold transition-colors ${
              days === d ? 'bg-lav-deep text-white' : 'border-2 border-line bg-card hover:bg-lav-soft'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="Avg focus" value={`${data.focus_pattern.avg_focus_score}%`} color="lav" />
        <StatPill label="Pack rate" value={`${data.forgetfulness_pattern.checklist_completion_rate}%`} color="sage" />
        <StatPill label="Alerts" value={data.active_alerts_count} color={data.active_alerts_count > 0 ? 'sun' : 'sky'} />
      </div>

      {/* Focus */}
      <Card>
        <h3 className="mb-1 text-lg font-extrabold">🎯 Focus pattern</h3>
        <p className="mb-3 text-base text-ink-soft">{data.focus_pattern.summary}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-lav-soft px-3 py-1 font-bold">
            Best duration: {data.focus_pattern.optimal_task_duration_minutes} min
          </span>
          <span className="rounded-full bg-lav-soft px-3 py-1 font-bold">
            Restlessness onset: {data.focus_pattern.restlessness_onset_minutes} min
          </span>
        </div>
      </Card>

      {/* Forgetfulness */}
      <Card>
        <h3 className="mb-1 text-lg font-extrabold">🎒 Forgetfulness pattern</h3>
        <p className="mb-3 text-base text-ink-soft">{data.forgetfulness_pattern.summary}</p>
        {data.forgetfulness_pattern.most_forgotten_items.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-bold text-ink-soft">Most forgotten items:</p>
            <ul className="flex flex-wrap gap-2">
              {data.forgetfulness_pattern.most_forgotten_items.map((item) => (
                <li key={item} className="rounded-full bg-sun-light px-3 py-1 text-sm font-bold">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Emotional regulation */}
      <Card>
        <h3 className="mb-1 text-lg font-extrabold">💛 Emotional regulation</h3>
        <p className="mb-3 text-base text-ink-soft">{data.emotional_regulation.summary}</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-mint-soft px-3 py-1 font-bold text-sage-dark">
            Dominant mood: {data.emotional_regulation.dominant_mood}
          </span>
          <span className="rounded-full bg-mint-soft px-3 py-1 font-bold text-sage-dark">
            Recovery rate: {data.emotional_regulation.calm_recovery_rate}%
          </span>
        </div>
      </Card>

      {/* Clinical summary */}
      <Card className="border-lav bg-lav-soft">
        <h3 className="mb-1 text-lg font-extrabold text-lav-ink">📋 Clinical summary</h3>
        <p className="text-base text-lav-ink">{data.clinical_summary}</p>
        <p className="mt-3 text-xs text-ink-soft">
          ⚠️ This is a prototype heuristic, not clinical advice. All outputs should be reviewed by a qualified professional.
        </p>
      </Card>
    </div>
  )
}

function AlertsPanel() {
  const { data: alerts, loading, error, reload } = useAsync(() => api.caregiverAlerts())
  const [acking, setAcking] = useState<number | null>(null)

  async function acknowledge(id: number) {
    setAcking(id)
    try { await api.acknowledgeAlert(id); reload() }
    finally { setAcking(null) }
  }

  if (loading) return <Loading label="Loading alerts…" />
  if (error) return <ErrorState message={error} onRetry={reload} />

  const active = (alerts ?? []).filter((a) => !a.is_acknowledged)
  const past = (alerts ?? []).filter((a) => a.is_acknowledged)

  return (
    <div className="flex flex-col gap-4">
      {active.length === 0 && (
        <Card className="text-center">
          <p className="text-2xl">✅</p>
          <p className="mt-1 font-bold text-sage-dark">No active distress alerts.</p>
        </Card>
      )}
      {active.map((a) => (
        <Card key={a.id} className="border-2 border-berry bg-berry-light">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="font-extrabold text-danger">🚨 Distress alert</p>
              <p className="text-sm text-ink-soft">{new Date(a.created_at).toLocaleString()}</p>
            </div>
            <span className="rounded-full bg-berry-light px-3 py-1 text-sm font-bold text-danger">
              Emotion: {a.emotion_score}
            </span>
          </div>
          {a.trigger_text && (
            <p className="mb-3 rounded-xl bg-card px-3 py-2 text-base italic text-ink-soft">
              "{a.trigger_text}"
            </p>
          )}
          <BigButton
            size="sm"
            variant="secondary"
            disabled={acking === a.id}
            onClick={() => acknowledge(a.id)}
          >
            {acking === a.id ? 'Saving…' : '✓ Acknowledge'}
          </BigButton>
        </Card>
      ))}
      {past.length > 0 && (
        <details className="rounded-card border border-line bg-card p-4">
          <summary className="cursor-pointer font-bold text-ink-soft">
            {past.length} acknowledged alert{past.length === 1 ? '' : 's'}
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {past.map((a) => (
              <li key={a.id} className="rounded-xl bg-lav-mist px-3 py-2 text-sm text-ink-soft">
                <span className="font-bold">{new Date(a.created_at).toLocaleDateString()}</span>
                {a.trigger_text ? ` — "${a.trigger_text}"` : ' — no text recorded'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function RecommendationsPanel({ data }: { data: SupportRecommendations }) {
  const mins = (s: number) => Math.round(s / 60)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <StatPill label="Max task length" value={`${mins(data.recommended_max_task_seconds)} min`} color="lav" />
        <StatPill label="Micro-break" value={`${mins(data.suggested_micro_break_seconds)} min`} color="sage" />
      </div>
      <Card>
        <h3 className="mb-3 text-lg font-extrabold">💡 Recommendations</h3>
        <ul className="flex flex-col gap-3">
          {data.recommendations.map((r, i) => (
            <li key={i} className="flex gap-3 text-base">
              <span className="mt-0.5 text-lg" aria-hidden>•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

type Tab = 'insights' | 'alerts' | 'recommendations'

function CaregiverDashboard() {
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('insights')
  const [days, setDays] = useState(7)

  const insights = useAsync(() => api.caregiverInsights(days), [days])
  const recs = useAsync(() => api.supportRecommendations())

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'insights', label: 'Insights', icon: '📊' },
    { id: 'alerts', label: `Alerts${insights.data?.active_alerts_count ? ` (${insights.data.active_alerts_count})` : ''}`, icon: '🚨' },
    { id: 'recommendations', label: 'Tips', icon: '💡' },
  ]

  return (
    <div className="min-h-dvh bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => nav(-1)}
            aria-label="Go back"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-line bg-card text-xl hover:bg-lav-soft"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-lav-ink">Caregiver view</h1>
            {insights.data && (
              <p className="text-sm text-ink-soft">{insights.data.child_name}</p>
            )}
          </div>
          <span className="text-2xl" aria-hidden>👨‍👩‍👧</span>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-2xl px-4 pb-2">
          <div className="flex gap-1" role="tablist" aria-label="Caregiver sections">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 rounded-xl py-2 text-sm font-extrabold transition-colors ${
                  tab === t.id
                    ? 'bg-lav-deep text-white'
                    : 'text-ink-soft hover:bg-lav-soft'
                }`}
              >
                <span aria-hidden>{t.icon} </span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-5 pb-16">
        {tab === 'insights' && (
          <>
            {insights.loading ? (
              <Loading label="Analysing patterns…" />
            ) : insights.error || !insights.data ? (
              <ErrorState message={insights.error} onRetry={insights.retry} />
            ) : (
              <InsightsPanel data={insights.data} days={days} onDaysChange={setDays} />
            )}
          </>
        )}
        {tab === 'alerts' && <AlertsPanel />}
        {tab === 'recommendations' && (
          <>
            {recs.loading ? (
              <Loading label="Loading tips…" />
            ) : recs.error || !recs.data ? (
              <ErrorState message={recs.error} onRetry={recs.retry} />
            ) : (
              <RecommendationsPanel data={recs.data} />
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function CaregiverPage() {
  return (
    <CaregiverPinGate>
      <CaregiverDashboard />
    </CaregiverPinGate>
  )
}
