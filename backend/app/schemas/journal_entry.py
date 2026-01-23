from typing import Optional, List
from pydantic import BaseModel, validator
from datetime import datetime
from ..models.journal_entry import JournalEntryStatus, ReferenceType

# --- Journal Entry Line Schemas ---

class JournalEntryLineBase(BaseModel):
    account_id: int
    debit_amount: float = 0.0
    credit_amount: float = 0.0
    description: Optional[str] = None

    @validator('credit_amount')
    def validate_amounts(cls, v, values):
        debit = values.get('debit_amount', 0)
        if debit > 0 and v > 0:
            raise ValueError('Line cannot have both debit and credit amounts')
        if debit == 0 and v == 0:
            raise ValueError('Line must have either debit or credit amount')
        return v

class JournalEntryLineCreate(JournalEntryLineBase):
    pass

from .account import Account

class JournalEntryLine(JournalEntryLineBase):
    id: int
    journal_entry_id: int
    created_at: datetime
    
    # Nested account for display
    account: Optional[Account] = None

    class Config:
        from_attributes = True

# --- Journal Entry Schemas ---

class JournalEntryBase(BaseModel):
    entry_date: datetime
    description: str
    reference_type: ReferenceType
    reference_id: Optional[int] = None
    status: JournalEntryStatus = JournalEntryStatus.DRAFT

class JournalEntryCreate(JournalEntryBase):
    lines: List[JournalEntryLineCreate]

    @validator('lines')
    def validate_balance(cls, v):
        if not v:
            raise ValueError('Entry must have at least one line')
        
        total_debits = sum(line.debit_amount for line in v)
        total_credits = sum(line.credit_amount for line in v)
        
        if abs(total_debits - total_credits) > 0.01:
            raise ValueError(f'Entry is not balanced. Debits: {total_debits}, Credits: {total_credits}')
        
        return v

class JournalEntryUpdate(BaseModel):
    entry_date: Optional[datetime] = None
    description: Optional[str] = None
    reference_type: Optional[ReferenceType] = None
    reference_id: Optional[int] = None
    status: Optional[JournalEntryStatus] = None

from .user import UserOut

class JournalEntry(JournalEntryBase):
    id: int
    entry_number: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: int
    posted_at: Optional[datetime] = None
    posted_by_id: Optional[int] = None
    reversed_at: Optional[datetime] = None
    reversed_by_id: Optional[int] = None
    reversal_entry_id: Optional[int] = None
    
    # Nested objects
    lines: List[JournalEntryLine]
    created_by: UserOut
    posted_by: Optional[UserOut] = None

    class Config:
        from_attributes = True
