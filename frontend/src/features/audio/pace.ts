/**
 * Pace extraction (commit C10): words per minute from the Web Speech API.
 *
 * If the browser has no SpeechRecognition (Firefox, some Safari versions) or the
 * child said too little, words_per_minute is null and the backend scores on
 * volume only (the "volume-only fallback").
 *
 * Privacy: in Chrome, speech recognition can run on Google's servers. We ask for
 * on-device recognition where the browser supports it (`processLocally`). The
 * transcript stays on the page unless the child taps "Use my words".
 */

export function countWords(text: string): number {
  const words = text.trim().match(/[\p{L}\p{N}']+/gu);
  return words ? words.length : 0;
}

/** null when there is not enough speech to estimate a pace. */
export function wordsPerMinute(words: number, speakingSeconds: number): number | null {
  if (words < 2 || speakingSeconds < 1) return null;
  const wpm = (words / speakingSeconds) * 60;
  return Math.round(Math.min(wpm, 400));
}

// Minimal typing for the parts of the Web Speech API we use (not in lib.dom for all TS versions).
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}
export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  processLocally?: boolean;
  onresult: ((e: SpeechEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SpeechCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognition(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechSupported(): boolean {
  return getSpeechRecognition() !== null;
}

/**
 * Keeps a running transcript while the microphone is open. Chrome ends recognition
 * after a pause, so we restart it until stop() is called.
 */
export class SpeechWordCounter {
  private rec: SpeechRecognitionLike | null = null;
  private finalText = "";
  private interimText = "";
  private active = false;

  constructor(private onUpdate?: (transcript: string) => void) {}

  start(lang = typeof navigator !== "undefined" ? navigator.language : "en-US"): boolean {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return false;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang || "en-US";
    if ("processLocally" in rec) rec.processLocally = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) this.finalText += ` ${r[0].transcript}`;
        else interim += ` ${r[0].transcript}`;
      }
      this.interimText = interim;
      this.onUpdate?.(this.transcript);
    };
    rec.onend = () => {
      if (this.active) {
        try {
          rec.start();
        } catch {
          this.active = false;
        }
      }
    };
    rec.onerror = (e) => {
      // "not-allowed" / "service-not-allowed": no pace this time; volume still works.
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "language-not-supported") {
        this.active = false;
      }
    };
    this.rec = rec;
    this.active = true;
    try {
      rec.start();
      return true;
    } catch {
      this.active = false;
      return false;
    }
  }

  stop(): void {
    this.active = false;
    try {
      this.rec?.stop();
    } catch {
      /* already stopped */
    }
    this.rec = null;
  }

  get transcript(): string {
    return `${this.finalText} ${this.interimText}`.replace(/\s+/g, " ").trim();
  }

  get words(): number {
    return countWords(this.transcript);
  }
}
