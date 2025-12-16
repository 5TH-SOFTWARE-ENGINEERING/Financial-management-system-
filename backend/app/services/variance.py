# app/services/variance.py
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session # type: ignore[import-untyped]

from ..models.budget import Budget, BudgetItem, BudgetVariance
from ..models.revenue import RevenueEntry
from ..models.expense import ExpenseEntry
from ..models.user import UserRole
from ..crud.budget import budget, budget_item, budget_variance
from ..crud.revenue import revenue as revenue_crud
from ..crud.expense import expense as expense_crud


class VarianceAnalysisService:
    """Service for budget variance analysis"""
    
    @staticmethod
    def calculate_variance(
        db: Session,
        budget_id: int,
        period_start: datetime,
        period_end: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None
    ) -> BudgetVariance:
        """Calculate variance between budget and actuals for a period"""
        budget_obj = budget.get(db, budget_id)
        if not budget_obj:
            raise ValueError("Budget not found")
        
        # Get budgeted amounts for the period
        budget_items = budget_item.get_by_budget(db, budget_id)
        
        budgeted_revenue = 0.0
        budgeted_expenses = 0.0
        
        # Calculate budgeted amounts for this period
        # For simplicity, prorate monthly budgets
        period_days = (period_end - period_start).days
        budget_days = (budget_obj.end_date - budget_obj.start_date).days
        
        for item in budget_items:
            # Prorate based on period
            prorated_amount = (item.amount / budget_days) * period_days if budget_days > 0 else 0
            
            if item.type.value == "revenue":
                budgeted_revenue += prorated_amount
            elif item.type.value == "expense":
                budgeted_expenses += prorated_amount
        
        # Get actual revenue and expenses for the period
        actual_revenue = VarianceAnalysisService._get_actual_revenue(
            db, period_start, period_end, user_id, user_role
        )
        actual_expenses = VarianceAnalysisService._get_actual_expenses(
            db, period_start, period_end, user_id, user_role
        )
        
        actual_profit = actual_revenue - actual_expenses
        budgeted_profit = budgeted_revenue - budgeted_expenses
        
        # Calculate variances
        revenue_variance = actual_revenue - budgeted_revenue
        expense_variance = actual_expenses - budgeted_expenses
        profit_variance = actual_profit - budgeted_profit
        
        # Calculate variance percentages
        revenue_variance_percent = (revenue_variance / budgeted_revenue * 100) if budgeted_revenue > 0 else 0
        expense_variance_percent = (expense_variance / budgeted_expenses * 100) if budgeted_expenses > 0 else 0
        profit_variance_percent = (profit_variance / budgeted_profit * 100) if budgeted_profit != 0 else 0
        
        # Create or update variance record
        variance_data = {
            "budget_id": budget_id,
            "period_start": period_start,
            "period_end": period_end,
            "budgeted_revenue": budgeted_revenue,
            "budgeted_expenses": budgeted_expenses,
            "budgeted_profit": budgeted_profit,
            "actual_revenue": actual_revenue,
            "actual_expenses": actual_expenses,
            "actual_profit": actual_profit,
            "revenue_variance": revenue_variance,
            "expense_variance": expense_variance,
            "profit_variance": profit_variance,
            "revenue_variance_percent": revenue_variance_percent,
            "expense_variance_percent": expense_variance_percent,
            "profit_variance_percent": profit_variance_percent,
            "created_by_id": user_id or budget_obj.created_by_id
        }
        
        variance = budget_variance.create(db, variance_data)
        return variance
    
    @staticmethod
    def _get_actual_revenue(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int],
        user_role: Optional[UserRole]
    ) -> float:
        """Get actual revenue for a period"""
        if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            return revenue_crud.get_total_by_period(db, start_date, end_date)
        elif user_role == UserRole.MANAGER:
            from ..crud.user import user as user_crud
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
            all_revenues = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            return sum(float(r.amount) for r in all_revenues if r.created_by_id in subordinate_ids and r.is_approved)
        else:
            user_revenues = revenue_crud.get_by_user(db, user_id, 0, 10000)
            return sum(float(r.amount) for r in user_revenues if start_date <= r.date <= end_date and r.is_approved)
    
    @staticmethod
    def _get_actual_expenses(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int],
        user_role: Optional[UserRole]
    ) -> float:
        """Get actual expenses for a period"""
        if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
            return expense_crud.get_total_by_period(db, start_date, end_date)
        elif user_role == UserRole.MANAGER:
            from ..crud.user import user as user_crud
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
            all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
            return sum(float(e.amount) for e in all_expenses if e.created_by_id in subordinate_ids and e.is_approved)
        else:
            user_expenses = expense_crud.get_by_user(db, user_id, 0, 10000)
            return sum(float(e.amount) for e in user_expenses if start_date <= e.date <= end_date and e.is_approved)
    
    @staticmethod
    def get_variance_summary(
        db: Session,
        budget_id: int,
        limit: int = 12
    ) -> List[Dict]:
        """Get variance summary for a budget (last N periods)"""
        variances = budget_variance.get_by_budget(db, budget_id, 0, limit)
        
        return [
            {
                "period_start": v.period_start.isoformat(),
                "period_end": v.period_end.isoformat(),
                "revenue_variance": v.revenue_variance,
                "revenue_variance_percent": v.revenue_variance_percent,
                "expense_variance": v.expense_variance,
                "expense_variance_percent": v.expense_variance_percent,
                "profit_variance": v.profit_variance,
                "profit_variance_percent": v.profit_variance_percent,
                "budgeted_revenue": v.budgeted_revenue,
                "actual_revenue": v.actual_revenue,
                "budgeted_expenses": v.budgeted_expenses,
                "actual_expenses": v.actual_expenses
            }
            for v in variances
        ]

