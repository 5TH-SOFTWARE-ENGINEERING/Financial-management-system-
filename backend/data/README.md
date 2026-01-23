# CSV Data Import

This directory contains CSV files for importing sample data into the database for AI model training.

## Files

- `revenue.csv` - Sample revenue entries (36 entries)
- `expenses.csv` - Sample expense entries (48 entries)
- `inventory.csv` - Sample inventory items (12 items)

## Usage

### Import All Data
```bash
python import_csv_data.py --all
```

### Import Specific File
```bash
python import_csv_data.py --revenue data/revenue.csv
python import_csv_data.py --expenses data/expenses.csv
python import_csv_data.py --inventory data/inventory.csv
```

## CSV Format

### Revenue CSV
Required columns:
- `title` - Entry title
- `amount` - Amount (decimal)
- `date` - Date in ISO format (YYYY-MM-DDTHH:MM:SSZ)
- `category` - Category (sales, services, interest, other)
- `source` - Optional source
- `description` - Optional description
- `is_recurring` - true/false

Example:
```csv
title,amount,date,category,source,description,is_recurring
Product Sales,5000.00,2024-01-15T00:00:00Z,sales,Online Store,Monthly product sales,false
```

### Expenses CSV
Required columns:
- `title` - Entry title
- `amount` - Amount (decimal)
- `date` - Date in ISO format
- `category` - Category (rent, salaries, utilities, marketing, etc.)
- `vendor` - Optional vendor name
- `description` - Optional description
- `is_recurring` - true/false

Example:
```csv
title,amount,date,category,vendor,description,is_recurring
Office Rent,2000.00,2024-01-01T00:00:00Z,rent,Landlord,Monthly office rent,true
```

### Inventory CSV
Required columns:
- `item_name` - Item name
- `buying_price` - Buying price (decimal)
- `selling_price` - Selling price (decimal)
- `quantity` - Current quantity (integer)
- `category` - Optional category
- `sku` - Optional SKU (must be unique)
- `description` - Optional description

Example:
```csv
item_name,buying_price,selling_price,quantity,category,sku,description
Laptop Computer,800.00,1200.00,25,electronics,LAPTOP-001,High-performance laptop
```

## Notes

- All imported entries are **automatically approved** for training purposes
- Dates are parsed in ISO format or YYYY-MM-DD format
- Duplicate SKUs in inventory are skipped
- Empty rows are automatically skipped

## After Import

Once data is imported, train your AI models:

```bash
python import_csv_data.py --all
python train_ai_models.py --all
```




python -c "from sqlalchemy import create_engine, text; from sqlalchemy.orm import sessionmaker; engine = create_engine('postgresql://postgres:amare@localhost/projectai'); SessionLocal = sessionmaker(bind=engine); db = SessionLocal(); exp_count = db.execute(text('SELECT COUNT(*) FROM expense_entries WHERE is_approved = true')).scalar(); rev_count = db.execute(text('SELECT COUNT(*) FROM revenue_entries WHERE is_approved = true')).scalar(); inv_count = db.execute(text('SELECT COUNT(*) FROM inventory_items WHERE is_active = true')).scalar(); print(f'Approved Expenses: {exp_count}'); print(f'Approved Revenues: {rev_count}'); print(f'Active Inventory: {inv_count}'); exp_months = db.execute(text('SELECT COUNT(DISTINCT DATE_TRUNC(\\'month\\', date)) FROM expense_entries WHERE is_approved = true')).scalar(); rev_months = db.execute(text('SELECT COUNT(DISTINCT DATE_TRUNC(\\'month\\', date)) FROM revenue_entries WHERE is_approved = true')).scalar(); print(f'\\nExpense months: {exp_months}'); print(f'Revenue months: {rev_months}'); db.close()"