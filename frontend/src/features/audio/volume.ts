/**
 * Volume extraction (commit C9). Pure functions, no browser APIs, so they are unit-testable.
 *
 * The microphone gives samples in [-1, 1]. We take the RMS of each analyser frame,
 * convert it to dBFS, and map -60..0 dBFS onto a 0..1 level. On that scale quiet
 * speech is roughly 0.35-0.5, normal speech 0.5-0.65, and shouting goes above 0.8,
 * which lines up with the backend scoring thresholds (calm 0.2-0.5, loud avg > 0.7,
 * peak > 0.85). Levels depend on the microphone, so treat them as relative.
 */

export const FLOOR_DB = -60;
/** Frames quieter than this count as silence and are left out of the average. */
export const VOICE_GATE = 0.3; // about -42 dBFS

export function rms(samples: ArrayLike<number>): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i];
  return Math.sqrt(sum / samples.length);
}

export function rmsToLevel(value: number): number {
  if (!(value > 0)) return 0;
  const db = 20 * Math.log10(value);
  return Math.min(1, Math.max(0, (db - FLOOR_DB) / -FLOOR_DB));
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Collects one level per analyser frame. Stores numbers only, never audio.
 * The peak is the 95th percentile of voiced frames, so one click or bump cannot
 * look like shouting.
 */
export class VolumeTracker {
  private voiced: number[] = [];
  private firstVoicedAt: number | null = null;
  private lastVoicedAt: number | null = null;

  /** level in 0..1, t in seconds since recording started. */
  add(level: number, t: number): void {
    if (level < VOICE_GATE) return;
    this.voiced.push(level);
    if (this.firstVoicedAt === null) this.firstVoicedAt = t;
    this.lastVoicedAt = t;
  }

  get voicedFrames(): number {
    return this.voiced.length;
  }

  /** Seconds between the first and last voiced frame (the speaking span). */
  get speakingSeconds(): number {
    if (this.firstVoicedAt === null || this.lastVoicedAt === null) return 0;
    return this.lastVoicedAt - this.firstVoicedAt;
  }

  summary(): { avg_volume: number; peak_volume: number } {
    if (this.voiced.length === 0) return { avg_volume: 0, peak_volume: 0 };
    const avg = this.voiced.reduce((a, b) => a + b, 0) / this.voiced.length;
    const sorted = [...this.voiced].sort((a, b) => a - b);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    return { avg_volume: round2(avg), peak_volume: round2(p95) };
  }
}
