# app/models/currency.py
"""
Multi-Currency Models
Implements currency definitions and exchange rate management
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class ExchangeRateSource(str, enum.Enum):
    """Source of exchange rate"""
    MANUAL = "manual"
    API = "api"
    BANK = "bank"
    CENTRAL_BANK = "central_bank"


class Currency(Base):
    """
    Currency Definition
    Represents different currencies supported by the system
    """
    __tablename__ = "currencies"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(3), unique=True, nullable=False, index=True)  # ISO 4217 code
    name = Column(String(100), nullable=False)
    symbol = Column(String(10), nullable=False)  # e.g., $, €, Br
    decimal_places = Column(Integer, default=2, nullable=False)
    
    # Base currency flag (only one can be true)
    is_base_currency = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    accounts = relationship("Account", back_populates="currency")
    exchange_rates_from = relationship(
        "ExchangeRate",
        foreign_keys="ExchangeRate.from_currency_id",
        back_populates="from_currency"
    )
    exchange_rates_to = relationship(
        "ExchangeRate",
        foreign_keys="ExchangeRate.to_currency_id",
        back_populates="to_currency"
    )
    revenue_entries = relationship("RevenueEntry", back_populates="currency")
    expense_entries = relationship("ExpenseEntry", back_populates="currency")

    def __repr__(self):
        return f"<Currency {self.code}: {self.name}>"


class ExchangeRate(Base):
    """
    Exchange Rate
    Stores historical exchange rates between currencies
    """
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    
    # Currency pair
    from_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False, index=True)
    to_currency_id = Column(Integer, ForeignKey("currencies.id"), nullable=False, index=True)
    
    # Exchange rate (1 from_currency = rate * to_currency)
    rate = Column(Float, nullable=False)
    
    # Effective date
    effective_date = Column(Date, nullable=False, index=True)
    
    # Source of rate
    source = Column(String(20), default=ExchangeRateSource.MANUAL, nullable=False)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    from_currency = relationship("Currency", foreign_keys=[from_currency_id], back_populates="exchange_rates_from")
    to_currency = relationship("Currency", foreign_keys=[to_currency_id], back_populates="exchange_rates_to")
    created_by = relationship("User", foreign_keys=[created_by_id])

    def __repr__(self):
        return f"<ExchangeRate 1 {self.from_currency.code if self.from_currency else '?'} = {self.rate} {self.to_currency.code if self.to_currency else '?'}>"
