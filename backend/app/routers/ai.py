from fastapi import APIRouter
from backend.app.schemas.ai import PraiseRequest, PraiseResponse, CalmReplyRequest, CalmReplyResponse, ChatRequest, ChatResponse
from ai.llm_service import generate_praise, generate_calm_reply, generate_chat_reply

router = APIRouter(prefix="/api", tags=["AI Coaching & Praise"])

_VALID_EMOJIS = {"happy", "calm", "tired", "sad", "worried", "angry"}


@router.post("/praise", response_model=PraiseResponse)
def get_praise(payload: PraiseRequest):
    result = generate_praise(
        child_name=payload.child_name or "Friend",
        task_title=payload.task_title or "your task",
        step_text=payload.step_text or "this step",
        streak=payload.streak or 1,
        event=payload.event or "step_completed",
        schedule_name=payload.schedule_name,
        step_number=payload.step_number,
        total_steps=payload.total_steps,
    )
    return PraiseResponse(
        message=result["message"],
        source=result.get("source", "template"),
    )


@router.post("/calm-reply", response_model=CalmReplyResponse)
def get_calm_reply(payload: CalmReplyRequest):
    # Normalise unknown emoji values instead of returning 422
    emoji = payload.emoji if payload.emoji in _VALID_EMOJIS else "calm"
    result = generate_calm_reply(
        child_name=payload.child_name or "Friend",
        emoji=emoji,
        text=payload.text or "",
        focus_score=payload.focus_score or 50,
        emotion_score=payload.emotion_score or 50,
    )
    return CalmReplyResponse(
        message=result["message"],
        suggested_activity=result.get("suggested_activity", "breathing"),
        source=result.get("source", "template"),
    )


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    result = generate_chat_reply(
        child_name=payload.child_name or "Friend",
        praise_message=payload.praise_message or "",
        child_text=payload.child_text or "",
    )
    return ChatResponse(
        message=result["message"],
        source=result.get("source", "template"),
    )
