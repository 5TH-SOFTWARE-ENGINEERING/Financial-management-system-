# app/schemas/inventory.py
from pydantic import BaseModel, field_validator # type: ignore[import-untyped]
from typing import Optional
from datetime import datetime
from decimal import Decimal

class InventoryItemBase(BaseModel):
    item_name: str
    selling_price: Decimal
    quantity: int = 0
    description: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    is_active: bool = True

    @field_validator('item_name')
    @classmethod
    def validate_item_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Item name must be at least 2 characters')
        return v.strip()

    @field_validator('selling_price')
    @classmethod
    def validate_selling_price(cls, v):
        if v <= 0:
            raise ValueError('Selling price must be positive')
        return v

    @field_validator('quantity')
    @classmethod
    def validate_quantity(cls, v):
        if v < 0:
            raise ValueError('Quantity cannot be negative')
        return v

class InventoryItemCreate(InventoryItemBase):
    """Schema for Finance Admin creating inventory items"""
    buying_price: Decimal
    expense_amount: Decimal = Decimal('0.0')

    @field_validator('buying_price')
    @classmethod
    def validate_buying_price(cls, v):
        if v <= 0:
            raise ValueError('Buying price must be positive')
        return v

    @field_validator('expense_amount')
    @classmethod
    def validate_expense_amount(cls, v):
        if v < 0:
            raise ValueError('Expense amount cannot be negative')
        return v

class InventoryItemUpdate(BaseModel):
    """Schema for updating inventory items (role-based fields)"""
    item_name: Optional[str] = None
    buying_price: Optional[Decimal] = None  # Finance Admin only
    expense_amount: Optional[Decimal] = None  # Finance Admin only
    selling_price: Optional[Decimal] = None
    quantity: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator('item_name')
    @classmethod
    def validate_item_name(cls, v):
        if v is not None and (not v or len(v.strip()) < 2):
            raise ValueError('Item name must be at least 2 characters')
        return v.strip() if v else v

class InventoryItemOut(BaseModel):
    """Base output schema - will be filtered based on user role"""
    id: int
    item_name: str
    selling_price: Decimal
    quantity: int
    description: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Finance Admin only fields (will be None for other roles)
    buying_price: Optional[Decimal] = None
    expense_amount: Optional[Decimal] = None
    total_cost: Optional[Decimal] = None
    profit_per_unit: Optional[Decimal] = None
    profit_margin: Optional[Decimal] = None
    
    # Metadata
    created_by_id: int
    last_modified_by_id: Optional[int] = None

    class Config:
        from_attributes = True

class InventoryItemPublicOut(BaseModel):
    """Public output schema for Employees and Accountants (no cost fields)"""
    id: int
    item_name: str
    selling_price: Decimal
    quantity: int
    description: Optional[str] = None
    category: Optional[str] = None
    sku: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class InventoryAuditLogOut(BaseModel):
    """Schema for inventory audit logs"""
    id: int
    item_id: int
    change_type: str
    field_changed: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by_id: int
    change_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Warehouse Schemas
class WarehouseBase(BaseModel):
    name: str
    address: Optional[str] = None
    is_active: bool = True
    is_main: bool = False

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None
    is_main: Optional[bool] = None

class WarehouseOut(WarehouseBase):
    id: int
    total_items: int = 0
    total_value: float = 0.0
    utilization: float = 0.0
    
    class Config:
        from_attributes = True

# Warehouse Item Stock Schemas
class WarehouseItemStockOut(BaseModel):
    warehouse_id: int
    item_id: int
    quantity: int
    warehouse: WarehouseOut
    
    class Config:
        from_attributes = True

# Stock Transfer Schemas
class StockTransferCreate(BaseModel):
    item_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: int

class StockTransferOut(BaseModel):
    id: int
    item_id: int
    from_warehouse_id: int
    to_warehouse_id: int
    quantity: int
    status: str
    created_at: datetime
    shipped_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
