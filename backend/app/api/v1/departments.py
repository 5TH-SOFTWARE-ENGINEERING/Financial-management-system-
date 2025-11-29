from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...core.database import get_db
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role

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
    """Create department - note: This is a stub, departments are managed via user.department field"""
    return {
        "id": department_data.get("name", "").lower().replace(" ", "_"),
        "name": department_data.get("name", ""),
        "description": department_data.get("description", ""),
        "user_count": 0,
        "message": "Department created (stub implementation)"
    }


@router.put("/{department_id}")
def update_department(
    department_id: str,
    department_data: dict,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Update department - note: This is a stub"""
    dept_name = department_id.replace("_", " ").title()
    return {
        "id": department_id,
        "name": department_data.get("name", dept_name),
        "description": department_data.get("description", ""),
        "message": "Department updated (stub implementation)"
    }


@router.delete("/{department_id}")
def delete_department(
    department_id: str,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete department - note: This removes department from users but doesn't delete users"""
    dept_name = department_id.replace("_", " ").title()
    
    # Remove department from users
    users = db.query(User).filter(User.department == dept_name).all()
    for user in users:
        user.department = None
    db.commit()
    
    return {"message": f"Department '{dept_name}' removed from users"}

