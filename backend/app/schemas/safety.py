from typing import List
from pydantic import BaseModel

class ResourceItem(BaseModel):
    name: str
    contact: str

class SafetyResourcesResponse(BaseModel):
    message: str
    resources: List[ResourceItem]
