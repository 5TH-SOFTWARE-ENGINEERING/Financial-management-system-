# app/services/budgeting.py
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import func # type: ignore[import-untyped]

from ..models.budget import Budget, BudgetItem, BudgetScenario, BudgetStatus, BudgetType
from ..models.revenue import RevenueEntry
from ..models.expense import ExpenseEntry
from ..models.user import UserRole
from ..crud.budget import budget, budget_item, budget_scenario
from ..crud.revenue import revenue as revenue_crud
from ..crud.expense import expense as expense_crud
from ..crud.user import user as user_crud


class BudgetingService:
    """Service for budget management and operations"""
    
    @staticmethod
    def create_budget_from_template(
        db: Session,
        template_name: str,
        user_id: int,
        start_date: datetime,
        end_date: datetime,
        **kwargs
    ) -> Budget:
        """Create a budget from a predefined template"""
        templates = BudgetingService._get_templates()
        
        if template_name not in templates:
            raise ValueError(f"Template '{template_name}' not found")
        
        template = templates[template_name]
        
        # Create budget
        budget_data = {
            "name": kwargs.get("name", template["name"]),
            "description": kwargs.get("description", template.get("description", "")),
            "period": kwargs.get("period", template.get("period", "monthly")),
            "start_date": start_date,
            "end_date": end_date,
            "department": kwargs.get("department"),
            "project": kwargs.get("project"),
            "status": BudgetStatus.DRAFT,
            "created_by_id": user_id
        }
        
        new_budget = budget.create(db, budget_data)
        
        # Add template items
        for item_template in template.get("items", []):
            item_data = {
                "budget_id": new_budget.id,
                "name": item_template["name"],
                "description": item_template.get("description", ""),
                "type": BudgetType(item_template["type"]),
                "category": item_template["category"],
                "amount": item_template.get("amount", 0.0),
                "monthly_amounts": json.dumps(item_template.get("monthly_amounts", {})) if item_template.get("monthly_amounts") else None
            }
            budget_item.create(db, item_data)
        
        # Recalculate totals
        totals = budget.calculate_totals(db, new_budget.id)
        budget.update(db, new_budget.id, totals)
        
        return new_budget
    
    @staticmethod
    def _get_templates() -> Dict[str, Any]:
        """Get predefined budget templates"""
        return {
            "monthly_department": {
                "name": "Monthly Department Budget",
                "description": "Standard monthly budget template for departments",
                "period": "monthly",
                "items": [
                    {"name": "Department Revenue", "type": "revenue", "category": "sales", "amount": 0.0},
                    {"name": "Salaries", "type": "expense", "category": "salary", "amount": 0.0},
                    {"name": "Office Supplies", "type": "expense", "category": "supplies", "amount": 0.0},
                    {"name": "Marketing", "type": "expense", "category": "marketing", "amount": 0.0},
                ]
            },
            "quarterly_project": {
                "name": "Quarterly Project Budget",
                "description": "Budget template for quarterly projects",
                "period": "quarterly",
                "items": [
                    {"name": "Project Revenue", "type": "revenue", "category": "services", "amount": 0.0},
                    {"name": "Project Expenses", "type": "expense", "category": "other", "amount": 0.0},
                    {"name": "Equipment", "type": "expense", "category": "equipment", "amount": 0.0},
                    {"name": "Travel", "type": "expense", "category": "travel", "amount": 0.0},
                ]
            },
            "yearly_company": {
                "name": "Annual Company Budget",
                "description": "Comprehensive yearly budget",
                "period": "yearly",
                "items": [
                    {"name": "Total Revenue", "type": "revenue", "category": "sales", "amount": 0.0},
                    {"name": "Total Expenses", "type": "expense", "category": "other", "amount": 0.0},
                    {"name": "Salaries", "type": "expense", "category": "salary", "amount": 0.0},
                    {"name": "Rent", "type": "expense", "category": "rent", "amount": 0.0},
                    {"name": "Utilities", "type": "expense", "category": "utilities", "amount": 0.0},
                ]
            }
        }
    
    @staticmethod
    def validate_budget_items(db: Session, budget_id: int) -> Dict[str, Any]:
        """Validate budget items (e.g., totals match subtotals, positive numbers)"""
        items = budget_item.get_by_budget(db, budget_id)
        errors = []
        warnings = []
        
        revenue_total = 0.0
        expense_total = 0.0
        
        for item in items:
            # Check for positive amounts
            if item.amount < 0:
                errors.append(f"Item '{item.name}' has negative amount: {item.amount}")
            
            # Sum by type
            if item.type.value == "revenue":
                revenue_total += item.amount
            elif item.type.value == "expense":
                expense_total += item.amount
            
            # Validate monthly breakdown if exists
            if item.monthly_amounts:
                try:
                    monthly_data = json.loads(item.monthly_amounts)
                    monthly_sum = sum(monthly_data.values())
                    if abs(monthly_sum - item.amount) > 0.01:  # Allow small rounding differences
                        warnings.append(f"Item '{item.name}': Monthly breakdown sum ({monthly_sum}) doesn't match total ({item.amount})")
                except (json.JSONDecodeError, ValueError):
                    errors.append(f"Item '{item.name}': Invalid monthly_amounts JSON")
        
        # Validate budget totals match item totals
        budget_obj = budget.get(db, budget_id)
        if budget_obj:
            if abs(budget_obj.total_revenue - revenue_total) > 0.01:
                warnings.append(f"Budget total revenue ({budget_obj.total_revenue}) doesn't match item sum ({revenue_total})")
            if abs(budget_obj.total_expenses - expense_total) > 0.01:
                warnings.append(f"Budget total expenses ({budget_obj.total_expenses}) doesn't match item sum ({expense_total})")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "revenue_total": revenue_total,
            "expense_total": expense_total,
            "profit": revenue_total - expense_total
        }
    
    @staticmethod
    def calculate_scenario(
        db: Session,
        budget_id: int,
        scenario_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate scenario based on adjustments"""
        budget_obj = budget.get(db, budget_id)
        if not budget_obj:
            raise ValueError("Budget not found")
        
        items = budget_item.get_by_budget(db, budget_id)
        adjustments = scenario_data.get("adjustments", {})
        
        scenario_revenue = 0.0
        scenario_expenses = 0.0
        
        for item in items:
            adjustment = adjustments.get(str(item.id), {})
            multiplier = adjustment.get("amount_multiplier", 1.0)
            fixed_amount = adjustment.get("amount", None)
            
            if fixed_amount is not None:
                adjusted_amount = fixed_amount
            else:
                adjusted_amount = item.amount * multiplier
            
            if item.type.value == "revenue":
                scenario_revenue += adjusted_amount
            elif item.type.value == "expense":
                scenario_expenses += adjusted_amount
        
        scenario_profit = scenario_revenue - scenario_expenses
        
        return {
            "total_revenue": scenario_revenue,
            "total_expenses": scenario_expenses,
            "total_profit": scenario_profit,
            "revenue_change": scenario_revenue - budget_obj.total_revenue,
            "expense_change": scenario_expenses - budget_obj.total_expenses,
            "profit_change": scenario_profit - budget_obj.total_profit
        }
    
    @staticmethod
    def compare_scenarios(
        db: Session,
        budget_id: int,
        scenario_ids: List[int]
    ) -> Dict[str, Any]:
        """Compare multiple scenarios side by side"""
        scenarios = []
        for scenario_id in scenario_ids:
            scenario_obj = budget_scenario.get(db, scenario_id)
            if scenario_obj and scenario_obj.budget_id == budget_id:
                scenarios.append({
                    "id": scenario_obj.id,
                    "name": scenario_obj.name,
                    "type": scenario_obj.scenario_type,
                    "total_revenue": scenario_obj.total_revenue,
                    "total_expenses": scenario_obj.total_expenses,
                    "total_profit": scenario_obj.total_profit
                })
        
        # Get base budget
        budget_obj = budget.get(db, budget_id)
        base = {
            "name": "Base Budget",
            "total_revenue": budget_obj.total_revenue if budget_obj else 0.0,
            "total_expenses": budget_obj.total_expenses if budget_obj else 0.0,
            "total_profit": budget_obj.total_profit if budget_obj else 0.0
        }
        
        return {
            "base": base,
            "scenarios": scenarios
        }

    @staticmethod
    def check_and_notify_exceeded_budgets(
        db: Session,
        expense_entry: ExpenseEntry
    ):
        """Check if this expense causes any budgets to be exceeded"""
        from ..services.notification_service import NotificationService
        from ..models.notification import NotificationType
        
        # Find active budgets for this date
        active_budgets = db.query(Budget).filter(
            Budget.start_date <= expense_entry.date,
            Budget.end_date >= expense_entry.date,
            Budget.status == BudgetStatus.ACTIVE
        ).all()
        
        for bud in active_budgets:
            # Check department/project constraints if they exist
            if bud.department:
                # Need to load user to check department
                # Assuming expense_entry.created_by is available or we query it
                if not expense_entry.created_by:
                    # Try to load user if not present (though usually it is via relationship)
                    user = user_crud.get(db, expense_entry.created_by_id)
                    if not user or user.department != bud.department:
                        continue
                elif expense_entry.created_by.department != bud.department:
                    continue
            
            if bud.project and expense_entry.project_id:
                # If budget is for a project, check if expense matches
                # Note: ExpenseEntry might not have project_id directly exposed in all schemas
                # Assuming we skip project check for now or handle it if model supports it
                pass

            # Check specific budget items matching the category
            items = budget_item.get_by_budget(db, bud.id)
            for item in items:
                if item.category == expense_entry.category or item.category == "all":
                    # Calculate total expenses for this category in this budget period
                    # We use a direct query for performance
                    total_spent = db.query(func.sum(ExpenseEntry.amount)).filter(
                        ExpenseEntry.date >= bud.start_date,
                        ExpenseEntry.date <= bud.end_date,
                        ExpenseEntry.category == expense_entry.category if item.category != "all" else True,
                        ExpenseEntry.is_approved == True 
                    ).scalar() or 0.0
                    
                    # Include CURRENT expense if it's not approved yet? 
                    # Usually we warn even if pending. 
                    # If the standard query checks 'is_approved=True', and this new one is pending,
                    # we should add it to the total to see if it WILL exceed.
                    current_amount = float(expense_entry.amount)
                    if not expense_entry.is_approved:
                        total_spent += current_amount
                    
                    if total_spent > item.amount:
                        # Budget exceeded!
                        exceeded_amount = total_spent - item.amount
                        percentage = (total_spent / item.amount) * 100
                        
                        # Notify the budget creator and the expense creator
                        NotificationService.notify_budget_exceeded(
                            db=db,
                            budget_id=bud.id,
                            user_id=bud.created_by_id,
                            budget_name=bud.name,
                            category_name=item.name,
                            spent_amount=total_spent,
                            budget_amount=item.amount
                        )
                        
                        if expense_entry.created_by_id != bud.created_by_id:
                             NotificationService.notify_budget_exceeded(
                                db=db,
                                budget_id=bud.id,
                                user_id=expense_entry.created_by_id,
                                budget_name=bud.name,
                                category_name=item.name,
                                spent_amount=total_spent,
                                budget_amount=item.amount
                            )
