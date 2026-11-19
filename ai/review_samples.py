#!/usr/bin/env python3
"""Generate ~30 sample praise and calm messages for tone-and-safety review.

Usage:
    python ai/review_samples.py

With ANTHROPIC_API_KEY set, some messages will come from the LLM.
Without a key, all messages come from templates.

Output format:
    [PASS] <source>  <message>
    [REJECT] <source>  <message>   (reason: ...)
"""
import sys
import os

# Allow running from repo root: python ai/review_samples.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.llm_service import generate_praise, generate_calm_reply
from ai.safety_filter import validate_message
from ai.config import AI_MAX_CHARS, llm_available

PRAISE_CASES = [
    {"event": "step_completed", "child_name": "Aarav",   "task_title": "Homework",        "step_text": "Write the date",          "streak": 1},
    {"event": "step_completed", "child_name": "Zara",    "task_title": "Morning Routine",  "step_text": "Brush teeth",             "streak": 2},
    {"event": "step_completed", "child_name": "Leo",     "task_title": "Reading",          "step_text": "Read one page",           "streak": 1},
    {"event": "task_completed", "child_name": "Aarav",   "task_title": "Pack school bag",  "step_text": "",                        "streak": 3},
    {"event": "task_completed", "child_name": "Mia",     "task_title": "Tidy desk",        "step_text": "",                        "streak": 1},
    {"event": "task_completed", "child_name": "Sam",     "task_title": "Evening wind-down","step_text": "",                        "streak": 5},
    {"event": "streak",         "child_name": "Aarav",   "task_title": "Daily routine",    "step_text": "",                        "streak": 7},
    {"event": "streak",         "child_name": "Priya",   "task_title": "Exercise",         "step_text": "",                        "streak": 3},
    {"event": "step_completed", "child_name": "Friend",  "task_title": "Science project",  "step_text": "Glue the picture",        "streak": 1},
    {"event": "step_completed", "child_name": "Kai",     "task_title": "Spelling",         "step_text": "Write 5 words",           "streak": 4},
]

CALM_CASES = [
    {"child_name": "Aarav",  "emoji": "angry",   "text": "I hate this homework",     "focus_score": 30, "emotion_score": 20},
    {"child_name": "Zara",   "emoji": "worried",  "text": "I'm scared of the test",   "focus_score": 45, "emotion_score": 30},
    {"child_name": "Leo",    "emoji": "tired",    "text": "I am really tired",        "focus_score": 25, "emotion_score": 50},
    {"child_name": "Mia",    "emoji": "sad",      "text": "My friend was mean to me", "focus_score": 40, "emotion_score": 25},
    {"child_name": "Sam",    "emoji": "calm",     "text": "I feel okay today",        "focus_score": 70, "emotion_score": 70},
    {"child_name": "Priya",  "emoji": "happy",    "text": "I did my homework!",       "focus_score": 80, "emotion_score": 85},
    {"child_name": "Friend", "emoji": "angry",    "text": "This is too hard",         "focus_score": 35, "emotion_score": 30},
    {"child_name": "Kai",    "emoji": "worried",  "text": "",                         "focus_score": 50, "emotion_score": 40},
    {"child_name": "Aarav",  "emoji": "tired",    "text": "I can't focus",            "focus_score": 20, "emotion_score": 55},
    {"child_name": "Zara",   "emoji": "sad",      "text": "I miss my dog",            "focus_score": 50, "emotion_score": 35},
]


def _verdict(message: str, max_chars: int) -> tuple:
    """Returns (verdict_str, reason_str)."""
    result = validate_message(message, max_chars)
    if result is None:
        return "REJECT", "failed safety filter"
    return "PASS", ""


def main():
    print("=" * 70)
    print("BloomAI — Sample Message Review")
    print(f"Mode: {'LLM + templates' if llm_available() else 'templates only (no API key)'}")
    print("=" * 70)

    print("\n── PRAISE SAMPLES ─────────────────────────────────────────────────")
    for i, case in enumerate(PRAISE_CASES, 1):
        result = generate_praise(**case)
        verdict, reason = _verdict(result["message"], AI_MAX_CHARS)
        tag = f"[{verdict}]"
        src = f"({result['source']})"
        suffix = f"  ← {reason}" if reason else ""
        print(f"{i:>2}. {tag:<8} {src:<12} {result['message']}{suffix}")

    print("\n── CALM REPLY SAMPLES ─────────────────────────────────────────────")
    for i, case in enumerate(CALM_CASES, 1):
        result = generate_calm_reply(**case)
        verdict, reason = _verdict(result["message"], AI_MAX_CHARS)
        tag = f"[{verdict}]"
        src = f"({result['source']})"
        activity = f"[{result['suggested_activity']}]"
        suffix = f"  ← {reason}" if reason else ""
        print(f"{i:>2}. {tag:<8} {src:<12} {activity:<14} {result['message']}{suffix}")

    print("\n" + "=" * 70)
    print("Review complete. All [REJECT] lines indicate a safety filter hit.")
    print("=" * 70)


if __name__ == "__main__":
    main()
