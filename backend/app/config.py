import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Database configuration (defaults to SQLite in backend directory)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'bloom.db'}")

# CORS allowed origins for React Frontend (Vite on 5173, etc.)
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"  # Prototype open CORS
]

# App Metadata
APP_NAME = "BloomAI Prototype Backend"
APP_VERSION = "0.1.0"
