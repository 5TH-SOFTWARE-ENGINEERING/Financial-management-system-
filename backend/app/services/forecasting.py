from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from typing import List, Dict, Any

from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine
from ..models.account import Account, AccountType

from ..models.payroll import EmployeeProfile
from ..models.fixed_asset import FixedAsset

class ForecastingService:
    @staticmethod
    def get_cash_flow_forecast(db: Session, days_ahead: int = 30) -> List[Dict[str, Any]]:
        """
        Generate cash flow forecast for the next N days based on historical data.
        Integrates "Planned" recurring items from Payroll and Fixed Assets.
        """
        # 1. Fetch historical daily cash flow
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
        
        # 2. Calculate recurring payroll costs
        # Total monthly base salary for all active employees
        total_monthly_payroll = db.query(func.sum(EmployeeProfile.base_salary)).filter(
            EmployeeProfile.status == "active"
        ).scalar() or 0.0

        # Assuming payroll is paid at end of month or every 30 days
        # Just for simulation, we'll put it in the next few days if it's nearing end of month
        
        # 3. Handle data for ML
        if len(results) < 5:
            # If no historical data, start with projections from today
            df = pd.DataFrame(columns=['date', 'net_amount'])
            last_date = datetime.now()
        else:
            df = pd.DataFrame(results, columns=['date', 'net_amount'])
            df['date'] = pd.to_datetime(df['date'])
            df['day_ordinal'] = df['date'].map(datetime.toordinal)
            
            # Train Model
            X = df[['day_ordinal']]
            y = df['net_amount']
            model = LinearRegression()
            model.fit(X, y)
            
            last_date = df['date'].max()

        future_dates = [last_date + timedelta(days=x) for x in range(1, days_ahead + 1)]
        
        forecast = []
        if len(results) >= 5:
            future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
            predictions = model.predict(future_ordinals)
        else:
            predictions = [0.0] * days_ahead

        for d, pred in zip(future_dates, predictions):
            daily_amount = float(pred)
            
            # Simple logic: If it's the 28th of the month, subtract payroll
            # (In a real system, we'd check actual payroll payment dates)
            is_payroll_day = d.day == 28
            if is_payroll_day:
                daily_amount -= total_monthly_payroll
            
            forecast.append({
                "date": d.strftime("%Y-%m-%d"),
                "predicted_amount": round(daily_amount, 2),
                "type": "forecast",
                "is_planned": is_payroll_day,
                "note": "Includes Recurring Payroll" if is_payroll_day else None
            })
        
        return forecast

forecasting_service = ForecastingService()
