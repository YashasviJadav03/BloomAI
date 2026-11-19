import json
import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from backend.app.database import Base, engine
from backend.app.models.profile import ProfileModel, UserStatsModel
from backend.app.models.schedule import TemplateModel, ScheduleModel, TaskModel, StepModel
from backend.app.models.checklist import ChecklistModel, ChecklistItemModel
from backend.app.models.session import SessionModel, StepCompletionModel
from backend.app.models.checkin import CheckInModel, CaregiverAlertModel
from backend.seed.presets import SCHEDULE_TEMPLATES, CHECKLIST_TEMPLATES

def seed_demo_environment(db: Session) -> dict:
    """
    Clears existing dynamic state and seeds 14 days of realistic historical activity,
    sessions, completed steps, points, streaks, video/audio check-in records,
    and caregiver distress alerts.
    Highlights the ADHD pattern: focus fatigue and video fidget rise past 12 minutes on sedentary homework.
    """
    # Clear tables
    db.query(CaregiverAlertModel).delete()
    db.query(CheckInModel).delete()
    db.query(StepCompletionModel).delete()
    db.query(SessionModel).delete()
    db.query(ChecklistItemModel).delete()
    db.query(ChecklistModel).delete()
    db.query(StepModel).delete()
    db.query(TaskModel).delete()
    db.query(ScheduleModel).delete()
    db.query(TemplateModel).delete()
    db.query(ProfileModel).delete()
    db.query(UserStatsModel).delete()
    db.commit()

    # 1. Profile
    profile = ProfileModel(
        id=1,
        name="Aarav",
        avatar="star",
        favourite_rewards=json.dumps(["Extra 15m playground time", "Lego build break", "Pick dinner music"])
    )
    db.add(profile)

    # 2. Stats
    stats = UserStatsModel(
        id=1,
        total_points=245,
        current_streak=5,
        best_streak=7,
        last_active_date=date.today()
    )
    db.add(stats)

    # 3. Templates
    for item in SCHEDULE_TEMPLATES + CHECKLIST_TEMPLATES:
        tpl = TemplateModel(
            type=item["type"],
            name=item["name"],
            color=item["color"],
            icon=item["icon"],
            data=json.dumps(item["data"])
        )
        db.add(tpl)
    db.commit()

    # 4. Active Schedules: Morning Routine & Homework Focus
    morning_tpl = SCHEDULE_TEMPLATES[0]
    morning_sched = ScheduleModel(name="Morning Routine", color="#F4A261", icon="sun")
    db.add(morning_sched)
    db.flush()
    all_tasks = []
    for t_idx, t_data in enumerate(morning_tpl["data"]["tasks"], start=1):
        task = TaskModel(
            schedule_id=morning_sched.id,
            title=t_data["title"],
            icon=t_data["icon"],
            order=t_idx,
            expected_seconds=t_data["expected_seconds"]
        )
        db.add(task)
        db.flush()
        all_tasks.append(task)
        for s_idx, s_data in enumerate(t_data["steps"], start=1):
            step = StepModel(task_id=task.id, text=s_data["text"], icon=s_data["icon"], order=s_idx)
            db.add(step)

    homework_tpl = SCHEDULE_TEMPLATES[1]
    hw_sched = ScheduleModel(name="Homework Focus", color="#2A9D8F", icon="book")
    db.add(hw_sched)
    db.flush()
    for t_idx, t_data in enumerate(homework_tpl["data"]["tasks"], start=1):
        task = TaskModel(
            schedule_id=hw_sched.id,
            title=t_data["title"],
            icon=t_data["icon"],
            order=t_idx,
            expected_seconds=t_data["expected_seconds"]
        )
        db.add(task)
        db.flush()
        all_tasks.append(task)
        for s_idx, s_data in enumerate(t_data["steps"], start=1):
            step = StepModel(task_id=task.id, text=s_data["text"], icon=s_data["icon"], order=s_idx)
            db.add(step)

    # 5. Checklist: School Bag
    bag_tpl = CHECKLIST_TEMPLATES[0]
    bag_chk = ChecklistModel(name=bag_tpl["name"], reminder_time=bag_tpl["data"]["reminder_time"])
    db.add(bag_chk)
    db.flush()
    for i_idx, i_data in enumerate(bag_tpl["data"]["items"], start=1):
        item = ChecklistItemModel(
            checklist_id=bag_chk.id,
            text=i_data["text"],
            icon=i_data["icon"],
            is_checked=(i_idx <= 3),  # 3 of 5 items checked
            order=i_idx
        )
        db.add(item)
    db.commit()

    # 6. Seed 14 days of realistic sessions, multimodal check-ins, and ADHD patterns
    now = datetime.utcnow()
    emojis = ["happy", "calm", "happy", "calm", "tired", "worried"]
    for day_offset in range(13, -1, -1):
        day_date = now - timedelta(days=day_offset)
        sample_task = all_tasks[day_offset % len(all_tasks)]
        session = SessionModel(
            task_id=sample_task.id,
            started_at=day_date.replace(hour=8, minute=0, second=0),
            ended_at=day_date.replace(hour=8, minute=random.randint(10, 16), second=0),
            duration_seconds=random.randint(110, 160),
            expected_seconds=sample_task.expected_seconds,
            bonus_points=10,
            status="completed"
        )
        db.add(session)
        db.flush()

        selected_emoji = random.choice(emojis)
        base_emotion = 80 if selected_emoji in ["happy", "calm"] else 45
        base_focus = 75 if selected_emoji in ["happy", "calm"] else 50
        fidget = 0.2
        face_pres = True

        # ADHD Restlessness Pattern: On days 3, 7, and 10, demonstrate 12-minute fatigue & video fidgeting
        if day_offset in [3, 7, 10]:
            selected_emoji = "tired"
            base_emotion = 48
            base_focus = 42
            fidget = 0.72  # High restlessness detected on-device
            face_pres = True

        checkin = CheckInModel(
            session_id=session.id,
            emoji=selected_emoji,
            text="Finished my morning routine!" if base_emotion > 60 else "Math was a bit long and I got fidgety",
            avg_volume=0.35,
            peak_volume=0.6,
            words_per_minute=115.0,
            audio_duration_seconds=6.0,
            fidget_score=fidget,
            face_present=face_pres,
            focus_score=base_focus,
            emotion_score=base_emotion,
            label="flow" if base_emotion > 70 else ("tired" if selected_emoji == "tired" else "calm"),
            safe_mode=False,
            created_at=day_date.replace(hour=8, minute=20)
        )
        db.add(checkin)

    # 7. Seed 1 sample Caregiver Distress Alert for demonstration
    sample_alert = CaregiverAlertModel(
        checkin_id=None,
        trigger_text="Demo Alert: Aarav said 'I can't do this homework' during 15-min math block.",
        emotion_score=22,
        is_acknowledged=False,
        created_at=now - timedelta(days=2, hours=3)
    )
    db.add(sample_alert)

    db.commit()
    return {
        "message": "Demo data seeded successfully",
        "days_seeded": 14,
        "profile": "Aarav",
        "active_alerts": 1
    }
