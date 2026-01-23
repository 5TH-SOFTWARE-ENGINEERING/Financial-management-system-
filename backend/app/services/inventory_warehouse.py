from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.inventory import Warehouse, WarehouseItemStock, StockTransfer, TransferStatus, InventoryItem
from ..schemas.inventory import WarehouseCreate, WarehouseUpdate, StockTransferCreate

class WarehouseService:
    @staticmethod
    def create_warehouse(db: Session, obj_in: WarehouseCreate) -> Warehouse:
        db_obj = Warehouse(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def get_warehouses(db: Session) -> List[Warehouse]:
        return db.query(Warehouse).all()

    @staticmethod
    def update_stock(db: Session, warehouse_id: int, item_id: int, quantity_change: int):
        """
        Updates stock for a specific item in a specific warehouse.
        Automatically updates the aggregate quantity in InventoryItem.
        """
        stock = db.query(WarehouseItemStock).filter(
            WarehouseItemStock.warehouse_id == warehouse_id,
            WarehouseItemStock.item_id == item_id
        ).first()

        if not stock:
            # Create if doesn't exist
            stock = WarehouseItemStock(
                warehouse_id=warehouse_id,
                item_id=item_id,
                quantity=quantity_change
            )
            db.add(stock)
        else:
            stock.quantity += quantity_change

        # Update absolute total in InventoryItem
        item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
        if item:
            item.quantity += quantity_change
        
        db.commit()
        return stock

    @staticmethod
    def initiate_transfer(db: Session, obj_in: StockTransferCreate, user_id: int) -> StockTransfer:
        """
        Starts a transfer. Deducts stock from source warehouse immediately (Pending).
        """
        # 1. Check source availability
        source_stock = db.query(WarehouseItemStock).filter(
            WarehouseItemStock.warehouse_id == obj_in.from_warehouse_id,
            WarehouseItemStock.item_id == obj_in.item_id
        ).first()

        if not source_stock or source_stock.quantity < obj_in.quantity:
            raise ValueError("Insufficient stock in source warehouse")

        # 2. Deduct from source
        source_stock.quantity -= obj_in.quantity
        
        # 3. Create Transfer record
        transfer = StockTransfer(
            **obj_in.dict(),
            created_by_id=user_id,
            status=TransferStatus.PENDING
        )
        db.add(transfer)
        db.commit()
        db.refresh(transfer)
        return transfer

    @staticmethod
    def ship_transfer(db: Session, transfer_id: int):
        transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()
        if not transfer or transfer.status != TransferStatus.PENDING:
            return None
        
        transfer.status = TransferStatus.SHIPPED
        transfer.shipped_at = datetime.now()
        db.commit()
        return transfer

    @staticmethod
    def receive_transfer(db: Session, transfer_id: int):
        transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()
        if not transfer or transfer.status != TransferStatus.SHIPPED:
            return None
        
        # Add to destination warehouse
        WarehouseService.update_stock(
            db, 
            warehouse_id=transfer.to_warehouse_id, 
            item_id=transfer.item_id, 
            quantity_change=transfer.quantity
        )
        
        transfer.status = TransferStatus.RECEIVED
        transfer.received_at = datetime.now()
        db.commit()
        return transfer

warehouse_service = WarehouseService()
