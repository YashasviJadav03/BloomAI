"""Thin, failure-tolerant wrapper around the Claude API (Anthropic Python SDK).

Every failure returns None so the caller can use a template. Nothing here logs
the child's text or name.

Environment variables:
    ANTHROPIC_API_KEY          Read by the SDK. With no credential, the LLM stays off.
    BLOOM_LLM_ENABLED          auto (default) | 1 | 0. "auto" turns the LLM on only when
                               ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN is set.
    BLOOM_LLM_MODEL            Default claude-opus-5-5.
    BLOOM_LLM_EFFORT           Default low (short replies need little reasoning).
    BLOOM_LLM_TIMEOUT_SECONDS  Default 4. Hard limit per call; no retries.
"""
import json
import logging
import os
from typing import Any, Dict, Optional

logger = logging.getLogger("bloomai.ai")

DEFAULT_MODEL = "claude-opus-5-5"
DEFAULT_EFFORT = "low"
DEFAULT_TIMEOUT_SECONDS = 4.0
# Thinking tokens count toward max_tokens; the visible reply is ~40 tokens.
MAX_TOKENS = 2048
FALLBACK_BETA = "server-side-fallback-2026-07-01"

try:  # The SDK is optional: without it, BloomAI runs on templates only.
    import anthropic
except ImportError:  # pragma: no cover - exercised only when the package is absent
    anthropic = None  # type: ignore[assignment]

_client = None


def llm_enabled() -> bool:
    flag = os.getenv("BLOOM_LLM_ENABLED", "auto").strip().lower()
    if flag in ("0", "false", "off", "no"):
        return False
    if anthropic is None:
        return False
    if flag in ("1", "true", "on", "yes"):
        return True
    return bool(os.getenv("ANTHROPIC_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN"))


def _timeout() -> float:
    try:
        return max(0.5, float(os.getenv("BLOOM_LLM_TIMEOUT_SECONDS", DEFAULT_TIMEOUT_SECONDS)))
    except ValueError:
        return DEFAULT_TIMEOUT_SECONDS


def get_client():
    """Lazily build one shared client. Tests replace this function with a fake."""
    global _client
    if _client is None:
        _client = anthropic.Anthropic(timeout=_timeout(), max_retries=0)
    return _client


def generate_json(system: str, user: str, schema: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Ask Claude for one JSON object matching `schema`. Returns None on any failure."""
    if not llm_enabled():
        return None
    try:
        response = get_client().beta.messages.create(
            model=os.getenv("BLOOM_LLM_MODEL", DEFAULT_MODEL),
            max_tokens=MAX_TOKENS,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_config={
                "effort": os.getenv("BLOOM_LLM_EFFORT", DEFAULT_EFFORT),
                "format": {"type": "json_schema", "schema": schema},
            },
            # On a safety decline, the API retries on a fallback model inside the same call.
            betas=[FALLBACK_BETA],
            fallbacks="default",
        )
    except Exception as exc:  # noqa: BLE001 - any failure must degrade to a template
        _log_failure(exc)
        return None

    if response.stop_reason != "end_turn":
        logger.info("LLM reply discarded: stop_reason=%s", response.stop_reason)
        return None
    text = next((b.text for b in response.content if getattr(b, "type", None) == "text"), None)
    if not text:
        logger.info("LLM reply discarded: no text block")
        return None
    try:
        data = json.loads(text)
    except ValueError:
        logger.info("LLM reply discarded: invalid JSON")
        return None
    return data if isinstance(data, dict) else None


def _log_failure(exc: Exception) -> None:
    if anthropic is not None:
        if isinstance(exc, anthropic.APITimeoutError):
            logger.warning("LLM timed out after %.1fs; using template", _timeout())
            return
        if isinstance(exc, anthropic.RateLimitError):
            logger.warning("LLM rate limited; using template")
            return
        if isinstance(exc, anthropic.APIStatusError):
            logger.warning("LLM API error %s (request %s); using template",
                           exc.status_code, getattr(exc, "request_id", None))
            return
        if isinstance(exc, anthropic.APIConnectionError):
            logger.warning("LLM unreachable; using template")
            return
    logger.warning("LLM call failed (%s); using template", type(exc).__name__)
