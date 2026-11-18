from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Date, Text
from backend.app.database import Base

class ProfileModel(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, default=1)
    name = Column(String(100), nullable=False, default="Aarav")
    avatar = Column(String(50), nullable=False, default="star")
    favourite_rewards = Column(Text, nullable=False, default="[]")  # JSON stringified array
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UserStatsModel(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, default=1)
    total_points = Column(Integer, default=0, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    best_streak = Column(Integer, default=0, nullable=False)
    last_active_date = Column(Date, nullable=True)
