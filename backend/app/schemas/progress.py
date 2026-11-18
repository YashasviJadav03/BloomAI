from pydantic import BaseModel

class ProgressSummaryResponse(BaseModel):
    total_points: int
    current_streak: int
    best_streak: int
    tasks_completed_today: int
    tasks_completed_week: int

class MoodDayPoint(BaseModel):
    date: str
    avg_emotion_score: int
    avg_focus_score: int
    checkins: int
