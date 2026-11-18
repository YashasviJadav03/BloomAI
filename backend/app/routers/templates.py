import json
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.schedule import TemplateModel
from backend.app.schemas.schedule import TemplateResponse

router = APIRouter(prefix="/api/templates", tags=["Templates"])

@router.get("", response_model=List[TemplateResponse])
def get_templates(
    type: Optional[str] = Query(None, description="Filter by type: schedule or checklist"),
    db: Session = Depends(get_db)
):
    query = db.query(TemplateModel)
    if type:
        query = query.filter(TemplateModel.type == type)
    templates = query.all()

    result = []
    for t in templates:
        try:
            parsed_data = json.loads(t.data)
        except Exception:
            parsed_data = {}
        result.append(
            TemplateResponse(
                id=t.id,
                type=t.type,
                name=t.name,
                color=t.color,
                icon=t.icon,
                data=parsed_data
            )
        )
    return result
