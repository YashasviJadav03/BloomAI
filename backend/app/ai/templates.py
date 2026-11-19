"""Fallback template messages and their loader (commit C2).

Templates are the floor for every AI response: they are used when the LLM is
disabled, unavailable, slow, or produces a message that fails the safety filter.
"""
import json
import random
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional

TEMPLATES_DIR = Path(__file__).resolve().parent / "fallback_templates"

PRAISE_EVENTS = ("step_completed", "task_completed", "session_ended", "streak")
CALM_EMOJIS = ("happy", "calm", "tired", "sad", "worried", "angry")
SUGGESTED_ACTIVITIES = ("breathing", "movement", "stretching", "talk_to_adult", "none")

# Used only if a JSON file is missing or corrupt, so the API can never return nothing.
_BUILTIN_PRAISE: Dict[str, List[str]] = {"default": ["Nice effort, {name}! Keep it up."]}
_BUILTIN_CALM: Dict[str, List[Dict[str, str]]] = {
    "default": [{"message": "Let's take a slow breath together, {name}.", "suggested_activity": "breathing"}],
    "distress": [{
        "message": "Thank you for telling me, {name}. Please find a grown-up you trust and tell them how you feel.",
        "suggested_activity": "talk_to_adult",
    }],
}


class _SafeDict(dict):
    """Leaves unknown placeholders blank instead of raising KeyError."""

    def __missing__(self, key: str) -> str:
        return ""


def fill(template: str, **values: object) -> str:
    """Fill {placeholders} in a template. Values are inserted verbatim (never re-formatted)."""
    return template.format_map(_SafeDict({k: "" if v is None else str(v) for k, v in values.items()})).strip()


def _load_json(filename: str, fallback: dict) -> dict:
    path = TEMPLATES_DIR / filename
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict) and data:
            return data
    except (OSError, ValueError):
        pass
    return fallback


@lru_cache(maxsize=1)
def load_praise_templates() -> Dict[str, List[str]]:
    data = _load_json("praise.json", _BUILTIN_PRAISE)
    data.setdefault("default", _BUILTIN_PRAISE["default"])
    return data


@lru_cache(maxsize=1)
def load_calm_templates() -> Dict[str, List[Dict[str, str]]]:
    data = _load_json("calm_reply.json", _BUILTIN_CALM)
    data.setdefault("default", _BUILTIN_CALM["default"])
    data.setdefault("distress", _BUILTIN_CALM["distress"])
    return data


def pick_praise_template(event: str, rng: Optional[random.Random] = None) -> str:
    rng = rng or random
    templates = load_praise_templates()
    return rng.choice(templates.get(event) or templates["default"])


def pick_calm_template(key: str, rng: Optional[random.Random] = None) -> Dict[str, str]:
    """key is an emoji value, or "distress" for the trusted-adult reply."""
    rng = rng or random
    templates = load_calm_templates()
    return rng.choice(templates.get(key) or templates["default"])
