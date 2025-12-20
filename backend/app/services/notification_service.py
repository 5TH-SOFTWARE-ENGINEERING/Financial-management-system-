"""
Comprehensive notification service for pushing notifications for any event
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import logging

from ..crud.notification import notification as notification_crud
from ..crud.user import user as user_crud
from ..models.notification import NotificationType, NotificationPriority
from ..models.user import User, UserRole
from ..schemas.notification import NotificationCreate

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating and managing notifications for any event"""
    
    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        expires_at: Optional[datetime] = None
    ) -> Optional[Any]:
        """Create a single notification for a user"""
        try:
            notification_data = NotificationCreate(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                priority=priority,
                action_url=action_url,
                expires_at=expires_at
            )
            return notification_crud.create(db, obj_in=notification_data)
        except Exception as e:
            logger.error(f"Failed to create notification for user {user_id}: {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def notify_expense_created(
        db: Session,
        expense_id: int,
        expense_title: str,
        amount: float,
        created_by_id: int,
        requires_approval: bool = True
    ):
        """Notify relevant users when an expense is created"""
        try:
            # Notify the creator
            NotificationService.create_notification(
                db=db,
                user_id=created_by_id,
                title="Expense Created",
                message=f"Your expense '{expense_title}' (${amount:,.2f}) has been created successfully.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/expenses/{expense_id}"
            )
            
            # If requires approval, notify approvers
            if requires_approval:
                approvers = NotificationService._get_approvers(db, created_by_id)
                for approver in approvers:
                    NotificationService.create_notification(
                        db=db,
                        user_id=approver.id,
                        title="Expense Approval Required",
                        message=f"New expense '{expense_title}' (${amount:,.2f}) requires your approval.",
                        notification_type=NotificationType.APPROVAL_REQUEST,
                        priority=NotificationPriority.HIGH,
                        action_url=f"/approvals?expense_id={expense_id}"
                    )
        except Exception as e:
            logger.error(f"Failed to send expense creation notifications: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_expense_updated(
        db: Session,
        expense_id: int,
        expense_title: str,
        updated_by_id: int
    ):
        """Notify when an expense is updated"""
        try:
            NotificationService.create_notification(
                db=db,
                user_id=updated_by_id,
                title="Expense Updated",
                message=f"Expense '{expense_title}' has been updated successfully.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/expenses/{expense_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send expense update notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_expense_approved(
        db: Session,
        expense_id: int,
        expense_title: str,
        approver_id: int,
        requester_id: int
    ):
        """Notify when an expense is approved"""
        try:
            # Notify the requester
            NotificationService.create_notification(
                db=db,
                user_id=requester_id,
                title="Expense Approved",
                message=f"Your expense '{expense_title}' has been approved.",
                notification_type=NotificationType.APPROVAL_DECISION,
                priority=NotificationPriority.MEDIUM,
                action_url=f"/expenses/{expense_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send expense approval notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_revenue_created(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        amount: float,
        created_by_id: int,
        requires_approval: bool = True
    ):
        """Notify relevant users when revenue is created"""
        try:
            # Notify the creator
            NotificationService.create_notification(
                db=db,
                user_id=created_by_id,
                title="Revenue Created",
                message=f"Your revenue entry '{revenue_title}' (${amount:,.2f}) has been created successfully.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/revenue/{revenue_id}"
            )
            
            # If requires approval, notify approvers
            if requires_approval:
                approvers = NotificationService._get_approvers(db, created_by_id)
                for approver in approvers:
                    NotificationService.create_notification(
                        db=db,
                        user_id=approver.id,
                        title="Revenue Approval Required",
                        message=f"New revenue entry '{revenue_title}' (${amount:,.2f}) requires your approval.",
                        notification_type=NotificationType.APPROVAL_REQUEST,
                        priority=NotificationPriority.HIGH,
                        action_url=f"/approvals?revenue_id={revenue_id}"
                    )
        except Exception as e:
            logger.error(f"Failed to send revenue creation notifications: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_revenue_updated(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        updated_by_id: int
    ):
        """Notify when revenue is updated"""
        try:
            NotificationService.create_notification(
                db=db,
                user_id=updated_by_id,
                title="Revenue Updated",
                message=f"Revenue entry '{revenue_title}' has been updated successfully.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/revenue/{revenue_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send revenue update notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_sale_created(
        db: Session,
        sale_id: int,
        item_name: str,
        quantity: int,
        total_amount: float,
        created_by_id: int
    ):
        """Notify when a sale is created"""
        try:
            NotificationService.create_notification(
                db=db,
                user_id=created_by_id,
                title="Sale Created",
                message=f"Sale for {quantity}x {item_name} (${total_amount:,.2f}) has been created.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.MEDIUM,
                action_url=f"/sales/{sale_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send sale creation notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_sale_posted(
        db: Session,
        sale_id: int,
        item_name: str,
        posted_by_id: int
    ):
        """Notify when a sale is posted to ledger"""
        try:
            NotificationService.create_notification(
                db=db,
                user_id=posted_by_id,
                title="Sale Posted to Ledger",
                message=f"Sale for {item_name} has been posted to the accounting ledger.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.MEDIUM,
                action_url=f"/sales/accounting"
            )
        except Exception as e:
            logger.error(f"Failed to send sale posted notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_budget_exceeded(
        db: Session,
        budget_id: int,
        budget_name: str,
        exceeded_amount: float,
        user_id: int
    ):
        """Notify when a budget is exceeded"""
        try:
            NotificationService.create_notification(
                db=db,
                user_id=user_id,
                title="Budget Exceeded",
                message=f"Budget '{budget_name}' has been exceeded by ${exceeded_amount:,.2f}.",
                notification_type=NotificationType.BUDGET_EXCEEDED,
                priority=NotificationPriority.HIGH,
                action_url=f"/budgets/{budget_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send budget exceeded notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_forecast_created(
        db: Session,
        forecast_id: int,
        forecast_name: str,
        created_by_id: int
    ):
        """Notify when a forecast is created"""
        try:
            NotificationService.create_notification(
                db=db,
                user_id=created_by_id,
                title="Forecast Created",
                message=f"Forecast '{forecast_name}' has been created successfully.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url=f"/forecast/{forecast_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send forecast creation notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_ml_training_completed(
        db: Session,
        model_type: str,
        metric: str,
        status: str,
        user_id: Optional[int] = None
    ):
        """Notify when ML model training completes"""
        try:
            if user_id:
                title = f"ML Training Complete: {model_type.upper()}"
                message = f"Training for {model_type} model on {metric} has {status}."
                NotificationService.create_notification(
                    db=db,
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=NotificationType.SYSTEM_ALERT,
                    priority=NotificationPriority.MEDIUM if status == "completed" else NotificationPriority.HIGH,
                    action_url="/ml-training"
                )
        except Exception as e:
            logger.error(f"Failed to send ML training notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_inventory_low(
        db: Session,
        item_id: int,
        item_name: str,
        current_quantity: int,
        min_quantity: int,
        user_ids: List[int]
    ):
        """Notify when inventory is low"""
        try:
            for user_id in user_ids:
                NotificationService.create_notification(
                    db=db,
                    user_id=user_id,
                    title="Low Inventory Alert",
                    message=f"Inventory item '{item_name}' is low: {current_quantity} remaining (minimum: {min_quantity}).",
                    notification_type=NotificationType.SYSTEM_ALERT,
                    priority=NotificationPriority.HIGH,
                    action_url=f"/inventory/manage?item_id={item_id}"
                )
        except Exception as e:
            logger.error(f"Failed to send inventory low notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_custom(
        db: Session,
        user_ids: List[int],
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
        expires_at: Optional[datetime] = None
    ) -> List[Any]:
        """Create custom notifications for any event - generic method for pushing notifications for anything"""
        try:
            notifications = notification_crud.create_for_users(
                db=db,
                user_ids=user_ids,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                action_url=action_url,
                expires_at=expires_at
            )
            return notifications
        except Exception as e:
            logger.error(f"Failed to create custom notifications: {str(e)}", exc_info=True)
            return []
    
    @staticmethod
    def notify_by_role(
        db: Session,
        roles: List[UserRole],
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM_ALERT,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None
    ):
        """Notify all users with specific roles"""
        try:
            user_ids = []
            for role in roles:
                users = db.query(User).filter(
                    User.role == role,
                    User.is_active == True
                ).all()
                user_ids.extend([user.id for user in users])
            
            # Remove duplicates
            user_ids = list(set(user_ids))
            
            if user_ids:
                NotificationService.notify_custom(
                    db=db,
                    user_ids=user_ids,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                    priority=priority,
                    action_url=action_url
                )
        except Exception as e:
            logger.error(f"Failed to send role-based notifications: {str(e)}", exc_info=True)
    
    @staticmethod
    def _get_approvers(db: Session, requester_id: int) -> List[User]:
        """Get list of approvers for a requester"""
        try:
            requester = user_crud.get(db, id=requester_id)
            if not requester:
                return []
            
            approvers = []
            
            # Get manager if exists
            if requester.manager_id:
                manager = user_crud.get(db, id=requester.manager_id)
                if manager and manager.is_active:
                    approvers.append(manager)
            
            # Get finance managers/admins
            finance_admins = db.query(User).filter(
                User.role.in_([UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER]),
                User.is_active == True
            ).all()
            approvers.extend(finance_admins)
            
            # Get general admins if no other approvers
            if not approvers:
                admins = db.query(User).filter(
                    User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                    User.is_active == True
                ).limit(5).all()
                approvers.extend(admins)
            
            # Remove duplicates
            seen = set()
            unique_approvers = []
            for approver in approvers:
                if approver.id not in seen:
                    seen.add(approver.id)
                    unique_approvers.append(approver)
            
            return unique_approvers
        except Exception as e:
            logger.error(f"Failed to get approvers: {str(e)}", exc_info=True)
            return []

