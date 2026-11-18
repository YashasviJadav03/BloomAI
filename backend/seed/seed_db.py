import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal, Base
from backend.app.models.profile import ProfileModel, UserStatsModel
from backend.app.models.schedule import TemplateModel, ScheduleModel, TaskModel, StepModel
from backend.app.models.checklist import ChecklistModel, ChecklistItemModel
from backend.seed.presets import SCHEDULE_TEMPLATES, CHECKLIST_TEMPLATES

def seed_database(db: Session = None, reset: bool = False):
    close_at_end = False
    if db is None:
        db = SessionLocal()
        close_at_end = True

    bind_engine = db.get_bind()

    try:
        if reset:
            Base.metadata.drop_all(bind=bind_engine)
            Base.metadata.create_all(bind=bind_engine)
        else:
            Base.metadata.create_all(bind=bind_engine)

        # 1. Seed Templates
        if db.query(TemplateModel).count() == 0:
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

        # 2. Seed Default Child Profile
        profile = db.query(ProfileModel).filter(ProfileModel.id == 1).first()
        if not profile:
            profile = ProfileModel(
                id=1,
                name="Aarav",
                avatar="star",
                favourite_rewards=json.dumps(["Extra playground time", "Lego build break"])
            )
            db.add(profile)
            db.commit()

        # 3. Seed User Stats
        stats = db.query(UserStatsModel).filter(UserStatsModel.id == 1).first()
        if not stats:
            stats = UserStatsModel(
                id=1,
                total_points=0,
                current_streak=0,
                best_streak=0,
                last_active_date=None
            )
            db.add(stats)
            db.commit()

        # 4. If no schedules exist, instantiate Morning Routine from template
        if db.query(ScheduleModel).count() == 0:
            morning = SCHEDULE_TEMPLATES[0]
            sched = ScheduleModel(
                name=morning["name"],
                color=morning["color"],
                icon=morning["icon"]
            )
            db.add(sched)
            db.flush()

            for t_idx, task_data in enumerate(morning["data"]["tasks"], start=1):
                task = TaskModel(
                    schedule_id=sched.id,
                    title=task_data["title"],
                    icon=task_data["icon"],
                    order=task_data.get("order", t_idx),
                    expected_seconds=task_data.get("expected_seconds", 120)
                )
                db.add(task)
                db.flush()

                for s_idx, step_data in enumerate(task_data["steps"], start=1):
                    step = StepModel(
                        task_id=task.id,
                        text=step_data["text"],
                        icon=step_data["icon"],
                        order=step_data.get("order", s_idx)
                    )
                    db.add(step)
            db.commit()

        # 5. If no checklists exist, instantiate School Bag checklist
        if db.query(ChecklistModel).count() == 0:
            bag = CHECKLIST_TEMPLATES[0]
            chk = ChecklistModel(
                name=bag["name"],
                reminder_time=bag["data"].get("reminder_time", "07:45")
            )
            db.add(chk)
            db.flush()

            for i_idx, item_data in enumerate(bag["data"]["items"], start=1):
                item = ChecklistItemModel(
                    checklist_id=chk.id,
                    text=item_data["text"],
                    icon=item_data["icon"],
                    is_checked=False,
                    order=item_data.get("order", i_idx)
                )
                db.add(item)
            db.commit()

    finally:
        if close_at_end:
            db.close()

if __name__ == "__main__":
    print("Seeding BloomAI Database...")
    seed_database()
    print("Database seeded successfully!")
