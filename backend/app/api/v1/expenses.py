from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...crud.expense import expense as expense_crud
from ...crud.user import user as user_crud
from ...schemas.expense import ExpenseCreate, ExpenseUpdate, ExpenseOut, ExpenseSummary
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role

router = APIRouter()


@router.get("/", response_model=List[ExpenseOut])
def read_expense_entries(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    category: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get expense entries with optional filtering"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        # Admins can see all entries
        if start_date and end_date:
            entries = expense_crud.get_by_date_range(db, start_date, end_date, skip, limit)
        elif category:
            entries = expense_crud.get_by_category(db, category, skip, limit)
        elif vendor:
            entries = expense_crud.get_by_vendor(db, vendor, skip, limit)
        else:
            entries = expense_crud.get_multi(db, skip, limit)
    elif current_user.role == UserRole.MANAGER:
        # Managers can see their own entries and their subordinates' entries
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        subordinate_ids.append(current_user.id)
        
        if start_date and end_date:
            all_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = expense_crud.get_by_category(db, category, 0, 1000)
        elif vendor:
            all_entries = expense_crud.get_by_vendor(db, vendor, 0, 1000)
        else:
            all_entries = expense_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id in subordinate_ids]
        entries = entries[skip:skip + limit]
    else:
        # Regular users can only see their own entries
        if start_date and end_date:
            all_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = expense_crud.get_by_category(db, category, 0, 1000)
        elif vendor:
            all_entries = expense_crud.get_by_vendor(db, vendor, 0, 1000)
        else:
            all_entries = expense_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id == current_user.id]
        entries = entries[skip:skip + limit]
    
    return entries


@router.get("/{expense_id}", response_model=ExpenseOut)
def read_expense_entry(
    expense_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific expense entry"""
    entry = expense_crud.get(db, id=expense_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can see entries of their subordinates
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
            if entry.created_by_id not in subordinate_ids + [current_user.id]:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only see their own entries
            if entry.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return entry


@router.post("/", response_model=ExpenseOut)
def create_expense_entry(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new expense entry"""
    return expense_crud.create(db, obj_in=expense_data, created_by_id=current_user.id)


@router.put("/{expense_id}", response_model=ExpenseOut)
def update_expense_entry(
    expense_id: int,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update expense entry"""
    entry = expense_crud.get(db, id=expense_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can update entries of their subordinates
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
            if entry.created_by_id not in subordinate_ids + [current_user.id]:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only update their own entries
            if entry.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Cannot update approved entries unless admin
    if entry.is_approved and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=400, detail="Cannot update approved entry")
    
    return expense_crud.update(db, db_obj=entry, obj_in=expense_update)


@router.delete("/{expense_id}")
def delete_expense_entry(
    expense_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete expense entry"""
    entry = expense_crud.get(db, id=expense_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can delete entries of their subordinates
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
            if entry.created_by_id not in subordinate_ids + [current_user.id]:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only delete their own entries
            if entry.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Cannot delete approved entries unless admin
    if entry.is_approved and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=400, detail="Cannot delete approved entry")
    
    expense_crud.delete(db, id=expense_id)
    return {"message": "Expense entry deleted successfully"}


@router.post("/{expense_id}/approve")
def approve_expense_entry(
    expense_id: int,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Approve expense entry (manager and above)"""
    entry = expense_crud.get(db, id=expense_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    
    if entry.is_approved:
        raise HTTPException(status_code=400, detail="Entry already approved")
    
    expense_crud.approve(db, id=expense_id, approved_by_id=current_user.id)
    return {"message": "Expense entry approved successfully"}


@router.get("/summary/total")
def get_expense_total(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get total expenses for a period"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    total = expense_crud.get_total_by_period(db, start_date, end_date)
    return {"total": total, "start_date": start_date, "end_date": end_date}


@router.get("/summary/by-category", response_model=List[ExpenseSummary])
def get_expense_summary_by_category(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get expense summary by category for a period"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    summary = expense_crud.get_summary_by_category(db, start_date, end_date)
    return summary


@router.get("/summary/by-vendor", response_model=List[ExpenseSummary])
def get_expense_summary_by_vendor(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get expense summary by vendor for a period"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    summary = expense_crud.get_summary_by_vendor(db, start_date, end_date)
    return summary


@router.get("/pending-approval", response_model=List[ExpenseOut])
def get_pending_approval(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Get expense entries pending approval"""
    entries = expense_crud.get_pending_approval(db, skip, limit)
    
    # Filter based on hierarchy for managers
    if current_user.role == UserRole.MANAGER:
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        entries = [entry for entry in entries if entry.created_by_id in subordinate_ids]
    
    return entries
