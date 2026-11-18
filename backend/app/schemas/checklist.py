from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ChecklistItemBase(BaseModel):
    text: str
    icon: str = "check"
    is_checked: bool = False
    order: int = 1

class ChecklistItemCreate(BaseModel):
    text: str
    icon: str = "check"
    order: int = 1

class ChecklistItemUpdate(BaseModel):
    text: Optional[str] = None
    icon: Optional[str] = None
    is_checked: Optional[bool] = None
    order: Optional[int] = None

class ChecklistItemResponse(ChecklistItemBase):
    id: int
    checklist_id: int

    model_config = ConfigDict(from_attributes=True)


class ChecklistBase(BaseModel):
    name: str
    reminder_time: str = "08:00"

class ChecklistCreate(BaseModel):
    name: Optional[str] = None
    reminder_time: Optional[str] = "08:00"
    template_id: Optional[int] = None

class ChecklistUpdate(BaseModel):
    name: Optional[str] = None
    reminder_time: Optional[str] = None

class ChecklistResponse(ChecklistBase):
    id: int
    created_at: datetime
    items: List[ChecklistItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
