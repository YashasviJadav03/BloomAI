from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class ProfileBase(BaseModel):
    name: str = "Aarav"
    avatar: str = "star"
    favourite_rewards: List[str] = ["Extra playground time", "Lego build break"]

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
