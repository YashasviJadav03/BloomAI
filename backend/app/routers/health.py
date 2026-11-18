from fastapi import APIRouter
from backend.app.config import APP_NAME, APP_VERSION

router = APIRouter(prefix="/api", tags=["System"])

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": APP_NAME,
        "version": APP_VERSION
    }
