from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from ...core.database import get_db
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role
from ...core.security import verify_password

router = APIRouter()


@router.get("/")
def get_departments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all departments - returns unique departments from users"""
    # Extract unique departments from users
    departments = db.query(User.department).filter(
        User.department.isnot(None),
        User.department != ""
    ).distinct().all()
    
    # Format response
    result = []
    for (dept,) in departments:
        user_count = db.query(User).filter(
            User.department == dept,
            User.is_active == True
        ).count()
        result.append({
            "id": dept.lower().replace(" ", "_"),
            "name": dept,
            "description": f"{dept} department",
            "user_count": user_count,
            "created_at": None,
            "updated_at": None
        })
    
    return result


@router.get("/{department_id}")
def get_department(
    department_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific department"""
    # Convert ID back to name
    dept_name = department_id.replace("_", " ").title()
    
    users = db.query(User).filter(
        User.department == dept_name,
        User.is_active == True
    ).all()
    
    if not users:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return {
        "id": department_id,
        "name": dept_name,
        "description": f"{dept_name} department",
        "user_count": len(users),
        "users": [{"id": u.id, "name": u.full_name or u.username, "email": u.email} for u in users],
        "created_at": None,
        "updated_at": None
    }


@router.post("/")
def create_department(
    department_data: dict,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create department - departments are managed via user.department field"""
    name = department_data.get("name", "").strip()
    if not name or len(name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Department name must be at least 2 characters"
        )
    
    # Check if department already exists
    existing = db.query(User.department).filter(
        User.department == name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Department '{name}' already exists"
        )
    
    # Department is created implicitly when users are assigned to it
    # Return success response
    dept_id = name.lower().replace(" ", "_")
    return {
        "id": dept_id,
        "name": name,
        "description": department_data.get("description", f"{name} department"),
        "user_count": 0,
        "created_at": None,
        "updated_at": None,
        "message": "Department created. Assign users to this department to activate it."
    }


@router.put("/{department_id}")
def update_department(
    department_id: str,
    department_data: dict,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Update department - updates department name for all users in that department"""
    old_dept_name = department_id.replace("_", " ").title()
    new_name = department_data.get("name", "").strip()
    
    if not new_name or len(new_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Department name must be at least 2 characters"
        )
    
    # Check if users exist with old department name
    users = db.query(User).filter(User.department == old_dept_name).all()
    
    if not users:
        raise HTTPException(
            status_code=404,
            detail="Department not found or has no users"
        )
    
    # Check if new name already exists (and is different)
    if new_name != old_dept_name:
        existing = db.query(User).filter(User.department == new_name).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Department '{new_name}' already exists"
            )
    
    # Update department name for all users
    for user in users:
        user.department = new_name
    db.commit()
    
    new_dept_id = new_name.lower().replace(" ", "_")
    return {
        "id": new_dept_id,
        "name": new_name,
        "description": department_data.get("description", f"{new_name} department"),
        "user_count": len(users),
        "message": f"Department updated from '{old_dept_name}' to '{new_name}'"
    }


class DeleteDepartmentRequest(BaseModel):
    password: str

@router.post("/{department_id}/delete")
def delete_department(
    department_id: str,
    delete_request: DeleteDepartmentRequest,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete department - note: This removes department from users but doesn't delete users. Requires password verification."""
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
            detail="Password is required to delete a department."
        )
    
    # Verify password
    password_to_verify = delete_request.password.strip()
    if not verify_password(password_to_verify, db_user_for_auth.hashed_password):
        raise HTTPException(
            status_code=403, 
            detail="Invalid password. Please verify your password to delete this department."
        )
    
    dept_name = department_id.replace("_", " ").title()
    
    # Remove department from users
    users = db.query(User).filter(User.department == dept_name).all()
    for user in users:
        user.department = None
    db.commit()
    
    return {"message": f"Department '{dept_name}' removed from users"}

