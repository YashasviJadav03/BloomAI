import { ACTIVITY_LABELS } from "./emojis";
import { CALM_DOWN_ACTIVITIES } from "./decide";
import type { CalmReplyResponse, SuggestedActivity } from "./types";

interface Props {
  reply: CalmReplyResponse;
  onActivity?: (activity: SuggestedActivity) => void;
  onContinue: () => void;
}

/** Shows the calm reply or encouragement after a check-in (commit C14). */
export function CalmReplyCard({ reply, onActivity, onContinue }: Props) {
  const showActivity = CALM_DOWN_ACTIVITIES.has(reply.suggested_activity) || reply.suggested_activity === "talk_to_adult";
  return (
    <section aria-live="polite" className="flex flex-col items-center gap-6 rounded-3xl bg-white p-8 text-center shadow-lg">
      <p className="text-2xl font-semibold leading-snug text-slate-800" data-testid="calm-reply-message">
        {reply.message}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        {showActivity && onActivity && (
          <button
            type="button"
            onClick={() => onActivity(reply.suggested_activity)}
            className="min-h-16 rounded-full bg-emerald-500 px-8 py-4 text-xl font-semibold text-white shadow focus:outline-none focus-visible:ring-4"
          >
            {ACTIVITY_LABELS[reply.suggested_activity]}
          </button>
        )}
        <button
          type="button"
          onClick={onContinue}
          className="min-h-16 rounded-full bg-sky-500 px-8 py-4 text-xl font-semibold text-white shadow focus:outline-none focus-visible:ring-4"
        >
          {showActivity ? "Back to my task" : ACTIVITY_LABELS.none}
        </button>
      </div>
    </section>
  );
}
