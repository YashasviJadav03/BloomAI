"""Praise and calm-reply generation (commits C6, C7).

Order of preference for every message:
  1. LLM reply that passes the safety filter       -> source "llm"
  2. Fallback template that passes the filter       -> source "template"
  3. A fixed default that is known to be safe       -> source "template"

The safety decision itself (safe_mode) belongs to Member A's distress rule. The
calm-reply path re-runs that rule as a second line of defence and never calls
the LLM when it trips.
"""
import random
from typing import Dict, Optional

from backend.app.ai import llm_client
from backend.app.ai.prompts import (
    CALM_SCHEMA, CALM_SYSTEM_PROMPT, NAME_PLACEHOLDER, PRAISE_SCHEMA,
    PRAISE_SYSTEM_PROMPT, build_calm_user_prompt, build_praise_user_prompt,
)
from backend.app.ai.safety_filter import check_message, normalize
from backend.app.ai.templates import (
    CALM_EMOJIS, PRAISE_EVENTS, SUGGESTED_ACTIVITIES, fill,
    pick_calm_template, pick_praise_template,
)
from backend.app.safety.distress_detector import evaluate_distress

DEFAULT_NAME = "Friend"
SAFE_DEFAULT_PRAISE = "Nice effort, {name}! Keep it up."
SAFE_DEFAULT_CALM = ("Let's take a slow breath together, {name}.", "breathing")
_TEMPLATE_ATTEMPTS = 4
# Stand-in used when checking LLM text, so the real name never affects the check.
_CHECK_NAME = "Sam"


def _clean_name(child_name: Optional[str]) -> str:
    name = " ".join((child_name or "").split())[:40]
    name = name.replace("{", "").replace("}", "")
    return name or DEFAULT_NAME


def _accept_llm_message(raw: Optional[str], name: str) -> Optional[str]:
    """Return the final message if the LLM text passes the filter, else None."""
    msg = normalize(raw)
    if not msg or msg.count(NAME_PLACEHOLDER) > 1:
        return None
    ok, _reason = check_message(msg.replace(NAME_PLACEHOLDER, _CHECK_NAME))
    if not ok:
        return None
    return msg.replace(NAME_PLACEHOLDER, name)


# ----------------------------- Praise -----------------------------

def praise_from_template(
    event: str, name: str, task_title: Optional[str], step_text: Optional[str],
    streak: Optional[int], rng: Optional[random.Random] = None,
) -> str:
    event = event if event in PRAISE_EVENTS else "step_completed"
    if event == "streak" and not (streak and streak >= 2):
        event = "step_completed"
    values = dict(name=name, task_title=task_title or "your task",
                  step_text=step_text or "that step", streak=streak or 1)
    for _ in range(_TEMPLATE_ATTEMPTS):
        msg = fill(pick_praise_template(event, rng), **values)
        if check_message(msg)[0]:
            return msg
    msg = fill(pick_praise_template("default", rng), **values)
    if check_message(msg)[0]:
        return msg
    return fill(SAFE_DEFAULT_PRAISE, name=name)


def generate_praise(
    child_name: Optional[str] = DEFAULT_NAME,
    task_title: Optional[str] = None,
    step_text: Optional[str] = None,
    streak: Optional[int] = None,
    event: str = "step_completed",
) -> Dict[str, str]:
    """Effort-based praise. Returns {"message", "source"}."""
    name = _clean_name(child_name)
    data = llm_client.generate_json(
        PRAISE_SYSTEM_PROMPT,
        build_praise_user_prompt(event, task_title, step_text, streak),
        PRAISE_SCHEMA,
    )
    if data:
        msg = _accept_llm_message(data.get("message"), name)
        if msg:
            return {"message": msg, "source": "llm"}
    return {
        "message": praise_from_template(event, name, task_title, step_text, streak),
        "source": "template",
    }


# ----------------------------- Calm reply -----------------------------

def calm_from_template(key: str, name: str, rng: Optional[random.Random] = None) -> Dict[str, str]:
    key = key if key in CALM_EMOJIS or key == "distress" else "default"
    for _ in range(_TEMPLATE_ATTEMPTS):
        tpl = pick_calm_template(key, rng)
        msg = fill(tpl.get("message", ""), name=name)
        activity = tpl.get("suggested_activity", "breathing")
        if check_message(msg)[0] and activity in SUGGESTED_ACTIVITIES:
            return {"message": msg, "suggested_activity": activity}
    message, activity = SAFE_DEFAULT_CALM
    return {"message": fill(message, name=name), "suggested_activity": activity}


def generate_calm_reply(
    child_name: Optional[str] = DEFAULT_NAME,
    emoji: str = "calm",
    text: Optional[str] = "",
    focus_score: Optional[int] = 50,
    emotion_score: Optional[int] = 50,
) -> Dict[str, str]:
    """Empathetic calm-down reply. Returns {"message", "suggested_activity", "source"}."""
    name = _clean_name(child_name)
    emoji = (emoji or "calm").lower()

    # Second line of defence: never send distress text to the LLM.
    score_for_rule = emotion_score if emotion_score is not None else 50
    if evaluate_distress(text, score_for_rule):
        return {**calm_from_template("distress", name), "source": "template"}

    data = llm_client.generate_json(
        CALM_SYSTEM_PROMPT,
        build_calm_user_prompt(emoji, text, focus_score, emotion_score),
        CALM_SCHEMA,
    )
    if data:
        msg = _accept_llm_message(data.get("message"), name)
        activity = data.get("suggested_activity")
        if msg and activity in SUGGESTED_ACTIVITIES and activity != "talk_to_adult":
            return {"message": msg, "suggested_activity": activity, "source": "llm"}

    return {**calm_from_template(emoji, name), "source": "template"}
