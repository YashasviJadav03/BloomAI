import { api } from '../../api/client'
import { FocusRhythmChart } from '../../components/charts/FocusRhythmChart'
import { Bloomi } from '../../components/mascot/Bloomi'
import { PageShell } from '../../components/PageShell'
import { FocusGarden, GardenRewardChips } from '../../components/progress/FocusGarden'
import { FeelingsCalendar } from '../../components/charts/FeelingsCalendar'
import { StreakTrail } from '../../components/progress/StreakTrail'
import { WeeklyGoal } from '../../components/progress/WeeklyGoal'
import { MetricCard } from '../../components/progress/MetricCard'
import { ProgressRing } from '../../components/progress/ProgressRing'
import { Card, ErrorState, Loading, SectionHeading } from '../../components/ui'
import { useAsync } from '../../hooks/useAsync'
import { gardenState } from '../../lib/garden'
import type { ProgressSummary } from '../../api/types'

function WeeklyNote({ p }: { p: ProgressSummary }) {
  const msg = p.tasks_completed_week > 0
    ? `You finished ${p.tasks_completed_week} task${p.tasks_completed_week === 1 ? '' : 's'} this week. Every one took effort. Thank you for trying!`
    : 'A new week is a fresh start. Whenever you are ready, Bloomi is here.'
  return (
    <Card className="flex items-center gap-4 bg-lav-soft">
      <Bloomi pose={p.tasks_completed_week > 0 ? 'happy' : 'thinking'} size={96} />
      <p className="text-xl font-extrabold leading-snug text-lav-ink">{msg}</p>
    </Card>
  )
}

export default function ProgressPage() {
  const sum = useAsync(() => api.progressSummary())
  const mood = useAsync(() => api.progressMood(30))
  const p = sum.data
  const g = p ? gardenState(p.total_points, p.best_streak) : null

  return (
    <PageShell title="My garden" subtitle="Every bit of effort helps it grow">
      {sum.loading ? <Loading label="Growing your garden…" /> : sum.error || !p || !g ? <ErrorState message={sum.error} onRetry={sum.retry} /> : (
        <div className="flex flex-col gap-6">
          <Card className="p-3 sm:p-4">
            <FocusGarden points={p.total_points} bestStreak={p.best_streak} />
            <div className="flex items-center gap-4 px-2 pb-1 pt-4">
              <ProgressRing size={76} stroke={10} value={g.nextPointsProgress} label={g.nextPoints ? `${Math.round(g.nextPointsProgress * 100)} percent of the way to ${g.nextPoints.name}` : 'All point rewards grown'}>
                <span className="text-xl" aria-hidden>🌱</span>
              </ProgressRing>
              <div>
                <p className="text-xl font-extrabold">{g.nextPoints ? `${g.pointsToNext} more point${g.pointsToNext === 1 ? '' : 's'} to grow: ${g.nextPoints.name}` : 'Your garden is fully grown!'}</p>
                <p className="text-base text-ink-soft">Garden rewards are just for fun. They are a picture of your points and streaks.</p>
              </div>
            </div>
            <div className="px-2 pb-2 pt-3"><GardenRewardChips points={p.total_points} bestStreak={p.best_streak} /></div>
          </Card>

          <section>
            <SectionHeading title="My achievements" />
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard icon="star" tint="peach" value={p.total_points} label="Points" hint="Earned for every step you finish" />
              <MetricCard icon="flower" tint="mint" value={`${p.current_streak} day${p.current_streak === 1 ? '' : 's'}`} label="Current streak" hint={`Best so far: ${p.best_streak} day${p.best_streak === 1 ? '' : 's'}`} />
              <MetricCard icon="check" tint="lav" value={p.tasks_completed_today} label="Tasks today" />
              <MetricCard icon="calendar" tint="sky" value={p.tasks_completed_week} label="Tasks this week" />
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <WeeklyGoal done={p.tasks_completed_week} />
            <StreakTrail current={p.current_streak} best={p.best_streak} />
          </div>

          {mood.loading ? <Loading label="Loading your rhythm…" /> : mood.error ? <ErrorState message={mood.error} onRetry={mood.retry} /> : (
            <>
              <FocusRhythmChart data={mood.data ?? []} />
              <FeelingsCalendar data={mood.data ?? []} />
            </>
          )}

          <WeeklyNote p={p} />
        </div>
      )}
    </PageShell>
  )
}
