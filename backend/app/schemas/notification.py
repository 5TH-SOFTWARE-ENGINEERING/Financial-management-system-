from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.notification import NotificationType, NotificationPriority


class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType
    priority: NotificationPriority = NotificationPriority.MEDIUM
    action_url: Optional[str] = None
    expires_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    user_id: int


class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[NotificationType] = None
    priority: Optional[NotificationPriority] = None
    is_read: Optional[bool] = None
    action_url: Optional[str] = None
    expires_at: Optional[datetime] = None


class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool = False
    is_email_sent: bool = False
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True
