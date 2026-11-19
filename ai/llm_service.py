"""AI Module for BloomAI — LLM praise and calm-reply with safe template fallbacks.

Public API (shapes must not change — backend/app/routers/ai.py depends on these):

  generate_praise(child_name, task_title, step_text, streak, event)
      -> {"message": str, "source": "llm" | "template"}

  generate_calm_reply(child_name, emoji, text, focus_score, emotion_score)
      -> {"message": str, "suggested_activity": str, "source": "llm" | "template"}

Both functions are entirely exception-safe: the worst case is a hard-coded template.
"""
import json
import logging
import re
import string
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent / "fallback_templates"

# ---------------------------------------------------------------------------
# Local distress keywords (defense-in-depth; the main check is in
# backend.app.safety.distress_detector but we keep a local copy so
# generate_calm_reply is safe even when that import fails).
# ---------------------------------------------------------------------------
_LOCAL_DISTRESS_RE = re.compile(
    r"\b(?:hurt\s+myself|kill\s+myself|want\s+to\s+disappear|hate\s+myself|"
    r"hate\s+my\s+life|i\s+am\s+worthless|i'm\s+worthless)\b",
    re.IGNORECASE,
)

# Fixed safe response returned on distress detection (never reaches LLM)
_DISTRESS_RESPONSE: Dict[str, str] = {
    "message": "Thank you for telling me. Let's find a trusted grown-up to talk to.",
    "suggested_activity": "none",
    "source": "template",
}

# Valid activities for calm reply
_VALID_ACTIVITIES = {"breathing", "movement", "stretching", "none"}


# ---------------------------------------------------------------------------
# Template helpers
# ---------------------------------------------------------------------------

def _safe_format(template: str, **kwargs: Any) -> str:
    """Format a template string using only the supplied keyword arguments.

    Silently ignores stray braces, unknown keys, or any other format error.
    """
    try:
        # Use string.Formatter so we can intercept missing keys instead of raising.
        formatter = string.Formatter()
        result_parts: list = []
        for literal_text, field_name, format_spec, _ in formatter.parse(template):
            result_parts.append(literal_text)
            if field_name is not None:
                # Strip attribute/index access like "{0}" or "{x.y}"
                base_key = re.split(r"[.\[]", field_name)[0]
                value = kwargs.get(base_key, "")
                result_parts.append(format(str(value), format_spec))
        return "".join(result_parts)
    except Exception:
        # Last resort: return template without substitution
        return template


def _load_praise_templates() -> Dict[str, list]:
    """Load praise.json. Handles both the new dict format and old flat-list format."""
    path = TEMPLATES_DIR / "praise.json"
    _fallback = {
        "step_completed": ["Great work on that step, {child_name}! Keep it up!"],
        "task_completed": ["You finished the whole task, {child_name}! Great effort!"],
        "streak": ["A streak of {streak}, {child_name}! You keep coming back!"],
    }
    if not path.exists():
        return _fallback
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        # New format: dict keyed by event type
        if isinstance(data, dict):
            return {k: v for k, v in data.items() if isinstance(v, list) and v}
        # Old format: flat list — assign everything to step_completed
        if isinstance(data, list) and data:
            return {"step_completed": data, "task_completed": data, "streak": data}
    except Exception as exc:
        logger.warning("Failed to load praise.json: %s", exc)
    return _fallback


def _load_calm_templates() -> list:
    """Load calm_reply.json and return the records list."""
    path = TEMPLATES_DIR / "calm_reply.json"
    _fallback = [
        {
            "condition": "angry",
            "message": "It is completely normal to feel upset. Let's take three slow breaths.",
            "suggested_activity": "breathing",
        },
        {
            "condition": "calm",
            "message": "You are in a great calm space. Keep this gentle rhythm going!",
            "suggested_activity": "none",
        },
    ]
    if not path.exists():
        return _fallback
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, list):
            return data
    except Exception as exc:
        logger.warning("Failed to load calm_reply.json: %s", exc)
    return _fallback


def _pick_praise_template(
    templates: Dict[str, list],
    event: str,
    rng=None,
) -> str:
    """Pick a random template string for the given event type."""
    import random as _random
    _rng = rng or _random
    pool = templates.get(event) or templates.get("step_completed") or []
    if not pool:
        return "Great work, {child_name}! Keep it up!"
    return _rng.choice(pool)


def _pick_calm_template(records: list, emoji: str, child_name: str) -> Dict[str, str]:
    """Find the calm template for the given emoji and format it."""
    for rec in records:
        if rec.get("condition") == emoji:
            msg = _safe_format(rec.get("message", ""), child_name=child_name)
            activity = rec.get("suggested_activity", "breathing")
            if activity not in _VALID_ACTIVITIES:
                activity = "breathing"
            return {"message": msg, "suggested_activity": activity, "source": "template"}

    # Hard-coded absolute last resort
    _last_resort = {
        "angry": ("It is okay to feel upset. Let's take three slow breaths together.", "breathing"),
        "worried": ("Big feelings are hard. Let's shake out your hands.", "movement"),
        "tired": ("Your brain worked hard. Stretch your arms up and rest a moment.", "stretching"),
        "sad": ("It is okay to feel sad. You are doing your best.", "breathing"),
        "calm": ("You are in a calm space. Keep that gentle rhythm going!", "none"),
        "happy": ("Love that smile! Keep that positive energy flowing!", "none"),
    }
    msg, activity = _last_resort.get(emoji, ("Let's take a deep breath together.", "breathing"))
    return {"message": msg, "suggested_activity": activity, "source": "template"}


# ---------------------------------------------------------------------------
# Main service functions
# ---------------------------------------------------------------------------

def generate_praise(
    child_name: str = "Friend",
    task_title: str = "your task",
    step_text: str = "this step",
    streak: int = 1,
    event: str = "step_completed",
    schedule_name: str = "",
    step_number: int = 0,
    total_steps: int = 0,
    rng=None,
) -> Dict[str, str]:
    """Generate effort-based praise for a child action.

    Returns {"message": str, "source": "llm" | "template"}.
    Never raises.
    """
    try:
        from ai.safety_filter import sanitize_child_text, validate_message
        from ai.config import llm_available, AI_MAX_CHARS

        # Sanitize inputs
        child_name = sanitize_child_text(child_name or "Friend", max_len=50) or "Friend"
        task_title = sanitize_child_text(task_title or "your task", max_len=100) or "your task"
        step_text = sanitize_child_text(step_text or "this step", max_len=100) or "this step"
        schedule_name = sanitize_child_text(schedule_name or "", max_len=100)
        streak = max(1, int(streak or 1))
        step_number = int(step_number or 0)
        total_steps = int(total_steps or 0)

        templates = _load_praise_templates()

        # Try the LLM first if available
        if llm_available():
            try:
                from ai.llm_client import complete
                from ai.prompts import SYSTEM_PRAISE, build_praise_user

                user_prompt = build_praise_user(
                    event, task_title, step_text, streak,
                    schedule_name=schedule_name,
                    step_number=step_number,
                    total_steps=total_steps,
                )
                raw = complete(SYSTEM_PRAISE, user_prompt)
                if raw:
                    validated = validate_message(raw, AI_MAX_CHARS)
                    if validated:
                        return {"message": validated, "source": "llm"}
                    logger.info("Praise LLM output rejected by safety filter; using template.")
            except Exception as exc:
                logger.warning("Praise LLM path failed: %s", type(exc).__name__)

        # Template path
        template_str = _pick_praise_template(templates, event, rng=rng)
        msg = _safe_format(
            template_str,
            child_name=child_name,
            task_title=task_title,
            step_text=step_text,
            streak=streak,
        )
        if not msg.strip():
            msg = f"Great work on that step, {child_name}! Keep it up!"
        return {"message": msg, "source": "template"}

    except Exception as exc:
        logger.error("generate_praise unexpected error: %s", type(exc).__name__)
        return {
            "message": "Great work! Keep going!",
            "source": "template",
        }


def generate_calm_reply(
    child_name: str = "Friend",
    emoji: str = "calm",
    text: str = "",
    focus_score: int = 50,
    emotion_score: int = 50,
) -> Dict[str, str]:
    """Generate an empathetic calm-down response.

    Returns {"message": str, "suggested_activity": str, "source": "llm" | "template"}.
    Never raises.
    """
    try:
        from ai.safety_filter import sanitize_child_text, validate_message
        from ai.config import llm_available, AI_MAX_CHARS

        # Sanitize inputs
        child_name = sanitize_child_text(child_name or "Friend", max_len=50) or "Friend"
        sanitized_text = sanitize_child_text(text or "", max_len=200)

        # Normalize emoji
        _valid_emojis = {"happy", "calm", "tired", "sad", "worried", "angry"}
        if emoji not in _valid_emojis:
            emoji = "calm"

        calm_records = _load_calm_templates()

        # ----------------------------------------------------------------
        # Defense-in-depth distress check — MUST happen before any LLM call
        # ----------------------------------------------------------------
        distress_detected = False

        # Local keyword check (always runs)
        if sanitized_text and _LOCAL_DISTRESS_RE.search(sanitized_text):
            distress_detected = True

        # Backend distress detector (lazy import — may not be on the path in ai-only tests)
        if not distress_detected:
            try:
                from backend.app.safety.distress_detector import evaluate_distress
                if evaluate_distress(sanitized_text, emotion_score):
                    distress_detected = True
            except Exception:
                pass  # If import fails, rely on local check only

        if distress_detected:
            return dict(_DISTRESS_RESPONSE)

        # ----------------------------------------------------------------
        # Try the LLM
        # ----------------------------------------------------------------
        if llm_available():
            try:
                from ai.llm_client import complete
                from ai.prompts import SYSTEM_CALM, build_calm_user

                user_prompt = build_calm_user(emoji, focus_score, emotion_score, sanitized_text)
                raw = complete(SYSTEM_CALM, user_prompt)
                if raw:
                    llm_result = _parse_calm_llm_response(raw, validate_message, AI_MAX_CHARS)
                    if llm_result:
                        return llm_result
                    logger.info("Calm LLM output rejected; using template.")
            except Exception as exc:
                logger.warning("Calm LLM path failed: %s", type(exc).__name__)

        # Template fallback
        return _pick_calm_template(calm_records, emoji, child_name)

    except Exception as exc:
        logger.error("generate_calm_reply unexpected error: %s", type(exc).__name__)
        return {
            "message": "Let's take a deep breath together.",
            "suggested_activity": "breathing",
            "source": "template",
        }


def _parse_calm_llm_response(raw: str, validate_message, max_chars: int) -> Optional[Dict[str, str]]:
    """Parse and validate the JSON blob returned by the calm-reply LLM.

    Returns a result dict on success, or None if anything is wrong.
    """
    # Strip code fences that some models include
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.info("Calm LLM returned non-JSON: %.60s", cleaned)
        return None

    if not isinstance(data, dict):
        return None

    message = data.get("message", "")
    activity = data.get("suggested_activity", "")

    if not isinstance(message, str) or not message.strip():
        return None

    if activity not in _VALID_ACTIVITIES:
        logger.info("Calm LLM returned unknown activity '%s'.", activity)
        return None

    validated_msg = validate_message(message, max_chars)
    if not validated_msg:
        return None

    return {
        "message": validated_msg,
        "suggested_activity": activity,
        "source": "llm",
    }


# ---------------------------------------------------------------------------
# Chat reply (child replies to Bloomi's praise)
# ---------------------------------------------------------------------------

_CHAT_FALLBACKS = [
    "That is great to hear! Keep going!",
    "I love that! You are doing wonderfully.",
    "Thank you for telling me! You are doing your best.",
    "That made me smile. On to the next step!",
]

def generate_chat_reply(
    child_name: str = "Friend",
    praise_message: str = "",
    child_text: str = "",
) -> Dict[str, str]:
    """Generate a short conversational reply to a child's response to praise.

    Returns {"message": str, "source": "llm" | "template"}.
    Never raises.
    """
    try:
        from ai.safety_filter import sanitize_child_text, validate_message
        from ai.config import llm_available, AI_MAX_CHARS
        import random as _random

        child_name = sanitize_child_text(child_name or "Friend", max_len=50) or "Friend"
        sanitized_text = sanitize_child_text(child_text or "", max_len=200)

        if not sanitized_text.strip():
            return {"message": "I am listening! Tell me more.", "source": "template"}

        # Distress check — same defense-in-depth as calm reply
        if _LOCAL_DISTRESS_RE.search(sanitized_text):
            return dict(_DISTRESS_RESPONSE)

        try:
            from backend.app.safety.distress_detector import evaluate_distress
            if evaluate_distress(sanitized_text, 50):
                return dict(_DISTRESS_RESPONSE)
        except Exception:
            pass

        # Try the LLM
        if llm_available():
            try:
                from ai.llm_client import complete
                from ai.prompts import SYSTEM_CHAT, build_chat_user

                user_prompt = build_chat_user(praise_message, sanitized_text)
                raw = complete(SYSTEM_CHAT, user_prompt)
                if raw:
                    validated = validate_message(raw, AI_MAX_CHARS)
                    if validated:
                        return {"message": validated, "source": "llm"}
                    logger.info("Chat LLM output rejected by safety filter; using template.")
            except Exception as exc:
                logger.warning("Chat LLM path failed: %s", type(exc).__name__)

        # Template fallback
        return {"message": _random.choice(_CHAT_FALLBACKS), "source": "template"}

    except Exception as exc:
        logger.error("generate_chat_reply unexpected error: %s", type(exc).__name__)
        return {"message": "Thank you for telling me! Keep going!", "source": "template"}
