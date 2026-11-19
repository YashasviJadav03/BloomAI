import type { ReactElement } from 'react'

// Bloomi, the BloomAI mascot: a soft lavender blob with a tiny mint sprout.
// BloomiArt is the raw <g> artwork (200 x 230 box, y starts at -22 for head-room), so it can be dropped
// inside any other SVG scene (the Focus Garden does this). <Bloomi/> wraps it in its own <svg>.
// Every pose shares the SAME body, sprout, eyes, cheeks and proportions: only face, arms and props change.

export type BloomiPose = 'welcome' | 'focused' | 'happy' | 'calm' | 'thinking' | 'sleepy' | 'growing'
export type BloomiArms = 'down' | 'wave' | 'up' | 'out' | 'hug' | 'book' | 'chin'
export type BloomiAnimate = 'idle' | 'none' | 'wave' | 'bounce' | 'wiggle'

export const BLOOMI_POSES: BloomiPose[] = ['welcome', 'focused', 'happy', 'calm', 'thinking', 'sleepy', 'growing']
export const BLOOMI_VIEWBOX = '0 -22 200 252'

const INK = '#2B2350'
const ARM_EDGE = '#8E7CD0'
const ARM_CORE = '#B8ABE8'

const DEFAULT_ARMS: Record<BloomiPose, BloomiArms> = {
  welcome: 'wave', focused: 'book', happy: 'up', calm: 'hug', thinking: 'chin', sleepy: 'down', growing: 'up',
}

/** Shared gradients/filters. Ids are fixed ("bl-*") so repeated instances on a page stay identical. */
export function BloomiDefs() {
  return (
    <defs>
      <radialGradient id="bl-body" cx="0.36" cy="0.26" r="0.9">
        <stop offset="0" stopColor="#DCD3F6" />
        <stop offset="0.45" stopColor="#B4A6E4" />
        <stop offset="1" stopColor="#8470C8" />
      </radialGradient>
      <radialGradient id="bl-belly" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stopColor="#F3EFFC" />
        <stop offset="1" stopColor="#D9D0F3" />
      </radialGradient>
      <linearGradient id="bl-leaf" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#DDF6EA" />
        <stop offset="0.5" stopColor="#A9D9C4" />
        <stop offset="1" stopColor="#62B796" />
      </linearGradient>
      <radialGradient id="bl-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#A9D9C4" stopOpacity="0.8" />
        <stop offset="1" stopColor="#A9D9C4" stopOpacity="0" />
      </radialGradient>
      <filter id="bl-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" /></filter>
      <filter id="bl-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
    </defs>
  )
}

function Arm({ d }: { d: string }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={ARM_EDGE} strokeWidth="18" />
      <path d={d} stroke={ARM_CORE} strokeWidth="11" />
    </g>
  )
}

function Sparkle({ x, y, s = 1, c = '#F4A261' }: { x: number; y: number; s?: number; c?: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -9 Q1.6 -1.6 9 0 Q1.6 1.6 0 9 Q-1.6 1.6 -9 0 Q-1.6 -1.6 0 -9 Z" fill={c} />
}

function Eyes({ pose }: { pose: BloomiPose }) {
  const dark = { fill: INK }
  const stroke = { fill: 'none', stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round' as const }
  if (pose === 'happy') {
    return <g><path d="M62 113 Q74 93 86 113" {...stroke} /><path d="M114 113 Q126 93 138 113" {...stroke} /></g>
  }
  if (pose === 'calm') {
    return <g><path d="M62 106 Q74 120 86 106" {...stroke} /><path d="M114 106 Q126 120 138 106" {...stroke} /></g>
  }
  if (pose === 'sleepy') {
    return (
      <g>
        <path d="M62 108 Q74 126 86 108 Z" {...dark} /><path d="M114 108 Q126 126 138 108 Z" {...dark} />
        <path d="M61 108 H87 M113 108 H139" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      </g>
    )
  }
  // open eyes (welcome, focused, thinking, growing): pupil offset shows where Bloomi is looking
  const [dx, dy] = pose === 'focused' ? [0, 4] : pose === 'thinking' ? [4, -4] : [0, 0]
  const ry = pose === 'focused' ? 12.5 : 14.5
  return (
    <g>
      <g className="bloomi-blink">
        {[74, 126].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx + dx} cy={110 + dy} rx="11" ry={ry} {...dark} />
            <circle cx={cx + dx - 3.6} cy={110 + dy - 5} r="4.4" fill="#fff" />
            <circle cx={cx + dx + 4} cy={110 + dy + 5} r="2.1" fill="#fff" opacity="0.9" />
            {pose === 'growing' && <Sparkle x={cx + dx + 5} y={110 + dy - 7} s={0.45} c="#fff" />}
          </g>
        ))}
      </g>
      {pose === 'focused' && <g stroke="#6A58B3" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8"><path d="M62 91 Q74 86 86 91" /><path d="M114 91 Q126 86 138 91" /></g>}
      {pose === 'thinking' && <g stroke="#6A58B3" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8"><path d="M62 92 H86" /><path d="M114 89 Q126 80 138 87" /></g>}
    </g>
  )
}

function Mouth({ pose }: { pose: BloomiPose }) {
  const line = { fill: 'none', stroke: INK, strokeWidth: 3.6, strokeLinecap: 'round' as const }
  if (pose === 'happy' || pose === 'growing' || pose === 'welcome') {
    return (
      <g>
        <path d="M85 127 Q100 158 115 127 Q100 133 85 127 Z" fill="#4B2A5E" stroke="#4B2A5E" strokeWidth="2" strokeLinejoin="round" />
        <path d="M92 143 Q100 135 108 143 Q100 151 92 143 Z" fill="#F28FA8" />
      </g>
    )
  }
  if (pose === 'sleepy') return <ellipse cx="100" cy="136" rx="6" ry="7.5" fill="#4B2A5E" />
  if (pose === 'thinking') return <path d="M91 134 Q97 129 103 134 Q108 138 112 132" {...line} />
  if (pose === 'calm') return <path d="M91 131 Q100 138 109 131" {...line} />
  return <path d="M89 130 Q100 140 111 130" {...line} />       // focused: quiet smile
}

/** Arms come in two layers: "back" arms peek out from behind the body, "front" arms lie over the belly. */
function armLayers(arms: BloomiArms, pose: BloomiPose): { back: ReactElement | null; front: ReactElement | null } {
  switch (arms) {
    case 'wave':
      return { back: <g><Arm d="M28 142 Q18 166 30 180" /><g className="bloomi-wave"><Arm d="M172 140 Q194 122 188 88" /></g></g>, front: null }
    case 'up':
      return { back: <g><Arm d="M28 138 Q6 112 14 76" /><Arm d="M172 138 Q194 112 186 76" /></g>, front: null }
    case 'out':
      return { back: <g><Arm d="M26 142 Q8 142 2 124" /><Arm d="M174 142 Q192 142 198 124" /></g>, front: null }
    case 'hug':
      return { back: null, front: <g><Arm d="M32 140 Q40 182 98 174" /><Arm d="M168 140 Q160 182 102 174" /></g> }
    case 'book':
      return { back: null, front: <g><Arm d="M32 142 Q30 174 72 178" /><Arm d="M168 142 Q170 174 128 178" /></g> }
    case 'chin':
      return { back: <Arm d="M28 146 Q18 168 30 182" />, front: <Arm d="M170 146 Q186 124 148 136" /> }
    default:
      return {
        back: <g><Arm d={pose === 'sleepy' ? 'M28 146 Q22 170 36 182' : 'M28 142 Q16 166 30 180'} /><Arm d={pose === 'sleepy' ? 'M172 146 Q178 170 164 182' : 'M172 142 Q184 166 170 180'} /></g>,
        front: null,
      }
  }
}

function Book() {
  return (
    <g>
      <rect x="64" y="150" width="72" height="46" rx="8" fill="#7FC4A8" />
      <rect x="64" y="150" width="72" height="46" rx="8" fill="none" stroke="#5DB594" strokeWidth="2" />
      <rect x="68" y="190" width="64" height="6" rx="3" fill="#FFF8EC" />
      <path d="M100 178 C 92 168 82 170 82 178 C 90 182 98 182 100 178 Z" fill="#DDF6EA" />
      <path d="M100 178 C 108 166 120 168 120 176 C 112 182 104 182 100 178 Z" fill="#A9D9C4" />
      <path d="M100 178 V186" stroke="#DDF6EA" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  )
}

export function BloomiArt({ pose = 'welcome', arms, animate = 'idle' }: { pose?: BloomiPose; arms?: BloomiArms; animate?: BloomiAnimate }) {
  const a = arms ?? DEFAULT_ARMS[pose]
  const layers = armLayers(a, pose)
  const droop = pose === 'sleepy'
  const sway = animate === 'idle' && !droop ? 'bloomi-sprout' : ''
  const move = animate === 'bounce' ? 'bloomi-bounce' : animate === 'wiggle' ? 'bloomi-wiggle' : ''
  return (
    <g>
      <BloomiDefs />
      {/* ground shadow */}
      <ellipse cx="100" cy="216" rx="64" ry="9" fill="#5B4A9A" opacity="0.16" filter="url(#bl-blur)" />
      {pose === 'calm' && (
        <g fill="none" stroke="#A9D9C4" strokeWidth="3" className="bloomi-aura">
          <circle cx="100" cy="134" r="90" opacity="0.5" /><circle cx="100" cy="134" r="99" opacity="0.28" />
        </g>
      )}
      {pose === 'growing' && <circle cx="100" cy="6" r="26" fill="url(#bl-glow)" />}

      <g className={move}>
        {/* feet */}
        <ellipse cx="70" cy="208" rx="17" ry="9.5" fill="#8470C8" /><ellipse cx="130" cy="208" rx="17" ry="9.5" fill="#8470C8" />
        <ellipse cx="66" cy="205" rx="7" ry="3" fill="#B4A6E4" opacity="0.8" /><ellipse cx="126" cy="205" rx="7" ry="3" fill="#B4A6E4" opacity="0.8" />

        {layers.back}

        {/* body */}
        <g transform={droop ? 'translate(0 4) scale(1 0.97)' : undefined}>
          <path d="M100 46 C 148 46 180 84 180 134 C 180 182 148 210 100 210 C 52 210 20 182 20 134 C 20 84 52 46 100 46 Z" fill="url(#bl-body)" />
          <ellipse cx="138" cy="182" rx="36" ry="26" fill="#6B58B0" opacity="0.14" filter="url(#bl-soft)" />
          <ellipse cx="100" cy="172" rx="42" ry="30" fill="url(#bl-belly)" opacity="0.72" />
          <ellipse cx="68" cy="82" rx="28" ry="15" transform="rotate(-28 68 82)" fill="#fff" opacity="0.42" filter="url(#bl-soft)" />

          {/* face */}
          <ellipse cx="54" cy="133" rx="10.5" ry="6.5" fill="#F5A3BA" opacity="0.55" />
          <ellipse cx="146" cy="133" rx="10.5" ry="6.5" fill="#F5A3BA" opacity="0.55" />
          <Eyes pose={pose} />
          <Mouth pose={pose} />

          {/* sprout */}
          <g className={sway}>
            <path d="M100 50 C 100 40 99 32 100 22" stroke="#69BE9C" strokeWidth="6" strokeLinecap="round" fill="none" />
            <g transform={droop ? 'rotate(-24 100 28)' : undefined}>
              <path d="M100 28 C 84 10 58 12 52 30 C 70 42 92 40 100 28 Z" fill="url(#bl-leaf)" />
              <path d="M98 28 Q 78 28 60 31" stroke="#5DB594" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
            </g>
            <g transform={droop ? 'rotate(24 100 24)' : undefined}>
              <path d="M100 24 C 116 4 142 6 148 24 C 130 36 108 34 100 24 Z" fill="url(#bl-leaf)" />
              <path d="M102 24 Q 122 24 140 26" stroke="#5DB594" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.6" />
            </g>
            {pose === 'growing' && (
              <g>
                <path d="M100 24 C 86 8 88 -8 100 -18 C 112 -8 114 8 100 24 Z" fill="url(#bl-leaf)" />
                <path d="M100 22 V -10" stroke="#5DB594" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
              </g>
            )}
          </g>
        </g>

        {a === 'book' && <Book />}
        {layers.front}
      </g>

      {/* props that tell the story of each pose */}
      {pose === 'welcome' && <g><Sparkle x={26} y={40} s={0.9} c="#F4A261" /><Sparkle x={178} y={52} s={0.6} c="#A9D9C4" /></g>}
      {pose === 'happy' && <g><Sparkle x={20} y={40} s={1} c="#F4A261" /><Sparkle x={180} y={34} s={1.1} c="#6AA9D8" /><Sparkle x={44} y={4} s={0.7} c="#D97B93" /><Sparkle x={160} y={-2} s={0.7} c="#F4A261" /></g>}
      {pose === 'growing' && <g><Sparkle x={34} y={2} s={1} c="#F4A261" /><Sparkle x={168} y={-4} s={1.1} c="#D97B93" /><Sparkle x={150} y={44} s={0.6} c="#6AA9D8" /><Sparkle x={52} y={44} s={0.6} c="#A9D9C4" /></g>}
      {pose === 'thinking' && (
        <g>
          <circle cx="152" cy="62" r="4.5" fill="#fff" stroke="#D9CFF0" strokeWidth="2" />
          <circle cx="161" cy="46" r="7" fill="#fff" stroke="#D9CFF0" strokeWidth="2" />
          <ellipse cx="177" cy="18" rx="22" ry="17" fill="#fff" stroke="#D9CFF0" strokeWidth="2" />
          <circle cx="168" cy="18" r="3" fill="#9B8AD1" /><circle cx="177" cy="18" r="3" fill="#9B8AD1" /><circle cx="186" cy="18" r="3" fill="#9B8AD1" />
        </g>
      )}
      {pose === 'sleepy' && (
        <g fill="none" stroke="#8E7CD0" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M148 56 h12 l-12 14 h12" /><path d="M164 26 h18 l-18 20 h18" />
        </g>
      )}
    </g>
  )
}
