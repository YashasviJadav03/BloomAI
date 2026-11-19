"""Safety filter for AI-generated and child-supplied text.

Two public functions:
  validate_message(text, max_chars) -> str | None
      Returns the text unchanged if it passes every check, otherwise None.
      Callers must fall back to a template on None.

  sanitize_child_text(text, max_len) -> str
      Strips dangerous characters, collapses whitespace, truncates.
      Always returns a safe string (possibly empty).
"""
import re
import unicodedata
from typing import Optional

# ---------------------------------------------------------------------------
# Blocked-word list (matched with word boundaries, case-insensitive)
# ---------------------------------------------------------------------------
_BLOCKED_WORDS = [
    "stupid", "dumb", "lazy", r"(?<!\w)bad(?!\w)", "fail", "failure",
    "punish", "hate", "ugly", "worthless", "hopeless", "terrible",
    "loser", "idiot", "shut up", "naughty", "spoiled", "wrong with you",
]

# Medical / diagnostic terms
_MEDICAL_TERMS = [
    r"adhd", r"diagnos\w*", r"medication", r"medicine", r"(?<!\w)pill\w*",
    r"(?<!\w)dose\b", r"doctor says", r"disorder", r"therapy",
    r"anxiety attack", r"depress\w*",
]

# Personal-info requests
_PERSONAL_INFO = [
    r"your address", r"phone number", r"where do you live", r"what school",
]

# Self-harm / violence
_SELF_HARM = [
    r"hurt (?:my|your)self", r"kill (?:my|your)self",
    r"want to disappear", r"hate (?:my|your)self",
    r"end (?:my|your) life", r"harm (?:my|your)self",
    r"suicide", r"self.harm",
]

# Compile once
def _compile(patterns: list) -> re.Pattern:
    combined = "|".join(f"(?:{p})" for p in patterns)
    return re.compile(combined, re.IGNORECASE)


_RE_BLOCKED = _compile(_BLOCKED_WORDS)
_RE_MEDICAL = _compile(_MEDICAL_TERMS)
_RE_PERSONAL = _compile(_PERSONAL_INFO)
_RE_SELF_HARM = _compile(_SELF_HARM)
_RE_URL = re.compile(r"https?://|www\.", re.IGNORECASE)
_RE_MARKDOWN = re.compile(r"[*#`\[\]]|@")
_RE_NEWLINE = re.compile(r"[\n\r]")


def validate_message(text: str, max_chars: int) -> Optional[str]:
    """
    Return *text* unchanged if it passes all checks, or None if it should be rejected.

    Checks (any failure → None):
    - Empty
    - Longer than max_chars
    - Contains a newline
    - More than 2 sentences (heuristic: more than 2 sentence-ending punctuation marks)
    - Contains a URL
    - Contains markdown characters or @
    - Contains a blocked word
    - Contains a medical / diagnostic term
    - Contains a personal-info request
    - Contains self-harm or violence terms
    """
    if not text or not text.strip():
        return None

    t = text.strip()

    if len(t) > max_chars:
        return None

    if _RE_NEWLINE.search(t):
        return None

    # Count sentence-ending punctuation to detect multi-paragraph output
    sentence_ends = len(re.findall(r"[.!?]", t))
    if sentence_ends > 2:
        return None

    if _RE_URL.search(t):
        return None

    if _RE_MARKDOWN.search(t):
        return None

    if _RE_BLOCKED.search(t):
        return None

    if _RE_MEDICAL.search(t):
        return None

    if _RE_PERSONAL.search(t):
        return None

    if _RE_SELF_HARM.search(t):
        return None

    return t


def sanitize_child_text(text: str, max_len: int = 200) -> str:
    """
    Sanitize child-supplied free text before it enters any prompt.

    - Strips NUL and other control characters (keeps spaces, tabs).
    - Removes < and > to prevent tag injection into prompts.
    - Collapses runs of whitespace to a single space.
    - Truncates to max_len characters.
    - Returns a plain string (may be empty).
    """
    if not text:
        return ""

    # Normalize unicode (NFC) then strip control characters except space/tab/newline
    cleaned = ""
    for ch in unicodedata.normalize("NFC", text):
        cat = unicodedata.category(ch)
        # Keep printable chars; skip control chars (Cc) except ordinary space
        if cat.startswith("C") and ch not in (" ", "\t"):
            continue
        cleaned += ch

    # Remove tag-injection characters
    cleaned = cleaned.replace("<", "").replace(">", "")

    # Collapse whitespace
    cleaned = re.sub(r"\s+", " ", cleaned).strip()

    # Truncate
    return cleaned[:max_len]
