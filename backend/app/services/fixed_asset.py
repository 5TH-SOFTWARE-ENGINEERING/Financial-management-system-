from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.fixed_asset import FixedAsset, DepreciationLog, DepreciationMethod, FixedAssetStatus
from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine, JournalEntryStatus, ReferenceType
from ..crud.fixed_asset import fixed_asset as fixed_asset_crud

class FixedAssetService:
    @staticmethod
    def calculate_straight_line_depreciation(asset: FixedAsset) -> float:
        """
        Calculate annual depreciation using straight-line method:
        (Cost - Salvage Value) / Useful Life
        """
        if asset.useful_life_years <= 0:
            return 0.0
        
        depreciable_amount = asset.purchase_cost - asset.salvage_value
        annual_depreciation = depreciable_amount / asset.useful_life_years
        return annual_depreciation

    @staticmethod
    def run_monthly_depreciation(db: Session, asset_id: int, current_user_id: int) -> Optional[DepreciationLog]:
        """
        Run depreciation for the current month for a specific asset.
        Creates a Journal Entry and updates the asset's book value.
        """
        asset = fixed_asset_crud.get(db, asset_id)
        if not asset or asset.status != FixedAssetStatus.ACTIVE:
            return None

        # Check if already depreciated this month (simplified check)
        # In production, check DepreciationLog for the current month
        
        annual_amount = FixedAssetService.calculate_straight_line_depreciation(asset)
        monthly_amount = annual_amount / 12
        
        # Ensure we don't exceed salvage value
        max_depreciation = asset.current_book_value - asset.salvage_value
        if monthly_amount > max_depreciation:
            monthly_amount = max_depreciation
            
        if monthly_amount <= 0:
            asset.status = FixedAssetStatus.FULLY_DEPRECIATED
            db.add(asset)
            db.commit()
            return None

        # 1. Create Journal Entry
        entry_number = f"DEP-{asset.id}-{datetime.now().strftime('%Y%m%d')}"
        db_entry = AccountingJournalEntry(
            entry_number=entry_number,
            entry_date=datetime.now(),
            description=f"Monthly depreciation for {asset.name}",
            reference_type=ReferenceType.ADJUSTMENT,
            reference_id=asset.id,
            status=JournalEntryStatus.POSTED, # Auto-post depreciation
            created_by_id=current_user_id,
            posted_at=datetime.now(),
            posted_by_id=current_user_id
        )
        db.add(db_entry)
        db.flush()

        # Line 1: Debit Depreciation Expense
        db.add(JournalEntryLine(
            journal_entry_id=db_entry.id,
            account_id=asset.depreciation_expense_account_id,
            debit_amount=monthly_amount,
            credit_amount=0.0,
            description=f"Depreciation expense - {asset.name}"
        ))

        # Line 2: Credit Accumulated Depreciation
        db.add(JournalEntryLine(
            journal_entry_id=db_entry.id,
            account_id=asset.accumulated_depreciation_account_id,
            debit_amount=0.0,
            credit_amount=monthly_amount,
            description=f"Accumulated depreciation - {asset.name}"
        ))

        # 2. Update Asset
        asset.accumulated_depreciation += monthly_amount
        asset.current_book_value -= monthly_amount
        if asset.current_book_value <= asset.salvage_value:
            asset.status = FixedAssetStatus.FULLY_DEPRECIATED
        db.add(asset)

        # 3. Create Log
        log = DepreciationLog(
            fixed_asset_id=asset.id,
            amount=monthly_amount,
            depreciation_date=datetime.now(),
            period_start=datetime.now().replace(day=1),
            period_end=datetime.now(),
            journal_entry_id=db_entry.id
        )
        db.add(log)
        
        db.commit()
        db.refresh(log)
        return log

fixed_asset_service = FixedAssetService()
