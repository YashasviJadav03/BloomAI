"""Output checks applied to every child-facing AI message (see docs/ai-rules.md).

`check_message` returns (ok, reason). A message that fails is never shown; the
caller falls back to a template instead.
"""
import re
from typing import Optional, Tuple

MAX_MESSAGE_CHARS = 160
MAX_EXCLAMATIONS = 1

# Rule 3: shaming labels and threats. Matched as whole words, case-insensitive.
BLOCKED_WORDS = {
    "stupid", "dumb", "lazy", "bad", "naughty", "useless", "worthless", "loser",
    "hopeless", "pathetic", "terrible", "awful", "ugly", "idiot", "silly", "fail",
    "failed", "failure", "failing", "disappointing", "disappointed", "shame",
    "ashamed", "embarrassing", "punish", "punished", "punishment", "hate", "hated",
    "kill", "die", "dead", "hurt", "wrong", "mistake", "mistakes", "weird",
    "careless", "messy", "annoying",
}

# Rule 3: blame patterns that are shaming even with innocent words.
BLOCKED_PHRASES = (
    "you should have", "should've", "why didn't you", "why did not you", "you always",
    "you never", "try harder", "not good enough", "you can't", "you cannot",
    "in trouble", "take away", "or else", "last chance", "better than you",
    "like other kids", "other children", "grow up", "big kids don't", "stop crying",
    "calm down",  # tells instead of helps; we invite ("let's take a breath") instead
)

# Rule 4: medical, diagnostic or therapeutic language.
MEDICAL_TERMS = (
    "adhd", "autism", "autistic", "asd", "disorder", "diagnos", "symptom",
    "medication", "medicine", "meds", "pill", "doctor", "therapist", "therapy",
    "psychiatr", "psycholog", "depress", "anxiety disorder", "mental illness",
    "condition", "treatment", "dyslexi", "ocd", "bipolar", "clinical",
)

_URL_RE = re.compile(r"(https?://|www\.|\.(com|org|net|io|uk|in|au)\b)", re.IGNORECASE)
_EMAIL_RE = re.compile(r"\S+@\S+")
_PHONE_RE = re.compile(r"\d[\d\s\-().]{5,}\d")
_ALLCAPS_RE = re.compile(r"\b[A-Z]{3,}\b")
_WORD_RE = re.compile(r"[a-z']+")


def normalize(text: Optional[str]) -> str:
    """Collapse whitespace and strip wrapping quotes the LLM sometimes adds."""
    if not text:
        return ""
    text = " ".join(text.split())
    if len(text) >= 2 and text[0] == text[-1] and text[0] in "\"'":
        text = text[1:-1].strip()
    return text


def check_message(text: Optional[str]) -> Tuple[bool, str]:
    msg = normalize(text)
    if not msg:
        return False, "empty"
    if len(msg) > MAX_MESSAGE_CHARS:
        return False, f"too_long:{len(msg)}"
    if "{" in msg or "}" in msg:
        return False, "unfilled_placeholder"
    if msg.count("!") > MAX_EXCLAMATIONS:
        return False, "too_many_exclamations"
    if _URL_RE.search(msg) or _EMAIL_RE.search(msg):
        return False, "link_or_email"
    if _PHONE_RE.search(msg):
        return False, "phone_number"

    lower = msg.lower().replace("’", "'")
    words = set(_WORD_RE.findall(lower))
    blocked = words & BLOCKED_WORDS
    if blocked:
        return False, f"blocked_word:{sorted(blocked)[0]}"
    for phrase in BLOCKED_PHRASES:
        if phrase in lower:
            return False, f"blocked_phrase:{phrase}"
    for term in MEDICAL_TERMS:
        # Short acronyms must be whole words; longer stems may prefix-match (diagnos -> diagnosis).
        if len(term) <= 4:
            if term in words:
                return False, f"medical:{term}"
        elif re.search(r"\b" + re.escape(term), lower):
            return False, f"medical:{term}"
    if _ALLCAPS_RE.search(msg):
        return False, "all_caps"
    return True, "ok"


def is_safe(text: Optional[str]) -> bool:
    return check_message(text)[0]
