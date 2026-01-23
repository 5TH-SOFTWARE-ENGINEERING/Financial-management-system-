from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...crud.account_mapping import account_mapping as crud_mapping
from ...schemas import account_mapping as schema_mapping

router = APIRouter()

@router.get("/", response_model=List[schema_mapping.AccountMapping])
def get_mappings(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Retrieve all account mappings.
    """
    return crud_mapping.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=schema_mapping.AccountMapping)
def create_mapping(
    mapping_in: schema_mapping.AccountMappingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Create or update an account mapping.
    """
    return crud_mapping.create(db, mapping_in, current_user.id)

@router.delete("/{mapping_id}", response_model=schema_mapping.AccountMapping)
def delete_mapping(
    mapping_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Delete an account mapping.
    """
    return crud_mapping.delete(db, mapping_id)
