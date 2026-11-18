from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    expected_seconds = Column(Integer, default=120)
    bonus_points = Column(Integer, default=0)
    status = Column(String(50), default="active")  # active, completed, abandoned

    completions = relationship("StepCompletionModel", back_populates="session", cascade="all, delete-orphan")


class StepCompletionModel(Base):
    __tablename__ = "step_completions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    step_id = Column(Integer, ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)
    points_awarded = Column(Integer, default=5)

    session = relationship("SessionModel", back_populates="completions")
