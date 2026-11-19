import { Card } from '../ui'

const SHOW = 10
/** A path of stepping stones: one stone per day of the current streak. A rest is just a pause: the best streak stays on show. */
export function StreakTrail({ current, best }: { current: number; best: number }) {
  const shown = Math.min(current, SHOW)
  const stones = Array.from({ length: Math.max(shown, 0) })
  return (
    <Card>
      <p className="text-sm font-extrabold uppercase tracking-wide text-lav-deep">How long have I kept going?</p>
      <h2 className="mb-3 mt-1 text-2xl font-extrabold">My Streak Trail</h2>
      {current === 0 ? (
        <p className="rounded-2xl bg-mint-soft p-4 text-xl font-bold text-sage-dark">A new trail starts with one small step today. 🌱</p>
      ) : (
        <>
          <ol className="flex flex-wrap items-center gap-2" aria-label={`${current} days in a row`}>
            {current > SHOW && <li className="text-base font-bold text-ink-soft">+{current - SHOW} earlier</li>}
            {stones.map((_, i) => {
              const last = i === shown - 1
              return (
                <li key={i} className={`flex items-center justify-center rounded-full font-extrabold ${last ? 'h-14 w-14 bg-sun text-ink shadow-soft' : 'h-10 w-10 bg-mint text-sage-dark'}`}>
                  {last ? '🌟' : '✓'}
                </li>
              )
            })}
            <li aria-hidden className="text-3xl">🌿</li>
          </ol>
          <p className="mt-3 text-xl font-extrabold">{current} day{current === 1 ? '' : 's'} in a row!</p>
        </>
      )}
      <p className="mt-1 text-base text-ink-soft">Your best trail so far: {best} day{best === 1 ? '' : 's'}. Resting is okay. Your best never goes away.</p>
    </Card>
  )
}
