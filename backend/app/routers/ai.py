"""AI praise and calm-reply endpoints (Member C). Contract: docs/api-contract.md section 8.

Both endpoints always answer 200 with a safe message: the LLM is optional and
any LLM failure falls back to a template (docs/ai-rules.md, rule 7).
"""
from fastapi import APIRouter
from backend.app.schemas.ai import PraiseRequest, PraiseResponse, CalmReplyRequest, CalmReplyResponse
from backend.app.ai.llm_service import generate_praise, generate_calm_reply

router = APIRouter(prefix="/api", tags=["AI Coaching & Praise"])


@router.post("/praise", response_model=PraiseResponse)
def get_praise(payload: PraiseRequest):
    result = generate_praise(
        child_name=payload.child_name,
        task_title=payload.task_title,
        step_text=payload.step_text,
        streak=payload.streak,
        event=payload.event,
    )
    return PraiseResponse(**result)


@router.post("/calm-reply", response_model=CalmReplyResponse)
def get_calm_reply(payload: CalmReplyRequest):
    result = generate_calm_reply(
        child_name=payload.child_name,
        emoji=payload.emoji,
        text=payload.text,
        focus_score=payload.focus_score,
        emotion_score=payload.emotion_score,
    )
    return CalmReplyResponse(**result)
