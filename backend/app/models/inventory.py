from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON, Enum as SQLEnum # type: ignore[import-untyped]
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
import enum
from ..core.database import Base

class TransferStatus(str, enum.Enum):
    PENDING = "pending"
    SHIPPED = "shipped"
    RECEIVED = "received"
    CANCELLED = "cancelled"

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    address = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_main = Column(Boolean, default=False)
    
    # Relationships
    stocks = relationship("WarehouseItemStock", back_populates="warehouse")

class WarehouseItemStock(Base):
    __tablename__ = "warehouse_item_stocks"

    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)

    # Relationships
    warehouse = relationship("Warehouse", back_populates="stocks")
    item = relationship("InventoryItem", back_populates="warehouse_stocks")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    from_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    to_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    
    status = Column(SQLEnum(TransferStatus), default=TransferStatus.PENDING)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    shipped_at = Column(DateTime(timezone=True))
    received_at = Column(DateTime(timezone=True))

    # Relationships
    item = relationship("InventoryItem")
    from_warehouse = relationship("Warehouse", foreign_keys=[from_warehouse_id])
    to_warehouse = relationship("Warehouse", foreign_keys=[to_warehouse_id])
    created_by = relationship("User")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    item_name = Column(String, nullable=False, index=True)
    
    # Cost fields (encrypted/visible only to Finance Admin)
    buying_price = Column(Float, nullable=False)  # Will be encrypted in API layer
    expense_amount = Column(Float, default=0.0)  # Additional expenses per item
    total_cost = Column(Float, nullable=False)  # Calculated: buying_price + expense_amount
    
    # Selling fields (visible to all)
    selling_price = Column(Float, nullable=False, index=True)
    quantity = Column(Integer, default=0, nullable=False)
    
    # Metadata
    description = Column(Text, nullable=True)
    category = Column(String, nullable=True, index=True)
    sku = Column(String, unique=True, nullable=True, index=True)  # Stock Keeping Unit
    is_active = Column(Boolean, default=True)
    
    # Audit fields
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_modified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    last_modified_by = relationship("User", foreign_keys=[last_modified_by_id])
    sales = relationship("Sale", back_populates="item", cascade="all, delete-orphan")
    audit_logs = relationship("InventoryAuditLog", back_populates="item", cascade="all, delete-orphan")
    warehouse_stocks = relationship("WarehouseItemStock", back_populates="item", cascade="all, delete-orphan")
    
    def calculate_total_cost(self):
        """Calculate total cost per unit"""
        return self.buying_price + self.expense_amount
    
    def calculate_profit_per_unit(self):
        """Calculate profit per unit (only for Finance Admin)"""
        return self.selling_price - self.calculate_total_cost()
    
    def calculate_profit_margin(self):
        """Calculate profit margin percentage (only for Finance Admin)"""
        total_cost = self.calculate_total_cost()
        if total_cost == 0:
            return 0.0
        return ((self.selling_price - total_cost) / total_cost) * 100

