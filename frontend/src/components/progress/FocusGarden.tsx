import { useMemo } from 'react'
import { GARDEN_REWARDS, gardenState, type GardenReward, type PlantKind } from '../../lib/garden'
import { BloomiArt } from '../mascot/BloomiArt'

// Plant positions in the 400 x 260 scene (x, ground y). Order matches nothing in particular: every reward owns a spot.
const SPOTS: Record<PlantKind, { x: number; y: number; scale?: number }> = {
  seedling: { x: 44, y: 232 },
  tulip: { x: 92, y: 238 },
  bluebell: { x: 138, y: 232 },
  daisy: { x: 268, y: 234 },
  rose: { x: 312, y: 240 },
  tree: { x: 360, y: 232, scale: 1 },
  butterfly: { x: 112, y: 150 },
  rainbow: { x: 200, y: 150 },
}

function Plant({ kind }: { kind: PlantKind }) {
  const stem = <path d="M0 0 C 0 -14 2 -26 0 -44" stroke="#5DB594" strokeWidth="4" strokeLinecap="round" fill="none" />
  const leaves = (
    <g>
      <path d="M0 -16 C -14 -26 -22 -20 -22 -12 C -12 -8 -4 -10 0 -16 Z" fill="#8FD3B3" />
      <path d="M0 -24 C 12 -34 22 -28 22 -20 C 12 -16 4 -18 0 -24 Z" fill="#A9D9C4" />
    </g>
  )
  switch (kind) {
    case 'seedling':
      return <g><path d="M0 0 V-22" stroke="#5DB594" strokeWidth="4" strokeLinecap="round" /><path d="M0 -22 C -12 -34 -26 -30 -28 -20 C -16 -14 -4 -14 0 -22 Z" fill="#A9D9C4" /><path d="M0 -20 C 10 -34 24 -32 28 -24 C 18 -14 6 -12 0 -20 Z" fill="#8FD3B3" /></g>
    case 'tulip':
      return <g>{stem}{leaves}<path d="M-13 -44 C -14 -62 -4 -66 0 -58 C 4 -66 14 -62 13 -44 C 8 -36 -8 -36 -13 -44 Z" fill="#9B8AD1" /><path d="M-5 -46 C -6 -58 0 -62 0 -56 C 0 -62 6 -58 5 -46 Z" fill="#B9ACE5" /></g>
    case 'daisy':
      return (
        <g>{stem}{leaves}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <ellipse key={a} cx="0" cy="-57" rx="4.6" ry="10" fill="#F4A261" transform={`rotate(${a} 0 -46)`} />)}
          <circle cx="0" cy="-46" r="7" fill="#FFF1D6" />
        </g>
      )
    case 'bluebell':
      return <g>{stem}{leaves}<path d="M-12 -34 C -16 -48 -8 -62 0 -62 C 8 -62 16 -48 12 -34 C 6 -29 -6 -29 -12 -34 Z" fill="#6AA9D8" /><path d="M-6 -38 C -8 -48 -3 -57 0 -57" stroke="#A9CFEE" strokeWidth="3" strokeLinecap="round" fill="none" /></g>
    case 'rose':
      return <g>{stem}{leaves}<circle cx="0" cy="-50" r="13" fill="#D97B93" /><path d="M-7 -50 C -7 -57 7 -57 7 -50 C 7 -44 -5 -44 -4 -50 C -4 -53 3 -53 3 -50" stroke="#F2B5C4" strokeWidth="2.6" strokeLinecap="round" fill="none" /></g>
    case 'tree':
      return (
        <g>
          <path d="M-5 0 C -4 -20 -3 -36 -2 -52 L 4 -52 C 5 -36 5 -20 6 0 Z" fill="#B58A63" />
          <circle cx="0" cy="-68" r="24" fill="#8FD3B3" /><circle cx="-18" cy="-54" r="16" fill="#A9D9C4" /><circle cx="18" cy="-54" r="16" fill="#7FC4A8" />
          <circle cx="-6" cy="-74" r="6" fill="#DDF6EA" opacity="0.7" />
        </g>
      )
    case 'butterfly':
      return <g className="garden-float"><ellipse cx="-9" cy="-4" rx="10" ry="8" fill="#F4A261" transform="rotate(-20 -9 -4)" /><ellipse cx="9" cy="-4" rx="10" ry="8" fill="#F4A261" transform="rotate(20 9 -4)" /><ellipse cx="-7" cy="6" rx="6" ry="5" fill="#FDEBDC" /><ellipse cx="7" cy="6" rx="6" ry="5" fill="#FDEBDC" /><rect x="-1.5" y="-8" width="3" height="18" rx="1.5" fill="#2B2350" /></g>
    case 'rainbow':
      return (
        <g opacity="0.7" fill="none" strokeLinecap="round" strokeWidth="9">
          <path d="M-150 90 A 150 150 0 0 1 150 90" stroke="#F2B5C4" /><path d="M-139 90 A 139 139 0 0 1 139 90" stroke="#FAD7B5" />
          <path d="M-128 90 A 128 128 0 0 1 128 90" stroke="#FFF1B8" /><path d="M-117 90 A 117 117 0 0 1 117 90" stroke="#BDE5CF" />
          <path d="M-106 90 A 106 106 0 0 1 106 90" stroke="#BFDDF4" />
        </g>
      )
  }
}

/** A seed spot: where a locked reward will grow. Quiet on purpose. */
function SeedSpot() {
  return <g opacity="0.75"><ellipse cx="0" cy="2" rx="13" ry="5" fill="#B9A58A" opacity="0.55" /><circle cx="0" cy="-3" r="2.6" fill="#8B7355" /></g>
}

export function FocusGarden({ points, bestStreak }: { points: number; bestStreak: number }) {
  const state = useMemo(() => gardenState(points, bestStreak), [points, bestStreak])
  const has = (r: GardenReward) => state.unlocked.some((u) => u.id === r.id)
  const unlockedNames = state.unlocked.map((u) => u.name)
  const label = `Your Focus Garden. ${state.unlocked.length} of ${GARDEN_REWARDS.length} garden rewards grown${unlockedNames.length ? `: ${unlockedNames.join(', ')}` : ''}.`
  const ground = GARDEN_REWARDS.filter((r) => r.plant !== 'butterfly' && r.plant !== 'rainbow')
  const rainbow = GARDEN_REWARDS.find((r) => r.plant === 'rainbow')!
  const butterfly = GARDEN_REWARDS.find((r) => r.plant === 'butterfly')!
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label={label} className="w-full overflow-hidden rounded-[1.5rem]">
      <defs>
        <linearGradient id="gd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3EEFA" /><stop offset="0.7" stopColor="#F4F1FB" /><stop offset="1" stopColor="#FFF6E6" /></linearGradient>
        <linearGradient id="gd-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE6D3" /><stop offset="1" stopColor="#8CCBB0" /></linearGradient>
        <radialGradient id="gd-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#FFE2BE" /><stop offset="1" stopColor="#FFE2BE" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#gd-sky)" />
      <circle cx="338" cy="52" r="44" fill="url(#gd-sun)" /><circle cx="338" cy="52" r="17" fill="#FFD9A8" />
      <g fill="#fff" opacity="0.85"><ellipse cx="70" cy="48" rx="30" ry="10" /><ellipse cx="94" cy="40" rx="20" ry="10" /><ellipse cx="236" cy="30" rx="24" ry="8" /><ellipse cx="254" cy="24" rx="14" ry="7" /></g>

      {has(rainbow) && <g transform="translate(200 90)" className="garden-item"><Plant kind="rainbow" /></g>}

      <path d="M0 176 C 70 140 130 150 190 170 C 250 190 320 150 400 168 V 260 H 0 Z" fill="#DCD3F3" />
      <path d="M0 198 C 80 170 150 182 220 196 C 290 210 350 184 400 192 V 260 H 0 Z" fill="#CDEBDD" />
      <path d="M0 218 C 100 204 200 212 300 214 C 350 215 380 212 400 210 V 260 H 0 Z" fill="url(#gd-ground)" />

      {/* plants that have grown, or a seed spot where they will */}
      {ground.map((r) => {
        const s = SPOTS[r.plant]
        return (
          <g key={r.id} transform={`translate(${s.x} ${s.y}) scale(${s.scale ?? 1})`}>
            {has(r) ? <g className="garden-item"><Plant kind={r.plant} /></g> : <SeedSpot />}
          </g>
        )
      })}
      {has(butterfly) && <g transform={`translate(${SPOTS.butterfly.x} ${SPOTS.butterfly.y})`}><Plant kind="butterfly" /></g>}

      {/* Bloomi lives in the garden: waves hello to a new gardener, celebrates once things grow */}
      <g transform="translate(152 116) scale(0.5)"><BloomiArt pose={state.unlocked.length === 0 ? 'welcome' : state.unlocked.length >= 6 ? 'growing' : 'happy'} arms={state.unlocked.length === 0 ? 'wave' : 'down'} /></g>
    </svg>
  )
}

export function GardenRewardChips({ points, bestStreak }: { points: number; bestStreak: number }) {
  const state = gardenState(points, bestStreak)
  const has = (r: GardenReward) => state.unlocked.some((u) => u.id === r.id)
  const ICON: Record<PlantKind, string> = { seedling: '🌱', tulip: '🌷', daisy: '🌼', bluebell: '🔔', rose: '🌹', tree: '🌳', butterfly: '🦋', rainbow: '🌈' }
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Garden rewards">
      {GARDEN_REWARDS.map((r) => {
        const on = has(r)
        return (
          <li key={r.id} className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${on ? 'border-mint bg-mint-soft' : 'border-line bg-lav-mist'}`}>
            <span className={`text-2xl ${on ? '' : 'opacity-40 grayscale'}`} aria-hidden>{ICON[r.plant]}</span>
            <span className="min-w-0 text-sm leading-tight">
              <span className={`block font-extrabold ${on ? 'text-ink' : 'text-ink-soft'}`}>{r.name}</span>
              <span className="text-ink-soft">{on ? 'Grown ✓' : r.kind === 'points' ? `at ${r.threshold} points` : `${r.threshold}-day streak`}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
