import type { ReactNode } from 'react'
import { Bloomi, type BloomiPose } from './Bloomi'

/** Bloomi on a soft, calm "stage" (blob + dots). Used for hero areas and friendly empty states. */
export function BloomiIllustration({ pose = 'welcome', size = 150, tone = 'lavender', children, className = '' }: {
  pose?: BloomiPose
  size?: number
  tone?: 'lavender' | 'mint' | 'peach' | 'sky'
  children?: ReactNode
  className?: string
}) {
  const blob = { lavender: ['#ECE7F8', '#DDD5F3'], mint: ['#E3F4EC', '#CDEBDD'], peach: ['#FDEBDC', '#F9D9BF'], sky: ['#E2EFF9', '#CFE3F3'] }[tone]
  return (
    <div className={`relative inline-flex items-end justify-center ${className}`} style={{ width: size * 1.35, height: size * 1.4 }}>
      <svg aria-hidden viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <path d="M100 14 C 150 8 192 50 186 104 C 182 156 140 192 96 188 C 48 184 10 146 16 98 C 20 52 56 18 100 14 Z" fill={blob[0]} />
        <path d="M40 150 C 70 176 130 182 168 150" stroke={blob[1]} strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="30" cy="46" r="5" fill={blob[1]} /><circle cx="176" cy="36" r="3.5" fill={blob[1]} /><circle cx="168" cy="170" r="4" fill={blob[1]} />
      </svg>
      <div className="relative -mb-1"><Bloomi pose={pose} size={size} />{children}</div>
    </div>
  )
}
