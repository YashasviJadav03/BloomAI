import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioFeatures } from "../checkin/types";
import { round2, rms, rmsToLevel, VolumeTracker } from "./volume";
import { SpeechWordCounter, speechSupported, wordsPerMinute } from "./pace";

/**
 * Live voice analysis for the check-in (commits C8-C10).
 *
 * Privacy by design: there is no MediaRecorder and no audio buffer. Each animation
 * frame we read the analyser, keep a single level number, and drop the samples.
 * On stop, the microphone tracks are closed and only AudioFeatures remain.
 */

export type VoiceStatus = "idle" | "requesting" | "recording" | "done" | "denied" | "unsupported";

export interface VoiceCheckin {
  status: VoiceStatus;
  /** Live level 0..1 for the meter. */
  level: number;
  elapsed: number;
  transcript: string;
  features: AudioFeatures | null;
  paceAvailable: boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export function useVoiceCheckin({ maxSeconds = 15, enablePace = true } = {}): VoiceCheckin {
  const [status, setStatus] = useState<VoiceStatus>(() =>
    typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function" ? "idle" : "unsupported",
  );
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [features, setFeatures] = useState<AudioFeatures | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const trackerRef = useRef<VolumeTracker | null>(null);
  const speechRef = useRef<SpeechWordCounter | null>(null);
  const startedAtRef = useRef(0);
  const stoppingRef = useRef(false);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    speechRef.current?.stop();
  }, []);

  const stop = useCallback(() => {
    if (stoppingRef.current || !trackerRef.current) return;
    stoppingRef.current = true;
    const duration = (performance.now() - startedAtRef.current) / 1000;
    const tracker = trackerRef.current;
    const speech = speechRef.current;
    teardown();

    const { avg_volume, peak_volume } = tracker.summary();
    const wpm = speech ? wordsPerMinute(speech.words, tracker.speakingSeconds) : null;
    setFeatures({ avg_volume, peak_volume, words_per_minute: wpm, duration_seconds: round2(duration) });
    setLevel(0);
    setStatus("done");
  }, [teardown]);

  const start = useCallback(async () => {
    if (status === "recording" || status === "requesting") return;
    setStatus("requesting");
    setFeatures(null);
    setTranscript("");
    setElapsed(0);
    stoppingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Gain control off so loudness stays meaningful; noise suppression on for classrooms.
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
      });
      streamRef.current = stream;
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);

      trackerRef.current = new VolumeTracker();
      speechRef.current = null;
      if (enablePace && speechSupported()) {
        const counter = new SpeechWordCounter(setTranscript);
        if (counter.start()) speechRef.current = counter;
      }

      startedAtRef.current = performance.now();
      setStatus("recording");
      let lastUi = 0;
      const tick = () => {
        analyser.getFloatTimeDomainData(buffer);
        const t = (performance.now() - startedAtRef.current) / 1000;
        const lvl = rmsToLevel(rms(buffer));
        trackerRef.current?.add(lvl, t);
        if (t - lastUi > 0.1) {
          lastUi = t;
          setLevel(lvl);
          setElapsed(Math.floor(t));
        }
        if (t >= maxSeconds) {
          stop();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      teardown();
      const name = (err as { name?: string })?.name;
      setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unsupported");
    }
  }, [enablePace, maxSeconds, status, stop, teardown]);

  const reset = useCallback(() => {
    teardown();
    trackerRef.current = null;
    setFeatures(null);
    setTranscript("");
    setLevel(0);
    setElapsed(0);
    setStatus((s) => (s === "unsupported" ? s : "idle"));
  }, [teardown]);

  useEffect(() => teardown, [teardown]);

  return { status, level, elapsed, transcript, features, paceAvailable: enablePace && speechSupported(), start, stop, reset };
}
