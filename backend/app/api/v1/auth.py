# app/api/v1/auth.py
from datetime import timedelta, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import logging

from ...core.database import get_db
from ...core.config import settings
from ...core.security import verify_password, create_access_token, get_password_hash
from ...models.user import User, UserRole
from ...crud import login_history as login_history_crud
from ...utils.user_agent import get_device_info, get_location_from_ip

import pyotp

logger = logging.getLogger(__name__)


# ------------------------------------------------------------------
# OTP Utilities
# ------------------------------------------------------------------
def generate_otp_secret() -> str:
    return pyotp.random_base32()

def generate_otp(secret: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.now()

def verify_otp(secret: str, otp_code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(otp_code, valid_window=1)


# ------------------------------------------------------------------
# Pydantic Schemas
# ------------------------------------------------------------------
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


class Token(BaseModel):
    access_token: str
    token_type: str


class UserOut(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True


# ------------------------------------------------------------------
# OAuth2 Scheme
# ------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ------------------------------------------------------------------
# Dependency: Get current active user
# ------------------------------------------------------------------
async def get_current_active_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


# ------------------------------------------------------------------
# CRUD Helper
# ------------------------------------------------------------------
class UserCRUD:
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def authenticate(db: Session, username: str, password: str) -> Optional[User]:
        # Support username or email input
        user = UserCRUD.get_by_username(db, username)
        if not user:
            user = UserCRUD.get_by_email(db, username)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def create(db: Session, obj_in: UserCreate) -> User:
        if UserCRUD.get_by_email(db, obj_in.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        if UserCRUD.get_by_username(db, obj_in.username):
            raise HTTPException(status_code=400, detail="Username already taken")

        hashed = get_password_hash(obj_in.password)
        db_user = User(
            email=obj_in.email,
            username=obj_in.username,
            hashed_password=hashed,
            full_name=obj_in.full_name,
            phone=obj_in.phone,
            department=obj_in.department,
            role=obj_in.role,
            is_active=True,
            is_verified=True,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user


user_crud = UserCRUD()


# ------------------------------------------------------------------
# Router
# ------------------------------------------------------------------
# router = APIRouter(prefix="/auth", tags=["Authentication"])
# ------------------------------------------------------------------
# Router – REMOVE prefix="/auth"
# ------------------------------------------------------------------
router = APIRouter(tags=["Authentication"])  # ← NO PREFIX HERE

# ------------------------------------------------------------------
# Helper function to get client IP and user agent
# ------------------------------------------------------------------
def get_client_info(request: Request) -> tuple[str, str]:
    """Extract IP address and user agent from request"""
    # Get IP address (check for forwarded headers first)
    ip_address = request.headers.get("X-Forwarded-For")
    if ip_address:
        ip_address = ip_address.split(",")[0].strip()
    else:
        ip_address = request.headers.get("X-Real-IP")
        if not ip_address:
            ip_address = request.client.host if request.client else None
    
    user_agent = request.headers.get("User-Agent", "")
    
    return ip_address or "Unknown", user_agent


def is_ip_allowed(user_ip: str, allowed_ips_str: str) -> bool:
    """Check if the user's IP is in the allowed IPs list"""
    if not allowed_ips_str:
        return False
    
    import json
    try:
        allowed_ips = json.loads(allowed_ips_str)
        if not isinstance(allowed_ips, list):
            return False
        
        # Check exact match or CIDR notation
        for allowed_ip in allowed_ips:
            if allowed_ip == user_ip:
                return True
            # Handle CIDR notation (e.g., 192.168.1.0/24)
            if '/' in allowed_ip:
                try:
                    from ipaddress import ip_address, ip_network
                    user_ip_obj = ip_address(user_ip)
                    network = ip_network(allowed_ip, strict=False)
                    if user_ip_obj in network:
                        return True
                except Exception:
                    continue
        
        return False
    except (json.JSONDecodeError, ValueError):
        # If JSON parsing fails, try comma-separated string
        allowed_ips = [ip.strip() for ip in allowed_ips_str.split(',')]
        return user_ip in allowed_ips


# ------------------------------------------------------------------
# LOGIN (OAuth2 form-data) – CRITICAL FOR test_hierarchy.py
# ------------------------------------------------------------------
@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    request: Request = None,
    db: Session = Depends(get_db)
):
    # Get client info from request
    ip_address, user_agent = "Unknown", ""
    try:
        if request:
            ip_address, user_agent = get_client_info(request)
    except Exception:
        pass  # If we can't get client info, use defaults
    device = get_device_info(user_agent) if user_agent else "Unknown Device"
    location = get_location_from_ip(ip_address)
    
    # Try to authenticate
    user = user_crud.authenticate(db, form_data.username, form_data.password)
    
    if not user:
        # Log failed login attempt (without user_id, we can't identify the user)
        # We could create a separate table for failed attempts without user_id
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    # Check if user is active before logging
    if not user.is_active:
        # Log failed login attempt
        try:
            login_history_crud.create(
                db=db,
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                device=device,
                location=location,
                success=False,
                failure_reason="Inactive user"
            )
        except Exception:
            pass  # Don't fail login if history logging fails
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Check IP restriction if enabled
    if user.ip_restriction_enabled:
        if not is_ip_allowed(ip_address, user.allowed_ips or ""):
            # Log failed login attempt due to IP restriction
            try:
                login_history_crud.create(
                    db=db,
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    device=device,
                    location=location,
                    success=False,
                    failure_reason=f"IP address not allowed: {ip_address}"
                )
            except Exception:
                pass
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Your IP address ({ip_address}) is not in the allowed list."
            )
    
    # Log successful login
    try:
        login_history_crud.create(
            db=db,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            device=device,
            location=location,
            success=True
        )
        # Update last_login
        from datetime import datetime
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception:
        pass  # Don't fail login if history logging fails

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ------------------------------------------------------------------
# REGISTER
# ------------------------------------------------------------------
@router.post("/register", response_model=UserOut, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = user_crud.create(db, user_data)
    return UserOut.from_orm(user)


# ------------------------------------------------------------------
# LOGIN with JSON
# ------------------------------------------------------------------
@router.post("/login-json", response_model=dict)
def login_json(
    user_data: UserLogin,
    request: Request = None,
    db: Session = Depends(get_db)
):
    # Get client info from request if available
    ip_address, user_agent = "Unknown", ""
    if request:
        try:
            ip_address, user_agent = get_client_info(request)
        except Exception:
            pass
    device = get_device_info(user_agent) if user_agent else "Unknown Device"
    location = get_location_from_ip(ip_address)
    
    # Try to authenticate
    user = user_crud.authenticate(db, user_data.username, user_data.password)
    
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not user.is_active:
        # Log failed login attempt
        try:
            login_history_crud.create(
                db=db,
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                device=device,
                location=location,
                success=False,
                failure_reason="Inactive user"
            )
        except Exception:
            pass
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Check IP restriction if enabled
    if user.ip_restriction_enabled:
        if not is_ip_allowed(ip_address, user.allowed_ips or ""):
            # Log failed login attempt due to IP restriction
            try:
                login_history_crud.create(
                    db=db,
                    user_id=user.id,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    device=device,
                    location=location,
                    success=False,
                    failure_reason=f"IP address not allowed: {ip_address}"
                )
            except Exception:
                pass
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Your IP address ({ip_address}) is not in the allowed list."
            )
    
    # Log successful login
    try:
        login_history_crud.create(
            db=db,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            device=device,
            location=location,
            success=True
        )
        # Update last_login
        user.last_login = datetime.utcnow()
        db.commit()
    except Exception:
        pass

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role.value,
        }
    }


# ------------------------------------------------------------------
# Password Reset OTP Storage (in-memory cache)
# ------------------------------------------------------------------
password_reset_otps = {}  # email -> {otp: str, expires_at: datetime}

def cleanup_expired_otps():
    """Remove expired OTPs from cache"""
    from datetime import datetime
    current_time = datetime.utcnow()
    expired_emails = [
        email for email, data in password_reset_otps.items()
        if data['expires_at'] < current_time
    ]
    for email in expired_emails:
        del password_reset_otps[email]


# ------------------------------------------------------------------
# OTP Endpoints
# ------------------------------------------------------------------
@router.post("/generate-otp", response_model=dict)
def generate_otp_endpoint(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if not current_user.otp_secret:
        current_user.otp_secret = generate_otp_secret()
        db.commit()
        db.refresh(current_user)

    otp_code = generate_otp(current_user.otp_secret)
    return {"otp_code": otp_code, "message": "OTP generated"}


@router.post("/verify-otp", response_model=dict)
def verify_otp_endpoint(
    otp_code: str,
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.otp_secret:
        raise HTTPException(status_code=400, detail="OTP not configured")
    if not verify_otp(current_user.otp_secret, otp_code):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"message": "OTP verified"}


# ------------------------------------------------------------------
# Password Reset Endpoints (Public - No Authentication Required)
# ------------------------------------------------------------------
class RequestOTPRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    newPassword: str

@router.post("/request-otp", response_model=dict)
def request_password_reset_otp(
    request_data: RequestOTPRequest,
    db: Session = Depends(get_db)
):
    """Request OTP for password reset"""
    from ...services.email import EmailService
    from datetime import datetime, timedelta
    import random
    import string
    
    email = request_data.email.lower().strip()
    
    # Find user by email
    user = user_crud.get_by_email(db, email)
    if not user:
        # Don't reveal if email exists (security best practice)
        # Return success even if user doesn't exist
        return {
            "message": "If an account with that email exists, an OTP has been sent."
        }
    
    # Generate 6-digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP with expiration (5 minutes)
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    password_reset_otps[email] = {
        'otp': otp_code,
        'expires_at': expires_at,
        'user_id': user.id
    }
    
    # Clean up expired OTPs
    cleanup_expired_otps()
    
    # Send OTP via email
    try:
        EmailService.send_otp_email(email, otp_code)
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        # Still return success to prevent email enumeration
    
    return {
        "message": "If an account with that email exists, an OTP has been sent."
    }


@router.post("/reset-password", response_model=dict)
def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password using OTP"""
    from datetime import datetime
    
    email = reset_data.email.lower().strip()
    otp_code = reset_data.code.strip()
    new_password = reset_data.newPassword
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Clean up expired OTPs first
    cleanup_expired_otps()
    
    # Check if OTP exists and is valid
    if email not in password_reset_otps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please request a new one."
        )
    
    otp_data = password_reset_otps[email]
    
    # Check expiration
    if datetime.utcnow() > otp_data['expires_at']:
        del password_reset_otps[email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
    
    # Verify OTP code
    if otp_data['otp'] != otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code. Please try again."
        )
    
    # Get user
    user = db.query(User).filter(User.id == otp_data['user_id']).first()
    if not user:
        del password_reset_otps[email]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    db.refresh(user)
    
    # Remove used OTP
    del password_reset_otps[email]
    
    return {
        "message": "Password has been reset successfully. You can now login with your new password."
    }


# ------------------------------------------------------------------
# ME
# ------------------------------------------------------------------
@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# ------------------------------------------------------------------
# LOGOUT (client-side)
# ------------------------------------------------------------------
@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}