// Icon set = big friendly emoji. No image files, no extra dependency, works offline.
// Icon names are plain strings so the backend can store them (e.g. "tooth", "sun").

export const ICONS: Record<string, string> = {
  sun: '☀️', moon: '🌙', book: '📚', tooth: '🪥', paste: '🧴', shirt: '👕', bag: '🎒', bed: '🛏️',
  breakfast: '🥣', water: '💧', soap: '🧼', shoes: '👟', jacket: '🧥', lunchbox: '🍱', pencil: '✏️',
  calendar: '📅', school: '🏫', calculator: '🧮', read: '📖', clock: '⏰', star: '⭐', heart: '💛', check: '✅',
  broom: '🧹', toy: '🧸', bottle: '🥤', homework: '📝', pajamas: '🩳', story: '📕', light: '💡',
  hairbrush: '💇', face: '🙂', paint: '🎨', music: '🎵', ball: '⚽', leaf: '🌱', cloud: '☁️',
}
export const ICON_NAMES = Object.keys(ICONS)

export const AVATARS: Record<string, string> = {
  fox: '🦊', panda: '🐼', owl: '🦉', cat: '🐱', dog: '🐶', frog: '🐸', lion: '🦁', penguin: '🐧', bunny: '🐰', bear: '🐻',
}
export const REWARDS: Record<string, string> = {
  star: '⭐', rocket: '🚀', unicorn: '🦄', dino: '🦖', balloon: '🎈', trophy: '🏆', rainbow: '🌈', cookie: '🍪',
}

export const SCHEDULE_COLORS = ['#F4A261', '#6AA9D8', '#9B8AD1', '#D97B93', '#3E8E7E', '#E9C46A']

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

/** Light tint of a hex colour, used for card backgrounds (keeps text contrast high). */
export function tint(hex: string, amount = 0.82): string {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255)
  return `rgb(${r}, ${g}, ${b})`
}
