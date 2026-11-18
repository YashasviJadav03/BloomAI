from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class SessionStartRequest(BaseModel):
    task_id: int

class SessionStartResponse(BaseModel):
    session_id: int
    task_id: int
    started_at: datetime
    expected_seconds: int

    model_config = ConfigDict(from_attributes=True)

class StepCompleteResponse(BaseModel):
    points_awarded: int
    total_points: int
    streak: int
    steps_remaining: int

class SessionEndResponse(BaseModel):
    duration_seconds: int
    expected_seconds: int
    bonus_points: int
    total_points: int
