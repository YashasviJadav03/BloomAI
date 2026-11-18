from datetime import datetime, date, timedelta
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.profile import UserStatsModel
from backend.app.models.session import SessionModel
from backend.app.models.checkin import CheckInModel
from backend.app.schemas.progress import ProgressSummaryResponse, MoodDayPoint

router = APIRouter(prefix="/api/progress", tags=["Progress"])

@router.get("/summary", response_model=ProgressSummaryResponse)
def get_progress_summary(db: Session = Depends(get_db)):
    stats = db.query(UserStatsModel).filter(UserStatsModel.id == 1).first()
    if not stats:
        stats = UserStatsModel(id=1, total_points=0, current_streak=0, best_streak=0)

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = datetime.utcnow() - timedelta(days=7)

    tasks_today = db.query(SessionModel).filter(
        SessionModel.status == "completed",
        SessionModel.ended_at >= today_start
    ).count()

    tasks_week = db.query(SessionModel).filter(
        SessionModel.status == "completed",
        SessionModel.ended_at >= week_start
    ).count()

    return ProgressSummaryResponse(
        total_points=stats.total_points,
        current_streak=stats.current_streak,
        best_streak=stats.best_streak,
        tasks_completed_today=tasks_today,
        tasks_completed_week=tasks_week
    )


@router.get("/mood", response_model=List[MoodDayPoint])
def get_mood_by_day(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    since_date = datetime.utcnow() - timedelta(days=days)
    records = db.query(CheckInModel).filter(
        CheckInModel.created_at >= since_date
    ).order_by(CheckInModel.created_at.asc()).all()

    # Group by date YYYY-MM-DD
    grouped = {}
    for r in records:
        day_str = r.created_at.strftime("%Y-%m-%d")
        if day_str not in grouped:
            grouped[day_str] = {"emotions": [], "focuses": []}
        grouped[day_str]["emotions"].append(r.emotion_score)
        grouped[day_str]["focuses"].append(r.focus_score)

    result = []
    for day_str, data in grouped.items():
        count = len(data["emotions"])
        avg_emo = round(sum(data["emotions"]) / count) if count else 0
        avg_foc = round(sum(data["focuses"]) / count) if count else 0
        result.append(
            MoodDayPoint(
                date=day_str,
                avg_emotion_score=avg_emo,
                avg_focus_score=avg_foc,
                checkins=count
            )
        )
    return result
