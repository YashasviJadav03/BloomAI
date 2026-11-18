from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from backend.app.database import Base

class CheckInModel(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="SET NULL"), nullable=True)
    emoji = Column(String(50), nullable=False)  # happy, calm, tired, sad, worried, angry
    text = Column(Text, nullable=True)
    avg_volume = Column(Float, nullable=True)
    peak_volume = Column(Float, nullable=True)
    words_per_minute = Column(Float, nullable=True)
    audio_duration_seconds = Column(Float, nullable=True)
    focus_score = Column(Integer, nullable=False, default=50)
    emotion_score = Column(Integer, nullable=False, default=50)
    label = Column(String(50), nullable=False, default="calm")
    safe_mode = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
