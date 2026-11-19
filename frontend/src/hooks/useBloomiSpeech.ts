/**
 * useBloomiSpeech — speaks text aloud using the browser's Web Speech Synthesis API
 * in a fun, child-like voice.
 *
 * Voice selection strategy:
 * 1. Prefer explicitly child/young voices (by name keyword)
 * 2. Prefer softer female voices that sound younger
 * 3. Fall back to any English voice
 * 4. Push pitch high (2.0) and rate slightly slow (0.95) to sound child-like
 *
 * Respects the `bloomiVoice` setting — if off, speak() is a no-op.
 * Cancels any ongoing speech on unmount or when speak() is called again.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSettings } from './settings'

// ── Voice preference ───────────────────────────────────────────────────────
// Tier 1: explicitly child/young voices (best match)
const CHILD_KEYWORDS = [
  'child', 'kid', 'junior', 'young', 'google uk english female',
  'google us english', 'female',
]
// Tier 2: softer female voices that tend to sound younger
const SOFT_KEYWORDS = [
  'zira', 'samantha', 'karen', 'moira', 'fiona', 'serena',
  'tessa', 'veena', 'susan', 'allison',
]
const ENGLISH_RE = /^en/i

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis?.getVoices() ?? []
  if (!voices.length) return null

  // Log available voices so the developer can see what's on this system
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(
      '[BloomiSpeech] Available voices:',
      voices.map((v) => `${v.name} (${v.lang})`).join(', ')
    )
  }

  // Tier 1: child/young voices
  for (const kw of CHILD_KEYWORDS) {
    const match = voices.find((v) => ENGLISH_RE.test(v.lang) && v.name.toLowerCase().includes(kw))
    if (match) {
      console.debug('[BloomiSpeech] Picked child voice:', match.name)
      return match
    }
  }
  // Tier 2: softer female voices
  for (const kw of SOFT_KEYWORDS) {
    const match = voices.find((v) => ENGLISH_RE.test(v.lang) && v.name.toLowerCase().includes(kw))
    if (match) {
      console.debug('[BloomiSpeech] Picked soft voice:', match.name)
      return match
    }
  }
  // Tier 3: any English female voice
  const enFemale = voices.find((v) => ENGLISH_RE.test(v.lang) && v.name.toLowerCase().includes('female'))
  if (enFemale) {
    console.debug('[BloomiSpeech] Picked English female voice:', enFemale.name)
    return enFemale
  }
  // Tier 4: any English voice
  const en = voices.find((v) => ENGLISH_RE.test(v.lang))
  if (en) {
    console.debug('[BloomiSpeech] Picked English voice:', en.name)
    return en
  }
  // Tier 5: first available
  console.debug('[BloomiSpeech] Picked fallback voice:', voices[0].name)
  return voices[0] ?? null
}

export function useBloomiSpeech() {
  const { bloomiVoice } = useSettings()
  const [speaking, setSpeaking] = useState(false)
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null)

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const cancel = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    uttRef.current = null
    setSpeaking(false)
  }, [supported])

  const speak = useCallback((text: string) => {
    if (!supported || !bloomiVoice || !text.trim()) return
    // Cancel any currently speaking utterance
    window.speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)
    // High pitch + slow rate = child-like voice
    utt.pitch = 1.4        // max child-like pitch
    utt.rate = 0.82         // slightly slower so kids can follow
    utt.volume = 1.0

    // Voices load asynchronously in some browsers — try to assign one
    const voice = pickVoice()
    if (voice) utt.voice = voice

    utt.onstart = () => setSpeaking(true)
    utt.onend = () => { setSpeaking(false); uttRef.current = null }
    utt.onerror = () => { setSpeaking(false); uttRef.current = null }

    uttRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [supported, bloomiVoice])

  // If voices weren't ready when speak() was called (common in Chrome),
  // re-pick after the voiceschanged event fires.
  useEffect(() => {
    if (!supported) return
    const handler = () => {
      if (uttRef.current && (!uttRef.current.voice || uttRef.current.voice.name === '')) {
        const voice = pickVoice()
        if (voice) uttRef.current.voice = voice
      }
    }
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
  }, [supported])

  // Cancel on unmount to avoid speech continuing after navigation
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel() }, [supported])

  return { speak, cancel, speaking, supported }
}
