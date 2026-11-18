from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict

# Steps
class StepBase(BaseModel):
    text: str
    icon: str = "check"
    order: int = 1

class StepCreate(StepBase):
    pass

class StepUpdate(BaseModel):
    text: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None

class StepResponse(StepBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Tasks
class TaskBase(BaseModel):
    title: str
    icon: str = "star"
    order: int = 1
    expected_seconds: int = 120

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    icon: Optional[str] = None
    order: Optional[int] = None
    expected_seconds: Optional[int] = None

class TaskResponse(TaskBase):
    id: int
    steps: List[StepResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Reorder Tasks
class ReorderTasksRequest(BaseModel):
    ordered_task_ids: List[int]


# Schedules
class ScheduleBase(BaseModel):
    name: str
    color: str = "#F4A261"
    icon: str = "sun"

class ScheduleCreate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = "#F4A261"
    icon: Optional[str] = "sun"
    template_id: Optional[int] = None

class ScheduleUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class ScheduleSummary(ScheduleBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ScheduleResponse(ScheduleBase):
    id: int
    created_at: datetime
    tasks: List[TaskResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Templates
class TemplateResponse(BaseModel):
    id: int
    type: str
    name: str
    color: str
    icon: str
    data: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)
