from typing import Literal, Optional
from pydantic import BaseModel, Field

# Contract: docs/api-contract.md section 8. Rules: docs/ai-rules.md.

PraiseEvent = Literal["step_completed", "task_completed", "session_ended", "streak"]
SuggestedActivity = Literal["breathing", "movement", "stretching", "talk_to_adult", "none"]


class PraiseRequest(BaseModel):
    event: PraiseEvent = "step_completed"
    child_name: Optional[str] = Field(None, max_length=100)
    task_title: Optional[str] = Field(None, max_length=200)
    step_text: Optional[str] = Field(None, max_length=300)
    streak: Optional[int] = Field(None, ge=0)


class PraiseResponse(BaseModel):
    message: str
    source: Literal["llm", "template"] = "template"


class CalmReplyRequest(BaseModel):
    child_name: Optional[str] = Field(None, max_length=100)
    emoji: Literal["happy", "calm", "tired", "sad", "worried", "angry"] = "calm"
    text: Optional[str] = Field("", max_length=1000)
    focus_score: Optional[int] = Field(None, ge=0, le=100)
    emotion_score: Optional[int] = Field(None, ge=0, le=100)


class CalmReplyResponse(BaseModel):
    message: str
    suggested_activity: SuggestedActivity = "breathing"
    source: Literal["llm", "template"] = "template"
