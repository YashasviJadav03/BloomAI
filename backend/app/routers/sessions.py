from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.profile import UserStatsModel
from backend.app.models.schedule import TaskModel, StepModel
from backend.app.models.session import SessionModel, StepCompletionModel
from backend.app.schemas.session import (
    SessionStartRequest, SessionStartResponse,
    StepCompleteResponse, SessionEndResponse
)

router = APIRouter(prefix="/api/sessions", tags=["Sessions & Points"])

def _get_or_create_stats(db: Session) -> UserStatsModel:
    stats = db.query(UserStatsModel).filter(UserStatsModel.id == 1).first()
    if not stats:
        stats = UserStatsModel(id=1, total_points=0, current_streak=0, best_streak=0, last_active_date=None)
        db.add(stats)
        db.commit()
        db.refresh(stats)
    return stats

def _update_streak(stats: UserStatsModel) -> int:
    today = date.today()
    if stats.last_active_date == today:
        pass  # already counted today
    elif stats.last_active_date == (today - timedelta(days=1)):
        stats.current_streak += 1
        stats.last_active_date = today
    else:
        stats.current_streak = 1
        stats.last_active_date = today

    if stats.current_streak > stats.best_streak:
        stats.best_streak = stats.current_streak

    return stats.current_streak


@router.post("", response_model=SessionStartResponse, status_code=status.HTTP_201_CREATED)
def start_session(payload: SessionStartRequest, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == payload.task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {payload.task_id} not found"
        )
    
    session = SessionModel(
        task_id=task.id,
        started_at=datetime.utcnow(),
        expected_seconds=task.expected_seconds,
        bonus_points=0,
        status="active"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return SessionStartResponse(
        session_id=session.id,
        task_id=session.task_id,
        started_at=session.started_at,
        expected_seconds=session.expected_seconds
    )


@router.post("/{id}/steps/{step_id}/complete", response_model=StepCompleteResponse)
def complete_step(id: int, step_id: int, db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(SessionModel.id == id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session {id} not found")

    step = db.query(StepModel).filter(StepModel.id == step_id).first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Step {step_id} not found")

    # Record completion (5 points)
    points_awarded = 5
    completion = StepCompletionModel(
        session_id=session.id,
        step_id=step.id,
        completed_at=datetime.utcnow(),
        points_awarded=points_awarded
    )
    db.add(completion)

    # Update Points & Streak
    stats = _get_or_create_stats(db)
    stats.total_points += points_awarded
    current_streak = _update_streak(stats)
    db.commit()
    db.refresh(stats)

    # Compute steps remaining in task
    task = db.query(TaskModel).filter(TaskModel.id == session.task_id).first()
    total_steps = len(task.steps) if task else 0
    completed_steps_count = db.query(StepCompletionModel).filter(
        StepCompletionModel.session_id == session.id
    ).count()

    steps_remaining = max(0, total_steps - completed_steps_count)

    return StepCompleteResponse(
        points_awarded=points_awarded,
        total_points=stats.total_points,
        streak=current_streak,
        steps_remaining=steps_remaining
    )


@router.post("/{id}/end", response_model=SessionEndResponse)
def end_session(id: int, db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(SessionModel.id == id).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Session {id} not found")

    now = datetime.utcnow()
    session.ended_at = now
    duration = int((now - session.started_at).total_seconds())
    if duration < 0:
        duration = 0
    session.duration_seconds = duration
    
    bonus = 10
    session.bonus_points = bonus
    session.status = "completed"

    stats = _get_or_create_stats(db)
    stats.total_points += bonus
    _update_streak(stats)

    db.commit()
    db.refresh(stats)
    db.refresh(session)

    return SessionEndResponse(
        duration_seconds=session.duration_seconds,
        expected_seconds=session.expected_seconds,
        bonus_points=bonus,
        total_points=stats.total_points
    )
