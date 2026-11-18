import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schedule import ScheduleModel, TaskModel, StepModel, TemplateModel
from backend.app.schemas.schedule import (
    ScheduleResponse, ScheduleSummary, ScheduleCreate, ScheduleUpdate,
    TaskCreate, TaskUpdate, TaskResponse, ReorderTasksRequest,
    StepCreate, StepUpdate, StepResponse
)

router = APIRouter(prefix="/api", tags=["Schedules & Tasks"])

# ----------------- Schedules -----------------

@router.get("/schedules", response_model=List[ScheduleResponse])
def list_schedules(db: Session = Depends(get_db)):
    return db.query(ScheduleModel).all()


@router.post("/schedules", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(payload: ScheduleCreate, db: Session = Depends(get_db)):
    # 1. Create from template if template_id is specified
    if payload.template_id:
        tpl = db.query(TemplateModel).filter(
            TemplateModel.id == payload.template_id,
            TemplateModel.type == "schedule"
        ).first()
        if not tpl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Schedule template with ID {payload.template_id} not found"
            )
        try:
            tpl_data = json.loads(tpl.data)
        except Exception:
            tpl_data = {}

        sched = ScheduleModel(
            name=payload.name or tpl.name,
            color=payload.color or tpl.color,
            icon=payload.icon or tpl.icon
        )
        db.add(sched)
        db.flush()

        for t_idx, t_data in enumerate(tpl_data.get("tasks", []), start=1):
            task = TaskModel(
                schedule_id=sched.id,
                title=t_data["title"],
                icon=t_data.get("icon", "star"),
                order=t_data.get("order", t_idx),
                expected_seconds=t_data.get("expected_seconds", 120)
            )
            db.add(task)
            db.flush()

            for s_idx, s_data in enumerate(t_data.get("steps", []), start=1):
                step = StepModel(
                    task_id=task.id,
                    text=s_data["text"],
                    icon=s_data.get("icon", "check"),
                    order=s_data.get("order", s_idx)
                )
                db.add(step)

        db.commit()
        db.refresh(sched)
        return sched

    # 2. Create blank schedule
    if not payload.name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Schedule name is required when not using a template"
        )
    sched = ScheduleModel(
        name=payload.name,
        color=payload.color or "#F4A261",
        icon=payload.icon or "sun"
    )
    db.add(sched)
    db.commit()
    db.refresh(sched)
    return sched


@router.get("/schedules/{id}", response_model=ScheduleResponse)
def get_schedule(id: int, db: Session = Depends(get_db)):
    sched = db.query(ScheduleModel).filter(ScheduleModel.id == id).first()
    if not sched:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule {id} not found"
        )
    return sched


@router.put("/schedules/{id}", response_model=ScheduleResponse)
def update_schedule(id: int, payload: ScheduleUpdate, db: Session = Depends(get_db)):
    sched = db.query(ScheduleModel).filter(ScheduleModel.id == id).first()
    if not sched:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Schedule {id} not found")
    if payload.name is not None:
        sched.name = payload.name
    if payload.color is not None:
        sched.color = payload.color
    if payload.icon is not None:
        sched.icon = payload.icon
    db.commit()
    db.refresh(sched)
    return sched


@router.delete("/schedules/{id}")
def delete_schedule(id: int, db: Session = Depends(get_db)):
    sched = db.query(ScheduleModel).filter(ScheduleModel.id == id).first()
    if not sched:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Schedule {id} not found")
    db.delete(sched)
    db.commit()
    return {"message": f"Schedule {id} deleted successfully"}


# ----------------- Tasks -----------------

@router.post("/schedules/{id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def add_task(id: int, payload: TaskCreate, db: Session = Depends(get_db)):
    sched = db.query(ScheduleModel).filter(ScheduleModel.id == id).first()
    if not sched:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Schedule {id} not found")
    
    # Auto-calculate order if not set or 1
    max_order = max([t.order for t in sched.tasks], default=0)
    order = payload.order if payload.order > 1 else max_order + 1

    task = TaskModel(
        schedule_id=id,
        title=payload.title,
        icon=payload.icon,
        order=order,
        expected_seconds=payload.expected_seconds
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/tasks/{id}", response_model=TaskResponse)
def update_task(id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {id} not found")
    if payload.title is not None:
        task.title = payload.title
    if payload.icon is not None:
        task.icon = payload.icon
    if payload.order is not None:
        task.order = payload.order
    if payload.expected_seconds is not None:
        task.expected_seconds = payload.expected_seconds
    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{id}")
def delete_task(id: int, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {id} not found")
    db.delete(task)
    db.commit()
    return {"message": f"Task {id} deleted successfully"}


@router.put("/schedules/{id}/tasks/reorder", response_model=ScheduleResponse)
def reorder_tasks(id: int, payload: ReorderTasksRequest, db: Session = Depends(get_db)):
    sched = db.query(ScheduleModel).filter(ScheduleModel.id == id).first()
    if not sched:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Schedule {id} not found")
    
    task_map = {t.id: t for t in sched.tasks}
    for order_idx, task_id in enumerate(payload.ordered_task_ids, start=1):
        if task_id in task_map:
            task_map[task_id].order = order_idx
    db.commit()
    db.refresh(sched)
    return sched


# ----------------- Steps -----------------

@router.post("/tasks/{id}/steps", response_model=StepResponse, status_code=status.HTTP_201_CREATED)
def add_step(id: int, payload: StepCreate, db: Session = Depends(get_db)):
    task = db.query(TaskModel).filter(TaskModel.id == id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Task {id} not found")
    
    max_order = max([s.order for s in task.steps], default=0)
    order = payload.order if payload.order > 1 else max_order + 1

    step = StepModel(
        task_id=id,
        text=payload.text,
        icon=payload.icon,
        order=order
    )
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


@router.put("/steps/{id}", response_model=StepResponse)
def update_step(id: int, payload: StepUpdate, db: Session = Depends(get_db)):
    step = db.query(StepModel).filter(StepModel.id == id).first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Step {id} not found")
    if payload.text is not None:
        step.text = payload.text
    if payload.icon is not None:
        step.icon = payload.icon
    if payload.order is not None:
        step.order = payload.order
    db.commit()
    db.refresh(step)
    return step


@router.delete("/steps/{id}")
def delete_step(id: int, db: Session = Depends(get_db)):
    step = db.query(StepModel).filter(StepModel.id == id).first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Step {id} not found")
    db.delete(step)
    db.commit()
    return {"message": f"Step {id} deleted successfully"}
