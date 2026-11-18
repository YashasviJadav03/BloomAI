from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ChecklistModel(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    reminder_time = Column(String(20), default="08:00")
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("ChecklistItemModel", back_populates="checklist", cascade="all, delete-orphan", order_by="ChecklistItemModel.order")


class ChecklistItemModel(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    checklist_id = Column(Integer, ForeignKey("checklists.id", ondelete="CASCADE"), nullable=False)
    text = Column(String(150), nullable=False)
    icon = Column(String(50), default="check")
    is_checked = Column(Boolean, default=False)
    order = Column(Integer, default=1)

    checklist = relationship("ChecklistModel", back_populates="items")
