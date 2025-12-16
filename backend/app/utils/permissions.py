from functools import wraps
from typing import Callable, List, Union
from fastapi import HTTPException, status # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]

from ..models.user import User, UserRole
from ..services.hierarchy import HierarchyService


def check_permission(user: User, permission: str) -> bool:
    """Check if a user has a specific permission"""
    return HierarchyService.check_permission(user.role, permission)


def require_permission(permission: str):
    """Decorator to require specific permission"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the current_user in kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not check_permission(current_user, permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Permission '{permission}' required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(roles: Union[UserRole, List[UserRole]]):
    """Decorator to require specific role(s)"""
    if isinstance(roles, UserRole):
        roles = [roles]
    
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the current_user in kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if current_user.role not in roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"One of roles {[r.value for r in roles]} required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_min_role(min_role: UserRole):
    """Decorator to require minimum role level"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find the current_user in kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            role_hierarchy = {
                UserRole.EMPLOYEE: 0,
                UserRole.ACCOUNTANT: 1,
                UserRole.MANAGER: 2,
                UserRole.ADMIN: 3,
                UserRole.SUPER_ADMIN: 4,
            }
            
            if role_hierarchy.get(current_user.role, 0) < role_hierarchy.get(min_role, 0):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Minimum role {min_role.value} required"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def can_access_user_data(target_user_id: int, current_user: User, db: Session) -> bool:
    """Check if current user can access target user's data"""
    return HierarchyService.can_manage_user(db, current_user.id, target_user_id) or current_user.id == target_user_id


def can_access_resource(resource_user_id: int, current_user: User, db: Session) -> bool:
    """Check if current user can access a resource belonging to another user"""
    # Users can always access their own resources
    if resource_user_id == current_user.id:
        return True
    
    # Admins and super admins can access all resources
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return True
    
    # Managers can access resources of their subordinates
    if current_user.role == UserRole.MANAGER:
        subordinate_ids = [sub.id for sub in HierarchyService.get_user_hierarchy(db, current_user.id).get("all_subordinates", [])]
        return resource_user_id in subordinate_ids
    
    return False


def filter_accessible_data(data: List, user_id_field: str, current_user: User, db: Session) -> List:
    """Filter a list of data to only include items the user can access"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return data
    
    if current_user.role == UserRole.MANAGER:
        accessible_user_ids = HierarchyService.get_accessible_user_ids(db, current_user.id)
        return [item for item in data if getattr(item, user_id_field) in accessible_user_ids]
    
    # Regular users can only see their own data
    return [item for item in data if getattr(item, user_id_field) == current_user.id]


class PermissionChecker:
    """Utility class for checking permissions"""
    
    @staticmethod
    def can_create_entries(user: User) -> bool:
        return check_permission(user, "can_create_entries")
    
    @staticmethod
    def can_view_all_entries(user: User) -> bool:
        return check_permission(user, "can_view_all_entries")
    
    @staticmethod
    def can_view_team_entries(user: User) -> bool:
        return check_permission(user, "can_view_team_entries")
    
    @staticmethod
    def can_manage_users(user: User) -> bool:
        return check_permission(user, "can_manage_users")
    
    @staticmethod
    def can_approve_entries(user: User) -> bool:
        return check_permission(user, "can_approve_entries")
    
    @staticmethod
    def can_access_admin(user: User) -> bool:
        return check_permission(user, "can_access_admin")
    
    @staticmethod
    def can_manage_system(user: User) -> bool:
        return check_permission(user, "can_manage_system")
    
    @staticmethod
    def can_create_reports(user: User) -> bool:
        return check_permission(user, "can_create_reports")
    
    @staticmethod
    def can_edit_own_entries(user: User) -> bool:
        return check_permission(user, "can_edit_own_entries")
    
    @staticmethod
    def can_delete_own_entries(user: User) -> bool:
        return check_permission(user, "can_delete_own_entries")


def get_accessible_scopes(current_user: User, db: Session) -> dict:
    """Get the data access scopes for the current user"""
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return {
            "user_access": "all",
            "revenue_access": "all", 
            "expense_access": "all",
            "approval_access": "all",
            "report_access": "all"
        }
    
    elif current_user.role == UserRole.MANAGER:
        subordinate_ids = HierarchyService.get_accessible_user_ids(db, current_user.id)
        return {
            "user_access": subordinate_ids,
            "revenue_access": "team",
            "expense_access": "team", 
            "approval_access": "team",
            "report_access": "team"
        }
    
    else:
        return {
            "user_access": [current_user.id],
            "revenue_access": "own",
            "expense_access": "own",
            "approval_access": "own",
            "report_access": "own"
        }
