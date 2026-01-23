from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import List, Optional

from ..models import Account, AccountType, AccountMapping
from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine, JournalEntryStatus, ReferenceType

class AccountingService:
    @staticmethod
    def get_account_for_category(db: Session, module: str, category: str, default_code: str, default_name: str, account_type: AccountType) -> Account:
        """
        Get the account mapped to a specific module and category.
        If no mapping exists, falls back to get_or_create_account with defaults.
        """
        mapping = db.query(AccountMapping).filter(
            AccountMapping.module == module,
            AccountMapping.category == category
        ).first()
        
        if mapping:
            return mapping.account
            
        return AccountingService.get_or_create_account(db, default_code, default_name, account_type)

    @staticmethod
    def get_or_create_account(db: Session, code: str, name: str, account_type: AccountType) -> Account:
        """
        Get an account by code, or create it if it doesn't exist.
        """
        account = db.query(Account).filter(Account.code == code).first()
        if not account:
            account = Account(
                code=code,
                name=name,
                account_type=account_type,
                is_active=True,
                is_system_account=True
            )
            db.add(account)
            db.commit()
            db.refresh(account)
        return account

    @staticmethod
    def create_journal_entry(
        db: Session,
        description: str,
        reference_type: ReferenceType,
        reference_id: int,
        lines: List[dict],
        created_by_id: int,
        entry_date: Optional[datetime] = None,
        status: JournalEntryStatus = JournalEntryStatus.POSTED
    ) -> AccountingJournalEntry:
        """
        Helper to create a full balanced journal entry.
        lines: List of {'account_id': int, 'debit': float, 'credit': float, 'description': str}
        """
        if not entry_date:
            entry_date = datetime.now()

        # Generate Entry Number
        today_str = entry_date.strftime("%Y%m%d")
        count = db.query(func.count(AccountingJournalEntry.id)).scalar() or 0
        entry_number = f"AUTO-{today_str}-{count + 1:04d}"

        # 1. Create Header
        db_entry = AccountingJournalEntry(
            entry_number=entry_number,
            entry_date=entry_date,
            description=description,
            reference_type=reference_type,
            reference_id=reference_id,
            status=status,
            created_by_id=created_by_id,
            posted_at=entry_date if status == JournalEntryStatus.POSTED else None,
            posted_by_id=created_by_id if status == JournalEntryStatus.POSTED else None
        )
        db.add(db_entry)
        db.flush()

        # 2. Create Lines
        total_debit = 0.0
        total_credit = 0.0

        for line in lines:
            debit = float(line.get('debit', 0.0))
            credit = float(line.get('credit', 0.0))
            
            db_line = JournalEntryLine(
                journal_entry_id=db_entry.id,
                account_id=line['account_id'],
                debit_amount=debit,
                credit_amount=credit,
                description=line.get('description', description)
            )
            db.add(db_line)
            total_debit += debit
            total_credit += credit

        # Basic sanity check (should be balanced)
        if abs(total_debit - total_credit) > 0.001:
            db.rollback()
            raise ValueError(f"Journal entry is not balanced: Dr {total_debit} != Cr {total_credit}")

        db.commit()
        db.refresh(db_entry)
        return db_entry

accounting_service = AccountingService()
