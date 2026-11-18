import re
from typing import Optional

EXPLICIT_DISTRESS_PATTERNS = [
    r"\bhate myself\b",
    r"\bwant to disappear\b",
    r"\bkill myself\b",
    r"\bhurt myself\b",
    r"\bi am stupid\b",
    r"\bi am dumb\b",
    r"\bi am worthless\b",
    r"\bnobody likes me\b",
    r"\bi want to cry\b",
    r"\bcan't do anything right\b",
    r"\bcant do anything right\b",
    r"\bpunish me\b",
    r"\bhate my life\b",
    r"\bi hate myself\b"
]

SEVERE_FRUSTRATION_PATTERNS = [
    r"\bhate this\b",
    r"\bgive up\b",
    r"\bhate everything\b",
    r"\bcan't do it\b",
    r"\bcant do it\b",
    r"\bleave me alone\b"
]

def evaluate_distress(text: Optional[str], emotion_score: int) -> bool:
    """
    Evaluates whether a child's check-in indicates distress requiring Safe Mode.
    Returns True if safe_mode should be triggered.
    """
    if not text:
        return False
    
    clean_text = text.lower().strip()

    # Rule 1: Explicit distress phrases immediately trip safe_mode
    for pattern in EXPLICIT_DISTRESS_PATTERNS:
        if re.search(pattern, clean_text):
            return True

    # Rule 2: Extremely low emotion score combined with severe frustration
    if emotion_score <= 25:
        for pattern in SEVERE_FRUSTRATION_PATTERNS:
            if re.search(pattern, clean_text):
                return True

    return False
