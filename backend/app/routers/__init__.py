from backend.app.routers.health import router as health_router
from backend.app.routers.profile import router as profile_router
from backend.app.routers.templates import router as templates_router
from backend.app.routers.schedules import router as schedules_router
from backend.app.routers.checklists import router as checklists_router
from backend.app.routers.sessions import router as sessions_router
from backend.app.routers.checkins import router as checkins_router
from backend.app.routers.safety import router as safety_router
from backend.app.routers.progress import router as progress_router
from backend.app.routers.ai import router as ai_router
from backend.app.routers.dev import router as dev_router
from backend.app.routers.caregiver import router as caregiver_router

__all__ = [
    "health_router",
    "profile_router",
    "templates_router",
    "schedules_router",
    "checklists_router",
    "sessions_router",
    "checkins_router",
    "safety_router",
    "progress_router",
    "ai_router",
    "dev_router",
    "caregiver_router"
]
