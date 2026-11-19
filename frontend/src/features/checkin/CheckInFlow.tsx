import { useCallback, useState } from "react";
import { AudioRecorder } from "../audio/AudioRecorder";
import { fetchCalmReply, submitCheckin } from "./api";
import { CalmReplyCard } from "./CalmReplyCard";
import { nextStepAfterCheckin } from "./decide";
import { EmojiPicker } from "./EmojiPicker";
import { TextCheckin } from "./TextCheckin";
import type { AudioFeatures, CalmReplyResponse, CheckInResponse, Emoji, SuggestedActivity } from "./types";

export interface CheckInFlowProps {
  childName?: string;
  /** The running task session, if the check-in happens during one. */
  sessionId?: number | null;
  /** Member B navigates to the safe-mode screen here. Called instead of asking for a calm reply. */
  onSafeMode: (result: CheckInResponse) => void;
  /** Member B opens the calm-down screen (breathing / movement / stretching). */
  onActivity?: (activity: SuggestedActivity, result: CheckInResponse) => void;
  /** Back to the task or home. */
  onDone: (result: CheckInResponse | null) => void;
  enableVoice?: boolean;
}

type Phase = "pick" | "sending" | "reply" | "error";

/**
 * Full check-in (commits C4, C5, C11, C14):
 *   emoji -> optional words -> optional voice features -> POST /api/checkins
 *   safe_mode true  -> onSafeMode()             (no calm-reply call)
 *   safe_mode false -> POST /api/calm-reply -> show reply and the suggested activity
 */
export function CheckInFlow({ childName, sessionId = null, onSafeMode, onActivity, onDone, enableVoice = true }: CheckInFlowProps) {
  const [emoji, setEmoji] = useState<Emoji | null>(null);
  const [text, setText] = useState("");
  const [audio, setAudio] = useState<AudioFeatures | null>(null);
  const [heard, setHeard] = useState("");
  const [phase, setPhase] = useState<Phase>("pick");
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [reply, setReply] = useState<CalmReplyResponse | null>(null);

  const onFeatures = useCallback((f: AudioFeatures | null) => setAudio(f), []);
  const onTranscript = useCallback((t: string) => setHeard(t), []);

  const submit = async () => {
    if (!emoji) return;
    setPhase("sending");
    let saved: CheckInResponse;
    try {
      saved = await submitCheckin({ session_id: sessionId, emoji, text, audio_features: audio });
    } catch {
      setPhase("error");
      return;
    }
    setResult(saved);
    if (nextStepAfterCheckin(saved) === "safe_mode") {
      onSafeMode(saved);
      return;
    }
    const calm = await fetchCalmReply({
      child_name: childName ?? null,
      emoji,
      text: text.trim() || null,
      focus_score: saved.focus_score,
      emotion_score: saved.emotion_score,
    });
    setReply(calm);
    setPhase("reply");
  };

  if (phase === "reply" && reply && result) {
    return (
      <CalmReplyCard
        reply={reply}
        onActivity={onActivity ? (a) => onActivity(a, result) : undefined}
        onContinue={() => onDone(result)}
      />
    );
  }

  return (
    <form
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2 className="text-3xl font-bold text-slate-800">{childName ? `How are you feeling, ${childName}?` : "How are you feeling?"}</h2>

      <EmojiPicker value={emoji} onChange={setEmoji} />

      {emoji && (
        <>
          <TextCheckin value={text} onChange={setText} />
          {heard && !text.includes(heard) && (
            <div className="flex w-full flex-col items-start gap-2 rounded-2xl bg-slate-50 p-4">
              <span className="text-lg text-slate-600">I heard: “{heard}”</span>
              <button type="button" className="text-lg font-semibold text-sky-600 underline" onClick={() => setText((t) => `${t} ${heard}`.trim().slice(0, 300))}>
                Use my words
              </button>
            </div>
          )}
          {enableVoice && <AudioRecorder onFeatures={onFeatures} onTranscript={onTranscript} />}
        </>
      )}

      {phase === "error" && (
        <div role="alert" className="w-full rounded-2xl bg-amber-50 p-4 text-center text-lg text-amber-900">
          I couldn't send that right now. Let's try again. If you feel upset, please tell a grown-up you trust.
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <button
          type="submit"
          disabled={!emoji || phase === "sending"}
          className="min-h-16 rounded-full bg-sky-500 px-10 py-4 text-2xl font-bold text-white shadow disabled:opacity-40 focus:outline-none focus-visible:ring-4"
        >
          {phase === "sending" ? "Sending…" : phase === "error" ? "Try again" : "Done"}
        </button>
        <button type="button" onClick={() => onDone(null)} className="min-h-16 rounded-full px-6 py-4 text-xl text-slate-500 underline">
          Not now
        </button>
      </div>
    </form>
  );
}
