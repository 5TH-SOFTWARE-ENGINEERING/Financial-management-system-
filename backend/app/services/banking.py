from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime
import csv
import io
from typing import List

from ..models.banking import BankAccount, BankTransaction, TransactionStatus
from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine

class BankingService:
    @staticmethod
    def match_transaction(db: Session, transaction_id: int) -> bool:
        """
        Attempt to auto-match a bank transaction to an existing journal entry
        """
        transaction = db.query(BankTransaction).filter(BankTransaction.id == transaction_id).first()
        if not transaction or transaction.journal_entry_id:
            return False

        # Simple Logic: Find a JE with same amount + date (+/- 1 day)
        # Note: This is simplified. In real world, amounts might differ slightly due to fees.
        # This assumes JournalEntry total matches transaction amount exactly.
        
        # Determine JE total to look for
        target_amount = abs(transaction.amount)
        
        # Find candidate JEs
        # Logic: A JE representing a deposit (Positive Tx) -> Debit Bank (Asset increased)
        # Logic: A JE representing a withdrawal (Negative Tx) -> Credit Bank (Asset decreased)
        
        # Here we just look for amount match for simplicity in this MVP
        # Ideally we'd filter JEs that use the GL Account linked to this Bank Account
        
        # ... logic omitted for brevity in MVP, simplistic 'amount' match placeholders
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
