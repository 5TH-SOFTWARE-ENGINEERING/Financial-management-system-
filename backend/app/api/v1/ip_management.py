from fastapi import APIRouter, Depends, HTTPException, status, Query # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List, Any

from ...core.database import get_db
from ...crud.ip_restriction import ip_restriction as ip_crud
from ...models.user import User, UserRole
from ...api.deps import require_min_role
from ...schemas.ip_restriction import IPRestrictionCreate, IPRestrictionUpdate, IPRestrictionOut

router = APIRouter()

@router.get("/", response_model=List[IPRestrictionOut])
def get_ip_restrictions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
) -> Any:
    """Retrieve IP restrictions (Admin only)"""
    return ip_crud.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=IPRestrictionOut, status_code=status.HTTP_201_CREATED)
def create_ip_restriction(
    *,
    db: Session = Depends(get_db),
    ip_in: IPRestrictionCreate,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
) -> Any:
    """Create new IP restriction (Admin only)"""
    existing = ip_crud.get_by_ip(db, ip_address=ip_in.ip_address)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="IP restriction for this address already exists.",
        )
    return ip_crud.create(db, obj_in=ip_in)

@router.put("/{ip_id}", response_model=IPRestrictionOut)
def update_ip_restriction(
    *,
    db: Session = Depends(get_db),
    ip_id: int,
    ip_in: IPRestrictionUpdate,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
) -> Any:
    """Update an IP restriction (Admin only)"""
    db_obj = ip_crud.get(db, id=ip_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="IP restriction not found")
    return ip_crud.update(db, db_obj=db_obj, obj_in=ip_in)

@router.delete("/{ip_id}", response_model=IPRestrictionOut)
def delete_ip_restriction(
    *,
    db: Session = Depends(get_db),
    ip_id: int,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
) -> Any:
    """Delete an IP restriction (Admin only)"""
    db_obj = ip_crud.get(db, id=ip_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="IP restriction not found")
    return ip_crud.delete(db, id=ip_id)
