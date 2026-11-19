from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.checkin import CheckInModel, CaregiverAlertModel
from backend.app.models.session import SessionModel
from backend.app.schemas.checkin import CheckInCreate, CheckInResponse
from backend.app.scoring.formula import compute_scores_and_label, calculate_emotion_score
from backend.app.safety.distress_detector import evaluate_distress

router = APIRouter(prefix="/api/checkins", tags=["Check-ins & Scoring"])

@router.post("", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
def submit_checkin(payload: CheckInCreate, db: Session = Depends(get_db)):
    duration_seconds = None
    expected_seconds = None

    if payload.session_id:
        session = db.query(SessionModel).filter(SessionModel.id == payload.session_id).first()
        if session:
            duration_seconds = session.duration_seconds
            expected_seconds = session.expected_seconds
            if duration_seconds is None and session.started_at:
                duration_seconds = int((datetime.utcnow() - session.started_at).total_seconds())

    # 1. Compute preliminary emotion score for distress detector
    prelim_emotion = calculate_emotion_score(payload.emoji, payload.text, payload.audio_features)
    safe_mode = evaluate_distress(payload.text, prelim_emotion)

    # 2. Compute full scoring and state label (incorporating audio & on-device video fidget features)
    focus_score, emotion_score, label = compute_scores_and_label(
        emoji=payload.emoji,
        text=payload.text,
        audio=payload.audio_features,
        video=payload.video_features,
        duration_seconds=duration_seconds,
        expected_seconds=expected_seconds,
        safe_mode=safe_mode
    )

    if safe_mode:
        label = "distressed"

    # 3. Save extracted features to database (never store raw audio or raw video)
    checkin = CheckInModel(
        session_id=payload.session_id,
        emoji=payload.emoji,
        text=payload.text,
        avg_volume=payload.audio_features.avg_volume if payload.audio_features else None,
        peak_volume=payload.audio_features.peak_volume if payload.audio_features else None,
        words_per_minute=payload.audio_features.words_per_minute if payload.audio_features else None,
        audio_duration_seconds=payload.audio_features.duration_seconds if payload.audio_features else None,
        fidget_score=payload.video_features.fidget_score if payload.video_features else None,
        face_present=payload.video_features.face_present if payload.video_features else True,
        focus_score=focus_score,
        emotion_score=emotion_score,
        label=label,
        safe_mode=safe_mode,
        created_at=datetime.utcnow()
    )
    db.add(checkin)
    db.flush()

    # 4. If distress is triggered, alert the caregiver by logging a CaregiverAlert
    if safe_mode:
        alert = CaregiverAlertModel(
            checkin_id=checkin.id,
            trigger_text=payload.text,
            emotion_score=emotion_score,
            is_acknowledged=False,
            created_at=datetime.utcnow()
        )
        db.add(alert)

    db.commit()
    db.refresh(checkin)

    return CheckInResponse(
        id=checkin.id,
        focus_score=checkin.focus_score,
        emotion_score=checkin.emotion_score,
        label=checkin.label,
        safe_mode=checkin.safe_mode,
        created_at=checkin.created_at
    )


@router.get("", response_model=List[CheckInResponse])
def get_recent_checkins(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    since_date = datetime.utcnow() - timedelta(days=days)
    records = db.query(CheckInModel).filter(
        CheckInModel.created_at >= since_date
    ).order_by(CheckInModel.created_at.desc()).all()
    return records
