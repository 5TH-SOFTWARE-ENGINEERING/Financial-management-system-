from pydantic import BaseModel, Field # type: ignore[import-untyped]
from typing import Optional
from datetime import datetime
from ..models.ip_restriction import IPStatus

class IPRestrictionBase(BaseModel):
    ip_address: str = Field(..., description="The IP address to restrict")
    description: Optional[str] = None
    status: IPStatus = IPStatus.ALLOWED

class IPRestrictionCreate(IPRestrictionBase):
    pass

class IPRestrictionUpdate(BaseModel):
    ip_address: Optional[str] = None
    description: Optional[str] = None
    status: Optional[IPStatus] = None

class IPRestrictionInDBBase(IPRestrictionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class IPRestrictionOut(IPRestrictionInDBBase):
    pass
