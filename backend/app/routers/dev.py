from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.seed.demo_data import seed_demo_environment
from backend.seed.seed_db import seed_database

router = APIRouter(prefix="/api/dev", tags=["Developer Tools & Demo"])

@router.post("/seed-demo")
def seed_demo(db: Session = Depends(get_db)):
    result = seed_demo_environment(db)
    return result

@router.post("/reset")
def reset_database(db: Session = Depends(get_db)):
    seed_database(db=db, reset=True)
    return {"message": "Database reset to initial template state"}
