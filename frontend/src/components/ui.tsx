import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { ICON_NAMES, Icon, SCHEDULE_COLORS } from '../theme/icons'

// ---------- Buttons ----------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sun'
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sage text-white hover:bg-sage-dark shadow-[0_5px_0_var(--color-sage-dark)] active:shadow-none active:translate-y-[5px]',
  sun: 'bg-sun text-ink hover:brightness-95 shadow-[0_5px_0_#c97f3d] active:shadow-none active:translate-y-[5px]',
  secondary: 'bg-card text-ink border-2 border-line hover:bg-sage-light',
  ghost: 'bg-transparent text-ink-soft hover:bg-sage-light',
  danger: 'bg-card text-danger border-2 border-danger hover:bg-berry-light',
}
export function BigButton({ variant = 'primary', icon, children, className = '', size = 'md', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'min-h-12 px-4 text-base', md: 'min-h-14 px-6 text-lg', lg: 'min-h-20 px-8 text-2xl' }
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-3 rounded-btn font-bold transition-all disabled:opacity-50 disabled:pointer-events-none ${sizes[size]} ${VARIANTS[variant]} ${className}`}
    >
      {icon && <Icon name={icon} className="text-[1.3em]" />}
      {children}
    </button>
  )
}

/** Round icon-only button; always give it a label for screen readers. */
export function IconButton({ label, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...rest} aria-label={label} title={label}
      className={`inline-flex h-12 w-12 min-w-12 items-center justify-center rounded-full bg-card text-xl border-2 border-line hover:bg-sage-light disabled:opacity-40 ${className}`}>
      {children}
    </button>
  )
}

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div style={style} className={`rounded-card bg-card border-2 border-line p-5 ${className}`}>{children}</div>
}

// ---------- States ----------
export function Loading({ label = 'Getting things ready…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-16 text-ink-soft">
      <span className="text-6xl animate-breathe" style={{ ['--breath-seconds' as string]: '2s' }}>🌱</span>
      <p className="text-lg">{label}</p>
    </div>
  )
}
export function ErrorState({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
      <span className="text-6xl">🙈</span>
      <h2 className="text-2xl font-bold">Oops, that didn't work</h2>
      <p className="max-w-sm text-ink-soft">{message ? `${message}. ` : ''}Let's try again. If it keeps happening, ask a grown-up to help.</p>
      {onRetry && <BigButton onClick={onRetry} icon="leaf">Try again</BigButton>}
    </div>
  )
}
export function EmptyState({ icon = 'cloud', title, hint, action }: { icon?: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Icon name={icon} className="text-6xl" />
      <h2 className="text-2xl font-bold">{title}</h2>
      {hint && <p className="max-w-sm text-ink-soft">{hint}</p>}
      {action}
    </div>
  )
}

// ---------- Modal (native <dialog>: focus trap + Esc for free) ----------
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}
      aria-label={title}
      className="m-auto w-[min(32rem,calc(100vw-1.5rem))] max-h-[90vh] overflow-y-auto rounded-card bg-cream p-0 text-ink backdrop:bg-ink/40 open:animate-pop">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">{title}</h2>
          <IconButton label="Close" onClick={onClose}>✕</IconButton>
        </div>
        {open && children}
      </div>
    </dialog>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Yes, remove', onConfirm, onCancel }: { open: boolean; title: string; message?: string; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      {message && <p className="mb-5 text-ink-soft">{message}</p>}
      <div className="flex flex-wrap gap-3">
        <BigButton variant="danger" onClick={onConfirm}>{confirmLabel}</BigButton>
        <BigButton variant="secondary" onClick={onCancel}>Keep it</BigButton>
      </div>
    </Modal>
  )
}

// ---------- Form bits ----------
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-base font-bold text-ink-soft">{label}</span>
      {children}
    </label>
  )
}
export const inputClass = 'w-full min-h-14 rounded-btn border-2 border-line bg-card px-4 text-lg text-ink placeholder:text-ink-soft/70 focus:border-sage'

export function IconPicker({ value, onChange, names = ICON_NAMES, label = 'Pick a picture' }: { value: string; onChange: (v: string) => void; names?: string[]; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {names.map((n) => (
        <button type="button" key={n} role="radio" aria-checked={value === n} aria-label={n} onClick={() => onChange(n)}
          className={`flex aspect-square min-h-12 items-center justify-center rounded-2xl border-2 text-2xl ${value === n ? 'border-sage bg-sage-light' : 'border-line bg-card hover:bg-sage-light'}`}>
          <Icon name={n} />
        </button>
      ))}
    </div>
  )
}
export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Pick a colour" className="flex flex-wrap gap-3">
      {SCHEDULE_COLORS.map((c) => (
        <button type="button" key={c} role="radio" aria-checked={value === c} aria-label={`colour ${c}`} onClick={() => onChange(c)}
          style={{ background: c }}
          className={`h-12 w-12 rounded-full border-4 ${value === c ? 'border-ink' : 'border-transparent'}`}>
          {value === c && <span className="text-xl text-white">✓</span>}
        </button>
      ))}
    </div>
  )
}
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-4 rounded-btn border-2 border-line bg-card px-4 text-lg font-bold">
      <span>{label}</span>
      <span className={`flex h-8 w-14 items-center rounded-full p-1 transition-colors ${checked ? 'bg-sage' : 'bg-line'}`}>
        <span className={`h-6 w-6 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : ''}`} />
      </span>
    </button>
  )
}
