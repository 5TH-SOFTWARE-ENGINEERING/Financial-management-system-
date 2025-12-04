# app/models/sale.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

class SaleStatus(str, enum.Enum):
    PENDING = "pending"  # Created by employee, not yet posted
    POSTED = "posted"  # Posted to ledger by accountant
    CANCELLED = "cancelled"

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    
    # Sale details
    quantity_sold = Column(Integer, nullable=False)
    selling_price = Column(Float, nullable=False)  # Price at time of sale
    total_sale = Column(Float, nullable=False)  # Calculated: quantity_sold * selling_price
    
    # Status and posting
    status = Column(SAEnum(SaleStatus), default=SaleStatus.PENDING, index=True)
    posted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Accountant who posted
    posted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Receipt information
    receipt_number = Column(String, unique=True, nullable=True, index=True)
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Audit fields
    sold_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Employee who made the sale
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    item = relationship("InventoryItem", back_populates="sales")
    sold_by = relationship("User", foreign_keys=[sold_by_id])
    posted_by = relationship("User", foreign_keys=[posted_by_id])
    journal_entries = relationship("JournalEntry", back_populates="sale", cascade="all, delete-orphan")

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)  # Link to sale if applicable
    
    # Journal entry details
    entry_date = Column(DateTime(timezone=True), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Debit side
    debit_account = Column(String, nullable=False)  # e.g., "Cash" or "Accounts Receivable"
    debit_amount = Column(Float, nullable=False)
    
    # Credit side
    credit_account = Column(String, nullable=False)  # e.g., "Sales Revenue"
    credit_amount = Column(Float, nullable=False)
    
    # Posting information
    posted_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    posted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Reference
    reference_number = Column(String, nullable=True, index=True)
    notes = Column(Text, nullable=True)
    
    # Relationships
    sale = relationship("Sale", back_populates="journal_entries")
    posted_by = relationship("User", foreign_keys=[posted_by_id])

