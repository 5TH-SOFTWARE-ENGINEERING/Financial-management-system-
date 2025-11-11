from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.audit import AuditAction


class AuditLogBase(BaseModel):
    action: AuditAction
    resource_type: str
    resource_id: Optional[int] = None
    old_values: Optional[str] = None
    new_values: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class AuditLogOut(AuditLogBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
