from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from ...core.database import get_db
from ...crud.revenue import revenue as revenue_crud
from ...crud.expense import expense as expense_crud
from ...crud.user import user as user_crud
from ...crud.approval import approval as approval_crud
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role

router = APIRouter()


@router.get("/overview")
def get_dashboard_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get dashboard overview with key metrics"""
    # Default to last 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Full overview for admins
        total_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
        total_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
        profit = total_revenue - total_expenses
        
        revenue_summary = revenue_crud.get_summary_by_category(db, start_date, end_date)
        expense_summary = expense_crud.get_summary_by_category(db, start_date, end_date)
        
        pending_approvals = len(approval_crud.get_pending(db))
        
        return {
            "period": {
                "start_date": start_date,
                "end_date": end_date,
                "days": 30
            },
            "financials": {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "profit": profit,
                "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
            },
            "revenue_by_category": revenue_summary,
            "expenses_by_category": expense_summary,
            "pending_approvals": pending_approvals
        }
    
    elif current_user.role == UserRole.MANAGER:
        # Manager overview - includes their team's data
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        subordinate_ids.append(current_user.id)
        
        # Get all revenue and expenses for the period
        all_revenue = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        
        # Filter for team members
        team_revenue = [r for r in all_revenue if r.created_by_id in subordinate_ids]
        team_expenses = [e for e in all_expenses if e.created_by_id in subordinate_ids]
        
        total_revenue = sum(float(r.amount) for r in team_revenue)
        total_expenses = sum(float(e.amount) for e in team_expenses)
        profit = total_revenue - total_expenses
        
        # Get pending approvals for their team
        all_pending = approval_crud.get_pending(db)
        team_pending = [p for p in all_pending if p.requester_id in subordinate_ids]
        
        return {
            "period": {
                "start_date": start_date,
                "end_date": end_date,
                "days": 30
            },
            "financials": {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "profit": profit,
                "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
            },
            "team_stats": {
                "team_size": len(subordinate_ids),
                "pending_approvals": len(team_pending)
            }
        }
    
    else:
        # Regular user overview - only their own data
        user_revenue = revenue_crud.get_by_user(db, current_user.id, 0, 1000)
        user_expenses = expense_crud.get_by_user(db, current_user.id, 0, 1000)
        
        # Filter by date range
        user_revenue_period = [r for r in user_revenue if start_date <= r.date <= end_date]
        user_expenses_period = [e for e in user_expenses if start_date <= e.date <= end_date]
        
        total_revenue = sum(float(r.amount) for r in user_revenue_period)
        total_expenses = sum(float(e.amount) for e in user_expenses_period)
        profit = total_revenue - total_expenses
        
        # Get their pending approvals
        user_pending = approval_crud.get_by_requester(db, current_user.id)
        pending_count = len([p for p in user_pending if p.status.value == "pending"])
        
        return {
            "period": {
                "start_date": start_date,
                "end_date": end_date,
                "days": 30
            },
            "financials": {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "profit": profit,
                "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
            },
            "personal_stats": {
                "revenue_entries": len(user_revenue_period),
                "expense_entries": len(user_expenses_period),
                "pending_approvals": pending_count
            }
        }


@router.get("/kpi")
@router.get("/kpis")
def get_kpi_metrics(
    period: str = Query("month", regex="^(week|month|quarter|year)$"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get KPI metrics for different time periods"""
    # Calculate date range based on period
    end_date = datetime.utcnow()
    
    if period == "week":
        start_date = end_date - timedelta(days=7)
        prev_start = end_date - timedelta(days=14)
        prev_end = start_date
    elif period == "month":
        start_date = end_date - timedelta(days=30)
        prev_start = end_date - timedelta(days=60)
        prev_end = start_date
    elif period == "quarter":
        start_date = end_date - timedelta(days=90)
        prev_start = end_date - timedelta(days=180)
        prev_end = start_date
    else:  # year
        start_date = end_date - timedelta(days=365)
        prev_start = end_date - timedelta(days=730)
        prev_end = start_date
    
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Current period metrics
    current_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
    current_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
    current_profit = current_revenue - current_expenses
    
    # Previous period metrics for comparison
    prev_revenue = revenue_crud.get_total_by_period(db, prev_start, prev_end)
    prev_expenses = expense_crud.get_total_by_period(db, prev_start, prev_end)
    prev_profit = prev_revenue - prev_expenses
    
    # Calculate growth percentages
    revenue_growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
    expense_growth = ((current_expenses - prev_expenses) / prev_expenses * 100) if prev_expenses > 0 else 0
    profit_growth = ((current_profit - prev_profit) / prev_profit * 100) if prev_profit != 0 else 0
    
    return {
        "period": period,
        "current_period": {
            "start_date": start_date,
            "end_date": end_date,
            "revenue": current_revenue,
            "expenses": current_expenses,
            "profit": current_profit
        },
        "previous_period": {
            "start_date": prev_start,
            "end_date": prev_end,
            "revenue": prev_revenue,
            "expenses": prev_expenses,
            "profit": prev_profit
        },
        "growth": {
            "revenue_growth_percent": revenue_growth,
            "expense_growth_percent": expense_growth,
            "profit_growth_percent": profit_growth
        }
    }


@router.get("/recent-activity")
def get_recent_activity(
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get recent activity for the current user"""
    # Get recent revenue entries
    recent_revenue = revenue_crud.get_by_user(db, current_user.id, 0, limit)
    
    # Get recent expense entries  
    recent_expenses = expense_crud.get_by_user(db, current_user.id, 0, limit)
    
    # Get recent approval requests
    recent_approvals = approval_crud.get_by_requester(db, current_user.id, 0, limit)
    
    # Combine and sort by date
    activities = []
    
    for rev in recent_revenue[:5]:
        activities.append({
            "type": "revenue",
            "id": rev.id,
            "title": rev.title,
            "amount": rev.amount,
            "date": rev.created_at,
            "status": "approved" if rev.is_approved else "pending"
        })
    
    for exp in recent_expenses[:5]:
        activities.append({
            "type": "expense",
            "id": exp.id,
            "title": exp.title,
            "amount": exp.amount,
            "date": exp.created_at,
            "status": "approved" if exp.is_approved else "pending"
        })
    
    for appr in recent_approvals[:5]:
        activities.append({
            "type": "approval",
            "id": appr.id,
            "title": appr.title,
            "amount": None,
            "date": appr.created_at,
            "status": appr.status.value
        })
    
    # Sort by date descending
    activities.sort(key=lambda x: x["date"], reverse=True)
    
    return activities[:limit]
