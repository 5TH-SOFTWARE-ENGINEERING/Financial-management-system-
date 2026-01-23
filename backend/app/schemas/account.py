from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from ..models.account import AccountType

class AccountBase(BaseModel):
    code: str
    name: str
    account_type: AccountType
    description: Optional[str] = None
    parent_account_id: Optional[int] = None
    currency_code: Optional[str] = None
    is_active: bool = True
    is_system_account: bool = False

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[AccountType] = None
    description: Optional[str] = None
    parent_account_id: Optional[int] = None
    currency_code: Optional[str] = None
    is_active: Optional[bool] = None

class Account(AccountBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: Optional[int] = None

    class Config:
        from_attributes = True
