"""AI Module for BloomAI
Handles LLM praise generation and calm-down coaching responses with safe template fallbacks.
Works completely offline without requiring any external API key.
"""
import json
import os
import random
from pathlib import Path
from typing import Dict, Any

TEMPLATES_DIR = Path(__file__).parent / "fallback_templates"

# Filtered/blocked words to guarantee child-safe tone
BLOCKED_WORDS = {
    "stupid", "lazy", "bad", "fail", "failure", "punish", "hate", "ugly", 
    "worthless", "dumb", "hopeless", "terrible", "loser"
}

def _clean_and_validate(text: str) -> str:
    """Ensures message is clean, safe, and child appropriate."""
    words = text.lower().split()
    for w in words:
        clean_w = "".join(c for c in w if c.isalnum())
        if clean_w in BLOCKED_WORDS:
            return ""
    if len(text) > 280:
        return text[:277] + "..."
    return text.strip()


def generate_praise(
    child_name: str = "Friend",
    task_title: str = "your task",
    step_text: str = "this step",
    streak: int = 1,
    event: str = "step_completed"
) -> Dict[str, str]:
    """
    Generates effort-based, positive praise.
    Falls back to curated templates.
    """
    child_name = child_name or "Friend"
    task_title = task_title or "your task"
    step_text = step_text or "this step"

    template_file = TEMPLATES_DIR / "praise.json"
    templates = [
        "You kept going on that step, {child_name}. Nice effort!",
        "Great focus on {task_title}, {child_name}!",
        "Step by step, you are doing it, {child_name}!",
        "Awesome determination! You finished {step_text}!"
    ]
    if template_file.exists():
        try:
            with open(template_file, "r", encoding="utf-8") as f:
                templates = json.load(f)
        except Exception:
            pass

    template = random.choice(templates)
    msg = template.format(
        child_name=child_name,
        task_title=task_title,
        step_text=step_text,
        streak=streak
    )
    safe_msg = _clean_and_validate(msg)
    if not safe_msg:
        safe_msg = f"Great work on that step, {child_name}! Keep it up!"

    return {
        "message": safe_msg,
        "source": "template"
    }


def generate_calm_reply(
    child_name: str = "Friend",
    emoji: str = "calm",
    text: str = "",
    focus_score: int = 50,
    emotion_score: int = 50
) -> Dict[str, str]:
    """
    Generates an empathetic calm-down response with a suggested activity (breathing, movement, stretching).
    """
    child_name = child_name or "Friend"
    template_file = TEMPLATES_DIR / "calm_reply.json"
    
    fallback_map = {
        "angry": ("It is completely normal to feel frustrated. Let's take three slow breaths together.", "breathing"),
        "worried": (f"Big feelings can feel heavy, {child_name}. Shake out your hands and take a breath.", "movement"),
        "tired": (f"Your brain worked hard today, {child_name}. Stretch your arms up and take a quick rest.", "stretching"),
        "sad": (f"It is okay to feel down sometimes, {child_name}. You are doing your best.", "breathing"),
        "calm": ("You are in a great calm space. Keep this gentle rhythm going!", "none"),
        "happy": (f"Love seeing you smile, {child_name}! Keep that positive energy flowing!", "none"),
    }

    if template_file.exists():
        try:
            with open(template_file, "r", encoding="utf-8") as f:
                records = json.load(f)
                for rec in records:
                    if rec.get("condition") == emoji:
                        msg = rec.get("message", "").format(child_name=child_name)
                        return {
                            "message": msg,
                            "suggested_activity": rec.get("suggested_activity", "breathing"),
                            "source": "template"
                        }
        except Exception:
            pass

    msg, activity = fallback_map.get(emoji, ("Let's take a deep breath together.", "breathing"))
    return {
        "message": msg,
        "suggested_activity": activity,
        "source": "template"
    }
