from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from ..models.fraud import FraudFlagStatus

class FraudFlagBase(BaseModel):
    source_type: str # "revenue", "expense", "sale"
    source_id: int
    fraud_score: float
    reason: str

class FraudFlagCreate(FraudFlagBase):
    pass

class FraudFlagUpdate(BaseModel):
    status: Optional[FraudFlagStatus] = None
    review_comments: Optional[str] = None

class FraudFlagSchema(FraudFlagBase):
    id: int
    status: FraudFlagStatus
    reviewed_by_id: Optional[int]
    reviewed_at: Optional[datetime]
    review_comments: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ScenarioSimulationRequest(BaseModel):
    period_months: int = Field(default=12, ge=1, le=36)
    revenue_multiplier: float = Field(default=1.0)
    expense_multiplier: float = Field(default=1.0)
    fixed_revenue_offset: float = Field(default=0.0)
    fixed_expense_offset: float = Field(default=0.0)

class ScenarioSimulationResponse(BaseModel):
    dates: List[str]
    base_revenue: List[float]
    base_expenses: List[float]
    projected_revenue: List[float]
    projected_expenses: List[float]
    net_impact: float
