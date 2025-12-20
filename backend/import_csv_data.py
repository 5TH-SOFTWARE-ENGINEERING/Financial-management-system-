#!/usr/bin/env python3
"""
CSV Data Import Script
Imports revenue, expense, and inventory data from CSV files into the database

Usage:
    python import_csv_data.py
    python import_csv_data.py --file data/revenue.csv
    python import_csv_data.py --all
"""

import sys
import csv
import argparse
from pathlib import Path
from datetime import datetime
from decimal import Decimal

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal
from app.crud.revenue import revenue as revenue_crud
from app.crud.expense import expense as expense_crud
from app.crud.inventory import inventory as inventory_crud
from app.schemas.revenue import RevenueCreate
from app.schemas.expense import ExpenseCreate
from app.schemas.inventory import InventoryItemCreate
from app.models.user import User, UserRole
from app.models.revenue import RevenueCategory
from app.models.expense import ExpenseCategory


def get_admin_user(db):
    """Get or create admin user for importing data"""
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin:
        # Try to get any admin user
        admin = db.query(User).filter(
            User.role.in_([UserRole.ADMIN, UserRole.SUPER_ADMIN])
        ).first()
    if not admin:
        raise ValueError("No admin user found. Please create an admin user first.")
    return admin


def import_revenue(csv_path: Path, db, admin_user):
    """Import revenue data from CSV"""
    print(f"Importing revenue from {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        errors = 0
        
        for row in reader:
            try:
                # Parse date
                date_str = row.get('date', '').strip()
                if not date_str:
                    errors += 1
                    print(f"  [ERROR] Row {count + 1}: Missing date")
                    continue
                
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except ValueError:
                    # Try other date formats
                    try:
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                    except ValueError:
                        errors += 1
                        print(f"  [ERROR] Row {count + 1}: Invalid date format: {date_str}")
                        continue
                
                # Parse amount
                amount = Decimal(str(row.get('amount', '0')).strip())
                if amount <= 0:
                    errors += 1
                    print(f"  [ERROR] Row {count + 1}: Invalid amount: {amount}")
                    continue
                
                # Parse category
                category_str = str(row.get('category', 'other') or 'other').strip().lower()
                try:
                    category = RevenueCategory(category_str)
                except ValueError:
                    category = RevenueCategory.OTHER
                
                # Get optional fields
                title = str(row.get('title') or 'Untitled').strip() if row.get('title') else 'Untitled'
                source_val = str(row.get('source') or '').strip() if row.get('source') else ''
                desc_val = str(row.get('description') or '').strip() if row.get('description') else ''
                is_recur = str(row.get('is_recurring') or '').strip().lower() in ('true', '1', 'yes')
                
                # Create revenue entry
                revenue_data = RevenueCreate(
                    title=title,
                    amount=amount,
                    date=date,
                    category=category,
                    source=source_val if source_val else None,
                    description=desc_val if desc_val else None,
                    is_recurring=is_recur,
                    recurring_frequency='monthly' if is_recur else None
                )
                
                revenue = revenue_crud.create(db, revenue_data, admin_user.id)
                
                # Auto-approve for training purposes
                revenue.is_approved = True
                revenue.approved_by_id = admin_user.id
                from datetime import timezone
                revenue.approved_at = datetime.now(timezone.utc)
                db.commit()
                
                count += 1
                
            except Exception as e:
                errors += 1
                print(f"  [ERROR] Row {row_num}: {str(e)}")
                db.rollback()
        
        print(f"  [OK] Imported {count} revenue entries ({errors} errors)")
        return count


def import_expenses(csv_path: Path, db, admin_user):
    """Import expense data from CSV"""
    print(f"Importing expenses from {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        errors = 0
        
        for row in reader:
            try:
                # Parse date
                date_str = row.get('date', '').strip()
                if not date_str:
                    errors += 1
                    print(f"  [ERROR] Row {count + 1}: Missing date")
                    continue
                
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except ValueError:
                    try:
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                    except ValueError:
                        errors += 1
                        print(f"  [ERROR] Row {count + 1}: Invalid date format: {date_str}")
                        continue
                
                # Parse amount
                amount_str = str(row.get('amount') or '0').strip() if row.get('amount') else '0'
                try:
                    amount = Decimal(amount_str)
                except (ValueError, TypeError):
                    errors += 1
                    print(f"  [ERROR] Row {row_num}: Invalid amount format: {amount_str}")
                    continue
                    
                if amount <= 0:
                    errors += 1
                    print(f"  [ERROR] Row {row_num}: Invalid amount: {amount}")
                    continue
                
                # Parse category
                category_str = str(row.get('category') or 'other').strip().lower()
                try:
                    category = ExpenseCategory(category_str)
                except ValueError:
                    category = ExpenseCategory.OTHER
                
                # Get optional fields
                title = str(row.get('title') or 'Untitled').strip() if row.get('title') else 'Untitled'
                vendor_val = str(row.get('vendor') or '').strip() if row.get('vendor') else ''
                desc_val = str(row.get('description') or '').strip() if row.get('description') else ''
                is_recur = str(row.get('is_recurring') or '').strip().lower() in ('true', '1', 'yes')
                
                # Create expense entry
                expense_data = ExpenseCreate(
                    title=title,
                    amount=amount,
                    date=date,
                    category=category,
                    vendor=vendor_val if vendor_val else None,
                    description=desc_val if desc_val else None,
                    is_recurring=is_recur,
                    recurring_frequency='monthly' if is_recur else None
                )
                
                expense = expense_crud.create(db, expense_data, admin_user.id)
                
                # Auto-approve for training purposes
                expense.is_approved = True
                expense.approved_by_id = admin_user.id
                from datetime import timezone
                expense.approved_at = datetime.now(timezone.utc)
                db.commit()
                
                count += 1
                
            except Exception as e:
                errors += 1
                print(f"  [ERROR] Row {row_num}: {str(e)}")
                db.rollback()
        
        print(f"  [OK] Imported {count} expense entries ({errors} errors)")
        return count


def import_inventory(csv_path: Path, db, admin_user):
    """Import inventory data from CSV"""
    print(f"Importing inventory from {csv_path}...")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        errors = 0
        row_num = 0
        
        for row in reader:
            row_num += 1
            try:
                # Skip empty rows
                if not row or not any(v for v in row.values() if v and str(v).strip()):
                    continue
                
                # Parse prices
                buying_price_str = str(row.get('buying_price') or '0').strip() if row.get('buying_price') else '0'
                selling_price_str = str(row.get('selling_price') or '0').strip() if row.get('selling_price') else '0'
                quantity_str = str(row.get('quantity') or '0').strip() if row.get('quantity') else '0'
                
                try:
                    buying_price = Decimal(buying_price_str)
                    selling_price = Decimal(selling_price_str)
                    quantity = int(quantity_str)
                except (ValueError, TypeError) as e:
                    errors += 1
                    print(f"  [ERROR] Row {row_num}: Invalid number format: {str(e)}")
                    continue
                
                if buying_price <= 0 or selling_price <= 0:
                    errors += 1
                    print(f"  [ERROR] Row {count + 1}: Invalid prices")
                    continue
                
                # Create inventory item
                inventory_data = InventoryItemCreate(
                    item_name=(row.get('item_name') or 'Untitled').strip() if row.get('item_name') else 'Untitled',
                    buying_price=buying_price,
                    selling_price=selling_price,
                    quantity=quantity,
                    category=(row.get('category') or '').strip() or None if row.get('category') else None,
                    sku=(row.get('sku') or '').strip() or None if row.get('sku') else None,
                    description=(row.get('description') or '').strip() or None if row.get('description') else None,
                    is_active=True
                )
                
                inventory_crud.create(db, inventory_data, admin_user.id)
                db.commit()
                
                count += 1
                
            except Exception as e:
                errors += 1
                print(f"  [ERROR] Row {row_num}: {str(e)}")
                db.rollback()
        
        print(f"  [OK] Imported {count} inventory items ({errors} errors)")
        return count


def main():
    parser = argparse.ArgumentParser(description="Import data from CSV files")
    parser.add_argument("--all", action="store_true", help="Import all CSV files")
    parser.add_argument("--file", type=str, help="Specific CSV file to import")
    parser.add_argument("--revenue", type=str, help="Revenue CSV file path")
    parser.add_argument("--expenses", type=str, help="Expenses CSV file path")
    parser.add_argument("--inventory", type=str, help="Inventory CSV file path")
    
    args = parser.parse_args()
    
    data_dir = Path(__file__).parent / "data"
    db = SessionLocal()
    
    try:
        admin_user = get_admin_user(db)
        print(f"Using admin user: {admin_user.email}")
        print("=" * 60)
        
        total_count = 0
        
        if args.all:
            # Import all files
            revenue_file = data_dir / "revenue.csv"
            expenses_file = data_dir / "expenses.csv"
            inventory_file = data_dir / "inventory.csv"
            
            if revenue_file.exists():
                total_count += import_revenue(revenue_file, db, admin_user)
            else:
                print(f"[WARN] Revenue file not found: {revenue_file}")
            
            if expenses_file.exists():
                total_count += import_expenses(expenses_file, db, admin_user)
            else:
                print(f"[WARN] Expenses file not found: {expenses_file}")
            
            if inventory_file.exists():
                total_count += import_inventory(inventory_file, db, admin_user)
            else:
                print(f"[WARN] Inventory file not found: {inventory_file}")
        
        elif args.file:
            # Import specific file
            file_path = Path(args.file)
            if not file_path.exists():
                file_path = data_dir / args.file
            
            if "revenue" in file_path.name.lower():
                total_count += import_revenue(file_path, db, admin_user)
            elif "expense" in file_path.name.lower():
                total_count += import_expenses(file_path, db, admin_user)
            elif "inventory" in file_path.name.lower():
                total_count += import_inventory(file_path, db, admin_user)
            else:
                print(f"[ERROR] Cannot determine file type from name: {file_path.name}")
                return
        
        elif args.revenue:
            file_path = Path(args.revenue)
            if not file_path.exists():
                file_path = data_dir / args.revenue
            total_count += import_revenue(file_path, db, admin_user)
        
        elif args.expenses:
            file_path = Path(args.expenses)
            if not file_path.exists():
                file_path = data_dir / args.expenses
            total_count += import_expenses(file_path, db, admin_user)
        
        elif args.inventory:
            file_path = Path(args.inventory)
            if not file_path.exists():
                file_path = data_dir / args.inventory
            total_count += import_inventory(file_path, db, admin_user)
        
        else:
            # Default: import all
            print("No specific file specified. Importing all files...")
            revenue_file = data_dir / "revenue.csv"
            expenses_file = data_dir / "expenses.csv"
            inventory_file = data_dir / "inventory.csv"
            
            if revenue_file.exists():
                total_count += import_revenue(revenue_file, db, admin_user)
            if expenses_file.exists():
                total_count += import_expenses(expenses_file, db, admin_user)
            if inventory_file.exists():
                total_count += import_inventory(inventory_file, db, admin_user)
        
        print("=" * 60)
        print(f"[SUCCESS] Total imported: {total_count} records")
        print("\nTIP: Run 'python train_ai_models.py --all' to train AI models with this data.")
        
    except Exception as e:
        print(f"\n[ERROR] Import failed: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()

