// docs/api-contract.md section 10.

export interface ProgressSummary {
  total_points: number;
  current_streak: number;
  best_streak: number;
  tasks_completed_today: number;
  tasks_completed_week: number;
}

export interface MoodDayPoint {
  date: string; // YYYY-MM-DD (UTC, as the backend groups it)
  avg_emotion_score: number;
  avg_focus_score: number;
  checkins: number;
}

/** One chart row per calendar day; null where the child did not check in. */
export interface ChartDay {
  date: string;
  label: string;
  mood: number | null;
  focus: number | null;
  checkins: number;
}
