"""BloomAI AI subsystem (Member C): praise and calm-reply generation.

See docs/ai-rules.md for the rules every message must follow.
"""
from backend.app.ai.llm_service import generate_calm_reply, generate_praise

__all__ = ["generate_praise", "generate_calm_reply"]
