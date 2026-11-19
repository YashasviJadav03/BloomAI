// Icon set = big friendly emoji. No image files, no extra dependency, works offline.
// Icon names are plain strings so the backend can store them (e.g. "tooth", "sun").

export const ICONS: Record<string, string> = {
  sun: '☀️', moon: '🌙', book: '📚', tooth: '🪥', paste: '🧴', shirt: '👕', bag: '🎒', bed: '🛏️',
  breakfast: '🥣', water: '💧', soap: '🧼', shoes: '👟', jacket: '🧥', lunchbox: '🍱', pencil: '✏️',
  calendar: '📅', school: '🏫', calculator: '🧮', read: '📖', clock: '⏰', star: '⭐', heart: '💛', check: '✅',
  broom: '🧹', toy: '🧸', bottle: '🥤', homework: '📝', pajamas: '🩳', story: '📕', light: '💡',
  hairbrush: '💇', face: '🙂', paint: '🎨', music: '🎵', ball: '⚽', leaf: '🌱', cloud: '☁️',
  // names used by the backend presets (backend/seed/presets.py)
  droplet: '💧', towel: '🧻', apple: '🍎', food: '🍽️', glass: '🥛', sparkles: '✨', cross: '✖️', 'book-open': '📖',
  backpack: '🎒', box: '📦', card: '🪪', eye: '👀', home: '🏠', trophy: '🏆', flower: '🌸', rocket: '🚀',
}
export const ICON_NAMES = Object.keys(ICONS)

export const AVATARS: Record<string, string> = {
  star: '⭐', fox: '🦊', panda: '🐼', owl: '🦉', cat: '🐱', dog: '🐶', frog: '🐸', lion: '🦁', penguin: '🐧', bunny: '🐰', bear: '🐻',
}
export const REWARDS: Record<string, string> = {
  star: '⭐', rocket: '🚀', unicorn: '🦄', dino: '🦖', balloon: '🎈', trophy: '🏆', rainbow: '🌈', cookie: '🍪',
}

export const SCHEDULE_COLORS = ['#F4A261', '#2A9D8F', '#4A6FA5', '#9B8AD1', '#D97B93', '#6AA9D8', '#E76F51']

/** Favourite rewards may be our keys ("rocket") or free text from the backend seed ("Lego build break"). */
export function rewardChar(r: string): string {
  if (REWARDS[r]) return REWARDS[r]
  const t = r.toLowerCase()
  if (/lego|build/.test(t)) return '🧱'
  if (/play|park|outdoor/.test(t)) return '🛝'
  if (/music|song/.test(t)) return '🎵'
  if (/game|screen/.test(t)) return '🎮'
  if (/treat|snack|ice|cookie/.test(t)) return '🍪'
  if (/story|book/.test(t)) return '📚'
  return '⭐'
}
export const rewardChars = (list: string[]) => (list.length ? list.map(rewardChar) : ['⭐', '🌈', '🌸'])

export function iconChar(name: string | undefined | null): string {
  if (!name) return '⭐'
  if (ICONS[name]) return ICONS[name]
  return /^[a-z0-9_-]+$/i.test(name) ? '⭐' : name   // unknown key -> star; raw emoji allowed
}

export function Icon({ name, className = '', label }: { name: string | undefined | null; className?: string; label?: string }) {
  return (
    <span className={`inline-block leading-none select-none ${className}`} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {iconChar(name)}
    </span>
  )
}

/** Rounded tinted tile behind an icon: gives every picture the same calm, finished look. */
export function IconTile({ name, color = '#9B8AD1', size = 'md', label }: { name: string | undefined | null; color?: string; size?: 'sm' | 'md' | 'lg' | 'xl'; label?: string }) {
  const dims = { sm: 'h-10 w-10 rounded-xl text-xl', md: 'h-14 w-14 rounded-2xl text-3xl', lg: 'h-20 w-20 rounded-3xl text-5xl', xl: 'h-32 w-32 rounded-[2rem] text-7xl' }[size]
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${dims}`} style={{ background: tint(color, 0.84), boxShadow: `inset 0 -3px 0 ${tint(color, 0.68)}` }}>
      <Icon name={name} label={label} />
    </span>
  )
}

/** Light tint of a hex colour, used for card backgrounds (keeps text contrast high). */
export function tint(hex: string, amount = 0.82): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255)
  return `rgb(${r}, ${g}, ${b})`
}
