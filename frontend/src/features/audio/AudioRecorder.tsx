import { useEffect } from "react";
import type { AudioFeatures } from "../checkin/types";
import { useVoiceCheckin } from "./useVoiceCheckin";

interface Props {
  /** Called with the extracted features after recording, or null when cleared. */
  onFeatures: (features: AudioFeatures | null) => void;
  /** Called with what speech recognition heard, so the child can choose to use it as text. */
  onTranscript?: (transcript: string) => void;
  maxSeconds?: number;
  enablePace?: boolean;
}

/**
 * "Tell me with your voice" button (commit C8). Optional: the check-in works without it.
 * No audio is recorded or uploaded, only four numbers (see useVoiceCheckin).
 */
export function AudioRecorder({ onFeatures, onTranscript, maxSeconds = 15, enablePace = true }: Props) {
  const voice = useVoiceCheckin({ maxSeconds, enablePace });

  useEffect(() => {
    onFeatures(voice.features);
  }, [voice.features, onFeatures]);

  useEffect(() => {
    if (voice.status === "done" && voice.transcript) onTranscript?.(voice.transcript);
  }, [voice.status, voice.transcript, onTranscript]);

  if (voice.status === "unsupported") {
    return <p className="text-base text-slate-500">Voice check-in isn't available on this device. That's okay!</p>;
  }
  if (voice.status === "denied") {
    return (
      <p className="text-base text-slate-500" role="status">
        The microphone is turned off. You can still tell me with words or a face.
      </p>
    );
  }

  const recording = voice.status === "recording";
  const bars = 10;
  const lit = Math.round(voice.level * bars);

  return (
    <div className="flex flex-col items-center gap-3" data-testid="audio-recorder">
      <button
        type="button"
        onClick={recording ? voice.stop : voice.start}
        disabled={voice.status === "requesting"}
        aria-pressed={recording}
        className={`min-h-16 min-w-48 rounded-full px-6 py-4 text-xl font-semibold shadow focus:outline-none focus-visible:ring-4 ${
          recording ? "bg-rose-500 text-white" : "bg-sky-500 text-white"
        }`}
      >
        {recording ? `⏹ Stop (${maxSeconds - voice.elapsed}s)` : voice.status === "done" ? "🎤 Try again" : "🎤 Tell me with your voice"}
      </button>

      {recording && (
        <div className="flex h-8 items-end gap-1" role="meter" aria-label="Voice level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(voice.level * 100)}>
          {Array.from({ length: bars }, (_, i) => (
            <span key={i} className={`w-3 rounded-t ${i < lit ? "bg-sky-500" : "bg-slate-200"}`} style={{ height: `${30 + i * 7}%` }} />
          ))}
        </div>
      )}

      {voice.status === "done" && voice.features && (
        <p className="text-base text-slate-600" role="status">
          Thanks for telling me! {voice.paceAvailable && voice.features.words_per_minute === null ? "(I heard your voice.)" : ""}
        </p>
      )}

      <p className="text-sm text-slate-400">Your voice is never saved. I only notice how loud and fast it is.</p>
    </div>
  );
}
