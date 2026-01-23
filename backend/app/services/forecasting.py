from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Any

from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine
from ..models.account import Account, AccountType

class ForecastingService:
    @staticmethod
    def get_cash_flow_forecast(db: Session, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """
        Generate cash flow forecast for the next N days based on historical data.
        Uses a simple Linear Regression model on daily net cash flow.
        """
        # 1. Fetch historical daily cash flow
        # Get daily revenue/expense totals (Net Income Approach)
        results = (
            db.query(
                func.date(AccountingJournalEntry.entry_date).label('date'),
                func.sum(JournalEntryLine.credit_amount - JournalEntryLine.debit_amount).label('net_amount')
            )
            .join(JournalEntryLine)
            .join(Account)
            .filter(Account.account_type.in_([AccountType.REVENUE, AccountType.EXPENSE])) 
            .group_by(func.date(AccountingJournalEntry.entry_date))
            .order_by('date')
            .all()
        )
        
        if len(results) < 5:
            # Not enough data for ML, return empty
            return []

        # Convert to Pandas
        df = pd.DataFrame(results, columns=['date', 'net_amount'])
        df['date'] = pd.to_datetime(df['date'])
        df['day_ordinal'] = df['date'].map(datetime.toordinal)
        
        # Train Model
        X = df[['day_ordinal']]
        y = df['net_amount']
        
        model = LinearRegression()
        model.fit(X, y)
        
        # Predict Future
        last_date = df['date'].max()
        future_dates = [last_date + timedelta(days=x) for x in range(1, days_ahead + 1)]
        future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
        
        predictions = model.predict(future_ordinals)
        
        # Format response
        forecast = [
            {
                "date": date.strftime("%Y-%m-%d"),
                "predicted_amount": float(pred),
                "type": "forecast"
            }
            for date, pred in zip(future_dates, predictions)
        ]
        
        return forecast

forecasting_service = ForecastingService()
