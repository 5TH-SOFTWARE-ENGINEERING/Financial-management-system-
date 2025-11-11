# app/api/v1/auth.py - Complete Authentication Router

from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.config import settings
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user  # Will be implemented in deps.py

# Stub schemas (define here for completeness; move to schemas/user.py later)
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True  # Pydantic v2: for ORM mode

# Stub CRUD functions (implement in crud/user.py; stubs here for router independence)
class UserCRUD:
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        user = UserCRUD.get_by_username(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def is_active(user: User) -> bool:
        return user.is_active

    @staticmethod
    def create(db: Session, obj_in: UserCreate) -> User:
        # Hash password before creating
        hashed_password = get_password_hash(obj_in.password)
        db_obj = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=hashed_password,
            full_name=obj_in.full_name,
            phone=obj_in.phone,
            department=obj_in.department,
            role=obj_in.role,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

user_crud = UserCRUD()

# Stub security functions (implement in core/security.py)
def get_password_hash(password: str) -> str:
    """Stub: In real impl, use passlib: from passlib.context import CryptContext; pwd_context.hash(password)"""
    return f"hashed_{password}"  # Placeholder

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Stub: In real impl, pwd_context.verify(plain_password, hashed_password)"""
    return hashed_password == f"hashed_{plain_password}"

from jose import JWTError, jwt  # pip install python-jose[cryptography]
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

from pyotp import TOTP  # pip install pyotp
def generate_otp_secret() -> str:
    return pyotp.random_base32()

def generate_otp(secret: str) -> str:
    totp = TOTP(secret)
    return totp.now()

def verify_otp(secret: str, otp_code: str) -> bool:
    totp = TOTP(secret)
    return totp.verify(otp_code)

from datetime import datetime  # Already imported above

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    db_user = user_crud.get_by_email(db, email=user_data.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    db_user = user_crud.get_by_username(db, username=user_data.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user (password hashed in CRUD create)
    user = user_crud.create(db, obj_in=user_data)
    return UserOut.from_orm(user)  # Or user directly if using from_attributes


@router.post("/login", response_model=dict)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login user and return access token (form data)"""
    user = user_crud.authenticate(
        db, username=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user_crud.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user. Please contact admin."
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
        }
    }


@router.post("/login-json", response_model=dict)
def login_json(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user with JSON payload"""
    user = user_crud.authenticate(
        db, username=user_data.username, password=user_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    if not user_crud.is_active(user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user. Please contact admin."
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
        }
    }


@router.post("/generate-otp", response_model=dict)
def generate_otp_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate OTP for 2FA (requires auth)"""
    if not current_user.otp_secret:
        # Generate new secret for user
        current_user.otp_secret = generate_otp_secret()
        db.commit()
        db.refresh(current_user)
    
    otp_code = generate_otp(current_user.otp_secret)
    # In production, send this via email/SMS instead of returning
    return {"otp_code": otp_code, "message": "OTP generated successfully. Check your email/SMS."}


@router.post("/verify-otp", response_model=dict)
def verify_otp_endpoint(
    otp_code: str,  # Expect in body; use Pydantic model for full impl
    current_user: User = Depends(get_current_active_user)
):
    """Verify OTP code (requires auth)"""
    if not current_user.otp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP not set up for this user. Generate first."
        )
    
    if not verify_otp(current_user.otp_secret, otp_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Optional: Update last verification or enable 2FA flag
    return {"message": "OTP verified successfully"}


# Additional endpoints for completeness
@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user info"""
    return current_user


@router.post("/logout")
def logout():
    """Placeholder for logout (JWT is stateless; client-side token discard)"""
    return {"message": "Logged out successfully (invalidate token client-side)"}