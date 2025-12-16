# app/models/budget.py
from sqlalchemy import ( # type: ignore[import-untyped]
    Column, Integer, String, Float, DateTime,
    ForeignKey, Text, Boolean, Enum as SAEnum
)
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
import enum
from datetime import datetime

from ..core.database import Base


class BudgetType(str, enum.Enum):
    REVENUE = "revenue"
    EXPENSE = "expense"
    PROFIT = "profit"


class BudgetPeriod(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class BudgetStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    ACTIVE = "active"
    ARCHIVED = "archived"


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    period = Column(SAEnum(BudgetPeriod), default=BudgetPeriod.MONTHLY)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    department = Column(String, nullable=True)  # Optional department/project filter
    project = Column(String, nullable=True)
    status = Column(SAEnum(BudgetStatus), default=BudgetStatus.DRAFT)
    
    # Budget totals
    total_revenue = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    total_profit = Column(Float, default=0.0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Foreign Keys
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    items = relationship("BudgetItem", back_populates="budget", cascade="all, delete-orphan")
    scenarios = relationship("BudgetScenario", back_populates="budget", cascade="all, delete-orphan")


class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    
    # Item details
    name = Column(String, nullable=False)
    description = Column(Text)
    type = Column(SAEnum(BudgetType), nullable=False)
    category = Column(String, nullable=False)  # Revenue/Expense category
    amount = Column(Float, nullable=False)
    
    # Monthly breakdown (JSON string or separate table)
    monthly_amounts = Column(Text, nullable=True)  # JSON: {"1": 1000, "2": 1200, ...}
    
    # Formula support (optional)
    formula = Column(Text, nullable=True)  # e.g., "=SUM(A1:A5)" or SQL-like
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    budget = relationship("Budget", back_populates="items")


class BudgetScenario(Base):
    __tablename__ = "budget_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    
    # Scenario details
    name = Column(String, nullable=False)
    description = Column(Text)
    scenario_type = Column(String, nullable=False)  # "best_case", "worst_case", "most_likely", "custom"
    
    # Scenario adjustments (JSON)
    adjustments = Column(Text, nullable=True)  # JSON: {"item_id": {"amount_multiplier": 1.2}, ...}
    
    # Calculated totals
    total_revenue = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)
    total_profit = Column(Float, default=0.0)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    budget = relationship("Budget", back_populates="scenarios")
    created_by = relationship("User", foreign_keys=[created_by_id])


class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Forecast details
    name = Column(String, nullable=False)
    description = Column(Text)
    forecast_type = Column(String, nullable=False)  # "revenue", "expense", "profit", "all"
    period_type = Column(String, nullable=False)  # "monthly", "quarterly", "yearly"
    
    # Forecast period
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)
    
    # Forecast method
    method = Column(String, nullable=False)  # "moving_average", "linear_growth", "trend", "manual"
    method_params = Column(Text, nullable=True)  # JSON: {"window": 3, "growth_rate": 0.05, ...}
    
    # Historical data period used
    historical_start_date = Column(DateTime(timezone=True), nullable=True)
    historical_end_date = Column(DateTime(timezone=True), nullable=True)
    
    # Forecast data (JSON)
    forecast_data = Column(Text, nullable=True)  # JSON: [{"period": "2024-01", "revenue": 10000, ...}, ...]
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])


class BudgetVariance(Base):
    __tablename__ = "budget_variances"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    
    # Variance period
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Budgeted amounts
    budgeted_revenue = Column(Float, default=0.0)
    budgeted_expenses = Column(Float, default=0.0)
    budgeted_profit = Column(Float, default=0.0)
    
    # Actual amounts
    actual_revenue = Column(Float, default=0.0)
    actual_expenses = Column(Float, default=0.0)
    actual_profit = Column(Float, default=0.0)
    
    # Variance calculations
    revenue_variance = Column(Float, default=0.0)
    expense_variance = Column(Float, default=0.0)
    profit_variance = Column(Float, default=0.0)
    
    revenue_variance_percent = Column(Float, default=0.0)
    expense_variance_percent = Column(Float, default=0.0)
    profit_variance_percent = Column(Float, default=0.0)
    
    # Metadata
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    budget = relationship("Budget")
    created_by = relationship("User", foreign_keys=[created_by_id])

