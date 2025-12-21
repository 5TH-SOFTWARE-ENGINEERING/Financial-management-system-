# Data Requirements for AI Model Training

## Overview

The AI training system requires sufficient historical data to train accurate forecasting models. This document explains the data requirements and how to ensure you have enough data.

## Minimum Data Requirements

Each model type has different minimum data requirements:

### Expenses Models
- **ARIMA**: 10+ data points (monthly)
- **Prophet**: 50+ data points (daily)
- **Linear Regression**: 5+ data points (monthly)

### Revenue Models
- **Prophet**: 50+ data points (daily)
- **XGBoost**: 20+ data points (monthly)
- **LSTM**: 30+ data points (monthly)

### Inventory Models
- **SARIMA**: 24+ data points (monthly, 2 years for seasonality)
- **XGBoost**: 20+ data points (monthly)
- **LSTM**: 30+ data points (monthly)

## What Counts as Data?

### For Expenses & Revenue
- **Approved entries only**: Only entries with `is_approved=True` are used
- **Date range**: Entries within the training period (default: last 2 years)
- **Grouped by period**: Data is grouped by daily/weekly/monthly periods

### For Inventory
- **Active items only**: Only items with `is_active=True`
- **Quantity tracking**: Uses current quantity values (historical tracking would be better)

## Current Status

When you run `python train_ai_models.py --all`, you'll see errors like:

```
❌ Expenses ARIMA: Insufficient data: need at least 10 data points, got 1
```

This means:
- You only have **1 approved expense entry** in the database
- You need at least **10 approved expense entries** to train ARIMA

## How to Add Data

### Option 1: Via API

Create revenue/expense entries through the API:

```bash
# Create revenue entry
POST /api/v1/revenue/
{
  "title": "Product Sales",
  "amount": 5000.00,
  "date": "2024-01-15T00:00:00Z",
  "category": "sales",
  "is_approved": true
}

# Create expense entry
POST /api/v1/expenses/
{
  "title": "Office Rent",
  "amount": 2000.00,
  "date": "2024-01-15T00:00:00Z",
  "category": "rent",
  "is_approved": true
}
```

### Option 2: Via Frontend

1. Navigate to Revenue/Expenses sections
2. Create entries with dates spread over time
3. Approve the entries (admin only)

### Option 3: Bulk Import Script

Create a script to import historical data from CSV/Excel:

```python
# Example: bulk_import_data.py
from app.core.database import SessionLocal
from app.crud.revenue import revenue as revenue_crud
from app.crud.expense import expense as expense_crud
from app.schemas.revenue import RevenueCreate
from app.schemas.expense import ExpenseCreate
from datetime import datetime, timedelta
import random

db = SessionLocal()
admin_id = 1  # Your admin user ID

# Generate sample revenue data
for i in range(60):  # 60 entries = ~2 months of daily data
    date = datetime.now() - timedelta(days=60-i)
    revenue_crud.create(db, RevenueCreate(
        title=f"Sales Day {i+1}",
        amount=random.uniform(1000, 10000),
        date=date,
        category="sales",
        is_approved=True
    ), created_by_id=admin_id)

db.close()
```

## Recommendations

### For Best Results:

1. **Minimum 6 months of data** for basic models
2. **Minimum 2 years of data** for seasonal models (SARIMA, Prophet)
3. **Daily data** preferred for Prophet models
4. **Monthly data** is fine for ARIMA, XGBoost, LSTM
5. **All entries should be approved** before training

### Data Quality Tips:

- ✅ Spread entries across the time period (don't cluster dates)
- ✅ Use realistic amounts (not all the same value)
- ✅ Include seasonal variations if applicable
- ✅ Ensure all entries are approved
- ✅ Include both revenue and expenses for profit forecasting

## Checking Your Data

Query your database to check data counts:

```sql
-- Check approved revenue entries
SELECT COUNT(*) FROM revenue_entries WHERE is_approved = true;

-- Check approved expense entries  
SELECT COUNT(*) FROM expense_entries WHERE is_approved = true;

-- Check date range of revenue entries
SELECT MIN(date), MAX(date), COUNT(*) 
FROM revenue_entries 
WHERE is_approved = true;

-- Check inventory items
SELECT COUNT(*) FROM inventory_items WHERE is_active = true;
```

## Training with Limited Data

If you have limited data but want to test the system:

1. **Use simpler models first**:
   - Start with Linear Regression (needs only 5 data points)
   - Then try ARIMA (needs 10 data points)

2. **Reduce minimum requirements** (for testing only):
   - Modify `ml_forecasting.py` to lower the minimums temporarily
   - **Warning**: Models trained on insufficient data will have poor accuracy

3. **Use synthetic data for testing**:
   - Generate sample data to test the training pipeline
   - Don't use for production forecasting

## Next Steps

Once you have sufficient data:

1. Run training: `python train_ai_models.py --all`
2. Check results: Look for "status": "trained" in output
3. Use trained models: Create forecasts with `method: "prophet"`, etc.
4. Monitor accuracy: Compare forecasts with actual results

---

**Remember**: More data = Better forecasts! 🎯

