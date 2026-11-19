/**
 * Caregiver PIN — stored in localStorage only (device-local parental lock).
 * The PIN is a 4-digit string. It is NOT sent to the backend.
 *
 * API:
 *   hasPin()          → whether a PIN has been set
 *   checkPin(input)   → true if input matches stored PIN
 *   setPin(pin)       → store a new PIN
 *   clearPin()        → remove the PIN (for testing / reset)
 */
const KEY = 'bloomai-caregiver-pin'

export function hasPin(): boolean {
  return !!localStorage.getItem(KEY)
}

export function checkPin(input: string): boolean {
  const stored = localStorage.getItem(KEY)
  return !!stored && stored === input.trim()
}

export function setPin(pin: string): void {
  localStorage.setItem(KEY, pin.trim())
}

export function clearPin(): void {
  localStorage.removeItem(KEY)
}
