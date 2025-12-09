from fastapi import APIRouter, Depends, HTTPException, status, Query # type: ignore[import-untyped]
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import List
import logging

from ...core.database import get_db
from ...crud.notification import notification as notification_crud
from ...schemas.notification import NotificationOut, NotificationUpdate, NotificationPreferencesUpdate, NotificationPreferencesOut
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
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Users can only access their own notifications
        if notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        return notification
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in read_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notification: {str(e)}"
        )


@router.put("/{notification_id}", response_model=NotificationOut)
def update_notification(
    notification_id: int,
    notification_update: NotificationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update notification (mark as read/unread)"""
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Users can only update their own notifications
        if notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        return notification_crud.update(db, db_obj=notification, obj_in=notification_update)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification: {str(e)}"
        )


@router.post("/{notification_id}/mark-read")
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark notification as read"""
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Users can only mark their own notifications as read
        if notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        notification_crud.mark_as_read(db, notification_id)
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in mark_notification_as_read: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )


@router.post("/mark-all-read")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    try:
        count = notification_crud.mark_all_as_read(db, current_user.id)
        return {"message": f"Marked {count} notifications as read"}
    except Exception as e:
        logger.error(f"Unexpected error in mark_all_notifications_as_read: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark all notifications as read: {str(e)}"
        )


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete notification"""
    try:
        notification = notification_crud.get(db, id=notification_id)
        if notification is None:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        # Users can only delete their own notifications
        if notification.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        notification_crud.delete(db, notification_id)
        return {"message": "Notification deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in delete_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete notification: {str(e)}"
        )


@router.post("/create-broadcast")
def create_broadcast_notification(
    title: str,
    message: str,
    target_roles: List[UserRole] = Query(...),
    current_user: User = Depends(require_min_role(UserRole.ADMIN)),
    db: Session = Depends(get_db)
):
    """Create broadcast notification for users with specific roles (admin only)"""
    try:
        from ...models.notification import NotificationType, NotificationPriority
        
        # Get all users with target roles
        users = []
        for role in target_roles:
            try:
                role_users = db.query(User).filter(User.role == role, User.is_active == True).all()
                users.extend(role_users)
            except Exception as e:
                logger.error(f"Error fetching users for role {role}: {str(e)}", exc_info=True)
                # Continue with other roles even if one fails
        
        # Remove duplicates
        user_ids = list(set([user.id for user in users]))
        
        if not user_ids:
            return {
                "message": "No active users found for the specified roles",
                "target_roles": target_roles,
                "recipients": 0
            }
        
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
    except Exception as e:
        logger.error(f"Unexpected error in create_broadcast_notification: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create broadcast notification: {str(e)}"
        )


@router.delete("/cleanup")
def cleanup_notifications(
    current_user: User = Depends(require_min_role(UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db)
):
    """Clean up expired notifications (super admin only)"""
    try:
        count = notification_crud.cleanup_expired(db)
        return {"message": f"Cleaned up {count} expired notifications"}
    except Exception as e:
        logger.error(f"Unexpected error in cleanup_notifications: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cleanup notifications: {str(e)}"
        )


@router.get("/preferences", response_model=dict)
def get_notification_preferences(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's notification preferences"""
    try:
        from ...schemas.notification import NotificationPreferencesOut, QuietHours
        from datetime import datetime
        
        # Default preferences structure matching frontend
        default_preferences = {
            "notificationPreferences": {
                "claims": {"email": True, "sms": False, "app": True, "push": True},
                "appointments": {"email": True, "sms": True, "app": True, "push": True},
                "messages": {"email": True, "sms": False, "app": True, "push": True},
                "billing": {"email": True, "sms": False, "app": True, "push": False},
                "policy": {"email": True, "sms": False, "app": True, "push": False},
                "marketing": {"email": False, "sms": False, "app": False, "push": False},
                "system": {"email": True, "sms": False, "app": True, "push": False}
            },
            "doNotDisturb": False,
            "quietHours": {"enabled": False, "startTime": "22:00", "endTime": "08:00"}
        }
        
        # Get user's preferences from database
        if current_user.notification_preferences:
            user_prefs = current_user.notification_preferences
            # Merge with defaults to ensure all fields are present
            result = {
                "notificationPreferences": {
                    **default_preferences["notificationPreferences"],
                    **(user_prefs.get("notificationPreferences", {}) or {})
                },
                "doNotDisturb": user_prefs.get("doNotDisturb", False),
                "quietHours": {
                    **default_preferences["quietHours"],
                    **(user_prefs.get("quietHours", {}) or {})
                },
                "lastUpdated": user_prefs.get("lastUpdated")
            }
            return result
        
        return {
            **default_preferences,
            "lastUpdated": None
        }
    except Exception as e:
        logger.error(f"Unexpected error in get_notification_preferences: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notification preferences: {str(e)}"
        )


@router.put("/preferences", response_model=dict)
def update_notification_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user's notification preferences"""
    try:
        from datetime import datetime
        
        # Validate and structure the preferences
        notification_prefs = {
            "notificationPreferences": preferences.get("notificationPreferences", {}),
            "doNotDisturb": preferences.get("doNotDisturb", False),
            "quietHours": preferences.get("quietHours", {
                "enabled": False,
                "startTime": "22:00",
                "endTime": "08:00"
            }),
            "lastUpdated": datetime.utcnow().isoformat()
        }
        
        # Update user's notification preferences
        current_user.notification_preferences = notification_prefs
        db.commit()
        db.refresh(current_user)
        
        return {
            "message": "Notification preferences updated successfully",
            "preferences": notification_prefs
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in update_notification_preferences: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification preferences: {str(e)}"
        )