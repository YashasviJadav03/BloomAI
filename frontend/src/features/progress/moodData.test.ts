import { describe, expect, it } from "vitest";
import { fillDays, weeklyNote } from "./moodData";

const TODAY = new Date("2026-11-24T10:00:00Z"); // a Tuesday

describe("fillDays", () => {
  it("returns a full week ending today with gaps as null", () => {
    const days = fillDays([{ date: "2026-11-22", avg_emotion_score: 62, avg_focus_score: 55, checkins: 3 }], 7, TODAY);
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe("2026-11-18");
    expect(days[6]).toMatchObject({ date: "2026-11-24", label: "Today", mood: null });
    expect(days[4]).toMatchObject({ date: "2026-11-22", label: "Sun", mood: 62, focus: 55, checkins: 3 });
  });
});

describe("weeklyNote", () => {
  const NEGATIVE = /\b(bad|worse|drop|down|low|missed|only|didn't|fail)/i;

  it("encourages a first check-in when there is no data", () => {
    const note = weeklyNote(fillDays([], 7, TODAY), null, "Aarav");
    expect(note).toContain("Try one today");
    expect(note).not.toMatch(NEGATIVE);
  });

  it("celebrates days, the brightest day, a rising trend and the streak", () => {
    const pts = [
      { date: "2026-11-19", avg_emotion_score: 40, avg_focus_score: 40, checkins: 1 },
      { date: "2026-11-20", avg_emotion_score: 45, avg_focus_score: 50, checkins: 1 },
      { date: "2026-11-22", avg_emotion_score: 70, avg_focus_score: 60, checkins: 2 },
      { date: "2026-11-24", avg_emotion_score: 80, avg_focus_score: 65, checkins: 1 },
    ];
    const note = weeklyNote(fillDays(pts, 7, TODAY), {
      total_points: 55, current_streak: 3, best_streak: 5, tasks_completed_today: 2, tasks_completed_week: 9,
    }, "Aarav");
    expect(note).toContain("4 days this week, Aarav");
    expect(note).toContain("Today felt the brightest");
    expect(note).toContain("climbing");
    expect(note).toContain("3 days in a row");
  });

  it("never turns a falling week into a negative note", () => {
    const pts = [
      { date: "2026-11-19", avg_emotion_score: 90, avg_focus_score: 80, checkins: 1 },
      { date: "2026-11-20", avg_emotion_score: 70, avg_focus_score: 60, checkins: 1 },
      { date: "2026-11-22", avg_emotion_score: 30, avg_focus_score: 30, checkins: 1 },
      { date: "2026-11-24", avg_emotion_score: 20, avg_focus_score: 25, checkins: 1 },
    ];
    const note = weeklyNote(fillDays(pts, 7, TODAY), null);
    expect(note).not.toMatch(NEGATIVE);
    expect(note).not.toContain("climbing");
    expect(note).toContain("Thursday felt the brightest");
  });
});
