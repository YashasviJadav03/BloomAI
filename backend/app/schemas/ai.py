from typing import Literal, Optional
from pydantic import BaseModel


class PraiseRequest(BaseModel):
    event: str = "step_completed"
    child_name: Optional[str] = "Aarav"
    task_title: Optional[str] = "Homework"
    step_text: Optional[str] = "Write the date"
    streak: Optional[int] = 3
    # Richer context so the LLM can generate task-specific praise
    schedule_name: Optional[str] = None
    step_number: Optional[int] = None
    total_steps: Optional[int] = None


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


class ChatRequest(BaseModel):
    child_name: Optional[str] = "Friend"
    praise_message: str = ""           # what Bloomi just said, for context
    child_text: str = ""               # the child's reply


class ChatResponse(BaseModel):
    message: str
    source: Literal["llm", "template", "fallback"] = "template"
