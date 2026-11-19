import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { BigButton, Field, inputClass } from '../components/ui'
import { useApp } from '../hooks/app'
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
    if (editing && profile) { setName(profile.name); setAvatar(profile.avatar); setRewards(profile.favourite_rewards) }
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
    <div className="min-h-dvh bg-gradient-to-b from-sage-light to-cream">
      <main className="mx-auto max-w-xl px-4 py-8 animate-fade-in">
        <div className="mb-6 text-center">
          <div className="text-7xl animate-wiggle" aria-hidden>🌱</div>
          <h1 className="mt-2 text-4xl font-extrabold">{editing ? 'My profile' : 'Hi! Let\'s get started'}</h1>
          {!editing && <p className="mt-1 text-lg text-ink-soft">Tell me a bit about you.</p>}
        </div>
        <form onSubmit={submit} className="rounded-card border-2 border-line bg-card p-6">
          <Field label="What's your name?">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Type your name" maxLength={30} autoFocus autoComplete="off" />
          </Field>
          <fieldset className="mb-5">
            <legend className="mb-2 text-base font-bold text-ink-soft">Pick your buddy</legend>
            <div role="radiogroup" className="grid grid-cols-5 gap-2">
              {Object.entries(AVATARS).map(([k, ch]) => (
                <button type="button" key={k} role="radio" aria-checked={avatar === k} aria-label={k} onClick={() => setAvatar(k)}
                  className={`aspect-square rounded-2xl border-2 text-4xl ${avatar === k ? 'border-sage bg-sage-light' : 'border-line bg-cream hover:bg-sage-light'}`}>{ch}</button>
              ))}
            </div>
          </fieldset>
          <fieldset className="mb-6">
            <legend className="mb-1 text-base font-bold text-ink-soft">Pick up to 3 favourite rewards</legend>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(REWARDS).map(([k, ch]) => {
                const on = rewards.includes(k)
                return (
                  <button type="button" key={k} aria-pressed={on} aria-label={k} onClick={() => toggleReward(k)}
                    className={`aspect-square rounded-2xl border-2 text-4xl ${on ? 'border-sun bg-sun-light' : 'border-line bg-cream hover:bg-sun-light'}`}>{ch}</button>
                )
              })}
            </div>
          </fieldset>
          {error && <p role="alert" className="mb-3 font-bold text-danger">{error}</p>}
          <BigButton type="submit" size="lg" className="w-full" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save' : "Let's go!"}</BigButton>
          {editing && <BigButton type="button" variant="ghost" className="mt-2 w-full" onClick={() => nav(-1)}>Cancel</BigButton>}
        </form>
      </main>
    </div>
  )
}
