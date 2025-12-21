#!/usr/bin/env python3
"""
Complete Pipeline: CSV Data -> Model Training -> Storage -> Integration
This script orchestrates the entire pipeline from CSV files to trained models
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from train_from_csv import train_all_from_csv, train_from_csv
from app.services.ml_forecasting import MLForecastingService
import json


def run_complete_pipeline():
    """Run the complete pipeline: CSV -> Train -> Store -> Verify"""
    print("=" * 80)
    print("CSV TO MODEL TRAINING PIPELINE")
    print("=" * 80)
    print()
    
    # Step 1: Verify CSV files exist
    print("STEP 1: Verifying CSV data files...")
    print("-" * 80)
    data_dir = Path("data")
    csv_files = {
        "revenue": data_dir / "revenue.csv",
        "expense": data_dir / "expenses.csv",
        "inventory": data_dir / "inventory.csv"
    }
    
    for metric, csv_path in csv_files.items():
        if csv_path.exists():
            print(f"  [OK] {metric.upper()}: {csv_path} ({csv_path.stat().st_size} bytes)")
        else:
            print(f"  [WARN] {metric.upper()}: {csv_path} not found")
    
    print()
    
    # Step 2: Train models from CSV
    print("STEP 2: Training models from CSV data...")
    print("-" * 80)
    try:
        results = train_all_from_csv()
        print("\n[OK] Training completed!")
    except Exception as e:
        print(f"\n[ERROR] Training failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    
    # Step 3: Verify models are stored
    print("STEP 3: Verifying trained models are stored...")
    print("-" * 80)
    
    # Check model directory
    model_dir = Path("model")
    if not model_dir.exists():
        model_dir = Path("models")
    
    if model_dir.exists():
        print(f"  Model directory: {model_dir}")
        model_files = list(model_dir.glob("*"))
        print(f"  Found {len(model_files)} model files")
        for model_file in sorted(model_files)[:10]:  # Show first 10
            if model_file.is_file():
                print(f"    - {model_file.name}")
        if len(model_files) > 10:
            print(f"    ... and {len(model_files) - 10} more")
    else:
        print(f"  [WARN] Model directory not found: {model_dir}")
    
    print()
    
    # Step 4: Verify store metadata
    print("STEP 4: Verifying model store metadata...")
    print("-" * 80)
    
    store_dir = Path("store")
    if store_dir.exists():
        store_files = list(store_dir.glob("*.json"))
        print(f"  Store directory: {store_dir}")
        print(f"  Found {len(store_files)} metadata files")
        for store_file in sorted(store_files):
            try:
                with open(store_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                print(f"    - {store_file.name}: {metadata.get('metric')} {metadata.get('model_type')} (Status: {metadata.get('status')})")
            except Exception as e:
                print(f"    - {store_file.name}: [ERROR reading] {e}")
    else:
        print(f"  [WARN] Store directory not found: {store_dir}")
    
    print()
    
    # Step 5: Test model loading
    print("STEP 5: Testing model loading from ml_forecasting.py...")
    print("-" * 80)
    
    try:
        trained_models = MLForecastingService.get_trained_models()
        print(f"  [OK] Found {len(trained_models)} trained models in store")
        
        for model_key, model_info in list(trained_models.items())[:5]:  # Show first 5
            exists = model_info.get('exists', False)
            status = "[OK]" if exists else "[MISSING]"
            print(f"    {status} {model_key}: {model_info.get('model_path', 'N/A')}")
        
        if len(trained_models) > 5:
            print(f"    ... and {len(trained_models) - 5} more models")
        
        # Try loading one model if available
        if trained_models:
            first_model = list(trained_models.items())[0]
            model_key, model_info = first_model
            if model_info.get('exists'):
                try:
                    metric, model_type = model_key.split('_', 1)
                    # Skip LSTM/XGBoost for quick test (requires more setup)
                    if model_type in ['arima', 'linear_regression']:
                        model = MLForecastingService.load_trained_model(metric, model_type)
                        print(f"\n  [OK] Successfully loaded test model: {model_key}")
                    else:
                        print(f"\n  [SKIP] Skipping load test for {model_key} (requires DB session)")
                except Exception as e:
                    print(f"\n  [WARN] Failed to load test model {model_key}: {e}")
        
    except Exception as e:
        print(f"  [ERROR] Failed to get trained models: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    
    # Step 6: Summary
    print("STEP 6: Pipeline Summary")
    print("-" * 80)
    
    successful_models = 0
    failed_models = 0
    
    for metric, models in results.items():
        if metric == "errors":
            failed_models = len(models)
            continue
        for model_type, result in models.items():
            if result.get("status") == "trained":
                successful_models += 1
    
    print(f"  Successful models: {successful_models}")
    print(f"  Failed models: {failed_models}")
    print(f"  Total trained models available: {len(trained_models) if 'trained_models' in locals() else 0}")
    
    print()
    print("=" * 80)
    print("PIPELINE COMPLETE!")
    print("=" * 80)
    print()
    print("Next steps:")
    print("  1. Models are stored in: backend/model/")
    print("  2. Model metadata is in: backend/store/")
    print("  3. Use MLForecastingService.load_trained_model() to load models")
    print("  4. Use MLForecastingService.generate_forecast_from_trained() to generate forecasts")
    print()
    
    return successful_models > 0


if __name__ == "__main__":
    success = run_complete_pipeline()
    sys.exit(0 if success else 1)

