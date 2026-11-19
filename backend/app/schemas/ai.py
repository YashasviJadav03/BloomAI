from typing import Literal, Optional
from pydantic import BaseModel


class PraiseRequest(BaseModel):
    event: str = "step_completed"
    child_name: Optional[str] = "Aarav"
    task_title: Optional[str] = "Homework"
    step_text: Optional[str] = "Write the date"
    streak: Optional[int] = 3


class PraiseResponse(BaseModel):
    message: str
    source: Literal["llm", "template", "fallback"] = "template"


class CalmReplyRequest(BaseModel):
    child_name: Optional[str] = "Aarav"
    emoji: str = "calm"
    text: Optional[str] = ""
    focus_score: Optional[int] = 50
    emotion_score: Optional[int] = 50


class CalmReplyResponse(BaseModel):
    message: str
    suggested_activity: str = "breathing"
    source: Literal["llm", "template", "fallback"] = "template"
