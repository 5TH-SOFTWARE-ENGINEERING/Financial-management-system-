# app/models/inventory_audit.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, JSON # type: ignore[import-untyped]
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
import enum
from ..core.database import Base

class InventoryChangeType(str, enum.Enum):
    CREATED = "created"
    UPDATED = "updated"
    PRICE_CHANGED = "price_changed"
    STOCK_ADDED = "stock_added"
    STOCK_REDUCED = "stock_reduced"
    DEACTIVATED = "deactivated"
    ACTIVATED = "activated"
    DELETED = "deleted"

class InventoryAuditLog(Base):
    __tablename__ = "inventory_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    
    # Change details
    change_type = Column(String, nullable=False, index=True)  # InventoryChangeType
    field_changed = Column(String, nullable=True)  # Which field was changed
    old_value = Column(Text, nullable=True)  # JSON string for complex values
    new_value = Column(Text, nullable=True)  # JSON string for complex values
    
    # Change metadata
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    change_reason = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    item = relationship("InventoryItem", back_populates="audit_logs")
    changed_by = relationship("User", foreign_keys=[changed_by_id])

