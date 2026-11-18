from fastapi import APIRouter
from backend.app.schemas.ai import PraiseRequest, PraiseResponse, CalmReplyRequest, CalmReplyResponse
from ai.llm_service import generate_praise, generate_calm_reply

router = APIRouter(prefix="/api", tags=["AI Coaching & Praise"])

@router.post("/praise", response_model=PraiseResponse)
def get_praise(payload: PraiseRequest):
    result = generate_praise(
        child_name=payload.child_name or "Friend",
        task_title=payload.task_title or "your task",
        step_text=payload.step_text or "this step",
        streak=payload.streak or 1,
        event=payload.event or "step_completed"
    )
    return PraiseResponse(
        message=result["message"],
        source=result.get("source", "template")
    )

@router.post("/calm-reply", response_model=CalmReplyResponse)
def get_calm_reply(payload: CalmReplyRequest):
    result = generate_calm_reply(
        child_name=payload.child_name or "Friend",
        emoji=payload.emoji or "calm",
        text=payload.text or "",
        focus_score=payload.focus_score or 50,
        emotion_score=payload.emotion_score or 50
    )
    return CalmReplyResponse(
        message=result["message"],
        suggested_activity=result.get("suggested_activity", "breathing"),
        source=result.get("source", "template")
    )
