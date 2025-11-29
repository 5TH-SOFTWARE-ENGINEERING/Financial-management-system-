from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...core.database import get_db
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role

router = APIRouter()


@router.get("/")
def get_projects(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all projects - note: This is a stub implementation"""
    # Return empty list as projects feature is not fully implemented
    return []


@router.get("/{project_id}")
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific project"""
    raise HTTPException(
        status_code=404, 
        detail="Project not found. Projects feature is not yet implemented."
    )


@router.post("/")
def create_project(
    project_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create project - note: This is a stub"""
    raise HTTPException(
        status_code=501,
        detail="Projects feature is not yet implemented. Please contact your administrator."
    )


@router.put("/{project_id}")
def update_project(
    project_id: int,
    project_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update project - note: This is a stub"""
    raise HTTPException(
        status_code=501,
        detail="Projects feature is not yet implemented. Please contact your administrator."
    )


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete project - note: This is a stub"""
    raise HTTPException(
        status_code=501,
        detail="Projects feature is not yet implemented. Please contact your administrator."
    )

