from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    department_id: Optional[str] = None
    assigned_users: Optional[List[int]] = None
    budget: Optional[Decimal] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    is_active: bool = True

    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Project name must be at least 2 characters')
        return v.strip()

    @validator('budget')
    def validate_budget(cls, v):
        if v is not None and v < 0:
            raise ValueError('Budget must be positive or zero')
        return v


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[str] = None
    assigned_users: Optional[List[int]] = None
    budget: Optional[Decimal] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None and len(v.strip()) < 2:
            raise ValueError('Project name must be at least 2 characters')
        return v.strip() if v else v

    @validator('budget')
    def validate_budget(cls, v):
        if v is not None and v < 0:
            raise ValueError('Budget must be positive or zero')
        return v


class ProjectOut(ProjectBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

