from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...schemas import inventory as schemas
from ...services.inventory_warehouse import warehouse_service

router = APIRouter()

@router.get("/", response_model=List[schemas.WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """List all warehouses"""
    return warehouse_service.get_warehouses(db)

@router.post("/", response_model=schemas.WarehouseOut)
def create_warehouse(
    warehouse_in: schemas.WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """Create a new warehouse location"""
    return warehouse_service.create_warehouse(db, warehouse_in)

@router.post("/transfers", response_model=schemas.StockTransferOut)
def initiate_transfer(
    transfer_in: schemas.StockTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """Initiate a stock transfer between warehouses"""
    try:
        return warehouse_service.initiate_transfer(db, transfer_in, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/transfers/{transfer_id}/ship", response_model=schemas.StockTransferOut)
def ship_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """Mark a transfer as shipped"""
    transfer = warehouse_service.ship_transfer(db, transfer_id)
    if not transfer:
        raise HTTPException(status_code=400, detail="Invalid transfer or status")
    return transfer

@router.post("/transfers/{transfer_id}/receive", response_model=schemas.StockTransferOut)
def receive_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """Mark a transfer as received and update stock"""
    transfer = warehouse_service.receive_transfer(db, transfer_id)
    if not transfer:
        raise HTTPException(status_code=400, detail="Invalid transfer or status")
    return transfer
