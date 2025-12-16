from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from functools import wraps
import json

from ..models.audit import AuditLog, AuditAction
from ..core.database import get_db


class AuditLogger:
    """Utility class for logging audit events"""
    
    @staticmethod
    def log_action(
        db: Session,
        user_id: int,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[int] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log an audit action"""
        from ..crud.audit import audit_log as audit_crud
        
        # Convert dictionaries to JSON strings
        old_values_json = json.dumps(old_values) if old_values else None
        new_values_json = json.dumps(new_values) if new_values else None
        
        return audit_crud.create(
            db=db,
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values_json,
            new_values=new_values_json,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_create(
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        new_values: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log a create action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.CREATE,
            resource_type=resource_type,
            resource_id=resource_id,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_update(
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        old_values: Dict[str, Any],
        new_values: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log an update action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.UPDATE,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_delete(
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        old_values: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log a delete action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.DELETE,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_login(
        db: Session,
        user_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log a login action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.LOGIN,
            resource_type="user",
            resource_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_logout(
        db: Session,
        user_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log a logout action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.LOGOUT,
            resource_type="user",
            resource_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_approve(
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log an approve action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.APPROVE,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_reject(
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        new_values: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log a reject action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.REJECT,
            resource_type=resource_type,
            resource_id=resource_id,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_export(
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log an export action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.EXPORT,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    @staticmethod
    def log_view(
        db: Session,
        user_id: int,
        resource_type: str,
        resource_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Log a view action"""
        return AuditLogger.log_action(
            db=db,
            user_id=user_id,
            action=AuditAction.VIEW,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent
        )


def audit_action(action: AuditAction, resource_type: str):
    """Decorator to automatically audit function calls"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract database session and user from kwargs
            db = None
            current_user = None
            
            for key, value in kwargs.items():
                if hasattr(value, 'query'):  # SQLAlchemy Session
                    db = value
                elif hasattr(value, 'id') and hasattr(value, 'email'):  # User model
                    current_user = value
            
            if not db or not current_user:
                # If we can't find db or user, just call the function
                return await func(*args, **kwargs)
            
            # Get request info if available
            request = kwargs.get('request')
            ip_address = None
            user_agent = None
            
            if request:
                ip_address = request.client.host if request.client else None
                user_agent = request.headers.get("user-agent")
            
            # Log the action before execution
            AuditLogger.log_action(
                db=db,
                user_id=current_user.id,
                action=action,
                resource_type=resource_type,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Call the original function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def log_function_call(func_name: str, log_args: bool = False, log_result: bool = False):
    """Decorator to log function calls for debugging"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = datetime.now()
            
            # Log function start
            print(f"[{start_time}] Starting {func_name}")
            
            if log_args:
                print(f"Args: {args}")
                print(f"Kwargs: {kwargs}")
            
            try:
                # Call the function
                result = await func(*args, **kwargs)
                
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                # Log successful completion
                print(f"[{end_time}] Completed {func_name} in {duration:.2f}s")
                
                if log_result:
                    print(f"Result: {result}")
                
                return result
                
            except Exception as e:
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                
                # Log error
                print(f"[{end_time}] Failed {func_name} in {duration:.2f}s: {str(e)}")
                raise
        
        return wrapper
    return decorator


def get_client_info(request) -> Dict[str, str]:
    """Extract client information from request"""
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "referer": request.headers.get("referer", "unknown"),
        "method": request.method,
        "url": str(request.url)
    }


def sanitize_for_audit(data: Dict[str, Any]) -> Dict[str, Any]:
    """Sanitize sensitive data before logging"""
    sensitive_fields = ["password", "token", "secret", "key", "credit_card", "ssn"]
    
    sanitized = data.copy()
    for key, value in sanitized.items():
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_for_audit(value)
    
    return sanitized


# Convenience function for easy access
def log_action(
    db: Session,
    user_id: int,
    action: AuditAction,
    resource_type: str,
    resource_id: Optional[int] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """Convenience function for logging actions"""
    return AuditLogger.log_action(
        db=db,
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        user_agent=user_agent
    )
