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
    fidget_score = Column(Float, nullable=True)
    face_present = Column(Boolean, nullable=True, default=True)
    focus_score = Column(Integer, nullable=False, default=50)
    emotion_score = Column(Integer, nullable=False, default=50)
    label = Column(String(50), nullable=False, default="calm")
    safe_mode = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CaregiverAlertModel(Base):
    __tablename__ = "caregiver_alerts"

    id = Column(Integer, primary_key=True, index=True)
    checkin_id = Column(Integer, ForeignKey("checkins.id", ondelete="CASCADE"), nullable=True)
    trigger_text = Column(Text, nullable=True)
    emotion_score = Column(Integer, nullable=False, default=20)
    is_acknowledged = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
