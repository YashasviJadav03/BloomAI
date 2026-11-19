import type { ChartDay, MoodDayPoint, ProgressSummary } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function utcDay(d: Date, offset: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
}

/**
 * Turn the sparse API list into exactly `days` rows ending today, so the chart
 * always shows a full week and gaps stay visible as gaps (never as zero).
 */
export function fillDays(points: MoodDayPoint[], days = 7, today: Date = new Date()): ChartDay[] {
  const byDate = new Map(points.map((p) => [p.date, p]));
  return Array.from({ length: days }, (_, i) => {
    const d = utcDay(today, i - (days - 1));
    const date = d.toISOString().slice(0, 10);
    const p = byDate.get(date);
    return {
      date,
      label: i === days - 1 ? "Today" : WEEKDAYS[d.getUTCDay()],
      mood: p ? p.avg_emotion_score : null,
      focus: p ? p.avg_focus_score : null,
      checkins: p ? p.checkins : 0,
    };
  });
}

/**
 * Weekly positive note (commit C13). Built only from things worth celebrating:
 * days checked in, the brightest day, a rising trend, streaks and tasks done.
 * It never mentions a drop, a bad day, or a missed day (docs/ai-rules.md).
 */
export function weeklyNote(days: ChartDay[], summary?: ProgressSummary | null, childName?: string): string {
  const name = childName ? `, ${childName}` : "";
  const active = days.filter((d) => d.mood !== null);
  if (active.length === 0) {
    return `Every check-in helps you learn about your feelings${name}. Try one today!`;
  }

  const parts: string[] = [];
  parts.push(
    active.length === 1
      ? `You checked in this week${name}. Telling me how you feel takes courage.`
      : `You checked in on ${active.length} days this week${name}.`,
  );

  const brightest = active.reduce((best, d) => ((d.mood ?? 0) > (best.mood ?? 0) ? d : best));
  if (active.length >= 2 && (brightest.mood ?? 0) >= 60) {
    const when = brightest.label === "Today" ? "Today" : WEEKDAYS_LONG[new Date(`${brightest.date}T00:00:00Z`).getUTCDay()];
    parts.push(`${when} felt the brightest.`);
  }

  if (active.length >= 4) {
    const half = Math.floor(active.length / 2);
    const avg = (xs: ChartDay[]) => xs.reduce((s, d) => s + (d.mood ?? 0), 0) / xs.length;
    if (avg(active.slice(half)) - avg(active.slice(0, half)) >= 5) parts.push("Your mood has been climbing!");
  }

  if (summary) {
    if (summary.current_streak >= 2) parts.push(`${summary.current_streak} days in a row of showing up.`);
    else if (summary.tasks_completed_week > 0) {
      parts.push(`You finished ${summary.tasks_completed_week} ${summary.tasks_completed_week === 1 ? "task" : "tasks"} this week.`);
    }
  }
  return parts.join(" ");
}
