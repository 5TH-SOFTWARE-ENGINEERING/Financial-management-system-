from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from ..core.database import get_db
from ..core.config import settings
from ..core.security import verify_token
from ..crud.user import user as user_crud
from ..models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db_user = user_crud.get(db, id=user_id)
    if db_user is None:
        raise credentials_exception
    
    return db_user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not user_crud.is_active(current_user):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not user_crud.is_superuser(current_user):
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user


def require_role(required_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        role_hierarchy = {
            UserRole.EMPLOYEE: 0,
            UserRole.ACCOUNTANT: 1,
            UserRole.MANAGER: 2,
            UserRole.ADMIN: 3,
            UserRole.SUPER_ADMIN: 4,
        }
        
        if role_hierarchy.get(current_user.role, 0) < role_hierarchy.get(required_role, 0):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    
    return role_checker


def require_min_role(min_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
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
                detail="Not enough permissions"
            )
        return current_user
    
    return role_checker


def can_access_user_data(target_user_id: int, current_user: User = Depends(get_current_active_user)) -> User:
    """Check if current user can access target user's data"""
    if current_user.id == target_user_id:
        return current_user
    
    # Managers can access their subordinates
    if current_user.role in [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        subordinates = user_crud.get_hierarchy(db, current_user.id)
        subordinate_ids = [sub.id for sub in subordinates]
        if target_user_id in subordinate_ids:
            return current_user
    
    # Admins and super admins can access all users
    if current_user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not enough permissions to access this user's data"
    )
