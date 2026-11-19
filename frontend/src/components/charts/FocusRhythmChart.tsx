import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { MoodDay } from '../../api/types'
import { Segmented } from '../ui'
import { ChartCard } from './ChartCard'
import { BloomiIllustration } from '../mascot/BloomiIllustration'

type Metric = 'focus' | 'emotion'
const WORD = (n: number) => (n >= 75 ? 'high' : n >= 50 ? 'medium' : 'gentle')

/** Last 7 calendar days ending today, merged with the API rows. Days without a check-in stay as gaps (no invented data). */
function lastSevenDays(rows: MoodDay[]) {
  const byDate = new Map(rows.map((r) => [r.date, r]))
  const out: { date: string; label: string; long: string; focus: number | null; emotion: number | null; checkins: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const r = byDate.get(iso)
    out.push({
      date: iso,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      long: d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      focus: r ? Math.round(r.avg_focus_score) : null,
      emotion: r ? Math.round(r.avg_emotion_score) : null,
      checkins: r?.checkins ?? 0,
    })
  }
  return out
}

export function FocusRhythmChart({ data }: { data: MoodDay[] }) {
  const [metric, setMetric] = useState<Metric>('focus')
  const days = useMemo(() => lastSevenDays(data), [data])
  const key = metric === 'focus' ? 'focus' : 'emotion'
  const color = metric === 'focus' ? '#2F6F62' : '#6552AE'
  const withData = days.filter((d) => d[key] !== null)
  const name = metric === 'focus' ? 'Focus check-in' : 'Feelings check-in'

  return (
    <ChartCard
      question="How have my days felt?"
      title="My Focus Rhythm"
      controls={<Segmented label="Show" value={metric} onChange={setMetric} options={[{ value: 'focus', label: 'Focus', icon: 'target' }, { value: 'emotion', label: 'Emotions', icon: 'heart' }]} />}
      footnote="These numbers come from how you said you felt in your check-ins. They are not a test and not a medical measure. There are no good or bad days here."
    >
      {withData.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BloomiIllustration pose="thinking" size={120} tone="sky" />
          <p className="text-xl font-extrabold">No check-ins this week yet</p>
          <p className="max-w-sm text-lg text-ink-soft">After a task, tell Bloomi how it felt. Your rhythm will appear here.</p>
        </div>
      ) : (
        <>
          <div className="h-56 w-full" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days} margin={{ top: 12, right: 14, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#E8E1F3" strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#5B5878', fontSize: 14, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} ticks={[0, 50, 100]} width={34} tick={{ fill: '#5B5878', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ stroke: '#B9ACE5', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as (typeof days)[number] | undefined
                    if (!active || !p || p[key] === null) return null
                    return (
                      <div className="rounded-2xl border border-line bg-card px-3 py-2 text-base shadow-lift">
                        <p className="font-extrabold">{p.long}</p>
                        <p className="text-ink-soft">{name}: {p[key]} out of 100 ({WORD(p[key] as number)})</p>
                        <p className="text-ink-soft">{p.checkins} check-in{p.checkins === 1 ? '' : 's'}</p>
                      </div>
                    )
                  }}
                />
                <Line type="monotone" dataKey={key} stroke={color} strokeWidth={4} connectNulls={false}
                  dot={{ r: 6, fill: '#fff', stroke: color, strokeWidth: 3 }} activeDot={{ r: 8 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {withData.length === 1 && <p className="mt-2 text-center text-base text-ink-soft">One check-in so far. A line will grow as you add more days.</p>}
          {/* Accessible alternative: the same data as a table */}
          <div className="sr-only"><table>
            <caption>{name} scores for the last 7 days, out of 100</caption>
            <thead><tr><th>Day</th><th>Score</th><th>Check-ins</th></tr></thead>
            <tbody>{days.map((d) => <tr key={d.date}><td>{d.long}</td><td>{d[key] ?? 'no check-in'}</td><td>{d.checkins}</td></tr>)}</tbody>
          </table></div>
        </>
      )}
    </ChartCard>
  )
}
