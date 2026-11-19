/**
 * CaregiverPinGate
 *
 * Renders either the PIN entry / setup screen or its children once unlocked.
 *
 * First visit (no PIN set):
 *   The caregiver is asked to create a 4-digit PIN. They must type it twice to confirm.
 *
 * Subsequent visits:
 *   The caregiver must enter the existing PIN to proceed.
 *
 * The session stays unlocked for the lifetime of the component (navigating away locks it again).
 */
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { checkPin, hasPin, setPin } from '../hooks/caregiverPin'
import { BigButton } from './ui'

type Mode = 'enter' | 'create-1' | 'create-2'

export function CaregiverPinGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(false)
  const [mode, setMode] = useState<Mode>(hasPin() ? 'enter' : 'create-1')
  const [pin, setLocalPin] = useState('')
  const [firstPin, setFirstPin] = useState('')  // held between create steps
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Re-focus input whenever the mode changes
  useEffect(() => { inputRef.current?.focus() }, [mode])

  function handleDigit(val: string) {
    // Only accept digits, max 4
    const digits = val.replace(/\D/g, '').slice(0, 4)
    setLocalPin(digits)
    setError(null)
  }

  function submit() {
    if (pin.length !== 4) { setError('Please enter all 4 digits.'); return }

    if (mode === 'enter') {
      if (checkPin(pin)) {
        setUnlocked(true)
      } else {
        setError('Wrong PIN. Try again.')
        setLocalPin('')
      }
      return
    }

    if (mode === 'create-1') {
      setFirstPin(pin)
      setLocalPin('')
      setMode('create-2')
      return
    }

    if (mode === 'create-2') {
      if (pin !== firstPin) {
        setError("The PINs don't match. Start again.")
        setFirstPin('')
        setLocalPin('')
        setMode('create-1')
        return
      }
      setPin(pin)
      setUnlocked(true)
    }
  }

  if (unlocked) return <>{children}</>

  const isCreate = mode !== 'enter'
  const title = mode === 'enter'
    ? 'Caregiver area'
    : mode === 'create-1'
    ? 'Create your PIN'
    : 'Confirm your PIN'
  const hint = mode === 'enter'
    ? 'Enter your 4-digit PIN to continue.'
    : mode === 'create-1'
    ? 'Choose a 4-digit PIN that only you will know.'
    : 'Enter the same PIN again to confirm.'

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-lav-soft text-5xl shadow-soft">
            🔒
          </span>
        </div>

        <h1 className="mb-1 text-center text-3xl font-extrabold text-lav-ink">{title}</h1>
        <p className="mb-8 text-center text-lg text-ink-soft">{hint}</p>

        {/* PIN dots display */}
        <div className="mb-6 flex justify-center gap-4" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-5 w-5 rounded-full border-2 transition-colors ${
                i < pin.length ? 'border-lav-deep bg-lav-deep' : 'border-line bg-card'
              }`}
            />
          ))}
        </div>

        {/* Hidden number input — the visible dots are purely decorative */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => handleDigit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={4}
          aria-label={mode === 'enter' ? 'Enter 4-digit PIN' : 'Enter 4-digit PIN'}
          className="sr-only"
        />

        {/* Number pad */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => {
            if (d === '') return <span key={i} />
            const isDelete = d === '⌫'
            return (
              <button
                key={d}
                type="button"
                aria-label={isDelete ? 'Delete' : d}
                onClick={() => {
                  if (isDelete) {
                    setLocalPin((p) => p.slice(0, -1))
                    setError(null)
                  } else {
                    handleDigit(pin + d)
                  }
                }}
                className="flex min-h-16 items-center justify-center rounded-2xl border-2 border-line bg-card text-2xl font-extrabold text-ink shadow-soft transition-transform active:scale-95 hover:bg-lav-soft"
              >
                {d}
              </button>
            )
          })}
        </div>

        {error && (
          <p role="alert" className="mb-3 rounded-btn bg-berry-light px-4 py-3 text-center font-bold text-danger">
            {error}
          </p>
        )}

        <BigButton
          size="lg"
          className="w-full"
          disabled={pin.length !== 4}
          onClick={submit}
        >
          {isCreate ? (mode === 'create-1' ? 'Next →' : 'Set PIN') : 'Unlock'}
        </BigButton>

        {isCreate && (
          <p className="mt-4 text-center text-base text-ink-soft">
            This PIN stays on this device. Write it down somewhere safe.
          </p>
        )}
      </div>
    </div>
  )
}
