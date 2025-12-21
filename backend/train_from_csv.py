#!/usr/bin/env python3
"""
CSV to Model Training Pipeline
Reads CSV data from backend/data, trains models, and stores them in backend/model

Usage:
    python train_from_csv.py --all
    python train_from_csv.py --metric revenue --model xgboost
"""

import sys
import csv
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any
import pandas as pd

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ml_forecasting import MLForecastingService


def load_revenue_csv(csv_path: Path) -> List[Dict[str, Any]]:
    """Load revenue data from CSV and convert to training format"""
    data_points = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                date_str = row.get('date', '').strip()
                if not date_str:
                    continue
                
                # Parse date
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except ValueError:
                    try:
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                        date = date.replace(tzinfo=timezone.utc)
                    except ValueError:
                        continue
                
                amount = float(row.get('amount', 0))
                if amount <= 0:
                    continue
                
                data_points.append({
                    'date': date.isoformat(),
                    'value': amount
                })
            except Exception as e:
                print(f"  [WARN] Skipping row: {e}")
                continue
    
    return data_points


def load_expense_csv(csv_path: Path) -> List[Dict[str, Any]]:
    """Load expense data from CSV and convert to training format"""
    data_points = []
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                date_str = row.get('date', '').strip()
                if not date_str:
                    continue
                
                # Parse date
                try:
                    date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                except ValueError:
                    try:
                        date = datetime.strptime(date_str, '%Y-%m-%d')
                        date = date.replace(tzinfo=timezone.utc)
                    except ValueError:
                        continue
                
                amount = float(row.get('amount', 0))
                if amount <= 0:
                    continue
                
                data_points.append({
                    'date': date.isoformat(),
                    'value': amount
                })
            except Exception as e:
                print(f"  [WARN] Skipping row: {e}")
                continue
    
    return data_points


def load_inventory_csv(csv_path: Path) -> List[Dict[str, Any]]:
    """Load inventory data from CSV and convert to monthly time series format"""
    # For inventory, we need to create a time series from current inventory values
    # Since inventory CSV doesn't have dates, we'll use current value for each month
    # in a date range based on when items were created/modified
    
    items = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                quantity = int(row.get('quantity', 0))
                selling_price = float(row.get('selling_price', 0))
                if quantity > 0 and selling_price > 0:
                    items.append({
                        'quantity': quantity,
                        'selling_price': selling_price
                    })
            except Exception:
                continue
    
    # Calculate total inventory value
    total_value = sum(item['quantity'] * item['selling_price'] for item in items)
    
    # Create monthly data points for the past 24 months with current inventory value
    # This is a simplified approach - in practice, inventory changes over time
    data_points = []
    current_date = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Generate 24 months of data
    for i in range(24):
        month_date = current_date.replace(month=((current_date.month - i - 1) % 12) + 1)
        if current_date.month - i - 1 < 0:
            year_offset = (i - current_date.month + 1) // 12 + 1
            month_date = month_date.replace(year=current_date.year - year_offset)
        
        data_points.append({
            'date': month_date.isoformat(),
            'value': total_value  # Using current value as estimate
        })
    
    return data_points


def train_from_csv(
    metric: str,
    model_type: str,
    csv_path: Path,
    save_to_store: bool = True
) -> Dict[str, Any]:
    """Train a model from CSV data"""
    print(f"\n{'='*60}")
    print(f"Training {model_type.upper()} model for {metric.upper()}")
    print(f"Data source: {csv_path}")
    print(f"{'='*60}\n")
    
    # Load CSV data
    print("Loading CSV data...")
    if metric == "revenue":
        data_points = load_revenue_csv(csv_path)
    elif metric == "expense":
        data_points = load_expense_csv(csv_path)
    elif metric == "inventory":
        data_points = load_inventory_csv(csv_path)
    else:
        raise ValueError(f"Unknown metric: {metric}")
    
    if not data_points:
        raise ValueError(f"No valid data points found in {csv_path}")
    
    print(f"  [OK] Loaded {len(data_points)} data points")
    
    # Train model using MLForecastingService
    print(f"\nTraining {model_type} model...")
    try:
        # Use train_from_custom_data - it will handle all model types
        result = MLForecastingService.train_from_custom_data(
            data_points=data_points,
            model_type=model_type,
            metric_name=metric,  # Use metric name directly (revenue, expense, inventory)
            period="monthly",
            user_id=None,  # Global model
            epochs=50,
            batch_size=32
        )
        
        print(f"  [OK] Training completed successfully!")
        print(f"  - MAE: {result.get('mae', 'N/A')}")
        print(f"  - RMSE: {result.get('rmse', 'N/A')}")
        print(f"  - Data Points: {result.get('data_points', 'N/A')}")
        print(f"  - Model Path: {result.get('model_path', 'N/A')}")
        
        # If this is a standard metric (revenue, expense, inventory) and the model
        # was saved with "custom_" prefix, we can optionally copy it to standard location
        # For now, we'll use the custom path but ensure it's accessible
        
        # Save to store if requested
        if save_to_store:
            save_model_to_store(metric, model_type, result)
        
        return result
        
    except Exception as e:
        print(f"  [ERROR] Training failed: {str(e)}")
        raise


def save_model_to_store(metric: str, model_type: str, result: Dict[str, Any]):
    """Save model metadata to store directory"""
    # Try backend/store first, then fallback to store
    backend_store = Path(__file__).parent / "store"
    if backend_store.exists() or Path(__file__).parent.parent.exists():
        store_dir = backend_store
    else:
        store_dir = Path("store")
    store_dir.mkdir(exist_ok=True)
    
    store_file = store_dir / f"{metric}_{model_type}.json"
    
    store_data = {
        "metric": metric,
        "model_type": model_type,
        "status": result.get("status", "trained"),
        "model_path": result.get("model_path", ""),
        "metrics": {
            "mae": result.get("mae"),
            "rmse": result.get("rmse"),
            "data_points": result.get("data_points")
        },
        "trained_at": result.get("trained_at", datetime.now(timezone.utc).isoformat()),
        "source": "csv",
        "last_updated": datetime.now(timezone.utc).isoformat()
    }
    
    import json
    with open(store_file, 'w', encoding='utf-8') as f:
        json.dump(store_data, f, indent=2)
    
    print(f"  [OK] Model metadata saved to {store_file}")


def train_all_from_csv():
    """Train all models from CSV files"""
    data_dir = Path("data")
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    
    results = {
        "revenue": {},
        "expense": {},
        "inventory": {},
        "errors": []
    }
    
    # Revenue models
    revenue_csv = data_dir / "revenue.csv"
    if revenue_csv.exists():
        for model_type in ["prophet", "xgboost", "lstm"]:
            try:
                results["revenue"][model_type] = train_from_csv(
                    "revenue", model_type, revenue_csv
                )
            except Exception as e:
                error_msg = f"Revenue {model_type}: {str(e)}"
                results["errors"].append(error_msg)
                print(f"\n[ERROR] {error_msg}\n")
    else:
        print(f"[WARN] Revenue CSV not found: {revenue_csv}")
    
    # Expense models
    expense_csv = data_dir / "expenses.csv"
    if expense_csv.exists():
        for model_type in ["arima", "prophet", "linear_regression"]:
            try:
                results["expense"][model_type] = train_from_csv(
                    "expense", model_type, expense_csv
                )
            except Exception as e:
                error_msg = f"Expense {model_type}: {str(e)}"
                results["errors"].append(error_msg)
                print(f"\n[ERROR] {error_msg}\n")
    else:
        print(f"[WARN] Expense CSV not found: {expense_csv}")
    
    # Inventory models
    inventory_csv = data_dir / "inventory.csv"
    if inventory_csv.exists():
        for model_type in ["sarima", "xgboost", "lstm"]:
            try:
                results["inventory"][model_type] = train_from_csv(
                    "inventory", model_type, inventory_csv
                )
            except Exception as e:
                error_msg = f"Inventory {model_type}: {str(e)}"
                results["errors"].append(error_msg)
                print(f"\n[ERROR] {error_msg}\n")
    else:
        print(f"[WARN] Inventory CSV not found: {inventory_csv}")
    
    return results


def main():
    parser = argparse.ArgumentParser(description="Train models from CSV data")
    parser.add_argument("--all", action="store_true", help="Train all models from all CSV files")
    parser.add_argument("--metric", choices=["revenue", "expense", "inventory"], help="Metric to train")
    parser.add_argument(
        "--model",
        choices=["arima", "sarima", "prophet", "xgboost", "lstm", "linear_regression"],
        help="Model type to train"
    )
    parser.add_argument("--csv", type=str, help="Path to CSV file (optional, uses default if not specified)")
    
    args = parser.parse_args()
    
    data_dir = Path("data")
    
    try:
        if args.all:
            print("Training all models from CSV files...")
            results = train_all_from_csv()
            
            print("\n" + "="*60)
            print("TRAINING SUMMARY")
            print("="*60)
            
            for metric, models in results.items():
                if metric == "errors":
                    if models:
                        print(f"\n[ERRORS] {len(models)} models failed:")
                        for error in models:
                            print(f"  - {error}")
                    continue
                
                print(f"\n{metric.upper()}:")
                for model_type, result in models.items():
                    if result.get("status") == "trained":
                        print(f"  [OK] {model_type.upper()}")
                        print(f"      - Model: {result.get('model_path', 'N/A')}")
                    else:
                        print(f"  [FAILED] {model_type.upper()}")
        
        elif args.metric and args.model:
            # Train specific model
            if args.csv:
                csv_path = Path(args.csv)
            else:
                if args.metric == "revenue":
                    csv_path = data_dir / "revenue.csv"
                elif args.metric == "expense":
                    csv_path = data_dir / "expenses.csv"
                elif args.metric == "inventory":
                    csv_path = data_dir / "inventory.csv"
                else:
                    raise ValueError(f"Unknown metric: {args.metric}")
            
            if not csv_path.exists():
                raise FileNotFoundError(f"CSV file not found: {csv_path}")
            
            train_from_csv(args.metric, args.model, csv_path)
        
        else:
            print("Training all models by default...")
            print("Use --help for options\n")
            train_all_from_csv()
    
    except Exception as e:
        print(f"\n[ERROR] Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

