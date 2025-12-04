# app/crud/sale.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from typing import Optional, List
from datetime import datetime, timezone
from decimal import Decimal
import uuid

from ..models.sale import Sale, SaleStatus, JournalEntry
from ..models.inventory import InventoryItem
from ..schemas.sale import SaleCreate, SalePostRequest


class CRUDSale:
    def get(self, db: Session, id: int) -> Optional[Sale]:
        """Get sale by ID"""
        return db.query(Sale).filter(Sale.id == id).first()

    def get_multi(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status: Optional[SaleStatus] = None,
        sold_by_id: Optional[int] = None,
        item_id: Optional[int] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Sale]:
        """Get multiple sales with filters"""
        query = db.query(Sale)

        if status:
            query = query.filter(Sale.status == status)

        if sold_by_id:
            query = query.filter(Sale.sold_by_id == sold_by_id)

        if item_id:
            query = query.filter(Sale.item_id == item_id)

        if start_date:
            query = query.filter(Sale.created_at >= start_date)

        if end_date:
            query = query.filter(Sale.created_at <= end_date)

        return query.order_by(desc(Sale.created_at)).offset(skip).limit(limit).all()

    def create(
        self,
        db: Session,
        obj_in: SaleCreate,
        sold_by_id: int
    ) -> Sale:
        """Create a new sale (Employee action)"""
        # Get the item
        item = db.query(InventoryItem).filter(InventoryItem.id == obj_in.item_id).first()
        if not item:
            raise ValueError("Item not found")

        if not item.is_active:
            raise ValueError("Item is not active")

        if item.quantity < obj_in.quantity_sold:
            raise ValueError(f"Insufficient stock. Available: {item.quantity}, Requested: {obj_in.quantity_sold}")

        # Calculate total sale
        total_sale = float(item.selling_price) * obj_in.quantity_sold

        # Generate receipt number
        receipt_number = f"RCP-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

        # Create sale
        db_sale = Sale(
            item_id=obj_in.item_id,
            quantity_sold=obj_in.quantity_sold,
            selling_price=float(item.selling_price),
            total_sale=total_sale,
            status=SaleStatus.PENDING,
            receipt_number=receipt_number,
            customer_name=obj_in.customer_name,
            customer_email=obj_in.customer_email,
            notes=obj_in.notes,
            sold_by_id=sold_by_id,
        )
        db.add(db_sale)
        db.commit()
        db.refresh(db_sale)

        # Reduce inventory stock
        from .inventory import inventory
        inventory.reduce_stock(db, obj_in.item_id, obj_in.quantity_sold, sold_by_id)

        return db_sale

    def post_sale(
        self,
        db: Session,
        sale_id: int,
        obj_in: SalePostRequest,
        posted_by_id: int
    ) -> Sale:
        """Post a sale to ledger (Accountant action)"""
        sale = self.get(db, sale_id)
        if not sale:
            raise ValueError("Sale not found")

        if sale.status == SaleStatus.POSTED:
            raise ValueError("Sale has already been posted")

        if sale.status == SaleStatus.CANCELLED:
            raise ValueError("Cannot post a cancelled sale")

        # Create journal entry
        journal_entry = JournalEntry(
            sale_id=sale_id,
            entry_date=datetime.now(timezone.utc),
            description=f"Sale of {sale.quantity_sold} units of item #{sale.item_id}",
            debit_account=obj_in.debit_account,
            debit_amount=float(sale.total_sale),
            credit_account=obj_in.credit_account,
            credit_amount=float(sale.total_sale),
            reference_number=obj_in.reference_number or sale.receipt_number,
            notes=obj_in.notes,
            posted_by_id=posted_by_id,
        )
        db.add(journal_entry)

        # Update sale status
        sale.status = SaleStatus.POSTED
        sale.posted_by_id = posted_by_id
        sale.posted_at = datetime.now(timezone.utc)
        sale.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(sale)
        db.refresh(journal_entry)

        return sale

    def cancel_sale(
        self,
        db: Session,
        sale_id: int,
        cancelled_by_id: int
    ) -> Sale:
        """Cancel a sale and restore inventory"""
        sale = self.get(db, sale_id)
        if not sale:
            raise ValueError("Sale not found")

        if sale.status == SaleStatus.POSTED:
            raise ValueError("Cannot cancel a posted sale. Create a reversal entry instead.")

        if sale.status == SaleStatus.CANCELLED:
            raise ValueError("Sale is already cancelled")

        # Restore inventory
        from .inventory import inventory
        inventory.add_stock(db, sale.item_id, sale.quantity_sold, cancelled_by_id)

        # Update sale status
        sale.status = SaleStatus.CANCELLED
        sale.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(sale)

        return sale

    def get_sales_summary(
        self,
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        user_ids: Optional[List[int]] = None
    ) -> dict:
        """
        Get sales summary for Accountant dashboard
        
        IMPORTANT: Only POSTED sales are included in revenue calculations.
        - Employee sales start as PENDING and must be approved by Finance Admin
        - Only after approval (POSTED status) are sales included in revenue and net profit
        
        Args:
            user_ids: If provided, only include sales made by these users (for Finance Admin's team)
        """
        query = db.query(Sale)

        if start_date:
            query = query.filter(Sale.created_at >= start_date)
        if end_date:
            query = query.filter(Sale.created_at <= end_date)
        
        # Filter by user_ids if provided (for Finance Admin's team)
        if user_ids is not None:
            query = query.filter(Sale.sold_by_id.in_(user_ids))

        total_sales = query.count()
        
        # CRITICAL: Only POSTED (approved) sales are included in revenue calculations
        # PENDING sales (especially from employees) are NOT included until approved by Finance Admin
        revenue_query = query.filter(Sale.status == SaleStatus.POSTED)
        
        # Build revenue query with all filters
        revenue_filters = [Sale.status == SaleStatus.POSTED]  # Only approved/posted sales
        if start_date:
            revenue_filters.append(Sale.created_at >= start_date)
        if end_date:
            revenue_filters.append(Sale.created_at <= end_date)
        if user_ids is not None:
            revenue_filters.append(Sale.sold_by_id.in_(user_ids))
        
        total_revenue = db.query(func.sum(Sale.total_sale)).filter(
            and_(*revenue_filters)
        ).scalar() or 0.0

        pending_sales = query.filter(Sale.status == SaleStatus.PENDING).count()
        posted_sales = query.filter(Sale.status == SaleStatus.POSTED).count()

        return {
            'total_sales': total_sales,
            'total_revenue': float(total_revenue),
            'pending_sales': pending_sales,
            'posted_sales': posted_sales,
            'period_start': start_date,
            'period_end': end_date
        }

    def get_journal_entries(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[JournalEntry]:
        """Get journal entries"""
        query = db.query(JournalEntry)

        if start_date:
            query = query.filter(JournalEntry.entry_date >= start_date)
        if end_date:
            query = query.filter(JournalEntry.entry_date <= end_date)

        return query.order_by(desc(JournalEntry.entry_date)).offset(skip).limit(limit).all()

    def get_receipt(self, db: Session, sale_id: int) -> Optional[Sale]:
        """Get sale with receipt information"""
        return self.get(db, sale_id)


sale = CRUDSale()

