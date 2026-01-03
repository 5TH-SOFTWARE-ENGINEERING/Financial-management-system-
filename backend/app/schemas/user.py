# app/schemas/user.py
from pydantic import BaseModel, EmailStr, field_validator # type: ignore[import-untyped]
from typing import Optional
from datetime import datetime

from ..models.user import UserRole


# ------------------------------------------------------------------
# Base Schemas
# ------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE
    department: Optional[str] = None
    is_active: bool = True


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[list[str]] = None  # Changed to list[str]


# ------------------------------------------------------------------
# Create / Update
# ------------------------------------------------------------------
class UserCreate(UserBase):
    password: str
    manager_id: Optional[int] = None

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

    @field_validator('role', mode='before')
    @classmethod
    def validate_role(cls, v) -> UserRole:
        """Ensure role is properly converted to UserRole enum"""
        if isinstance(v, UserRole):
            return v
        if isinstance(v, str):
            # Try to find matching enum by value
            for role in UserRole:
                if role.value == v or role.name == v.upper():
                    return role
            # If no match, try common variations
            role_map = {
                'finance_manager': UserRole.FINANCE_ADMIN,
                'finance_admin': UserRole.FINANCE_ADMIN,
                'super_admin': UserRole.SUPER_ADMIN,
                'admin': UserRole.ADMIN,
                'manager': UserRole.MANAGER,
                'accountant': UserRole.ACCOUNTANT,
                'employee': UserRole.EMPLOYEE,
            }
            normalized = v.lower().replace('_', '_')
            if normalized in role_map:
                return role_map[normalized]
        # Default to EMPLOYEE if invalid
        return UserRole.EMPLOYEE


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None
    manager_id: Optional[int] = None
    permissions: Optional[list[dict]] = None  # Custom permissions


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[list[str]] = None


# ------------------------------------------------------------------
# Output (Response)
# ------------------------------------------------------------------
class UserOut(UserBase):
    id: int
    is_verified: bool = False
    manager_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True  # Pydantic v2


class RoleOut(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoleWithStats(RoleOut):
    user_count: int = 0
    permission_count: int = 0


# ------------------------------------------------------------------
# Auth
# ------------------------------------------------------------------
class UserLogin(BaseModel):
    username: str
    password: str


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


# ------------------------------------------------------------------
# Permissions
# ------------------------------------------------------------------
class UserPermissionsUpdate(BaseModel):
    permissions: list[dict]  # [{"resource": "REVENUES", "actions": {"READ": true, "CREATE": true}}]


class AdminResetPasswordRequest(BaseModel):
    username_or_email: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v