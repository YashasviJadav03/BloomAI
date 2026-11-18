import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.profile import ProfileModel, UserStatsModel
from backend.app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/api/profile", tags=["Profile"])

def _to_response(profile: ProfileModel) -> ProfileResponse:
    rewards = []
    if profile.favourite_rewards:
        try:
            rewards = json.loads(profile.favourite_rewards)
        except Exception:
            rewards = []
    return ProfileResponse(
        id=profile.id,
        name=profile.name,
        avatar=profile.avatar,
        favourite_rewards=rewards,
        created_at=profile.created_at,
        updated_at=profile.updated_at
    )

@router.get("", response_model=ProfileResponse)
def get_profile(db: Session = Depends(get_db)):
    profile = db.query(ProfileModel).filter(ProfileModel.id == 1).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return _to_response(profile)

@router.post("", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(payload: ProfileCreate, db: Session = Depends(get_db)):
    profile = db.query(ProfileModel).filter(ProfileModel.id == 1).first()
    if not profile:
        profile = ProfileModel(
            id=1,
            name=payload.name,
            avatar=payload.avatar,
            favourite_rewards=json.dumps(payload.favourite_rewards),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(profile)
    else:
        profile.name = payload.name
        profile.avatar = payload.avatar
        profile.favourite_rewards = json.dumps(payload.favourite_rewards)
        profile.updated_at = datetime.utcnow()

    # Ensure user stats also exists
    stats = db.query(UserStatsModel).filter(UserStatsModel.id == 1).first()
    if not stats:
        stats = UserStatsModel(id=1, total_points=0, current_streak=0, best_streak=0)
        db.add(stats)

    db.commit()
    db.refresh(profile)
    return _to_response(profile)

@router.put("", response_model=ProfileResponse)
def update_profile(payload: ProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(ProfileModel).filter(ProfileModel.id == 1).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    profile.name = payload.name
    profile.avatar = payload.avatar
    profile.favourite_rewards = json.dumps(payload.favourite_rewards)
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return _to_response(profile)
