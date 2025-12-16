# app/services/forecasting.py
import json
import statistics
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session # type: ignore[import-untyped]

from ..models.budget import Forecast
from ..models.revenue import RevenueEntry
from ..models.expense import ExpenseEntry
from ..models.user import UserRole
from ..crud.budget import forecast
from ..crud.revenue import revenue as revenue_crud
from ..crud.expense import expense as expense_crud


class ForecastingService:
    """Service for forecasting and prediction"""
    
    @staticmethod
    def generate_moving_average_forecast(
        db: Session,
        forecast_type: str,  # "revenue", "expense", "profit"
        start_date: datetime,
        end_date: datetime,
        historical_start: datetime,
        historical_end: datetime,
        window: int = 3,  # Number of periods to average
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None
    ) -> List[Dict[str, Any]]:
        """Generate forecast using moving average method"""
        # Get historical data
        historical_data = ForecastingService._get_historical_data(
            db, forecast_type, historical_start, historical_end, user_id, user_role
        )
        
        if not historical_data:
            return []
        
        # Group by period (monthly, weekly, etc.)
        period_data = ForecastingService._group_by_period(historical_data, "month")
        
        # Calculate moving averages
        periods = sorted(period_data.keys())
        if len(periods) < window:
            window = len(periods)
        
        # Get last N periods for average
        recent_periods = periods[-window:] if len(periods) >= window else periods
        recent_values = [period_data[p] for p in recent_periods]
        
        avg_value = statistics.mean(recent_values) if recent_values else 0.0
        
        # Generate forecast periods
        forecast_data = []
        current_date = start_date
        
        while current_date <= end_date:
            # Use moving average for this period
            forecast_data.append({
                "period": current_date.strftime("%Y-%m"),
                "date": current_date.isoformat(),
                "forecasted_value": avg_value,
                "method": "moving_average",
                "window": window
            })
            
            # Move to next period (monthly)
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return forecast_data
    
    @staticmethod
    def generate_linear_growth_forecast(
        db: Session,
        forecast_type: str,
        start_date: datetime,
        end_date: datetime,
        historical_start: datetime,
        historical_end: datetime,
        growth_rate: float = 0.05,  # 5% growth rate
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None
    ) -> List[Dict[str, Any]]:
        """Generate forecast using linear growth method"""
        # Get historical data
        historical_data = ForecastingService._get_historical_data(
            db, forecast_type, historical_start, historical_end, user_id, user_role
        )
        
        if not historical_data:
            return []
        
        # Group by period
        period_data = ForecastingService._group_by_period(historical_data, "month")
        periods = sorted(period_data.keys())
        
        if not periods:
            return []
        
        # Get last period value as baseline
        last_period = periods[-1]
        last_value = period_data[last_period]
        
        # Generate forecast
        forecast_data = []
        current_date = start_date
        period_count = 0
        
        while current_date <= end_date:
            # Calculate: Previous * (1 + growth_rate) ^ period_count
            forecasted_value = last_value * ((1 + growth_rate) ** period_count)
            
            forecast_data.append({
                "period": current_date.strftime("%Y-%m"),
                "date": current_date.isoformat(),
                "forecasted_value": forecasted_value,
                "method": "linear_growth",
                "growth_rate": growth_rate
            })
            
            period_count += 1
            # Move to next period (monthly)
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return forecast_data
    
    @staticmethod
    def generate_trend_forecast(
        db: Session,
        forecast_type: str,
        start_date: datetime,
        end_date: datetime,
        historical_start: datetime,
        historical_end: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None
    ) -> List[Dict[str, Any]]:
        """Generate forecast using trend analysis (linear regression)"""
        # Get historical data
        historical_data = ForecastingService._get_historical_data(
            db, forecast_type, historical_start, historical_end, user_id, user_role
        )
        
        if not historical_data:
            return []
        
        # Group by period and create time series
        period_data = ForecastingService._group_by_period(historical_data, "month")
        periods = sorted(period_data.keys())
        
        if len(periods) < 2:
            # Need at least 2 points for trend
            return []
        
        # Simple linear regression
        n = len(periods)
        x_values = list(range(n))
        y_values = [period_data[p] for p in periods]
        
        # Calculate slope and intercept
        sum_x = sum(x_values)
        sum_y = sum(y_values)
        sum_xy = sum(x * y for x, y in zip(x_values, y_values))
        sum_x2 = sum(x * x for x in x_values)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x) if (n * sum_x2 - sum_x * sum_x) != 0 else 0
        intercept = (sum_y - slope * sum_x) / n
        
        # Generate forecast
        forecast_data = []
        current_date = start_date
        period_index = n  # Start from next period
        
        while current_date <= end_date:
            forecasted_value = slope * period_index + intercept
            if forecasted_value < 0:
                forecasted_value = 0  # Don't allow negative forecasts for revenue/expenses
            
            forecast_data.append({
                "period": current_date.strftime("%Y-%m"),
                "date": current_date.isoformat(),
                "forecasted_value": forecasted_value,
                "method": "trend",
                "slope": slope,
                "intercept": intercept
            })
            
            period_index += 1
            # Move to next period
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return forecast_data
    
    @staticmethod
    def _get_historical_data(
        db: Session,
        forecast_type: str,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int],
        user_role: Optional[UserRole]
    ) -> List[float]:
        """Get historical data for forecasting"""
        data_points = []
        
        if forecast_type in ["revenue", "profit"]:
            # Get revenue data
            if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
                revenues = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                data_points.extend([float(r.amount) for r in revenues])
            elif user_role == UserRole.MANAGER:
                # Get team data
                from ..crud.user import user as user_crud
                subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
                all_revenues = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                data_points.extend([float(r.amount) for r in all_revenues if r.created_by_id in subordinate_ids])
            else:
                user_revenues = revenue_crud.get_by_user(db, user_id, 0, 10000)
                data_points.extend([float(r.amount) for r in user_revenues if start_date <= r.date <= end_date])
        
        if forecast_type in ["expense", "profit"]:
            # Get expense data
            if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
                expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                expense_amounts = [float(e.amount) for e in expenses]
                if forecast_type == "profit":
                    # For profit, subtract expenses
                    data_points = [r - e for r, e in zip(data_points, expense_amounts)] if data_points else [-e for e in expense_amounts]
                else:
                    data_points.extend(expense_amounts)
            elif user_role == UserRole.MANAGER:
                from ..crud.user import user as user_crud
                subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
                all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                expense_amounts = [float(e.amount) for e in all_expenses if e.created_by_id in subordinate_ids]
                if forecast_type == "profit":
                    data_points = [r - e for r, e in zip(data_points, expense_amounts)] if data_points else [-e for e in expense_amounts]
                else:
                    data_points.extend(expense_amounts)
            else:
                user_expenses = expense_crud.get_by_user(db, user_id, 0, 10000)
                expense_amounts = [float(e.amount) for e in user_expenses if start_date <= e.date <= end_date]
                if forecast_type == "profit":
                    data_points = [r - e for r, e in zip(data_points, expense_amounts)] if data_points else [-e for e in expense_amounts]
                else:
                    data_points.extend(expense_amounts)
        
        return data_points
    
    @staticmethod
    def _group_by_period(data: List[float], period_type: str = "month") -> Dict[str, float]:
        """Group data points by time period"""
        # For simplicity, assume data points are already grouped or we need to group them
        # In a real implementation, we'd need date information for each data point
        # For now, return a simple aggregation
        if not data:
            return {}
        
        # Simple approach: assume data is already in order and group by index
        # In production, you'd want to group by actual dates
        period_data = {}
        for i, value in enumerate(data):
            period_key = f"period_{i}"
            if period_key not in period_data:
                period_data[period_key] = 0.0
            period_data[period_key] += value
        
        return period_data

