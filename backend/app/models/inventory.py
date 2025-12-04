# app/models/inventory.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

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

