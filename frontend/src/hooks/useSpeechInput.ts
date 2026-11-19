/**
 * useSpeechInput — thin wrapper around the Web Speech API (SpeechRecognition).
 *
 * Returns:
 *   supported   — whether the browser supports speech recognition
 *   listening   — currently recording
 *   start()     — begin listening; fires onResult when speech ends
 *   stop()      — cancel early
 *   error       — last error string, or null
 *
 * Privacy: audio never leaves the device — the browser's built-in engine
 * transcribes locally (Chrome) or via the browser vendor's cloud (varies).
 * No audio bytes are stored or sent to our backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

// Web Speech API types (not in every TS lib version)
interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition
}
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor
    webkitSpeechRecognition?: ISpeechRecognitionConstructor
  }
}

function getSR(): ISpeechRecognitionConstructor | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

interface Options {
  lang?: string          // BCP-47 e.g. "en-US". Defaults to browser language.
  onResult: (transcript: string) => void
}

export function useSpeechInput({ lang, onResult }: Options) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const srRef = useRef<ISpeechRecognition | null>(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  const supported = !!getSR()

  const stop = useCallback(() => {
    srRef.current?.stop()
    srRef.current = null
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const SR = getSR()
    if (!SR) { setError('Speech input is not available in this browser.'); return }

    setError(null)
    setListening(true)

    const sr = new SR()
    srRef.current = sr
    sr.lang = lang ?? navigator.language ?? 'en-US'
    sr.interimResults = false
    sr.maxAlternatives = 1

    sr.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript.trim()) onResultRef.current(transcript.trim())
    }

    sr.onerror = (e) => {
      // "no-speech" is normal (user stayed silent); don't show it as an error
      if (e.error !== 'no-speech') {
        setError(
          e.error === 'not-allowed'
            ? 'Microphone permission was blocked. Please allow it in your browser settings.'
            : `Speech error: ${e.error}`
        )
      }
      setListening(false)
      srRef.current = null
    }

    sr.onend = () => {
      setListening(false)
      srRef.current = null
    }

    sr.start()
  }, [lang])

  // Clean up on unmount
  useEffect(() => () => { srRef.current?.abort() }, [])

  return { supported, listening, start, stop, error }
}
