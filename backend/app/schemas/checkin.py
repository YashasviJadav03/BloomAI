from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AudioFeatures(BaseModel):
    avg_volume: Optional[float] = 0.5
    peak_volume: Optional[float] = 0.7
    words_per_minute: Optional[float] = 120.0
    duration_seconds: Optional[float] = 5.0

class CheckInCreate(BaseModel):
    session_id: Optional[int] = None
    emoji: str  # happy, calm, tired, sad, worried, angry
    text: Optional[str] = None
    audio_features: Optional[AudioFeatures] = None

class CheckInResponse(BaseModel):
    id: int
    focus_score: int
    emotion_score: int
    label: str
    safe_mode: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
