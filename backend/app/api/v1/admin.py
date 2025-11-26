from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
from datetime import datetime, timedelta

from ...core.database import get_db
from ...crud.user import user as user_crud
from ...crud.audit import audit_log as audit_crud
from ...crud.notification import notification as notification_crud
from ...crud.report import report as report_crud
from ...crud.revenue import revenue as revenue_crud
from ...crud.expense import expense as expense_crud
from ...crud.approval import approval as approval_crud
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role
from ...services.backup import BackupService
from ...services.email import EmailService

router = APIRouter()


@router.get("/system/stats")
def get_system_stats(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get system statistics"""
    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Role distribution
    role_stats = {}
    for role in UserRole:
        count = db.query(User).filter(User.role == role).count()
        role_stats[role.value] = count

    # Financial snapshot (last 30 days)
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    total_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
    total_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
    pending_approvals = len(approval_crud.get_pending(db))
    net_profit = total_revenue - total_expenses
    
    # Database statistics
    try:
        # Get table sizes (PostgreSQL specific)
        if "postgresql" in str(db.bind.url):
            table_stats = db.execute(text("""
                SELECT 
                    schemaname,
                    tablename,
                    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            """)).fetchall()
            
            db_stats = {
                "tables": [
                    {
                        "name": row.tablename,
                        "size": row.size,
                        "size_bytes": row.size_bytes
                    }
                    for row in table_stats
                ]
            }
        else:
            # For other databases, provide basic info
            db_stats = {"message": "Detailed table stats only available for PostgreSQL"}
    except Exception as e:
        db_stats = {"error": str(e)}
    
    # Recent activity
    recent_audits = audit_crud.get_multi(db, skip=0, limit=10)
    recent_reports = report_crud.get_recent(db, days=7, skip=0, limit=10)
    
    # Basic DB health check
    try:
        db.execute(text("SELECT 1"))
        system_health = "healthy"
    except Exception:
        system_health = "unhealthy"

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "by_role": role_stats
        },
        "financials": {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "net_profit": net_profit
        },
        "pending_approvals": pending_approvals,
        "system_health": system_health,
        "database": db_stats,
        "activity": {
            "recent_audits": len(recent_audits),
            "recent_reports": len(recent_reports)
        },
        "timestamp": datetime.utcnow()
    }


@router.get("/audit/logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: int = Query(None),
    action: str = Query(None),
    resource_type: str = Query(None),
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Get audit logs with filtering"""
    if user_id:
        logs = audit_crud.get_by_user(db, user_id, skip, limit)
    elif action:
        from ...models.audit import AuditAction
        try:
            action_enum = AuditAction(action)
            logs = audit_crud.get_by_action(db, action_enum, skip, limit)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid action")
    elif resource_type:
        logs = audit_crud.get_by_resource(db, resource_type, None, skip, limit)
    elif start_date and end_date:
        logs = audit_crud.get_by_date_range(db, start_date, end_date, skip, limit)
    else:
        logs = audit_crud.get_multi(db, skip, limit)
    
    return logs


@router.post("/backup/create")
def create_backup(
    background_tasks: BackgroundTasks,
    include_files: bool = Query(False),
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Create system backup (super admin only)"""
    # Add backup task to background
    background_tasks.add_task(BackupService.create_backup, include_files)
    
    return {"message": "Backup started in background"}


@router.get("/backup/list")
def list_backups(
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """List available backups"""
    backups = BackupService.list_backups()
    return {"backups": backups}


@router.post("/backup/restore")
def restore_backup(
    backup_name: str,
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Restore from backup (super admin only)"""
    # This is a dangerous operation - should require additional confirmation
    result = BackupService.restore_backup(backup_name)
    return {"message": f"Backup restore completed: {result}"}


@router.post("/maintenance/cleanup")
def cleanup_system(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Clean up old data (super admin only)"""
    # Clean up old audit logs
    audit_count = audit_crud.cleanup_old(db, days)
    
    # Clean up expired notifications
    notification_count = notification_crud.cleanup_expired(db)
    
    # Clean up old reports
    report_count = report_crud.cleanup_expired(db)
    
    return {
        "message": "System cleanup completed",
        "cleaned": {
            "audit_logs": audit_count,
            "notifications": notification_count,
            "reports": report_count
        }
    }


@router.post("/notifications/broadcast")
def broadcast_system_notification(
    title: str,
    message: str,
    target_roles: List[UserRole] = Query(...),
    priority: str = Query("medium", regex="^(low|medium|high|urgent)$"),
    send_email: bool = Query(False),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Send system-wide notification (admin only)"""
    from ...models.notification import NotificationType, NotificationPriority
    
    # Get all users with target roles
    users = []
    for role in target_roles:
        role_users = db.query(User).filter(User.role == role, User.is_active == True).all()
        users.extend(role_users)
    
    # Remove duplicates
    user_ids = list(set([user.id for user in users]))
    
    # Create notifications
    priority_map = {
        "low": NotificationPriority.LOW,
        "medium": NotificationPriority.MEDIUM,
        "high": NotificationPriority.HIGH,
        "urgent": NotificationPriority.URGENT
    }
    
    notifications = notification_crud.create_for_users(
        db=db,
        user_ids=user_ids,
        title=title,
        message=message,
        notification_type=NotificationType.SYSTEM_ALERT,
        priority=priority_map[priority]
    )
    
    # Send emails if requested
    if send_email:
        background_tasks = BackgroundTasks()
        for user in users:
            if user.email:
                background_tasks.add_task(
                    EmailService.send_system_notification,
                    user.email,
                    title,
                    message
                )
    
    return {
        "message": f"System notification sent to {len(notifications)} users",
        "target_roles": [role.value for role in target_roles],
        "recipients": len(notifications),
        "email_sent": send_email
    }


@router.get("/health")
def system_health_check(
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Check system health"""
    health_status = {
        "database": "unknown",
        "timestamp": datetime.utcnow(),
        "services": {}
    }
    
    # Check database connection
    try:
        db.execute(text("SELECT 1"))
        health_status["database"] = "healthy"
    except Exception as e:
        health_status["database"] = f"unhealthy: {str(e)}"
    
    # Check other services (add more as needed)
    # For now, just check if we can import services
    try:
        from ...services.email import EmailService
        health_status["services"]["email"] = "available"
    except ImportError:
        health_status["services"]["email"] = "unavailable"
    
    try:
        from ...services.backup import BackupService
        health_status["services"]["backup"] = "available"
    except ImportError:
        health_status["services"]["backup"] = "unavailable"
    
    return health_status


@router.post("/users/export")
def export_users(
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Export users data (admin only)"""
    users = user_crud.get_multi(db, skip=0, limit=10000)
    
    if format == "csv":
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "id", "email", "username", "full_name", "role", 
            "department", "is_active", "created_at"
        ])
        
        # Data
        for user in users:
            writer.writerow([
                user.id, user.email, user.username, user.full_name,
                user.role.value, user.department, user.is_active, user.created_at
            ])
        
        output.seek(0)
        return {"data": output.getvalue(), "filename": "users_export.csv"}
    
    else:  # JSON
        import json
        
        users_data = []
        for user in users:
            users_data.append({
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name,
                "role": user.role.value,
                "department": user.department,
                "is_active": user.is_active,
                "created_at": user.created_at.isoformat()
            })
        
        return {"data": json.dumps(users_data, indent=2), "filename": "users_export.json"}


@router.get("/settings")
def get_system_settings(
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Get system settings (super admin only)"""
    from ...core.config import settings
    
    return {
        "app_name": settings.APP_NAME,
        "debug": settings.DEBUG,
        "version": settings.VERSION,
        "database_configured": bool(settings.DATABASE_URL),
        "email_configured": bool(settings.SMTP_HOST and settings.SMTP_USER),
        "redis_configured": bool(settings.REDIS_URL),
        "s3_configured": bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_BUCKET_NAME)
    }
