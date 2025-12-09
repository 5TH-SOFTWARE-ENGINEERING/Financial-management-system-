# app/crud/inventory.py
from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_, or_, func # type: ignore[import-untyped]
from typing import Optional, List
from datetime import datetime, timezone
from decimal import Decimal

from ..models.inventory import InventoryItem
from ..models.inventory_audit import InventoryAuditLog, InventoryChangeType
from ..schemas.inventory import InventoryItemCreate, InventoryItemUpdate


class CRUDInventory:
    def get(self, db: Session, id: int) -> Optional[InventoryItem]:
        """Get inventory item by ID"""
        return db.query(InventoryItem).filter(InventoryItem.id == id).first()

    def get_multi(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> List[InventoryItem]:
        """Get multiple inventory items with filters"""
        query = db.query(InventoryItem)

        if is_active is not None:
            query = query.filter(InventoryItem.is_active == is_active)

        if category:
            query = query.filter(InventoryItem.category == category)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    InventoryItem.item_name.ilike(search_term),
                    InventoryItem.description.ilike(search_term),
                    InventoryItem.sku.ilike(search_term)
                )
            )

        return query.order_by(InventoryItem.created_at.desc()).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        obj_in: InventoryItemCreate,
        created_by_id: int
    ) -> InventoryItem:
        """Create new inventory item"""
        # Calculate total cost
        total_cost = float(obj_in.buying_price) + float(obj_in.expense_amount)

        db_obj = InventoryItem(
            item_name=obj_in.item_name,
            buying_price=float(obj_in.buying_price),
            expense_amount=float(obj_in.expense_amount),
            total_cost=total_cost,
            selling_price=float(obj_in.selling_price),
            quantity=obj_in.quantity,
            description=obj_in.description,
            category=obj_in.category,
            sku=obj_in.sku,
            is_active=obj_in.is_active,
            created_by_id=created_by_id,
            last_modified_by_id=created_by_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        # Create audit log
        self._create_audit_log(
            db=db,
            item_id=db_obj.id,
            change_type=InventoryChangeType.CREATED,
            changed_by_id=created_by_id,
            old_value=None,
            new_value=f"Item created: {db_obj.item_name}"
        )

        return db_obj

    def update(
        self,
        db: Session,
        db_obj: InventoryItem,
        obj_in: InventoryItemUpdate,
        updated_by_id: int
    ) -> InventoryItem:
        """Update inventory item with audit logging"""
        update_data = obj_in.dict(exclude_unset=True)
        
        # Track changes for audit log
        changes = []
        
        for field, new_value in update_data.items():
            old_value = getattr(db_obj, field, None)
            
            # Special handling for cost fields
            if field == 'buying_price' or field == 'expense_amount':
                # Recalculate total_cost if cost fields are updated
                if 'buying_price' in update_data:
                    buying_price = float(update_data['buying_price'])
                else:
                    buying_price = db_obj.buying_price
                
                if 'expense_amount' in update_data:
                    expense_amount = float(update_data['expense_amount'])
                else:
                    expense_amount = db_obj.expense_amount
                
                new_total_cost = buying_price + expense_amount
                if db_obj.total_cost != new_total_cost:
                    changes.append(('total_cost', str(db_obj.total_cost), str(new_total_cost)))
                    db_obj.total_cost = new_total_cost
            
            if old_value != new_value:
                changes.append((field, str(old_value) if old_value is not None else None, str(new_value)))
                setattr(db_obj, field, new_value)

        db_obj.last_modified_by_id = updated_by_id
        db_obj.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(db_obj)

        # Create audit logs for each change
        for field, old_val, new_val in changes:
            change_type = InventoryChangeType.UPDATED
            if field == 'selling_price':
                change_type = InventoryChangeType.PRICE_CHANGED
            elif field == 'quantity' and old_val:
                old_qty = int(float(old_val))
                new_qty = int(float(new_val))
                if new_qty > old_qty:
                    change_type = InventoryChangeType.STOCK_ADDED
                else:
                    change_type = InventoryChangeType.STOCK_REDUCED
            elif field == 'is_active':
                change_type = InventoryChangeType.ACTIVATED if new_val == 'True' else InventoryChangeType.DEACTIVATED

            self._create_audit_log(
                db=db,
                item_id=db_obj.id,
                change_type=change_type,
                field_changed=field,
                changed_by_id=updated_by_id,
                old_value=old_val,
                new_value=new_val
            )

        return db_obj

    def reduce_stock(
        self,
        db: Session,
        item_id: int,
        quantity: int,
        changed_by_id: int
    ) -> Optional[InventoryItem]:
        """Reduce stock quantity (used when item is sold)"""
        item = self.get(db, item_id)
        if not item:
            return None

        if item.quantity < quantity:
            raise ValueError(f"Insufficient stock. Available: {item.quantity}, Requested: {quantity}")

        old_quantity = item.quantity
        item.quantity -= quantity
        item.last_modified_by_id = changed_by_id
        item.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(item)

        # Create audit log
        self._create_audit_log(
            db=db,
            item_id=item_id,
            change_type=InventoryChangeType.STOCK_REDUCED,
            field_changed='quantity',
            changed_by_id=changed_by_id,
            old_value=str(old_quantity),
            new_value=str(item.quantity),
            change_reason=f"Stock reduced due to sale of {quantity} units"
        )

        return item

    def add_stock(
        self,
        db: Session,
        item_id: int,
        quantity: int,
        changed_by_id: int
    ) -> Optional[InventoryItem]:
        """Add stock quantity"""
        item = self.get(db, item_id)
        if not item:
            return None

        old_quantity = item.quantity
        item.quantity += quantity
        item.last_modified_by_id = changed_by_id
        item.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(item)

        # Create audit log
        self._create_audit_log(
            db=db,
            item_id=item_id,
            change_type=InventoryChangeType.STOCK_ADDED,
            field_changed='quantity',
            changed_by_id=changed_by_id,
            old_value=str(old_quantity),
            new_value=str(item.quantity),
            change_reason=f"Stock increased by {quantity} units"
        )

        return item

    def get_audit_logs(
        self,
        db: Session,
        item_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[InventoryAuditLog]:
        """Get audit logs for an inventory item"""
        return db.query(InventoryAuditLog).filter(
            InventoryAuditLog.item_id == item_id
        ).order_by(
            InventoryAuditLog.created_at.desc()
        ).offset(skip).limit(limit).all()

    def _create_audit_log(
        self,
        db: Session,
        item_id: int,
        change_type: InventoryChangeType,
        changed_by_id: int,
        field_changed: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        change_reason: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> InventoryAuditLog:
        """Create an audit log entry"""
        audit_log = InventoryAuditLog(
            item_id=item_id,
            change_type=change_type.value if isinstance(change_type, InventoryChangeType) else change_type,
            field_changed=field_changed,
            old_value=old_value,
            new_value=new_value,
            changed_by_id=changed_by_id,
            change_reason=change_reason,
            ip_address=ip_address
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log

    def get_low_stock_items(
        self,
        db: Session,
        threshold: int = 10
    ) -> List[InventoryItem]:
        """Get items with stock below threshold"""
        return db.query(InventoryItem).filter(
            and_(
                InventoryItem.quantity <= threshold,
                InventoryItem.is_active == True
            )
        ).all()

    def delete(self, db: Session, id: int, deleted_by_id: int) -> bool:
        """Delete inventory item"""
        item = self.get(db, id)
        if not item:
            return False
        
        # Create audit log before deletion
        self._create_audit_log(
            db=db,
            item_id=item.id,
            change_type=InventoryChangeType.DELETED,
            field_changed='item',
            changed_by_id=deleted_by_id,
            old_value=item.item_name,
            new_value=None
        )
        
        db.delete(item)
        db.commit()
        return True

    def get_total_value(self, db: Session) -> dict:
        """Get total inventory value (all inventory)"""
        result = db.query(
            func.sum(InventoryItem.total_cost * InventoryItem.quantity).label('total_cost_value'),
            func.sum(InventoryItem.selling_price * InventoryItem.quantity).label('total_selling_value'),
            func.sum(InventoryItem.quantity).label('total_quantity_in_stock'),
            func.count(InventoryItem.id).label('total_items')
        ).filter(InventoryItem.is_active == True).first()

        # Handle case when no inventory items exist
        if result is None:
            return {
                'total_cost_value': 0.0,
                'total_selling_value': 0.0,
                'total_quantity_in_stock': 0,
                'total_items': 0,
                'potential_profit': 0.0
            }

        return {
            'total_cost_value': float(result.total_cost_value or 0),
            'total_selling_value': float(result.total_selling_value or 0),
            'total_quantity_in_stock': int(result.total_quantity_in_stock or 0),
            'total_items': result.total_items or 0,
            'potential_profit': float(result.total_selling_value or 0) - float(result.total_cost_value or 0)
        }
    
    def get_total_value_by_users(self, db: Session, user_ids: List[int]) -> dict:
        """Get total inventory value for specific users (Finance Admin's team only)"""
        # Handle empty user_ids list
        if not user_ids:
            return {
                'total_cost_value': 0.0,
                'total_selling_value': 0.0,
                'total_quantity_in_stock': 0,
                'total_items': 0,
                'potential_profit': 0.0
            }

        result = db.query(
            func.sum(InventoryItem.total_cost * InventoryItem.quantity).label('total_cost_value'),
            func.sum(InventoryItem.selling_price * InventoryItem.quantity).label('total_selling_value'),
            func.sum(InventoryItem.quantity).label('total_quantity_in_stock'),
            func.count(InventoryItem.id).label('total_items')
        ).filter(
            and_(
                InventoryItem.is_active == True,
                InventoryItem.created_by_id.in_(user_ids)
            )
        ).first()

        # Handle case when no inventory items exist for these users
        if result is None:
            return {
                'total_cost_value': 0.0,
                'total_selling_value': 0.0,
                'total_quantity_in_stock': 0,
                'total_items': 0,
                'potential_profit': 0.0
            }

        return {
            'total_cost_value': float(result.total_cost_value or 0),
            'total_selling_value': float(result.total_selling_value or 0),
            'total_quantity_in_stock': int(result.total_quantity_in_stock or 0),
            'total_items': result.total_items or 0,
            'potential_profit': float(result.total_selling_value or 0) - float(result.total_cost_value or 0)
        }


inventory = CRUDInventory()

