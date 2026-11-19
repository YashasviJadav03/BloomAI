import { mockResponse, request, USE_MOCK } from "../checkin/http";
import type { MoodDayPoint, ProgressSummary } from "./types";

export function fetchProgressSummary(): Promise<ProgressSummary> {
  if (USE_MOCK) {
    return mockResponse({ total_points: 55, current_streak: 3, best_streak: 5, tasks_completed_today: 2, tasks_completed_week: 9 });
  }
  return request<ProgressSummary>("GET", "/api/progress/summary");
}

export function fetchMoodByDay(days = 7): Promise<MoodDayPoint[]> {
  if (USE_MOCK) {
    const today = new Date();
    return mockResponse(
      Array.from({ length: days }, (_, i) => {
        const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - 1 - i)));
        return {
          date: d.toISOString().slice(0, 10),
          avg_emotion_score: 55 + ((i * 7) % 30),
          avg_focus_score: 50 + ((i * 11) % 30),
          checkins: 1 + (i % 3),
        };
      }),
    );
  }
  return request<MoodDayPoint[]>("GET", `/api/progress/mood?days=${days}`);
}
