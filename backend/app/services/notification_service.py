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
                    notification_type=NotificationType.INVENTORY_LOW,
                    priority=NotificationPriority.HIGH,
                    action_url=f"/inventory/manage?item_id={item_id}"
                )
        except Exception as e:
            logger.error(f"Failed to send inventory low notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_inventory_created(
        db: Session,
        item_id: int,
        item_name: str,
        quantity: int,
        created_by_id: int
    ):
        """Notify when inventory item is created"""
        try:
            # Notify the creator
            NotificationService.create_notification(
                db=db,
                user_id=created_by_id,
                title="Inventory Item Created",
                message=f"Inventory item '{item_name}' (Quantity: {quantity}) has been created successfully.",
                notification_type=NotificationType.INVENTORY_UPDATED,
                priority=NotificationPriority.LOW,
                action_url=f"/inventory/manage?item_id={item_id}"
            )
            
            # Notify the creator's manager and relevant admins only
            creator = user_crud.get(db, id=created_by_id)
            notify_ids = []
            if creator and creator.manager_id:
                notify_ids.append(creator.manager_id)
            
            # Plus any global admins (limited to avoid spam)
            admins = db.query(User).filter(
                User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                User.is_active == True,
                User.id != created_by_id,
                User.id.notin_(notify_ids)
            ).limit(5).all()
            
            notify_ids.extend([admin.id for admin in admins])
            
            for target_id in list(set(notify_ids)):
                NotificationService.create_notification(
                    db=db,
                    user_id=target_id,
                    title="New Inventory Item",
                    message=f"A new inventory item '{item_name}' has been added by {creator.full_name or creator.username}.",
                    notification_type=NotificationType.INVENTORY_UPDATED,
                    priority=NotificationPriority.LOW,
                    action_url=f"/inventory/manage?item_id={item_id}"
                )
        except Exception as e:
            logger.error(f"Failed to send inventory creation notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_inventory_updated(
        db: Session,
        item_id: int,
        item_name: str,
        updated_by_id: int,
        changes: List[str] = None
    ):
        """Notify when inventory item is updated"""
        try:
            changes_text = ", ".join(changes) if changes else "updated"
            NotificationService.create_notification(
                db=db,
                user_id=updated_by_id,
                title="Inventory Item Updated",
                message=f"Inventory item '{item_name}' has been {changes_text}.",
                notification_type=NotificationType.INVENTORY_UPDATED,
                priority=NotificationPriority.LOW,
                action_url=f"/inventory/manage?item_id={item_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send inventory update notification: {str(e)}", exc_info=True)
    
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
            # Notify the creator
            NotificationService.create_notification(
                db=db,
                user_id=created_by_id,
                title="Sale Created",
                message=f"Sale for {quantity}x {item_name} (${total_amount:,.2f}) has been created successfully.",
                notification_type=NotificationType.SALE_CREATED,
                priority=NotificationPriority.MEDIUM,
                action_url=f"/sales/accounting?sale_id={sale_id}"
            )
            
            # Notify the manager (the Finance Admin) and global admins if necessary
            creator = user_crud.get(db, id=created_by_id)
            notify_ids = []
            if creator and creator.manager_id:
                notify_ids.append(creator.manager_id)
            
            # If no direct manager, notify global admins
            if not notify_ids:
                admins = db.query(User).filter(
                    User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                    User.is_active == True,
                    User.id != created_by_id
                ).limit(5).all()
                notify_ids.extend([admin.id for admin in admins])
            
            for target_id in list(set(notify_ids)):
                NotificationService.create_notification(
                    db=db,
                    user_id=target_id,
                    title="New Sale Pending",
                    message=f"New sale for {quantity}x {item_name} (${total_amount:,.2f}) is pending posting to ledger.",
                    notification_type=NotificationType.SALE_CREATED,
                    priority=NotificationPriority.HIGH,
                    action_url=f"/sales/accounting?sale_id={sale_id}"
                )
        except Exception as e:
            logger.error(f"Failed to send sale creation notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_sale_posted(
        db: Session,
        sale_id: int,
        item_name: str,
        total_amount: float,
        posted_by_id: int,
        sold_by_id: int
    ):
        """Notify when a sale is posted to ledger"""
        try:
            # Notify the person who posted
            NotificationService.create_notification(
                db=db,
                user_id=posted_by_id,
                title="Sale Posted to Ledger",
                message=f"Sale for {item_name} (${total_amount:,.2f}) has been posted to the accounting ledger.",
                notification_type=NotificationType.SALE_POSTED,
                priority=NotificationPriority.MEDIUM,
                action_url=f"/sales/accounting"
            )
            
            # Notify the original seller if different
            if sold_by_id != posted_by_id:
                NotificationService.create_notification(
                    db=db,
                    user_id=sold_by_id,
                    title="Sale Posted to Ledger",
                    message=f"Your sale for {item_name} (${total_amount:,.2f}) has been posted to the accounting ledger.",
                    notification_type=NotificationType.SALE_POSTED,
                    priority=NotificationPriority.MEDIUM,
                    action_url=f"/sales/accounting"
                )
        except Exception as e:
            logger.error(f"Failed to send sale posted notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_pending_approvals(
        db: Session,
        approver_id: int,
        pending_count: int
    ):
        """Notify approvers about pending approvals"""
        try:
            if pending_count > 0:
                NotificationService.create_notification(
                    db=db,
                    user_id=approver_id,
                    title="Pending Approvals",
                    message=f"You have {pending_count} pending approval{'s' if pending_count > 1 else ''} requiring your attention.",
                    notification_type=NotificationType.APPROVAL_REQUEST,
                    priority=NotificationPriority.HIGH,
                    action_url="/approvals"
                )
        except Exception as e:
            logger.error(f"Failed to send pending approvals notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_user_created(
        db: Session,
        new_user_id: int,
        new_user_email: str,
        new_user_role: UserRole,
        created_by_id: int,
        created_by_name: str
    ):
        """Notify when a new user is created"""
        try:
            # Notify the newly created user
            NotificationService.create_notification(
                db=db,
                user_id=new_user_id,
                title="Welcome to the System",
                message=f"Your account has been created by {created_by_name}. Welcome aboard!",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.MEDIUM,
                action_url="/users/me"
            )
            
            # Notify admins about new user creation
            admins = db.query(User).filter(
                User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                User.is_active == True,
                User.id != created_by_id  # Don't notify the creator
            ).all()
            
            for admin in admins:
                NotificationService.create_notification(
                    db=db,
                    user_id=admin.id,
                    title="New User Created",
                    message=f"A new {new_user_role.value} user '{new_user_email}' has been created by {created_by_name}.",
                    notification_type=NotificationType.SYSTEM_ALERT,
                    priority=NotificationPriority.LOW,
                    action_url=f"/users/{new_user_id}"
                )
        except Exception as e:
            logger.error(f"Failed to send user creation notifications: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_user_updated(
        db: Session,
        updated_user_id: int,
        updated_user_email: str,
        updated_by_id: int,
        updated_by_name: str,
        changes: List[str] = None
    ):
        """Notify when a user is updated"""
        try:
            changes_text = ", ".join(changes) if changes else "your profile"
            
            # Notify the updated user
            NotificationService.create_notification(
                db=db,
                user_id=updated_user_id,
                title="Profile Updated",
                message=f"Your account has been updated by {updated_by_name}. Changes: {changes_text}.",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.LOW,
                action_url="/users/me"
            )
        except Exception as e:
            logger.error(f"Failed to send user update notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_expense_rejected(
        db: Session,
        expense_id: int,
        expense_title: str,
        rejected_by_id: int,
        requester_id: int,
        rejection_reason: str = None
    ):
        """Notify when an expense is rejected"""
        try:
            reason_text = f" Reason: {rejection_reason}" if rejection_reason else ""
            NotificationService.create_notification(
                db=db,
                user_id=requester_id,
                title="Expense Rejected",
                message=f"Your expense '{expense_title}' has been rejected.{reason_text}",
                notification_type=NotificationType.APPROVAL_DECISION,
                priority=NotificationPriority.HIGH,
                action_url=f"/expenses/{expense_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send expense rejection notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_revenue_approved(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        approver_id: int,
        requester_id: int
    ):
        """Notify when revenue is approved"""
        try:
            NotificationService.create_notification(
                db=db,
                user_id=requester_id,
                title="Revenue Approved",
                message=f"Your revenue entry '{revenue_title}' has been approved.",
                notification_type=NotificationType.APPROVAL_DECISION,
                priority=NotificationPriority.MEDIUM,
                action_url=f"/revenue/{revenue_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send revenue approval notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_revenue_rejected(
        db: Session,
        revenue_id: int,
        revenue_title: str,
        rejected_by_id: int,
        requester_id: int,
        rejection_reason: str = None
    ):
        """Notify when revenue is rejected"""
        try:
            reason_text = f" Reason: {rejection_reason}" if rejection_reason else ""
            NotificationService.create_notification(
                db=db,
                user_id=requester_id,
                title="Revenue Rejected",
                message=f"Your revenue entry '{revenue_title}' has been rejected.{reason_text}",
                notification_type=NotificationType.APPROVAL_DECISION,
                priority=NotificationPriority.HIGH,
                action_url=f"/revenue/{revenue_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send revenue rejection notification: {str(e)}", exc_info=True)
    
    @staticmethod
    def notify_approval_decision(
        db: Session,
        approval_id: int,
        approval_title: str,
        decision: str,  # "approved" or "rejected"
        approver_id: int,
        requester_id: int,
        rejection_reason: str = None
    ):
        """Notify when an approval workflow is decided"""
        try:
            if decision.lower() == "approved":
                title = "Approval Granted"
                message = f"Your approval request '{approval_title}' has been approved."
                priority = NotificationPriority.MEDIUM
            else:
                title = "Approval Rejected"
                reason_text = f" Reason: {rejection_reason}" if rejection_reason else ""
                message = f"Your approval request '{approval_title}' has been rejected.{reason_text}"
                priority = NotificationPriority.HIGH
            
            NotificationService.create_notification(
                db=db,
                user_id=requester_id,
                title=title,
                message=message,
                notification_type=NotificationType.APPROVAL_DECISION,
                priority=priority,
                action_url=f"/approvals/{approval_id}"
            )
        except Exception as e:
            logger.error(f"Failed to send approval decision notification: {str(e)}", exc_info=True)
    
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
        """Get list of approvers for a requester - prioritized by hierarchy"""
        try:
            requester = user_crud.get(db, id=requester_id)
            if not requester:
                return []
            
            approvers = []
            
            # 1. Primary Approver: The direct manager
            if requester.manager_id:
                manager = user_crud.get(db, id=requester.manager_id)
                if manager and manager.is_active:
                    approvers.append(manager)
            
            # 2. Secondary Approvers: Global Admins (limited)
            # Only include global admins if they are not the manager
            admins = db.query(User).filter(
                User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
                User.is_active == True,
                User.id != requester_id
            ).limit(3).all()
            approvers.extend(admins)
            
            # 3. Fallback: If no manager and no admins, include a few Finance Admins
            if not approvers:
                finance_admins = db.query(User).filter(
                    User.role == UserRole.FINANCE_ADMIN,
                    User.is_active == True,
                    User.id != requester_id
                ).limit(3).all()
                approvers.extend(finance_admins)
            
            # Remove duplicates and ensure uniqueness
            id_to_user = {u.id: u for u in approvers}
            return list(id_to_user.values())
        except Exception as e:
            logger.error(f"Failed to get approvers: {str(e)}", exc_info=True)
            return []

