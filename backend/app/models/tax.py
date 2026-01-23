# app/models/tax.py
"""
Tax Engine Models
Implements configurable tax types, rates, and components
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class TaxType(Base):
    """
    Tax Type Definition
    Represents different types of taxes (VAT, Sales Tax, Income Tax, etc.)
    """
    __tablename__ = "tax_types"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    tax_rates = relationship("TaxRate", back_populates="tax_type", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TaxType {self.code}: {self.name}>"


class TaxRate(Base):
    """
    Tax Rate Configuration
    Represents specific tax rates for different jurisdictions and time periods
    """
    __tablename__ = "tax_rates"

    id = Column(Integer, primary_key=True, index=True)
    tax_type_id = Column(Integer, ForeignKey("tax_types.id"), nullable=False, index=True)
    
    name = Column(String(100), nullable=False)
    rate_percentage = Column(Float, nullable=False)  # e.g., 15.00 for 15%
    
    # Jurisdiction (country, state, region)
    jurisdiction = Column(String(100), nullable=True)
    
    # Effective dates
    effective_from = Column(DateTime(timezone=True), nullable=False, index=True)
    effective_to = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Default rate for this tax type
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    tax_type = relationship("TaxType", back_populates="tax_rates")
    created_by = relationship("User", foreign_keys=[created_by_id])
    tax_components = relationship("TaxComponent", back_populates="tax_rate")

    def __repr__(self):
        return f"<TaxRate {self.name}: {self.rate_percentage}%>"


class TransactionType(str, enum.Enum):
    """Type of transaction for tax component"""
    REVENUE = "revenue"
    EXPENSE = "expense"
    SALE = "sale"


class TaxComponent(Base):
    """
    Tax Component
    Stores tax breakdown for individual transactions
    """
    __tablename__ = "tax_components"

    id = Column(Integer, primary_key=True, index=True)
    
    # Link to source transaction
    transaction_type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    transaction_id = Column(Integer, nullable=False, index=True)
    
    # Tax calculation
    tax_rate_id = Column(Integer, ForeignKey("tax_rates.id"), nullable=False, index=True)
    taxable_amount = Column(Float, nullable=False)  # Amount before tax
    tax_amount = Column(Float, nullable=False)  # Calculated tax
    total_amount = Column(Float, nullable=False)  # Amount including tax
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tax_rate = relationship("TaxRate", back_populates="tax_components")

    def __repr__(self):
        return f"<TaxComponent {self.transaction_type} #{self.transaction_id}: {self.tax_amount}>"
