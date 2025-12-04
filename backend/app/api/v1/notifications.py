from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
import logging

from ...core.database import get_db
from ...crud.notification import notification as notification_crud
from ...schemas.notification import NotificationOut, NotificationUpdate
from ...models.user import User, UserRole
from ...api.deps import get_current_active_user, require_min_role

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[NotificationOut])
def read_notifications(
    skip: int = 0,
    limit: int = 100,
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's notifications"""
    try:
        if unread_only:
            notifications = notification_crud.get_unread(db, current_user.id, skip, limit)
        else:
            notifications = notification_crud.get_by_user(db, current_user.id, skip, limit)
        return notifications
    except Exception as e:
        logger.error(f"Error fetching notifications for user {current_user.id}: {str(e)}", exc_info=True)
        # Return empty list as a safe default
        return []


@router.get("/unread/count")
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    try:
        count = notification_crud.get_unread_count(db, current_user.id)
        return {"unread_count": count}
    except Exception as e:
        logger.error(f"Error fetching unread notification count for user {current_user.id}: {str(e)}", exc_info=True)
        # Return 0 as a safe default instead of crashing
        return {"unread_count": 0}


@router.get("/{notification_id}", response_model=NotificationOut)
def read_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific notification"""
    notification = notification_crud.get(db, id=notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Users can only access their own notifications
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return notification


@router.put("/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update notification (mark as read/unread)"""
    notification = notification_crud.get(db, id=notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Users can only update their own notifications
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return notification_crud.update(db, db_obj=notification, obj_in=notification_update)


@router.post("/{notification_id}/mark-read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    notification = notification_crud.get(db, id=notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Users can only mark their own notifications as read
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    notification_crud.mark_as_read(db, notification_id)
    return {"message": "Notification marked as read"}


@router.post("/mark-all-read")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    count = notification_crud.mark_all_as_read(db, current_user.id)
    return {"message": f"Marked {count} notifications as read"}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""
    notification = notification_crud.get(db, id=notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Users can only delete their own notifications
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    notification_crud.delete(db, notification_id)
    return {"message": "Notification deleted successfully"}


@router.post("/create-broadcast")
def create_broadcast_notification(
    title: str,
    message: str,
    target_roles: List[UserRole] = Query(...),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create broadcast notification for users with specific roles (admin only)"""
    from ...models.notification import NotificationType, NotificationPriority
    
    # Get all users with target roles
    users = []
    for role in target_roles:
        role_users = db.query(User).filter(User.role == role, User.is_active == True).all()
        users.extend(role_users)
    
    # Remove duplicates
    user_ids = list(set([user.id for user in users]))
    
    # Create notifications for all target users
    notifications = notification_crud.create_for_users(
        db=db,
        user_ids=user_ids,
        title=title,
        message=message,
        notification_type=NotificationType.SYSTEM_ALERT,
        priority=NotificationPriority.HIGH
    )
    
    return {
        "message": f"Broadcast notification sent to {len(notifications)} users",
        "target_roles": target_roles,
        "recipients": len(notifications)
    }


@router.delete("/cleanup")
def cleanup_notifications(
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Clean up expired notifications (super admin only)"""
    count = notification_crud.cleanup_expired(db)
    return {"message": f"Cleaned up {count} expired notifications"}
