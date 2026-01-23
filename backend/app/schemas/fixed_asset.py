from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from ..models.fixed_asset import DepreciationMethod, FixedAssetStatus

class DepreciationLogBase(BaseModel):
    amount: float
    depreciation_date: datetime
    period_start: datetime
    period_end: datetime

class DepreciationLogCreate(DepreciationLogBase):
    fixed_asset_id: int
    journal_entry_id: Optional[int] = None

class DepreciationLog(DepreciationLogBase):
    id: int
    fixed_asset_id: int
    journal_entry_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class FixedAssetBase(BaseModel):
    name: str
    asset_category: str
    purchase_date: datetime
    purchase_cost: float
    salvage_value: float = 0.0
    useful_life_years: int
    depreciation_method: DepreciationMethod = DepreciationMethod.STRAIGHT_LINE
    asset_account_id: int
    depreciation_expense_account_id: int
    accumulated_depreciation_account_id: int
    serial_number: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class FixedAssetCreate(FixedAssetBase):
    pass

class FixedAssetUpdate(BaseModel):
    name: Optional[str] = None
    asset_category: Optional[str] = None
    status: Optional[FixedAssetStatus] = None
    location: Optional[str] = None
    description: Optional[str] = None

class FixedAsset(FixedAssetBase):
    id: int
    accumulated_depreciation: float
    current_book_value: float
    status: FixedAssetStatus
    created_at: datetime
    updated_at: Optional[datetime]
    created_by_id: int
    depreciation_logs: List[DepreciationLog] = []

    class Config:
        from_attributes = True
