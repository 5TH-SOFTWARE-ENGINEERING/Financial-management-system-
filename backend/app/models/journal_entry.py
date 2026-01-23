# app/models/journal_entry.py
"""
Journal Entry Models
Implements double-entry bookkeeping with journal entries and line items
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class JournalEntryStatus(str, enum.Enum):
    """Status of journal entry"""
    DRAFT = "draft"
    POSTED = "posted"
    REVERSED = "reversed"


class ReferenceType(str, enum.Enum):
    """Type of source transaction"""
    REVENUE = "revenue"
    EXPENSE = "expense"
    SALE = "sale"
    INVENTORY = "inventory"
    MANUAL = "manual"
    OPENING_BALANCE = "opening_balance"
    ADJUSTMENT = "adjustment"


class JournalEntry(Base):
    """
    Journal Entry Header
    Represents a complete accounting transaction
    """
    __tablename__ = "accounting_journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    entry_number = Column(String(50), unique=True, nullable=False, index=True)
    entry_date = Column(DateTime(timezone=True), nullable=False, index=True)
    description = Column(Text, nullable=False)
    
    # Reference to source transaction
    reference_type = Column(SQLEnum(ReferenceType), nullable=False, index=True)
    reference_id = Column(Integer, nullable=True)  # ID of source transaction
    
    # Status
    status = Column(SQLEnum(JournalEntryStatus), default=JournalEntryStatus.DRAFT, nullable=False, index=True)
    
    # Posting information
    posted_at = Column(DateTime(timezone=True), nullable=True)
    posted_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Reversal information
    reversed_at = Column(DateTime(timezone=True), nullable=True)
    reversed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reversal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    lines = relationship("JournalEntryLine", back_populates="journal_entry", cascade="all, delete-orphan")
    created_by = relationship("User", foreign_keys=[created_by_id])
    posted_by = relationship("User", foreign_keys=[posted_by_id])
    reversed_by = relationship("User", foreign_keys=[reversed_by_id])
    reversal_entry = relationship("JournalEntry", remote_side=[id], foreign_keys=[reversal_entry_id])

    def __repr__(self):
        return f"<JournalEntry {self.entry_number}: {self.description}>"


class JournalEntryLine(Base):
    """
    Journal Entry Line Item
    Represents individual debit/credit entries
    """
    __tablename__ = "accounting_journal_entry_lines"

    id = Column(Integer, primary_key=True, index=True)
    journal_entry_id = Column(Integer, ForeignKey("accounting_journal_entries.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    
    # Amounts (one must be zero, the other non-zero)
    debit_amount = Column(Float, default=0.0, nullable=False)
    credit_amount = Column(Float, default=0.0, nullable=False)
    
    # Description for this specific line
    description = Column(String(500), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    journal_entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("Account", back_populates="journal_entry_lines")

    def __repr__(self):
        amount = self.debit_amount if self.debit_amount > 0 else self.credit_amount
        type_str = "DR" if self.debit_amount > 0 else "CR"
        return f"<JournalEntryLine {type_str} {amount}>"
