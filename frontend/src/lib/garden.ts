// Focus Garden milestones.
// IMPORTANT: these thresholds live only in the frontend. They are a visual reward for the REAL points and
// streak numbers from /api/progress/summary. They are not stored, not achievements from the backend, and they
// never change a score. Streak rewards use the BEST streak, so a missed day never takes a flower away.

export type PlantKind = 'seedling' | 'tulip' | 'daisy' | 'bluebell' | 'rose' | 'tree' | 'butterfly' | 'rainbow'
export interface GardenReward {
  id: string
  kind: 'points' | 'streak'
  threshold: number
  plant: PlantKind
  name: string
}

export const GARDEN_REWARDS: GardenReward[] = [
  { id: 'p25', kind: 'points', threshold: 25, plant: 'seedling', name: 'First sprout' },
  { id: 'p60', kind: 'points', threshold: 60, plant: 'tulip', name: 'Lavender tulip' },
  { id: 'p120', kind: 'points', threshold: 120, plant: 'daisy', name: 'Sunny daisy' },
  { id: 's3', kind: 'streak', threshold: 3, plant: 'butterfly', name: 'Butterfly' },
  { id: 'p200', kind: 'points', threshold: 200, plant: 'bluebell', name: 'Sky bluebell' },
  { id: 'p320', kind: 'points', threshold: 320, plant: 'rose', name: 'Berry rose' },
  { id: 's7', kind: 'streak', threshold: 7, plant: 'rainbow', name: 'Rainbow' },
  { id: 'p500', kind: 'points', threshold: 500, plant: 'tree', name: 'Little tree' },
]

export interface GardenState {
  unlocked: GardenReward[]
  locked: GardenReward[]
  nextPoints: GardenReward | null
  /** 0..1 progress from the previous points milestone to the next one */
  nextPointsProgress: number
  pointsToNext: number
}

export function gardenState(points: number, bestStreak: number): GardenState {
  const isUnlocked = (r: GardenReward) => (r.kind === 'points' ? points >= r.threshold : bestStreak >= r.threshold)
  const unlocked = GARDEN_REWARDS.filter(isUnlocked)
  const locked = GARDEN_REWARDS.filter((r) => !isUnlocked(r))
  const pointRewards = GARDEN_REWARDS.filter((r) => r.kind === 'points')
  const nextPoints = pointRewards.find((r) => points < r.threshold) ?? null
  const prev = [...pointRewards].reverse().find((r) => points >= r.threshold)?.threshold ?? 0
  const nextPointsProgress = nextPoints ? (points - prev) / (nextPoints.threshold - prev) : 1
  return { unlocked, locked, nextPoints, nextPointsProgress, pointsToNext: nextPoints ? nextPoints.threshold - points : 0 }
}

/** Reward unlocked by going from `before` to `after` points (used for the "new leaf" celebration). */
export function newlyUnlockedByPoints(before: number, after: number): GardenReward | null {
  return GARDEN_REWARDS.filter((r) => r.kind === 'points' && before < r.threshold && after >= r.threshold).pop() ?? null
}
