import json
from pathlib import Path
from fastapi import APIRouter
from backend.app.schemas.safety import SafetyResourcesResponse

router = APIRouter(prefix="/api/safety", tags=["Safety"])

CONFIG_FILE = Path(__file__).resolve().parent.parent / "safety" / "helplines.json"

@router.get("/resources", response_model=SafetyResourcesResponse)
def get_safety_resources():
    default_response = {
        "message": "It sounds like today is hard. Please talk to a trusted adult.",
        "resources": [
            {"name": "Childline (UK)", "contact": "0800 1111 (Free 24/7)"},
            {"name": "Crisis Text Line", "contact": "Text HOME to 741741"}
        ]
    }
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default_response
    return default_response
