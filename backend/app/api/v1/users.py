from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...core.database import get_db
from ...crud.user import user as user_crud
from ...schemas.user import UserCreate, UserUpdate, UserOut
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role
from ...services.hierarchy import HierarchyService

router = APIRouter()


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user


@router.put("/me", response_model=UserOut)
def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    # Users can only update their own basic info, not role or active status
    if user_update.role is not None:
        raise HTTPException(
            status_code=403,
            detail="Cannot change your own role"
        )
    if user_update.is_active is not None:
        raise HTTPException(
            status_code=403,
            detail="Cannot change your own active status"
        )
    
    user = user_crud.update(db, db_obj=current_user, obj_in=user_update)
    return user


@router.get("/", response_model=List[UserOut])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Get all users (manager and above)"""
    users = user_crud.get_multi(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=UserOut)
def read_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific user by ID"""
    # Check permissions
    if current_user.id != user_id and current_user.role not in [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        if current_user.role == UserRole.MANAGER:
            # Managers can only see their subordinates
            subordinates = user_crud.get_hierarchy(db, current_user.id)
            subordinate_ids = [sub.id for sub in subordinates]
            if user_id not in subordinate_ids:
                raise HTTPException(
                    status_code=403,
                    detail="Not enough permissions"
                )
        else:
            raise HTTPException(
                status_code=403,
                detail="Not enough permissions"
            )
    
    user = user_crud.get(db, id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserOut)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Create new user with hierarchy enforcement"""
    # Validate hierarchy rules
    if current_user.role == UserRole.ADMIN:
        # Admin can create managers, accountants, and employees
        allowed_roles = [UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        if user_data.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Admin can only create managers, accountants, and employees"
            )
        # Admin-created users can be assigned to any manager or be unassigned
        if user_data.manager_id:
            manager = user_crud.get(db, user_data.manager_id)
            if not manager or manager.role != UserRole.MANAGER:
                raise HTTPException(
                    status_code=400,
                    detail="Manager ID must be a valid manager"
                )
    
    elif current_user.role == UserRole.MANAGER:
        # Manager can only create accountants and employees
        allowed_roles = [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        if user_data.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Managers can only create accountants and employees"
            )
        # Manager-created users must be assigned to them (the creating manager)
        user_data.manager_id = current_user.id
    
    elif current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can create anyone
        pass
    
    else:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to create users"
        )
    
    return user_crud.create(db, obj_in=user_data)


@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Update user (admin and above)"""
    db_user = user_crud.get(db, id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Super admin can only be updated by super admin
    if db_user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Cannot modify super admin"
        )
    
    return user_crud.update(db, db_obj=db_user, obj_in=user_update)


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Delete user (super admin only)"""
    db_user = user_crud.get(db, id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete yourself"
        )
    
    user_crud.delete(db, id=user_id)
    return {"message": "User deleted successfully"}


@router.post("/subordinates", response_model=UserOut)
def create_subordinate(
    user_data: UserCreate,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Create subordinate user (managers create accountants/employees, admins create managers)"""
    # Validate hierarchy rules for subordinate creation
    if current_user.role == UserRole.MANAGER:
        # Managers can only create accountants and employees
        allowed_roles = [UserRole.ACCOUNTANT, UserRole.EMPLOYEE]
        if user_data.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Managers can only create accountants and employees as subordinates"
            )
        # Force assignment to the creating manager
        user_data.manager_id = current_user.id
    
    elif current_user.role == UserRole.ADMIN:
        # Admins can create managers
        if user_data.role != UserRole.MANAGER:
            raise HTTPException(
                status_code=403,
                detail="Admins can only create managers as subordinates"
            )
        # Admin-created managers can be unassigned or assigned to any admin
        if user_data.manager_id:
            manager = user_crud.get(db, user_data.manager_id)
            if not manager or manager.role != UserRole.ADMIN:
                raise HTTPException(
                    status_code=400,
                    detail="Manager ID must be a valid admin"
                )
    
    elif current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can create anyone as subordinate
        pass
    
    else:
        raise HTTPException(
            status_code=403,
            detail="Insufficient permissions to create subordinates"
        )
    
    # Create the user
    return user_crud.create(db, obj_in=user_data)


@router.post("/{user_id}/delegate-action")
def delegate_action(
    user_id: int,
    action: str,
    current_user: User = Depends(require_min_role(UserRole.MANAGER)),
    db: Session = Depends(get_db)
):
    """Delegate an action to a subordinate"""
    target_user = user_crud.get(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if target is actually a subordinate
    if not HierarchyService.can_manage_user(db, current_user.id, user_id):
        raise HTTPException(
            status_code=403,
            detail="Can only delegate actions to subordinates"
        )
    
    # Check if delegation is allowed
    if not HierarchyService.can_delegate_action(current_user.role, target_user.role, action):
        raise HTTPException(
            status_code=403,
            detail=f"Cannot delegate action '{action}' to {target_user.role.value}"
        )
    
    return {"message": f"Action '{action}' delegated to {target_user.username}"}


@router.post("/{user_id}/override-action")
def override_action(
    user_id: int,
    action: str,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Override a subordinate's action (admin and super admin only)"""
    target_user = user_crud.get(db, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if override is allowed
    if not HierarchyService.can_override_action(current_user.role, target_user.role):
        raise HTTPException(
            status_code=403,
            detail=f"Cannot override actions of {target_user.role.value}"
        )
    
    return {"message": f"Action '{action}' overriden for {target_user.username}"}


@router.get("/hierarchy-tree")
def get_hierarchy_tree(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get complete hierarchy tree (admin and super admin only)"""
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin sees everything
        all_users = user_crud.get_multi(db, 0, 10000)
        return HierarchyService._build_hierarchy_tree(all_users)
    
    elif current_user.role == UserRole.ADMIN:
        # Admin sees their assigned managers and their subordinates
        managers = user_crud.get_subordinates(db, current_user.id)
        hierarchy = []
        
        for manager in managers:
            manager_node = {
                "id": manager.id,
                "username": manager.username,
                "full_name": manager.full_name,
                "role": manager.role.value,
                "department": manager.department,
                "subordinates": []
            }
            
            # Get manager's subordinates
            manager_subordinates = user_crud.get_hierarchy(db, manager.id)
            for sub in manager_subordinates:
                manager_node["subordinates"].append({
                    "id": sub.id,
                    "username": sub.username,
                    "full_name": sub.full_name,
                    "role": sub.role.value,
                    "department": sub.department
                })
            
            hierarchy.append(manager_node)
        
        return hierarchy
    
    else:
        raise HTTPException(
            status_code=403,
            detail="Only admins can view hierarchy tree"
        )


@router.post("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Deactivate user (admin and above)"""
    db_user = user_crud.get(db, id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if db_user.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Cannot deactivate super admin"
        )
    
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Cannot deactivate yourself"
        )
    
    user_update = UserUpdate(is_active=False)
    user_crud.update(db, db_obj=db_user, obj_in=user_update)
    return {"message": "User deactivated successfully"}


@router.post("/{user_id}/activate")
def activate_user(
    user_id: int,
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Activate user (admin and above)"""
    db_user = user_crud.get(db, id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_update = UserUpdate(is_active=True)
    user_crud.update(db, db_obj=db_user, obj_in=user_update)
    return {"message": "User activated successfully"}
