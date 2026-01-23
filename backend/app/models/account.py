# app/models/account.py
"""
Chart of Accounts Model
Implements the account structure for double-entry bookkeeping
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class AccountType(str, enum.Enum):
    """Account types following standard accounting classification"""
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class Account(Base):
    """
    Chart of Accounts
    Represents individual accounts in the accounting system
    """
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    account_type = Column(SQLEnum(AccountType), nullable=False, index=True)
    description = Column(String(500), nullable=True)
    
    # Hierarchical structure
    parent_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    
    # Currency support
    currency_code = Column(String(3), ForeignKey("currencies.code"), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_system_account = Column(Boolean, default=False, nullable=False)  # Cannot be deleted
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    parent_account = relationship("Account", remote_side=[id], backref="sub_accounts")
    currency = relationship("Currency", back_populates="accounts")
    created_by = relationship("User", foreign_keys=[created_by_id])
    journal_entry_lines = relationship("JournalEntryLine", back_populates="account")

    def __repr__(self):
        return f"<Account {self.code}: {self.name}>"
