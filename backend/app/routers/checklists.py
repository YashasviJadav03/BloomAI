import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.checklist import ChecklistModel, ChecklistItemModel
from backend.app.models.schedule import TemplateModel
from backend.app.schemas.checklist import (
    ChecklistResponse, ChecklistCreate, ChecklistUpdate,
    ChecklistItemResponse, ChecklistItemCreate, ChecklistItemUpdate
)

router = APIRouter(prefix="/api", tags=["Checklists"])

@router.get("/checklists", response_model=List[ChecklistResponse])
def list_checklists(db: Session = Depends(get_db)):
    return db.query(ChecklistModel).all()


@router.post("/checklists", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
def create_checklist(payload: ChecklistCreate, db: Session = Depends(get_db)):
    # 1. Create from template
    if payload.template_id:
        tpl = db.query(TemplateModel).filter(
            TemplateModel.id == payload.template_id,
            TemplateModel.type == "checklist"
        ).first()
        if not tpl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Checklist template with ID {payload.template_id} not found"
            )
        try:
            tpl_data = json.loads(tpl.data)
        except Exception:
            tpl_data = {}

        chk = ChecklistModel(
            name=payload.name or tpl.name,
            reminder_time=payload.reminder_time or tpl_data.get("reminder_time", "08:00")
        )
        db.add(chk)
        db.flush()

        for idx, item_data in enumerate(tpl_data.get("items", []), start=1):
            item = ChecklistItemModel(
                checklist_id=chk.id,
                text=item_data["text"],
                icon=item_data.get("icon", "check"),
                is_checked=False,
                order=item_data.get("order", idx)
            )
            db.add(item)

        db.commit()
        db.refresh(chk)
        return chk

    # 2. Create blank checklist
    if not payload.name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Checklist name is required"
        )
    chk = ChecklistModel(
        name=payload.name,
        reminder_time=payload.reminder_time or "08:00"
    )
    db.add(chk)
    db.commit()
    db.refresh(chk)
    return chk


@router.put("/checklists/{id}", response_model=ChecklistResponse)
def update_checklist(id: int, payload: ChecklistUpdate, db: Session = Depends(get_db)):
    chk = db.query(ChecklistModel).filter(ChecklistModel.id == id).first()
    if not chk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Checklist {id} not found")
    if payload.name is not None:
        chk.name = payload.name
    if payload.reminder_time is not None:
        chk.reminder_time = payload.reminder_time
    db.commit()
    db.refresh(chk)
    return chk


@router.delete("/checklists/{id}")
def delete_checklist(id: int, db: Session = Depends(get_db)):
    chk = db.query(ChecklistModel).filter(ChecklistModel.id == id).first()
    if not chk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Checklist {id} not found")
    db.delete(chk)
    db.commit()
    return {"message": f"Checklist {id} deleted successfully"}


@router.post("/checklists/{id}/items", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
def add_checklist_item(id: int, payload: ChecklistItemCreate, db: Session = Depends(get_db)):
    chk = db.query(ChecklistModel).filter(ChecklistModel.id == id).first()
    if not chk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Checklist {id} not found")
    
    max_order = max([it.order for it in chk.items], default=0)
    order = payload.order if payload.order > 1 else max_order + 1

    item = ChecklistItemModel(
        checklist_id=id,
        text=payload.text,
        icon=payload.icon,
        is_checked=False,
        order=order
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/checklist-items/{id}", response_model=ChecklistItemResponse)
def update_checklist_item(id: int, payload: ChecklistItemUpdate, db: Session = Depends(get_db)):
    item = db.query(ChecklistItemModel).filter(ChecklistItemModel.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Checklist item {id} not found")
    if payload.text is not None:
        item.text = payload.text
    if payload.icon is not None:
        item.icon = payload.icon
    if payload.is_checked is not None:
        item.is_checked = payload.is_checked
    if payload.order is not None:
        item.order = payload.order
    db.commit()
    db.refresh(item)
    return item


@router.delete("/checklist-items/{id}")
def delete_checklist_item(id: int, db: Session = Depends(get_db)):
    item = db.query(ChecklistItemModel).filter(ChecklistItemModel.id == id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Checklist item {id} not found")
    db.delete(item)
    db.commit()
    return {"message": f"Checklist item {id} deleted successfully"}


@router.post("/checklists/{id}/reset", response_model=ChecklistResponse)
def reset_checklist(id: int, db: Session = Depends(get_db)):
    chk = db.query(ChecklistModel).filter(ChecklistModel.id == id).first()
    if not chk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Checklist {id} not found")
    for it in chk.items:
        it.is_checked = False
    db.commit()
    db.refresh(chk)
    return chk
