import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { BigButton, Field, inputClass } from '../components/ui'
import { useApp } from '../hooks/app'
import { Bloomi } from '../components/mascot/Bloomi'
import { AVATARS, REWARDS } from '../theme/icons'

/** First launch: name, avatar, favourite rewards. Also used to edit the profile (?edit=1). */
export default function SetupPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const editing = params.get('edit') === '1'
  const { profile, setProfile } = useApp()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('fox')
  const [rewards, setRewards] = useState<string[]>(['star', 'rocket'])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editing && profile) {
      setName(profile.name)
      setAvatar(profile.avatar)
      // Keep only reward keys that exist in the picker grid.
      // The backend seed stores free-text strings ("Extra playground time") which cannot
      // be represented as picker buttons — filter those out so the selection state is correct.
      setRewards(profile.favourite_rewards.filter((r) => r in REWARDS))
    }
  }, [editing, profile])

  const toggleReward = (k: string) =>
    setRewards((r) => (r.includes(k) ? r.filter((x) => x !== k) : r.length >= 3 ? r : [...r, k]))

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Please type your name'); return }
    setBusy(true); setError(null)
    try {
      const body = { name: name.trim(), avatar, favourite_rewards: rewards }
      const saved = editing && profile ? await api.updateProfile(body) : await api.createProfile(body)
      setProfile(saved)
      nav('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-dvh">
      <main className="mx-auto max-w-xl px-4 py-8 animate-fade-in">
        <div className="mb-6 flex flex-col items-center text-center">
          <Bloomi pose="welcome" arms="wave" size={editing ? 120 : 170} animate="wave" />
          <h1 className="mt-2 text-4xl font-extrabold text-lav-ink">{editing ? 'My profile' : "Hi! I'm Bloomi"}</h1>
          {!editing && <p className="mt-1 text-xl text-ink-soft">I will help you focus, one small step at a time. What is your name?</p>}
        </div>
        <form onSubmit={submit} className="rounded-card border border-line bg-card p-6 shadow-soft">
          <Field label="Your name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Type your name" maxLength={30} autoFocus autoComplete="off" />
          </Field>
          <fieldset className="mb-6">
            <legend className="mb-2 text-base font-bold text-ink-soft">Pick your buddy</legend>
            <div role="radiogroup" aria-label="Your buddy" className="grid grid-cols-5 gap-2">
              {Object.entries(AVATARS).map(([k, ch]) => (
                <button type="button" key={k} role="radio" aria-checked={avatar === k} aria-label={k} onClick={() => setAvatar(k)}
                  className={`flex aspect-square min-h-14 items-center justify-center rounded-2xl border-2 text-4xl transition-transform ${avatar === k ? 'scale-105 border-lav-deep bg-lav-soft shadow-soft' : 'border-line bg-cream hover:bg-lav-mist'}`}>{ch}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mb-6">
            <legend className="mb-1 text-base font-bold text-ink-soft">Pick up to 3 favourite rewards ({rewards.length}/3)</legend>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(REWARDS).map(([k, ch]) => {
                const on = rewards.includes(k)
                return (
                  <button type="button" key={k} aria-pressed={on} aria-label={k} onClick={() => toggleReward(k)}
                    className={`flex aspect-square min-h-14 items-center justify-center rounded-2xl border-2 text-4xl ${on ? 'border-sun-deep bg-sun-light' : 'border-line bg-cream hover:bg-sun-light'}`}>{ch}</button>
                )
              })}
            </div>
          </fieldset>
          {error && <p role="alert" className="mb-3 font-bold text-berry">{error}</p>}
          <BigButton type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save' : "Let's go!"}</BigButton>
          {editing && <BigButton type="button" variant="ghost" className="mt-2 w-full" onClick={() => nav(-1)}>Cancel</BigButton>}
        </form>
      </main>
    </div>
  )
}
