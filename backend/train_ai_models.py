#!/usr/bin/env python3
"""
AI Model Training Script
Trains all AI/ML models for forecasting

Usage:
    python train_ai_models.py
    python train_ai_models.py --metric revenue --model prophet
    python train_ai_models.py --all
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal, engine, Base
from app.services.ml_forecasting import MLForecastingService
from app.models.user import UserRole
# Import all models to ensure they're registered with Base
from app.models import (  # noqa: F401
    User, UserRole, Role,
    RevenueEntry, ExpenseEntry,
    ApprovalWorkflow, ApprovalComment,
    Report, ReportSchedule,
    AuditLog, Notification,
    Project, LoginHistory,
    Budget, BudgetItem, BudgetScenario, Forecast, BudgetVariance,
    BudgetType, BudgetPeriod, BudgetStatus,
    InventoryItem,
    Sale, SaleStatus, JournalEntry,
    InventoryAuditLog, InventoryChangeType
)
import argparse


def train_all_models():
    """Train all models for all metrics"""
    print("Starting AI Model Training...")
    print("=" * 60)
    
    # Ensure database tables exist
    print("Initializing database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully\n")
    except Exception as e:
        print(f"Warning: Failed to create database tables: {e}\n")
    
    db = SessionLocal()
    try:
        # Calculate date range (last 2 years)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=730)  # 2 years
        
        print(f"Training Period: {start_date.date()} to {end_date.date()}")
        print(f"Training all models for all metrics...\n")
        
        # Train all models
        results = MLForecastingService.train_all_models(
            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
        )
        
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
        
        # Print results
        for metric, models in results.items():
            if metric == "errors":
                if models:
                    print(f"\n[ERRORS] {len(models)} models failed:")
                    for error in models:
                        print(f"   - {error}")
                    print("\nTIP: See DATA_REQUIREMENTS.md for information about data requirements.")
                continue
            
            if metric == "trained_at":
                print(f"\nTrained at: {models}")
                continue
            
            print(f"\n{metric.upper()}:")
            for model_type, result in models.items():
                if result.get("status") == "trained":
                    print(f"   [OK] {model_type.upper()}:")
                    print(f"      - MAE: {result.get('mae', 'N/A')}")
                    print(f"      - RMSE: {result.get('rmse', 'N/A')}")
                    print(f"      - Data Points: {result.get('data_points', 'N/A')}")
                    if result.get('model_path'):
                        print(f"      - Model: {result['model_path']}")
                else:
                    print(f"   [FAILED] {model_type.upper()}: Failed")
        
        return results
        
    except Exception as e:
        print(f"\n[ERROR] Training failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()


def train_specific_model(metric: str, model_type: str):
    """Train a specific model"""
    print(f"Training {model_type.upper()} for {metric.upper()}...")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=730)  # 2 years
        
        print(f"Training Period: {start_date.date()} to {end_date.date()}\n")
        
        # Train specific model
        if metric == "expense" and model_type == "arima":
            result = MLForecastingService.train_arima_expenses(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "expense" and model_type == "prophet":
            result = MLForecastingService.train_prophet_expenses(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "expense" and model_type == "linear_regression":
            result = MLForecastingService.train_linear_regression_expenses(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "revenue" and model_type == "prophet":
            result = MLForecastingService.train_prophet_revenue(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "revenue" and model_type == "xgboost":
            result = MLForecastingService.train_xgboost_revenue(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "revenue" and model_type == "lstm":
            result = MLForecastingService.train_lstm_revenue(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "inventory" and model_type == "sarima":
            result = MLForecastingService.train_sarima_inventory(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "inventory" and model_type == "xgboost":
            result = MLForecastingService.train_xgboost_inventory(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        elif metric == "inventory" and model_type == "lstm":
            result = MLForecastingService.train_lstm_inventory(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
            )
        else:
            print(f"[ERROR] Invalid combination: {metric} + {model_type}")
            print("\nValid combinations:")
            print("  Expenses: arima, prophet, linear_regression")
            print("  Revenue: prophet, xgboost, lstm")
            print("  Inventory: sarima, xgboost, lstm")
            return None
        
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
        print(f"\nResults:")
        print(f"   Model: {result.get('model_type', 'N/A')}")
        print(f"   Metric: {result.get('metric', 'N/A')}")
        print(f"   Status: {result.get('status', 'N/A')}")
        print(f"   MAE: {result.get('mae', 'N/A')}")
        print(f"   RMSE: {result.get('rmse', 'N/A')}")
        print(f"   Data Points: {result.get('data_points', 'N/A')}")
        if result.get('model_path'):
            print(f"   Model Path: {result['model_path']}")
        
        return result
        
    except Exception as e:
        # Restore stderr for error messages
        sys.stderr = old_stderr #type: ignore
        error_msg = str(e)
        if "Insufficient data" not in error_msg:
            print(f"\n[ERROR] Training failed: {error_msg}")
            import traceback
            traceback.print_exc()
        else:
            print(f"\n[ERROR] Training failed: {error_msg}")
        return None
    finally:
        sys.stderr = old_stderr #type: ignore
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Train AI/ML forecasting models")
    parser.add_argument("--all", action="store_true", help="Train all models")
    parser.add_argument("--metric", choices=["expense", "revenue", "inventory"], help="Metric to train")
    parser.add_argument(
        "--model",
        choices=["arima", "sarima", "prophet", "xgboost", "lstm", "linear_regression"],
        help="Model type to train"
    )
    
    args = parser.parse_args()
    
    if args.all:
        train_all_models()
    elif args.metric and args.model:
        train_specific_model(args.metric, args.model)
    else:
        print("Training all models by default...")
        print("Use --help for options\n")
        train_all_models()


if __name__ == "__main__":
    main()

