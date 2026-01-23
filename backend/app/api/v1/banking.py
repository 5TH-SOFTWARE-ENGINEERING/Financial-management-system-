from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...api import deps
from ...models.user import User, UserRole
from ...models.banking import BankAccount, BankTransaction
from ...schemas import banking as banking_schema
from ...services.banking import banking_service
from ...services.forecasting import forecasting_service
from ...services.bank_feed_service import bank_feed_service

router = APIRouter()

# ------------------------------------------------------------------
# Bank Accounts
# ------------------------------------------------------------------

@router.get("/accounts", response_model=List[banking_schema.BankAccount])
def get_bank_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """List all connected bank accounts"""
    return db.query(BankAccount).all()

@router.post("/accounts", response_model=banking_schema.BankAccount)
def create_bank_account(
    account_in: banking_schema.BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.FINANCE_ADMIN))
):
    """Connect a new bank account"""
    db_account = BankAccount(
        **account_in.dict(),
        created_by_id=current_user.id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

# ------------------------------------------------------------------
# CSV Upload & Feed
# ------------------------------------------------------------------

@router.post("/upload-statement", response_model=List[banking_schema.BankTransaction])
async def upload_bank_statement(
    bank_account_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """Upload CSV bank statement"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
    try:
        content = await file.read()
        transactions = banking_service.process_csv_upload(db, bank_account_id, content)
        return transactions
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV: {str(e)}")

@router.get("/transactions", response_model=List[banking_schema.BankTransaction])
def get_transactions(
    bank_account_id: int,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """Get bank transactions"""
    return db.query(BankTransaction).filter(
        BankTransaction.bank_account_id == bank_account_id
    ).offset(skip).limit(limit).all()

# ------------------------------------------------------------------
# Simulation & Automation
# ------------------------------------------------------------------

@router.post("/simulate-fetch", response_model=List[banking_schema.BankTransaction])
def simulate_bank_fetch(
    bank_account_id: int,
    count: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Manually trigger a simulated bank API fetch (polling simulation)
    """
    return bank_feed_service.simulate_polling_sync(db, bank_account_id, count)

@router.post("/webhook/simulator", response_model=banking_schema.BankTransaction)
def simulate_bank_webhook(
    bank_account_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.ACCOUNTANT))
):
    """
    Simulate an incoming webhook from a bank provider
    Example Payload: {"id": "evt_123", "amount": -45.50, "description": "Client Dinner", "date": "2024-01-20T10:00:00"}
    """
    tx = bank_feed_service.process_mock_webhook(db, bank_account_id, payload)
    if not tx:
        raise HTTPException(status_code=400, detail="Failed to process simulated webhook")
    return tx

# ------------------------------------------------------------------
# Cash Flow Forecasting
# ------------------------------------------------------------------

@router.get("/forecast")
def get_cash_flow_forecast(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.require_min_role(UserRole.MANAGER))
):
    """
    Get cash flow forecast using ML (Linear Regression on historical data)
    """
    forecast = forecasting_service.get_cash_flow_forecast(db, days)
    return {
        "days_ahead": days,
        "forecast": forecast
    }
