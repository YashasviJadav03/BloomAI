import { useMemo, useState } from 'react'
import type { MoodDay } from '../../api/types'
import { BloomiIllustration } from '../mascot/BloomiIllustration'
import { MoodFace } from '../mascot/MoodFace'
import { ChartCard } from './ChartCard'

type Band = 'bright' | 'okay' | 'gentle'
// Bands are for the AVERAGE of a day's check-in feelings scores. They are a friendly summary, not a measurement.
const bandOf = (n: number): Band => (n >= 70 ? 'bright' : n >= 45 ? 'okay' : 'gentle')
const BAND = {
  bright: { word: 'bright', face: 'happy' as const, bg: 'bg-sun-light border-sun' },
  okay: { word: 'steady', face: 'calm' as const, bg: 'bg-mint-soft border-mint' },
  gentle: { word: 'gentle', face: 'worried' as const, bg: 'bg-lav-soft border-lav' },
}
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function FeelingsCalendar({ data }: { data: MoodDay[] }) {
  const [picked, setPicked] = useState<string | null>(null)
  const cells = useMemo(() => {
    const byDate = new Map(data.map((r) => [r.date, r]))
    const days: { date: string; d: Date; row?: MoodDay }[] = []
    for (let i = 27; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ date: iso(d), d, row: byDate.get(iso(d)) }) }
    const lead = (days[0].d.getDay() + 6) % 7 // weeks start on Monday
    return { days, lead }
  }, [data])
  const filled = cells.days.filter((c) => c.row)
  const sel = cells.days.find((c) => c.date === picked && c.row)

  return (
    <ChartCard question="What was each day like?" title="My Feelings Calendar"
      footnote="Each face is the average of how you said you felt that day. Empty days just mean no check-in. That is perfectly fine.">
      {filled.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <BloomiIllustration pose="thinking" size={110} tone="lavender" />
          <p className="text-xl font-extrabold">Your calendar is waiting</p>
          <p className="max-w-sm text-lg text-ink-soft">Each check-in adds a little face here.</p>
        </div>
      ) : (
        <>
          <div role="grid" aria-label="Feelings in the last 4 weeks" className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => <span key={i} role="columnheader" className="text-center text-sm font-extrabold text-ink-soft">{l}</span>)}
            {Array.from({ length: cells.lead }).map((_, i) => <span key={`p${i}`} aria-hidden />)}
            {cells.days.map((c) => {
              const long = c.d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
              if (!c.row) return (
                <span key={c.date} role="gridcell" aria-label={`${long}: no check-in`} className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-line text-sm text-ink-soft/70">{c.d.getDate()}</span>
              )
              const band = BAND[bandOf(c.row.avg_emotion_score)]
              return (
                <button key={c.date} role="gridcell" type="button" onClick={() => setPicked(c.date === picked ? null : c.date)} aria-pressed={picked === c.date}
                  aria-label={`${long}: feeling ${band.word}, ${c.row.checkins} check-in${c.row.checkins === 1 ? '' : 's'}`}
                  className={`flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl border-2 ${band.bg} ${picked === c.date ? 'ring-4 ring-lav-deep/40' : ''}`}>
                  <MoodFace mood={band.face} size={26} />
                  <span className="text-xs font-bold leading-none text-ink-soft">{c.d.getDate()}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 min-h-7 text-center text-lg font-bold" aria-live="polite">
            {sel?.row ? `${sel.d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: a ${BAND[bandOf(sel.row.avg_emotion_score)].word} day` : 'Tap a face to see the day.'}
          </p>
          <ul className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-base text-ink-soft" aria-label="Legend">
            {(['bright', 'okay', 'gentle'] as Band[]).map((b) => <li key={b} className="flex items-center gap-1"><MoodFace mood={BAND[b].face} size={22} /> {BAND[b].word}</li>)}
          </ul>
        </>
      )}
    </ChartCard>
  )
}
