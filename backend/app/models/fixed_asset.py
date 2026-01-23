from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

class DepreciationMethod(str, enum.Enum):
    STRAIGHT_LINE = "straight_line"
    DOUBLE_DECLINING = "double_declining"
    UNITS_OF_PRODUCTION = "units_of_production"

class FixedAssetStatus(str, enum.Enum):
    ACTIVE = "active"
    DISPOSED = "disposed"
    FULLY_DEPRECIATED = "fully_depreciated"

class FixedAsset(Base):
    __tablename__ = "fixed_assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    asset_category = Column(String(100), nullable=False)  # e.g., "Vehicles", "Buildings", "Equipment"
    
    # Financial details
    purchase_date = Column(DateTime(timezone=True), nullable=False)
    purchase_cost = Column(Float, nullable=False)
    salvage_value = Column(Float, default=0.0)
    useful_life_years = Column(Integer, nullable=False)
    
    # Depreciation state
    depreciation_method = Column(SQLEnum(DepreciationMethod), default=DepreciationMethod.STRAIGHT_LINE)
    accumulated_depreciation = Column(Float, default=0.0)
    current_book_value = Column(Float, nullable=False)
    
    # Status
    status = Column(SQLEnum(FixedAssetStatus), default=FixedAssetStatus.ACTIVE)
    
    # Links to Chart of Accounts
    asset_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    depreciation_expense_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    accumulated_depreciation_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    
    # Metadata
    serial_number = Column(String(100), unique=True, nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    asset_account = relationship("Account", foreign_keys=[asset_account_id])
    depreciation_expense_account = relationship("Account", foreign_keys=[depreciation_expense_account_id])
    accumulated_depreciation_account = relationship("Account", foreign_keys=[accumulated_depreciation_account_id])
    depreciation_logs = relationship("DepreciationLog", back_populates="fixed_asset", cascade="all, delete-orphan")
    created_by = relationship("User")

class DepreciationLog(Base):
    __tablename__ = "fixed_asset_depreciation_logs"

    id = Column(Integer, primary_key=True, index=True)
    fixed_asset_id = Column(Integer, ForeignKey("fixed_assets.id"), nullable=False)
    amount = Column(Float, nullable=False)
    depreciation_date = Column(DateTime(timezone=True), nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Link to the resulting journal entry
    journal_entry_id = Column(Integer, ForeignKey("accounting_journal_entries.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    fixed_asset = relationship("FixedAsset", back_populates="depreciation_logs")
    journal_entry = relationship("AccountingJournalEntry")
