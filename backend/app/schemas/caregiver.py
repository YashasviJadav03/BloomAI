from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class FocusPattern(BaseModel):
    avg_focus_score: int
    optimal_task_duration_minutes: int
    restlessness_onset_minutes: int
    summary: str

class ForgetfulnessPattern(BaseModel):
    checklist_completion_rate: int
    most_forgotten_items: List[str]
    summary: str

class EmotionalRegulationPattern(BaseModel):
    dominant_mood: str
    calm_recovery_rate: int
    summary: str

class CaregiverInsightsResponse(BaseModel):
    child_name: str
    time_range_days: int
    focus_pattern: FocusPattern
    forgetfulness_pattern: ForgetfulnessPattern
    emotional_regulation: EmotionalRegulationPattern
    clinical_summary: str
    active_alerts_count: int

class CaregiverAlertResponse(BaseModel):
    id: int
    checkin_id: Optional[int]
    trigger_text: Optional[str]
    emotion_score: int
    is_acknowledged: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SupportRecommendationsResponse(BaseModel):
    recommended_max_task_seconds: int
    suggested_micro_break_seconds: int
    recommendations: List[str]
