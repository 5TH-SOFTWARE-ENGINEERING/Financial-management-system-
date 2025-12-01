# app/schemas/budget.py
from pydantic import BaseModel, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

from ..models.budget import BudgetPeriod, BudgetStatus, BudgetType


class BudgetItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    type: BudgetType
    category: str
    amount: float
    monthly_amounts: Optional[Dict[str, float]] = None
    formula: Optional[str] = None

    @validator('amount')
    def validate_amount(cls, v):
        if v < 0:
            raise ValueError('Amount must be non-negative')
        return v


class BudgetItemCreate(BudgetItemBase):
    pass


class BudgetItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[BudgetType] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    monthly_amounts: Optional[Dict[str, float]] = None
    formula: Optional[str] = None


class BudgetItemOut(BudgetItemBase):
    id: int
    budget_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BudgetBase(BaseModel):
    name: str
    description: Optional[str] = None
    period: BudgetPeriod
    start_date: datetime
    end_date: datetime
    department: Optional[str] = None
    project: Optional[str] = None
    status: BudgetStatus = BudgetStatus.DRAFT

    @validator('end_date')
    def validate_dates(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('End date must be after start date')
        return v


class BudgetCreate(BudgetBase):
    items: Optional[List[BudgetItemCreate]] = []


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    period: Optional[BudgetPeriod] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    department: Optional[str] = None
    project: Optional[str] = None
    status: Optional[BudgetStatus] = None


class BudgetOut(BudgetBase):
    id: int
    total_revenue: float
    total_expenses: float
    total_profit: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    created_by_id: int
    approved_by_id: Optional[int] = None
    items: List[BudgetItemOut] = []

    class Config:
        from_attributes = True


class BudgetScenarioCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scenario_type: str  # "best_case", "worst_case", "most_likely", "custom"
    adjustments: Optional[Dict[str, Dict[str, Any]]] = None  # {"item_id": {"amount_multiplier": 1.2}, ...}


class BudgetScenarioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scenario_type: Optional[str] = None
    adjustments: Optional[Dict[str, Dict[str, Any]]] = None


class BudgetScenarioOut(BaseModel):
    id: int
    budget_id: int
    name: str
    description: Optional[str] = None
    scenario_type: str
    adjustments: Optional[Dict[str, Any]] = None
    total_revenue: float
    total_expenses: float
    total_profit: float
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: int

    class Config:
        from_attributes = True


class ForecastCreate(BaseModel):
    name: str
    description: Optional[str] = None
    forecast_type: str  # "revenue", "expense", "profit", "all"
    period_type: str  # "monthly", "quarterly", "yearly"
    start_date: datetime
    end_date: datetime
    method: str  # "moving_average", "linear_growth", "trend", "manual"
    method_params: Optional[Dict[str, Any]] = None
    historical_start_date: Optional[datetime] = None
    historical_end_date: Optional[datetime] = None


class ForecastUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    forecast_data: Optional[List[Dict[str, Any]]] = None


class ForecastOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    forecast_type: str
    period_type: str
    start_date: datetime
    end_date: datetime
    method: str
    method_params: Optional[Dict[str, Any]] = None
    historical_start_date: Optional[datetime] = None
    historical_end_date: Optional[datetime] = None
    forecast_data: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: int

    class Config:
        from_attributes = True


class BudgetVarianceOut(BaseModel):
    id: int
    budget_id: int
    period_start: datetime
    period_end: datetime
    budgeted_revenue: float
    budgeted_expenses: float
    budgeted_profit: float
    actual_revenue: float
    actual_expenses: float
    actual_profit: float
    revenue_variance: float
    expense_variance: float
    profit_variance: float
    revenue_variance_percent: float
    expense_variance_percent: float
    profit_variance_percent: float
    calculated_at: datetime

    class Config:
        from_attributes = True


class ScenarioComparisonRequest(BaseModel):
    scenario_ids: List[int]


class BudgetValidationResult(BaseModel):
    valid: bool
    errors: List[str]
    warnings: List[str]
    revenue_total: float
    expense_total: float
    profit: float

