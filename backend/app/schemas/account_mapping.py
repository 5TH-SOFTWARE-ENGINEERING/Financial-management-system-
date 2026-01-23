from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AccountMappingBase(BaseModel):
    module: str
    category: str
    account_id: int

class AccountMappingCreate(AccountMappingBase):
    pass

class AccountMappingUpdate(BaseModel):
    account_id: Optional[int] = None

class AccountMapping(AccountMappingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: int

    class Config:
        from_attributes = True
