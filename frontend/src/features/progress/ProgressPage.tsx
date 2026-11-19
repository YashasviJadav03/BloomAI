import { useEffect, useState } from "react";
import { fetchMoodByDay, fetchProgressSummary } from "./api";
import { MoodChart } from "./MoodChart";
import { fillDays, weeklyNote } from "./moodData";
import type { ChartDay, ProgressSummary } from "./types";
import "./progress.css";

type Load = { state: "loading" } | { state: "error" } | { state: "ready"; summary: ProgressSummary; days: ChartDay[] };

function StatTile({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="viz-card flex flex-col items-center rounded-3xl p-4 text-center shadow">
      <span aria-hidden="true" className="text-4xl">
        {icon}
      </span>
      <span className="text-4xl font-extrabold">{value}</span>
      <span className="viz-muted text-base font-semibold">{label}</span>
    </div>
  );
}

/** My Progress page (commits C12, C13). Member B mounts it on the /progress route. */
export function ProgressPage({ childName, days = 7 }: { childName?: string; days?: number }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoad({ state: "loading" });
    Promise.all([fetchProgressSummary(), fetchMoodByDay(days)])
      .then(([summary, mood]) => !cancelled && setLoad({ state: "ready", summary, days: fillDays(mood, days) }))
      .catch(() => !cancelled && setLoad({ state: "error" }));
    return () => {
      cancelled = true;
    };
  }, [days, attempt]);

  return (
    <main className="bloom-progress mx-auto flex w-full max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-3xl font-bold">{childName ? `${childName}'s progress` : "My progress"}</h1>

      {load.state === "loading" && (
        <p className="viz-muted text-lg" role="status">
          Gathering your stars…
        </p>
      )}

      {load.state === "error" && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900">
          <span className="text-lg">I couldn't load your progress right now.</span>
          <button type="button" className="rounded-full bg-amber-500 px-6 py-3 text-lg font-semibold text-white" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
        </div>
      )}

      {load.state === "ready" && (
        <>
          <p className="viz-card rounded-3xl p-5 text-xl font-semibold leading-snug shadow" data-testid="weekly-note">
            🌱 {weeklyNote(load.days, load.summary, childName)}
          </p>
          <section aria-label="My stats" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile icon="🔥" value={load.summary.current_streak} label="Day streak" />
            <StatTile icon="⭐" value={load.summary.total_points} label="Points" />
            <StatTile icon="✅" value={load.summary.tasks_completed_today} label="Tasks today" />
            <StatTile icon="🏆" value={load.summary.best_streak} label="Best streak" />
          </section>
          <MoodChart days={load.days} />
        </>
      )}
    </main>
  );
}
