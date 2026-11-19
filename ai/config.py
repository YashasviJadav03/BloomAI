"""AI module configuration — read from environment variables.

Automatically loads backend/.env if it exists (no hard python-dotenv dependency).
Shell-set variables always take precedence over the .env file.

Variables:
  GEMINI_API_KEY      — Google Gemini API key. If empty, LLM is disabled (templates used).
  AI_MODEL            — Gemini model ID (default: gemini-2.0-flash)
  AI_TIMEOUT_SECONDS  — Per-request timeout in seconds (default: 4)
  AI_MAX_CHARS        — Maximum characters in a validated AI message (default: 240)
  AI_ENABLED          — Set to "false" to force template-only mode (default: true)
"""
import os
from pathlib import Path


def _load_dotenv() -> None:
    """
    Minimal .env loader — no external dependency.
    Reads backend/.env (relative to repo root) and sets missing env vars.
    Shell-set variables always take precedence.
    Skips blank lines and comments (#).
    """
    here = Path(__file__).resolve().parent      # ai/
    repo_root = here.parent                      # BloomAI/
    env_path = repo_root / "backend" / ".env"

    if not env_path.exists():
        return

    try:
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value
    except Exception:
        pass  # Never break startup over a missing or malformed .env


_load_dotenv()

GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
AI_MODEL: str = os.getenv("AI_MODEL", "gemini-2.0-flash")
AI_TIMEOUT_SECONDS: float = float(os.getenv("AI_TIMEOUT_SECONDS", "4"))
AI_MAX_CHARS: int = int(os.getenv("AI_MAX_CHARS", "240"))
_AI_ENABLED_RAW: str = os.getenv("AI_ENABLED", "true").strip().lower()
AI_ENABLED: bool = _AI_ENABLED_RAW not in ("false", "0", "no")


def llm_available() -> bool:
    """Returns True only when a Gemini key is present and AI_ENABLED is not False."""
    return AI_ENABLED and bool(GEMINI_API_KEY)
