from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class TemplateModel(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # "schedule" or "checklist"
    name = Column(String(100), nullable=False)
    color = Column(String(50), default="#F4A261")
    icon = Column(String(50), default="sun")
    data = Column(Text, nullable=False, default="{}")  # JSON payload


class ScheduleModel(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(50), default="#F4A261")
    icon = Column(String(50), default="sun")
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("TaskModel", back_populates="schedule", cascade="all, delete-orphan", order_by="TaskModel.order")


class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    icon = Column(String(50), default="star")
    order = Column(Integer, default=1)
    expected_seconds = Column(Integer, default=120)

    schedule = relationship("ScheduleModel", back_populates="tasks")
    steps = relationship("StepModel", back_populates="task", cascade="all, delete-orphan", order_by="StepModel.order")


class StepModel(Base):
    __tablename__ = "steps"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    text = Column(String(255), nullable=False)
    icon = Column(String(50), default="check")
    order = Column(Integer, default=1)

    task = relationship("TaskModel", back_populates="steps")
