# app/schemas/sale.py
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from ..models.sale import SaleStatus

class SaleBase(BaseModel):
    item_id: int
    quantity_sold: int
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('quantity_sold')
    @classmethod
    def validate_quantity_sold(cls, v):
        if v <= 0:
            raise ValueError('Quantity sold must be positive')
        return v

class SaleCreate(SaleBase):
    """Schema for Employee creating a sale"""
    pass

class SaleOut(BaseModel):
    """Schema for sale output"""
    id: int
    item_id: int
    item_name: str  # Denormalized for convenience
    quantity_sold: int
    selling_price: Decimal
    total_sale: Decimal
    status: SaleStatus
    receipt_number: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    sold_by_id: int
    sold_by_name: Optional[str] = None
    posted_by_id: Optional[int] = None
    posted_by_name: Optional[str] = None
    posted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SalePostRequest(BaseModel):
    """Schema for Accountant posting a sale to ledger"""
    debit_account: str = "Cash"  # Default to Cash, can be "Accounts Receivable"
    credit_account: str = "Sales Revenue"
    reference_number: Optional[str] = None
    notes: Optional[str] = None

    @field_validator('debit_account')
    @classmethod
    def validate_debit_account(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Debit account must be at least 2 characters')
        return v.strip()

    @field_validator('credit_account')
    @classmethod
    def validate_credit_account(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Credit account must be at least 2 characters')
        return v.strip()

class JournalEntryOut(BaseModel):
    """Schema for journal entry output"""
    id: int
    sale_id: Optional[int] = None
    entry_date: datetime
    description: str
    debit_account: str
    debit_amount: Decimal
    credit_account: str
    credit_amount: Decimal
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    posted_by_id: int
    posted_by_name: Optional[str] = None
    posted_at: datetime

    class Config:
        from_attributes = True

class SalesSummaryOut(BaseModel):
    """Schema for sales summary (Accountant view)"""
    total_sales: int
    total_revenue: Decimal
    pending_sales: int
    posted_sales: int
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None

class ReceiptOut(BaseModel):
    """Schema for receipt generation"""
    receipt_number: str
    sale_id: int
    item_name: str
    quantity_sold: int
    selling_price: Decimal
    total_sale: Decimal
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    sold_by_name: Optional[str] = None
    created_at: datetime

