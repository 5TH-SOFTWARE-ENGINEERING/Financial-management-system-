# app/api/v1/budgeting.py
"""
Budgeting & Forecasting (FP&A) API
Provides endpoints for budget management, scenario planning, forecasting, and variance analysis
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from typing import List, Optional
from datetime import datetime, timedelta
import json
from pydantic import BaseModel  # type: ignore

from ...core.database import get_db
from ...core.security import verify_password
from ...api.deps import get_current_active_user
from ...models.user import User, UserRole
from ...models.budget import BudgetStatus, BudgetType, BudgetPeriod
from ...crud.budget import budget, budget_item, budget_scenario, forecast, budget_variance
from ...schemas.budget import (
    BudgetCreate, BudgetUpdate, BudgetOut,
    BudgetItemCreate, BudgetItemUpdate, BudgetItemOut,
    BudgetScenarioCreate, BudgetScenarioUpdate, BudgetScenarioOut,
    ForecastCreate, ForecastUpdate, ForecastOut,
    BudgetVarianceOut, ScenarioComparisonRequest, BudgetValidationResult
)
from ...services.budgeting import BudgetingService
from ...services.forecasting import ForecastingService
from ...services.variance import VarianceAnalysisService

router = APIRouter()


# ============================================================================
# BUDGET MANAGEMENT
# ============================================================================

@router.post("/budgets", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new budget"""
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions to create budgets")
    
    # Create budget
    budget_dict = budget_data.dict(exclude={"items"})
    budget_dict["created_by_id"] = current_user.id
    
    new_budget = budget.create(db, budget_dict)
    
    # Add budget items
    items_data = budget_data.items or []
    for item_data in items_data:
        item_dict = item_data.dict()
        item_dict["budget_id"] = new_budget.id
        if item_dict.get("monthly_amounts"):
            item_dict["monthly_amounts"] = json.dumps(item_dict["monthly_amounts"])
        budget_item.create(db, item_dict)
    
    # Calculate totals
    totals = budget.calculate_totals(db, new_budget.id)
    budget.update(db, new_budget.id, totals)
    
    db.refresh(new_budget)
    return new_budget


@router.post("/budgets/from-template", response_model=BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget_from_template(
    template_name: str = Query(..., description="Template name"),
    name: Optional[str] = Query(None),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    department: Optional[str] = Query(None),
    project: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a budget from a predefined template"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    try:
        start_date_dt = datetime.fromisoformat(start_date)
        end_date_dt = datetime.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    new_budget = BudgetingService.create_budget_from_template(
        db, template_name, current_user.id, start_date_dt, end_date_dt,
        name=name, department=department, project=project
    )
    
    db.refresh(new_budget)
    return new_budget


@router.get("/budgets", response_model=List[BudgetOut])
def get_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all budgets"""
    budgets = budget.get_all(
        db, skip, limit, current_user.id, current_user.role, status, department
    )
    return budgets


@router.get("/budgets/{budget_id}", response_model=BudgetOut)
def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific budget by ID"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return budget_obj


@router.put("/budgets/{budget_id}", response_model=BudgetOut)
def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_data = budget_update.dict(exclude_unset=True)
    updated_budget = budget.update(db, budget_id, update_data)
    
    # Recalculate totals if items changed
    if update_data:
        totals = budget.calculate_totals(db, budget_id)
        budget.update(db, budget_id, totals)
    
    return updated_budget


@router.delete("/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    budget.delete(db, budget_id)
    return None


class DeleteBudgetRequest(BaseModel):
    password: str

@router.post("/budgets/{budget_id}/delete")
def delete_budget_with_password(
    budget_id: int,
    delete_request: DeleteBudgetRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget - requires password verification"""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before deletion
    if not delete_request.password or not delete_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to delete a budget."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this budget."
        )
    
    # Check budget exists
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if budget_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete the budget
    budget.delete(db, budget_id)
    return {"message": "Budget deleted successfully"}


@router.post("/budgets/{budget_id}/validate", response_model=BudgetValidationResult)
def validate_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Validate budget items and totals"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    result = BudgetingService.validate_budget_items(db, budget_id)
    
    # Update totals if valid
    if result["valid"]:
        budget.update(db, budget_id, {
            "total_revenue": result["revenue_total"],
            "total_expenses": result["expense_total"],
            "total_profit": result["profit"]
        })
    
    return result


# ============================================================================
# BUDGET ITEMS
# ============================================================================

@router.post("/budgets/{budget_id}/items", response_model=BudgetItemOut, status_code=status.HTTP_201_CREATED)
def create_budget_item(
    budget_id: int,
    item_data: BudgetItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add an item to a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    item_dict = item_data.dict()
    item_dict["budget_id"] = budget_id
    if item_dict.get("monthly_amounts"):
        item_dict["monthly_amounts"] = json.dumps(item_dict["monthly_amounts"])
    
    new_item = budget_item.create(db, item_dict)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return new_item


@router.get("/budgets/{budget_id}/items", response_model=List[BudgetItemOut])
def get_budget_items(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all items for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    items = budget_item.get_by_budget(db, budget_id)
    return items


@router.put("/budgets/{budget_id}/items/{item_id}", response_model=BudgetItemOut)
def update_budget_item(
    budget_id: int,
    item_id: int,
    item_update: BudgetItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a budget item"""
    item_obj = budget_item.get(db, item_id)
    if not item_obj or item_obj.budget_id != budget_id:
        raise HTTPException(status_code=404, detail="Budget item not found")
    
    update_data = item_update.dict(exclude_unset=True)
    if update_data.get("monthly_amounts"):
        update_data["monthly_amounts"] = json.dumps(update_data["monthly_amounts"])
    
    updated_item = budget_item.update(db, item_id, update_data)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return updated_item


@router.delete("/budgets/{budget_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_item(
    budget_id: int,
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget item"""
    item_obj = budget_item.get(db, item_id)
    if not item_obj or item_obj.budget_id != budget_id:
        raise HTTPException(status_code=404, detail="Budget item not found")
    
    budget_item.delete(db, item_id)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return None


class DeleteBudgetItemRequest(BaseModel):
    password: str

@router.post("/budgets/{budget_id}/items/{item_id}/delete")
def delete_budget_item_with_password(
    budget_id: int,
    item_id: int,
    delete_request: DeleteBudgetItemRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a budget item - requires password verification"""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before deletion
    if not delete_request.password or not delete_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to delete a budget item."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this budget item."
        )
    
    # Check item exists
    item_obj = budget_item.get(db, item_id)
    if not item_obj or item_obj.budget_id != budget_id:
        raise HTTPException(status_code=404, detail="Budget item not found")
    
    # Delete the budget item
    budget_item.delete(db, item_id)
    
    # Recalculate totals
    totals = budget.calculate_totals(db, budget_id)
    budget.update(db, budget_id, totals)
    
    return {"message": "Budget item deleted successfully"}


# ============================================================================
# SCENARIO PLANNING
# ============================================================================

@router.post("/budgets/{budget_id}/scenarios", response_model=BudgetScenarioOut, status_code=status.HTTP_201_CREATED)
def create_scenario(
    budget_id: int,
    scenario_data: BudgetScenarioCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a scenario for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    # Calculate scenario totals
    scenario_calc = BudgetingService.calculate_scenario(
        db, budget_id, scenario_data.dict()
    )
    
    # Create scenario
    scenario_dict = scenario_data.dict()
    scenario_dict["budget_id"] = budget_id
    scenario_dict["created_by_id"] = current_user.id
    if scenario_dict.get("adjustments"):
        scenario_dict["adjustments"] = json.dumps(scenario_dict["adjustments"])
    scenario_dict.update({
        "total_revenue": scenario_calc["total_revenue"],
        "total_expenses": scenario_calc["total_expenses"],
        "total_profit": scenario_calc["total_profit"]
    })
    
    new_scenario = budget_scenario.create(db, scenario_dict)
    return new_scenario


@router.get("/budgets/{budget_id}/scenarios", response_model=List[BudgetScenarioOut])
def get_scenarios(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all scenarios for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    scenarios = budget_scenario.get_by_budget(db, budget_id)
    return scenarios


@router.post("/budgets/{budget_id}/scenarios/compare")
def compare_scenarios(
    budget_id: int,
    comparison_request: ScenarioComparisonRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Compare multiple scenarios side by side"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    comparison = BudgetingService.compare_scenarios(
        db, budget_id, comparison_request.scenario_ids
    )
    return comparison


# ============================================================================
# FORECASTING
# ============================================================================

@router.post("/forecasts", response_model=ForecastOut, status_code=status.HTTP_201_CREATED)
def create_forecast(
    forecast_data: ForecastCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new forecast"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    forecast_dict = forecast_data.dict()
    forecast_dict["created_by_id"] = current_user.id
    
    # Generate forecast data based on method
    method = forecast_dict["method"]
    forecast_type = forecast_dict["forecast_type"]
    start_date = forecast_dict["start_date"]
    end_date = forecast_dict["end_date"]
    method_params = forecast_dict.get("method_params", {})
    historical_start = forecast_dict.get("historical_start_date", start_date - timedelta(days=365))
    historical_end = forecast_dict.get("historical_end_date", start_date)
    
    if method == "moving_average":
        forecast_values = ForecastingService.generate_moving_average_forecast(
            db, forecast_type, start_date, end_date, historical_start, historical_end,
            window=method_params.get("window", 3),
            user_id=current_user.id,
            user_role=current_user.role
        )
    elif method == "linear_growth":
        forecast_values = ForecastingService.generate_linear_growth_forecast(
            db, forecast_type, start_date, end_date, historical_start, historical_end,
            growth_rate=method_params.get("growth_rate", 0.05),
            user_id=current_user.id,
            user_role=current_user.role
        )
    elif method == "trend":
        forecast_values = ForecastingService.generate_trend_forecast(
            db, forecast_type, start_date, end_date, historical_start, historical_end,
            user_id=current_user.id,
            user_role=current_user.role
        )
    else:
        forecast_values = []
    
    forecast_dict["forecast_data"] = json.dumps(forecast_values) if forecast_values else None
    if forecast_dict.get("method_params"):
        forecast_dict["method_params"] = json.dumps(forecast_dict["method_params"])
    
    new_forecast = forecast.create(db, forecast_dict)
    
    # Parse JSON strings back to dicts for response
    if new_forecast.method_params and isinstance(new_forecast.method_params, str):
        new_forecast.method_params = json.loads(new_forecast.method_params)
    if new_forecast.forecast_data and isinstance(new_forecast.forecast_data, str):
        new_forecast.forecast_data = json.loads(new_forecast.forecast_data)
    
    return new_forecast


@router.get("/forecasts", response_model=List[ForecastOut])
def get_forecasts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all forecasts"""
    forecasts = forecast.get_all(db, skip, limit, current_user.id, current_user.role)
    # Parse JSON strings back to dicts for response
    for f in forecasts:
        if f.method_params and isinstance(f.method_params, str):
            f.method_params = json.loads(f.method_params)
        if f.forecast_data and isinstance(f.forecast_data, str):
            f.forecast_data = json.loads(f.forecast_data)
    return forecasts


@router.get("/forecasts/{forecast_id}", response_model=ForecastOut)
def get_forecast(
    forecast_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific forecast by ID"""
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Parse JSON strings back to dicts for response
    if forecast_obj.method_params and isinstance(forecast_obj.method_params, str):
        forecast_obj.method_params = json.loads(forecast_obj.method_params)
    if forecast_obj.forecast_data and isinstance(forecast_obj.forecast_data, str):
        forecast_obj.forecast_data = json.loads(forecast_obj.forecast_data)
    
    return forecast_obj


@router.put("/forecasts/{forecast_id}", response_model=ForecastOut)
def update_forecast(
    forecast_id: int,
    forecast_data: ForecastUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a forecast"""
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions - must match get_forecast permissions to prevent escalation
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Prepare update data
    update_dict = forecast_data.dict(exclude_unset=True)
    
    # If forecast_data is provided, serialize it
    if "forecast_data" in update_dict and update_dict["forecast_data"]:
        update_dict["forecast_data"] = json.dumps(update_dict["forecast_data"])
    
    # Update the forecast
    updated_forecast = forecast.update(db, forecast_id, update_dict)
    
    # Parse JSON strings back to dicts for response
    if updated_forecast.method_params and isinstance(updated_forecast.method_params, str):
        updated_forecast.method_params = json.loads(updated_forecast.method_params)
    if updated_forecast.forecast_data and isinstance(updated_forecast.forecast_data, str):
        updated_forecast.forecast_data = json.loads(updated_forecast.forecast_data)
    
    return updated_forecast


@router.delete("/forecasts/{forecast_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_forecast(
    forecast_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a forecast"""
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    forecast.delete(db, forecast_id)
    return None


class DeleteForecastRequest(BaseModel):
    password: str

@router.post("/forecasts/{forecast_id}/delete")
def delete_forecast_with_password(
    forecast_id: int,
    delete_request: DeleteForecastRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a forecast - requires password verification"""
    # Reload current user from database to ensure we have the password hash
    db_user_for_auth = db.query(User).filter(User.id == current_user.id).first()
    if not db_user_for_auth:
        raise HTTPException(status_code=404, detail="Current user not found")
    
    # Validate that password hash exists
    if not db_user_for_auth.hashed_password:
        raise HTTPException(
            status_code=500,
            detail="User password hash not found. Please contact administrator."
        )
    
    # Verify password before deletion
    if not delete_request.password or not delete_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to delete a forecast."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this forecast."
        )
    
    # Check forecast exists
    forecast_obj = forecast.get(db, forecast_id)
    if not forecast_obj:
        raise HTTPException(status_code=404, detail="Forecast not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if forecast_obj.created_by_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Delete the forecast
    forecast.delete(db, forecast_id)
    return {"message": "Forecast deleted successfully"}


# ============================================================================
# VARIANCE ANALYSIS
# ============================================================================

@router.post("/budgets/{budget_id}/variance", response_model=BudgetVarianceOut, status_code=status.HTTP_201_CREATED)
def calculate_variance(
    budget_id: int,
    period_start: str = Query(..., description="Period start date (YYYY-MM-DD)"),
    period_end: str = Query(..., description="Period end date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Calculate variance between budget and actuals for a period"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    try:
        period_start_dt = datetime.fromisoformat(period_start)
        period_end_dt = datetime.fromisoformat(period_end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    variance = VarianceAnalysisService.calculate_variance(
        db, budget_id, period_start_dt, period_end_dt,
        current_user.id, current_user.role
    )
    return variance


@router.get("/budgets/{budget_id}/variance", response_model=List[BudgetVarianceOut])
def get_variance_history(
    budget_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get variance history for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    variances = budget_variance.get_by_budget(db, budget_id, skip, limit)
    return variances


@router.get("/budgets/{budget_id}/variance/summary")
def get_variance_summary(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get variance summary for a budget"""
    budget_obj = budget.get(db, budget_id)
    if not budget_obj:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    summary = VarianceAnalysisService.get_variance_summary(db, budget_id)
    return summary

