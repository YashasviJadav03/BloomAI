import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("bloomai.request")
from backend.app.config import APP_NAME, APP_VERSION, CORS_ORIGINS
from backend.app.database import engine, Base
from backend.seed.seed_db import seed_database
from backend.app.routers import (
    health_router,
    profile_router,
    templates_router,
    schedules_router,
    checklists_router,
    sessions_router,
    checkins_router,
    safety_router,
    progress_router,
    ai_router,
    dev_router,
    caregiver_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed default presets if empty
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"[Warning] Auto-seed on startup encountered: {e}")
    yield

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend API service for BloomAI ADHD child assistant & caregiver insights",
    lifespan=lifespan
)

# Configure CORS for Vite / React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log every incoming HTTP request and how long it took."""
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s  ->  %d  (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response

# Register All Routers
app.include_router(health_router)
app.include_router(profile_router)
app.include_router(templates_router)
app.include_router(schedules_router)
app.include_router(checklists_router)
app.include_router(sessions_router)
app.include_router(checkins_router)
app.include_router(safety_router)
app.include_router(progress_router)
app.include_router(ai_router)
app.include_router(dev_router)
app.include_router(caregiver_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
