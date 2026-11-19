"""Thin wrapper around the Google Gemini SDK (google-genai).

Design rules:
- Import the SDK lazily so the app starts even without the package installed.
- Never raise to callers — any failure returns None.
- Never log the API key or any child text.
- System prompt is passed via GenerateContentConfig.system_instruction.
"""
import logging
from typing import Optional

from ai.config import GEMINI_API_KEY, AI_MODEL, AI_TIMEOUT_SECONDS

logger = logging.getLogger(__name__)


def complete(system: str, user: str) -> Optional[str]:
    """Call the Gemini API and return the generated text, or None on any failure."""
    if not GEMINI_API_KEY:
        logger.debug("LLM skipped: no GEMINI_API_KEY configured.")
        return None

    try:
        import google.genai as genai          # lazy import — optional dependency
        from google.genai import types
    except ImportError:
        logger.warning("LLM skipped: 'google-genai' package not installed. "
                       "Run: pip install google-genai")
        return None

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.7,
            max_output_tokens=120,
        )

        response = client.models.generate_content(
            model=AI_MODEL,
            contents=user,
            config=config,
        )

        # Extract text from response
        text = response.text
        if not text or not text.strip():
            logger.warning("Gemini returned blank text.")
            return None
        return text.strip()

    except Exception as exc:
        # Log type and a short message only — never log the key or child text
        logger.warning("LLM request failed: %s: %s", type(exc).__name__, str(exc)[:200])
        return None
