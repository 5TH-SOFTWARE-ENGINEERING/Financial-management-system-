from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ...core.database import get_db
from ...models.user import User, UserRole
from ...models.project import Project
from ...api.deps import get_current_active_user, require_min_role
from ...crud.project import project as project_crud
from ...crud.user import user as user_crud
from ...schemas.project import ProjectCreate, ProjectUpdate, ProjectOut

router = APIRouter()


@router.get("/", response_model=List[ProjectOut])
def get_projects(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    department: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all projects"""
    projects = project_crud.get_multi(
        db, 
        skip=skip, 
        limit=limit,
        status=status,
        department=department
    )
    
    # Format response with department names and user names
    result = []
    for proj in projects:
        # Populate assigned_users_names from user IDs
        assigned_users_names = []
        if proj.assigned_users:
            for user_id in proj.assigned_users:
                try:
                    user = user_crud.get(db, id=int(user_id))
                    if user:
                        assigned_users_names.append(user.full_name or user.username or f"User {user_id}")
                except (ValueError, TypeError):
                    # Skip invalid user IDs
                    continue
        
        project_dict = {
            "id": proj.id,
            "name": proj.name,
            "description": proj.description,
            "department_id": proj.department_id,
            "department_name": proj.department_id.replace("_", " ").title() if proj.department_id else None,
            "assigned_users": proj.assigned_users or [],
            "assigned_users_names": assigned_users_names,
            "budget": proj.budget,
            "start_date": proj.start_date.isoformat() if proj.start_date else None,
            "end_date": proj.end_date.isoformat() if proj.end_date else None,
            "is_active": proj.is_active,
            "created_at": proj.created_at.isoformat() if proj.created_at else None,
            "updated_at": proj.updated_at.isoformat() if proj.updated_at else None,
            "created_by_id": proj.created_by_id,
        }
        result.append(project_dict)
    
    return result


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific project"""
    project = project_crud.get(db, id=project_id)
    if project is None:
        raise HTTPException(
            status_code=404, 
            detail="Project not found"
        )
    
    # Populate assigned_users_names from user IDs
    assigned_users_names = []
    if project.assigned_users:
        for user_id in project.assigned_users:
            try:
                user = user_crud.get(db, id=int(user_id))
                if user:
                    assigned_users_names.append(user.full_name or user.username or f"User {user_id}")
            except (ValueError, TypeError):
                # Skip invalid user IDs
                continue
    
    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "department_id": project.department_id,
        "department_name": project.department_id.replace("_", " ").title() if project.department_id else None,
        "assigned_users": project.assigned_users or [],
        "assigned_users_names": assigned_users_names,
        "budget": project.budget,
        "start_date": project.start_date.isoformat() if project.start_date else None,
        "end_date": project.end_date.isoformat() if project.end_date else None,
        "is_active": project.is_active,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "created_by_id": project.created_by_id,
    }


@router.post("/", response_model=ProjectOut)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create project"""
    try:
        project = project_crud.create(db, obj_in=project_data, created_by_id=current_user.id)
        
        # Populate assigned_users_names from user IDs
        assigned_users_names = []
        if project.assigned_users:
            for user_id in project.assigned_users:
                try:
                    user = user_crud.get(db, id=int(user_id))
                    if user:
                        assigned_users_names.append(user.full_name or user.username or f"User {user_id}")
                except (ValueError, TypeError):
                    # Skip invalid user IDs
                    continue
        
        return {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "department_id": project.department_id,
            "department_name": project.department_id.replace("_", " ").title() if project.department_id else None,
            "assigned_users": project.assigned_users or [],
            "assigned_users_names": assigned_users_names,
            "budget": project.budget,
            "start_date": project.start_date.isoformat() if project.start_date else None,
            "end_date": project.end_date.isoformat() if project.end_date else None,
            "is_active": project.is_active,
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "updated_at": project.updated_at.isoformat() if project.updated_at else None,
            "created_by_id": project.created_by_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to create project: {str(e)}"
        )


@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update project"""
    project = project_crud.get(db, id=project_id)
    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )
    
    # Check permissions - users can only update their own projects unless admin
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
        if project.created_by_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions to update this project"
            )
    
    try:
        updated_project = project_crud.update(db, db_obj=project, obj_in=project_data)
        
        # Populate assigned_users_names from user IDs
        assigned_users_names = []
        if updated_project.assigned_users:
            for user_id in updated_project.assigned_users:
                try:
                    user = user_crud.get(db, id=int(user_id))
                    if user:
                        assigned_users_names.append(user.full_name or user.username or f"User {user_id}")
                except (ValueError, TypeError):
                    # Skip invalid user IDs
                    continue
        
        return {
            "id": updated_project.id,
            "name": updated_project.name,
            "description": updated_project.description,
            "department_id": updated_project.department_id,
            "department_name": updated_project.department_id.replace("_", " ").title() if updated_project.department_id else None,
            "assigned_users": updated_project.assigned_users or [],
            "assigned_users_names": assigned_users_names,
            "budget": updated_project.budget,
            "start_date": updated_project.start_date.isoformat() if updated_project.start_date else None,
            "end_date": updated_project.end_date.isoformat() if updated_project.end_date else None,
            "is_active": updated_project.is_active,
            "created_at": updated_project.created_at.isoformat() if updated_project.created_at else None,
            "updated_at": updated_project.updated_at.isoformat() if updated_project.updated_at else None,
            "created_by_id": updated_project.created_by_id,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to update project: {str(e)}"
        )


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete project"""
    project = project_crud.get(db, id=project_id)
    if project is None:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )
    
    project_crud.delete(db, id=project_id)
    return {"message": "Project deleted successfully"}

