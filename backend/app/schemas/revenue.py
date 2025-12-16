from pydantic import BaseModel, validator # type: ignore[import-untyped]
from typing import Optional
from datetime import datetime
from decimal import Decimal
from ..models.revenue import RevenueCategory


class RevenueBase(BaseModel):
    title: str
    description: Optional[str] = None
    amount: Decimal
    category: RevenueCategory = RevenueCategory.OTHER
    source: Optional[str] = None
    date: datetime
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    attachment_url: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

    @validator('recurring_frequency')
    def validate_recurring_frequency(cls, v, values):
        if values.get('is_recurring') and not v:
            raise ValueError('Recurring frequency is required when is_recurring is True')
        if v and v not in ['monthly', 'quarterly', 'yearly']:
            raise ValueError('Recurring frequency must be monthly, quarterly, or yearly')
        return v


class RevenueCreate(RevenueBase):
    pass


class RevenueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    category: Optional[RevenueCategory] = None
    source: Optional[str] = None
    date: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    recurring_frequency: Optional[str] = None
    attachment_url: Optional[str] = None


class RevenueOut(RevenueBase):
    id: int
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_approved: bool
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RevenueSummary(BaseModel):
    total_amount: Decimal
    count: int
    category: RevenueCategory
    period: str
