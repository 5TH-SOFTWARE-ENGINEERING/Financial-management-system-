from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...core.database import get_db
from ...crud.revenue import revenue as revenue_crud
from ...crud.user import user as user_crud
from ...crud.approval import approval as approval_crud
from ...schemas.revenue import RevenueCreate, RevenueUpdate, RevenueOut, RevenueSummary
from ...models.user import User, UserRole
from ...models.approval import ApprovalStatus
from ...api.deps import get_current_active_user, require_min_role
from ...core.security import verify_password
from pydantic import BaseModel

router = APIRouter()


@router.get("/", response_model=List[RevenueOut])
def read_revenue_entries(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get revenue entries with optional filtering"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        # Admins and Finance Managers can see all entries
        # For reports, allow fetching all data by using a very high limit
        effective_limit = limit if limit <= 10000 else 10000
        if start_date and end_date:
            entries = revenue_crud.get_by_date_range(db, start_date, end_date, skip, effective_limit)
        elif category:
            entries = revenue_crud.get_by_category(db, category, skip, effective_limit)
        else:
            entries = revenue_crud.get_multi(db, skip, effective_limit)
    elif current_user.role == UserRole.MANAGER:
        # Managers can see their own entries and their subordinates' entries
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        subordinate_ids.append(current_user.id)
        
        if start_date and end_date:
            all_entries = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = revenue_crud.get_by_category(db, category, 0, 1000)
        else:
            all_entries = revenue_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id in subordinate_ids]
        entries = entries[skip:skip + limit]
    else:
        # Regular users can only see their own entries
        if start_date and end_date:
            all_entries = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 1000)
        elif category:
            all_entries = revenue_crud.get_by_category(db, category, 0, 1000)
        else:
            all_entries = revenue_crud.get_multi(db, 0, 1000)
        
        entries = [entry for entry in all_entries if entry.created_by_id == current_user.id]
        entries = entries[skip:skip + limit]
    
    return entries


@router.get("/{revenue_id}", response_model=RevenueOut)
def read_revenue_entry(
    revenue_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific revenue entry"""
    entry = revenue_crud.get(db, id=revenue_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Revenue entry not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
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


@router.post("/", response_model=RevenueOut)
def create_revenue_entry(
    revenue_data: RevenueCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new revenue entry"""
    return revenue_crud.create(db, obj_in=revenue_data, created_by_id=current_user.id)


@router.put("/{revenue_id}", response_model=RevenueOut)
def update_revenue_entry(
    revenue_id: int,
    revenue_update: RevenueUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update revenue entry"""
    entry = revenue_crud.get(db, id=revenue_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Revenue entry not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can update entries of their subordinates
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
            if entry.created_by_id not in subordinate_ids + [current_user.id]:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only update their own entries
            if entry.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Cannot update approved entries unless admin or finance manager
    if entry.is_approved and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=400, detail="Cannot update approved entry")
    
    return revenue_crud.update(db, db_obj=entry, obj_in=revenue_update)


class DeleteRevenueRequest(BaseModel):
    password: str

@router.post("/{revenue_id}/delete")
def delete_revenue_entry(
    revenue_id: int,
    delete_request: DeleteRevenueRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete revenue entry - requires password verification"""
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
            detail="Password is required to delete a revenue entry."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this revenue entry."
        )
    
    entry = revenue_crud.get(db, id=revenue_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Revenue entry not found")
    
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can delete entries of their subordinates
            subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
            if entry.created_by_id not in subordinate_ids + [current_user.id]:
                raise HTTPException(status_code=403, detail="Not enough permissions")
        else:
            # Regular users can only delete their own entries
            if entry.created_by_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Cannot delete approved entries unless admin or finance manager
    if entry.is_approved and current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        raise HTTPException(status_code=400, detail="Cannot delete approved entry")
    
    revenue_crud.delete(db, id=revenue_id)
    return {"message": "Revenue entry deleted successfully"}


@router.post("/{revenue_id}/approve")
def approve_revenue_entry(
    revenue_id: int,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Approve revenue entry (manager and above)"""
    entry = revenue_crud.get(db, id=revenue_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Revenue entry not found")
    
    if entry.is_approved:
        raise HTTPException(status_code=400, detail="Entry already approved")
    
    revenue_crud.approve(db, id=revenue_id, approved_by_id=current_user.id)
    return {"message": "Revenue entry approved successfully"}


class RejectRequest(BaseModel):
    reason: str
    password: str


@router.post("/{revenue_id}/reject")
def reject_revenue_entry(
    revenue_id: int,
    reject_request: RejectRequest,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Reject revenue entry by rejecting its approval workflow (manager and above)"""
    entry = revenue_crud.get(db, id=revenue_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Revenue entry not found")
    
    if entry.is_approved:
        raise HTTPException(status_code=400, detail="Entry already approved")
    
    # Find the approval workflow for this revenue entry, create one if it doesn't exist
    approval_workflow = approval_crud.get_by_revenue_entry(db, revenue_id)
    if approval_workflow is None:
        # Auto-create approval workflow if it doesn't exist
        from ...schemas.approval import ApprovalCreate
        from ...models.approval import ApprovalType
        
        approval_data = ApprovalCreate(
            title=entry.title or f"Revenue Entry #{revenue_id}",
            description=entry.description or f"Revenue entry for {entry.title}",
            type=ApprovalType.REVENUE,
            revenue_entry_id=revenue_id
        )
        approval_workflow = approval_crud.create(db, obj_in=approval_data, requester_id=entry.created_by_id)
    
    if approval_workflow.status != ApprovalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Approval workflow is not pending")
    
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
    
    # Verify password before rejection
    if not reject_request.password or not reject_request.password.strip():
        raise HTTPException(
            status_code=400,
            detail="Password is required to reject a revenue entry."
        )
    
    # Verify password
    password_to_verify = reject_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to reject this revenue entry."
        )
    
    # Check permissions - manager can reject if requester is their subordinate
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            subordinate_ids = [sub.id for sub in subordinates]
            if approval_workflow.requester_id not in subordinate_ids:
                raise HTTPException(status_code=403, detail="Not enough permissions to reject this request")
        else:
            raise HTTPException(status_code=403, detail="Not enough permissions to reject revenue entries")
    
    # Reject the approval workflow
    approval_crud.reject(db, approval_workflow.id, current_user.id, reject_request.reason)
    return {"message": "Revenue entry rejected successfully"}


@router.get("/summary/total")
def get_revenue_total(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get total revenue for a period"""
    # Allow admin, super_admin, finance_manager, and manager roles
    allowed_roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    total = revenue_crud.get_total_by_period(db, start_date, end_date)
    return {"total": float(total), "start_date": start_date.isoformat(), "end_date": end_date.isoformat()}


@router.get("/summary/by-category")
def get_revenue_summary_by_category(
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get revenue summary by category for a period"""
    # Allow admin, super_admin, finance_manager, and manager roles
    allowed_roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.MANAGER]
    if current_user.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    summary = revenue_crud.get_summary_by_category(db, start_date, end_date)
    # Convert category enum to string and ensure total is a float
    result = []
    for item in summary:
        category = item["category"]
        # Handle enum category
        if hasattr(category, "value"):
            category_str = category.value
        elif isinstance(category, str):
            category_str = category
        else:
            category_str = str(category)
        
        result.append({
            "category": category_str,
            "total": float(item["total"]) if item["total"] is not None else 0.0,
            "count": int(item["count"]) if item["count"] is not None else 0
        })
    return result


@router.get("/pending-approval", response_model=List[RevenueOut])
def get_pending_approval(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Get revenue entries pending approval"""
    entries = revenue_crud.get_pending_approval(db, skip, limit)
    
    # Filter based on hierarchy for managers
    if current_user.role == UserRole.MANAGER:
        subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, current_user.id)]
        entries = [entry for entry in entries if entry.created_by_id in subordinate_ids]
    
    return entries