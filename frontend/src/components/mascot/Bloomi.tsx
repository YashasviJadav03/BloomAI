import { BLOOMI_VIEWBOX, BloomiArt, type BloomiAnimate, type BloomiArms, type BloomiPose } from './BloomiArt'

export { BLOOMI_POSES } from './BloomiArt'
export type { BloomiPose, BloomiArms, BloomiAnimate } from './BloomiArt'

const LABELS: Record<BloomiPose, string> = {
  welcome: 'Bloomi waving hello', focused: 'Bloomi reading quietly', happy: 'Bloomi celebrating',
  calm: 'Bloomi breathing calmly', thinking: 'Bloomi thinking', sleepy: 'Bloomi resting', growing: 'Bloomi with a new leaf',
}

/**
 * The BloomAI companion. `decorative` (default) hides it from screen readers because it is never the only
 * carrier of meaning; pass decorative={false} when it IS the content (e.g. an empty state without text).
 */
export function Bloomi({ pose = 'welcome', arms, size = 160, animate = 'idle', className = '', decorative = true }: {
  pose?: BloomiPose
  arms?: BloomiArms
  size?: number
  animate?: BloomiAnimate
  className?: string
  decorative?: boolean
}) {
  return (
    <svg viewBox={BLOOMI_VIEWBOX} width={size} height={(size * 252) / 200} className={`shrink-0 overflow-visible ${className}`}
      role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : LABELS[pose]} aria-hidden={decorative ? true : undefined}>
      <BloomiArt pose={pose} arms={arms} animate={animate} />
    </svg>
  )
}
