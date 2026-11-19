import { NavLink } from 'react-router-dom'

// Four predictable places, always in the same spot. Simple outline icons; the label is always visible.
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const ITEMS = [
  { to: '/', label: 'Home', end: true, icon: <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" {...stroke} /></svg> },
  { to: '/checklists', label: 'Pack', end: false, icon: <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7M6 7h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM9 13h6" {...stroke} /></svg> },
  { to: '/progress', label: 'Garden', end: false, icon: <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><path d="M12 21v-8M12 13c0-4 2.5-6 6.5-6 0 4-2.5 6-6.5 6zM12 15c0-3-2-5-5.5-5 0 3.2 2 5 5.5 5z" {...stroke} /></svg> },
  { to: '/calm', label: 'Calm', end: false, icon: <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden><circle cx="10" cy="14" r="6" {...stroke} /><circle cx="18" cy="7" r="2.5" {...stroke} /><circle cx="19" cy="15" r="1.2" {...stroke} /></svg> },
]

export function BottomNav() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/90 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-xl items-stretch justify-around gap-1 px-2 py-1.5">
        {ITEMS.map((i) => (
          <li key={i.to} className="flex-1">
            <NavLink to={i.to} end={i.end}
              className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-sm font-extrabold transition-colors ${isActive ? 'bg-lav-soft text-lav-ink' : 'text-ink-soft hover:bg-lav-mist'}`}>
              {i.icon}
              <span>{i.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
