import type { Emoji } from '../../api/types'

// Mood faces share Bloomi's sprout and soft clay style, each with its own hue AND its own face shape,
// so a mood is never communicated by colour alone.
const HUES: Record<Emoji, [string, string]> = {
  happy: ['#FFE0C2', '#F4A261'],
  calm: ['#DFF3EA', '#8FD0B3'],
  tired: ['#E4E0F1', '#A79CCB'],
  sad: ['#DCEBF8', '#7FB0DD'],
  worried: ['#FBDCE5', '#E28CA5'],
  angry: ['#FBD9CF', '#E9826A'],
}
const INK = '#2B2350'

export function MoodFace({ mood, size = 72 }: { mood: Emoji; size?: number }) {
  const [light, deep] = HUES[mood]
  const id = `mf-${mood}`
  const stroke = { fill: 'none', stroke: INK, strokeWidth: 4.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const dot = (cx: number, cy = 62, r = 5.2) => <circle cx={cx} cy={cy} r={r} fill={INK} />
  return (
    <svg aria-hidden viewBox="0 0 120 120" width={size} height={size} className="shrink-0">
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.3" r="0.85"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="0.35" stopColor={light} /><stop offset="1" stopColor={deep} /></radialGradient>
      </defs>
      <ellipse cx="60" cy="108" rx="34" ry="5" fill="#5B4A9A" opacity="0.14" />
      <path d="M60 22 C 90 22 108 42 108 66 C 108 92 90 106 60 106 C 30 106 12 92 12 66 C 12 42 30 22 60 22 Z" fill={`url(#${id})`} />
      {/* tiny sprout */}
      <path d="M60 24 V14" stroke="#69BE9C" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M60 16 C 52 6 38 7 36 16 C 46 22 56 22 60 16 Z" fill="#A9D9C4" /><path d="M60 14 C 68 4 82 5 84 14 C 74 20 64 20 60 14 Z" fill="#8FD3B3" />
      <ellipse cx="31" cy="74" rx="6" ry="3.8" fill="#F5A3BA" opacity="0.5" /><ellipse cx="89" cy="74" rx="6" ry="3.8" fill="#F5A3BA" opacity="0.5" />
      {mood === 'happy' && <g><path d="M36 62 Q44 50 52 62" {...stroke} /><path d="M68 62 Q76 50 84 62" {...stroke} /><path d="M46 78 Q60 96 74 78 Z" fill="#4B2A5E" stroke="#4B2A5E" strokeWidth="2" strokeLinejoin="round" /></g>}
      {mood === 'calm' && <g><path d="M36 58 Q44 67 52 58" {...stroke} /><path d="M68 58 Q76 67 84 58" {...stroke} /><path d="M50 78 Q60 85 70 78" {...stroke} /></g>}
      {mood === 'tired' && <g><path d="M36 60 Q44 70 52 60 Z" fill={INK} /><path d="M68 60 Q76 70 84 60 Z" fill={INK} /><path d="M35 60 H53 M67 60 H85" stroke={INK} strokeWidth="3" strokeLinecap="round" /><ellipse cx="60" cy="82" rx="4.5" ry="5.5" fill="#4B2A5E" /><path d="M92 36 h8 l-8 9 h8" stroke="#8E7CD0" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
      {mood === 'sad' && <g>{dot(44)}{dot(76)}<path d="M34 50 Q42 46 52 52" {...stroke} strokeWidth={3} /><path d="M68 52 Q78 46 86 50" {...stroke} strokeWidth={3} /><path d="M48 86 Q60 74 72 86" {...stroke} /><path d="M82 70 Q86 76 82 80 Q78 76 82 70 Z" fill="#7FB0DD" /></g>}
      {mood === 'worried' && <g>{dot(44, 64, 5.6)}{dot(76, 64, 5.6)}<path d="M34 52 Q42 44 52 49" {...stroke} strokeWidth={3} /><path d="M68 49 Q78 44 86 52" {...stroke} strokeWidth={3} /><path d="M47 84 Q53 79 58 84 Q64 89 73 82" {...stroke} /></g>}
      {mood === 'angry' && <g>{dot(44, 66)}{dot(76, 66)}<path d="M33 49 L53 58" {...stroke} strokeWidth={4.6} /><path d="M87 49 L67 58" {...stroke} strokeWidth={4.6} /><path d="M48 86 Q60 79 72 86" {...stroke} /></g>}
    </svg>
  )
}

export const MOOD_LABEL: Record<Emoji, string> = { happy: 'Happy', calm: 'Calm', tired: 'Tired', sad: 'Sad', worried: 'Worried', angry: 'Angry' }
export const MOODS: Emoji[] = ['happy', 'calm', 'tired', 'worried', 'sad', 'angry']
