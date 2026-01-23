from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from datetime import datetime, timedelta
import csv
import io
from typing import List

from ..models.banking import BankAccount, BankTransaction, TransactionStatus
from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine

class BankingService:
    @staticmethod
    def match_transaction(db: Session, transaction_id: int) -> bool:
        """
        Attempt to auto-match a bank transaction to an existing journal entry.
        If matched, it links the transaction to the entry.
        If not matched, it could (optionally) create a new entry for bank fees or interest.
        """
        transaction = db.query(BankTransaction).filter(BankTransaction.id == transaction_id).first()
        if not transaction or transaction.journal_entry_id:
            return False

        # 1. Search for matching balanced journal entry line
        # Logic: Find a JournalEntryLine that uses an 'Asset' account (Bank) 
        # with matching debit/credit amount and date close to transaction date.
        
        target_amount = abs(transaction.amount)
        is_deposit = transaction.amount > 0
        
        from ..models.account import AccountType
        
        # Search window: +/- 3 days
        start_date = transaction.date - timedelta(days=3)
        end_date = transaction.date + timedelta(days=3)

        match = (
            db.query(AccountingJournalEntry)
            .join(JournalEntryLine)
            .join(Account)
            .filter(
                Account.account_type == AccountType.ASSET,
                AccountingJournalEntry.entry_date.between(start_date, end_date),
                AccountingJournalEntry.status == JournalEntryStatus.POSTED
            )
            .filter(
                or_(
                    and_(is_deposit, JournalEntryLine.debit_amount >= target_amount - 0.01, JournalEntryLine.debit_amount <= target_amount + 0.01),
                    and_(not is_deposit, JournalEntryLine.credit_amount >= target_amount - 0.01, JournalEntryLine.credit_amount <= target_amount + 0.01)
                )
            )
            .first()
        )

        if match:
            transaction.journal_entry_id = match.id
            transaction.status = TransactionStatus.COMPLETED
            db.commit()
            return True

        return False

    @staticmethod
    def process_csv_upload(db: Session, bank_account_id: int, file_content: bytes):
        """
        Parse CSV and create BankTransaction records
        Expected Format: Date, Description, Amount
        """
        decoded = file_content.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        transactions = []
        for row in csv_reader:
            # Flexible column mapping attempt
            date_str = row.get("Date") or row.get("date")
            desc = row.get("Description") or row.get("description") or row.get("Memo")
            amount_str = row.get("Amount") or row.get("amount")
            
            if date_str and amount_str:
                try:
                    # Parse Date (Assuming YYYY-MM-DD for now, simplistic)
                    # In production use dateutil.parser
                    dt = datetime.strptime(date_str, "%Y-%m-%d") 
                    amount = float(amount_str)
                    
                    # Create Tx
                    tx = BankTransaction(
                        bank_account_id=bank_account_id,
                        date=dt,
                        description=desc or "Imported Transaction",
                        amount=amount,
                        status=TransactionStatus.PENDING
                    )
                    db.add(tx)
                    transactions.append(tx)
                except Exception as e:
                    print(f"Skipping row {row}: {e}")
                    continue
        
        db.commit()
        return transactions

banking_service = BankingService()
