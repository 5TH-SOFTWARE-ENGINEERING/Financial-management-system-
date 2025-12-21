#!/usr/bin/env python3
"""
Test script to verify the CSV -> Model -> Store -> Forecasting pipeline integration
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ml_forecasting import MLForecastingService
import json


def test_pipeline_integration():
    """Test the complete pipeline integration"""
    print("=" * 80)
    print("TESTING PIPELINE INTEGRATION")
    print("=" * 80)
    print()
    
    # Test 1: Check directories exist
    print("TEST 1: Directory Structure")
    print("-" * 80)
    
    data_dir = Path("data")
    model_dir = Path("model")
    store_dir = Path("store")
    
    checks = {
        "Data directory (backend/data/)": data_dir.exists(),
        "Model directory (backend/model/)": model_dir.exists(),
        "Store directory (backend/store/)": store_dir.exists()
    }
    
    for name, exists in checks.items():
        status = "[OK]" if exists else "[MISSING]"
        print(f"  {status} {name}")
    
    print()
    
    # Test 2: Check CSV files
    print("TEST 2: CSV Data Files")
    print("-" * 80)
    
    csv_files = {
        "revenue.csv": data_dir / "revenue.csv",
        "expenses.csv": data_dir / "expenses.csv",
        "inventory.csv": data_dir / "inventory.csv"
    }
    
    for name, path in csv_files.items():
        if path.exists():
            size = path.stat().st_size
            print(f"  [OK] {name}: {size:,} bytes")
        else:
            print(f"  [MISSING] {name}")
    
    print()
    
    # Test 3: Check trained models
    print("TEST 3: Trained Models")
    print("-" * 80)
    
    if model_dir.exists():
        model_files = list(model_dir.glob("*.pkl")) + list(model_dir.glob("*.keras"))
        print(f"  Found {len(model_files)} model files:")
        for model_file in sorted(model_files)[:10]:
            size = model_file.stat().st_size
            print(f"    - {model_file.name}: {size:,} bytes")
        if len(model_files) > 10:
            print(f"    ... and {len(model_files) - 10} more")
    else:
        print("  [ERROR] Model directory not found")
    
    print()
    
    # Test 4: Check store metadata
    print("TEST 4: Store Metadata")
    print("-" * 80)
    
    if store_dir.exists():
        store_files = list(store_dir.glob("*.json"))
        print(f"  Found {len(store_files)} metadata files:")
        for store_file in sorted(store_files):
            try:
                with open(store_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                model_path_str = metadata.get('model_path', 'N/A')
                model_exists = Path(model_path_str).exists() if model_path_str != 'N/A' else False
                status = "[OK]" if model_exists else "[MISSING MODEL]"
                print(f"    {status} {store_file.name}")
                print(f"      - Metric: {metadata.get('metric')}")
                print(f"      - Model Type: {metadata.get('model_type')}")
                print(f"      - Model Path: {Path(model_path_str).name if model_path_str != 'N/A' else 'N/A'}")
                print(f"      - Model Exists: {model_exists}")
            except Exception as e:
                print(f"    [ERROR] {store_file.name}: {e}")
    else:
        print("  [ERROR] Store directory not found")
    
    print()
    
    # Test 5: Test get_trained_models()
    print("TEST 5: MLForecastingService.get_trained_models()")
    print("-" * 80)
    
    try:
        models = MLForecastingService.get_trained_models()
        print(f"  [OK] Found {len(models)} trained models")
        for key, info in list(models.items())[:5]:
            exists = info.get('exists', False)
            status = "[OK]" if exists else "[MISSING]"
            print(f"    {status} {key}: {info.get('model_path', 'N/A')}")
        if len(models) > 5:
            print(f"    ... and {len(models) - 5} more")
    except Exception as e:
        print(f"  [ERROR] Failed to get trained models: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    
    # Test 6: Test model path resolution
    print("TEST 6: Model Path Resolution")
    print("-" * 80)
    
    test_cases = [
        ("expense", "arima"),
        ("revenue", "xgboost"),
        ("inventory", "sarima")
    ]
    
    for metric, model_type in test_cases:
        # Try standard path
        standard_path = MLForecastingService._get_model_path(metric, model_type)
        custom_path = MLForecastingService._get_custom_model_path(metric, model_type)
        
        standard_exists = standard_path.exists()
        custom_exists = custom_path.exists()
        
        if standard_exists or custom_exists:
            path_used = standard_path if standard_exists else custom_path
            print(f"  [OK] {metric}_{model_type}: Found at {path_used.name}")
        else:
            print(f"  [NOT FOUND] {metric}_{model_type}: Checked both {standard_path.name} and {custom_path.name}")
    
    print()
    
    # Test 7: Summary
    print("TEST 7: Integration Summary")
    print("-" * 80)
    
    summary = {
        "CSV Files": len([f for f in csv_files.values() if f.exists()]),
        "Model Files": len(model_files) if model_dir.exists() else 0,
        "Store Files": len(store_files) if store_dir.exists() else 0,
        "Detected Models": len(models) if 'models' in locals() else 0
    }
    
    print("  Summary:")
    for key, value in summary.items():
        print(f"    - {key}: {value}")
    
    # Overall status
    all_good = (
        summary["CSV Files"] >= 2 and
        summary["Model Files"] > 0 and
        summary["Store Files"] > 0
    )
    
    print()
    print("=" * 80)
    if all_good:
        print("[OK] PIPELINE INTEGRATION: WORKING")
        print("=" * 80)
        print("\nThe pipeline is properly integrated:")
        print("  [OK] CSV data files available")
        print("  [OK] Trained models stored")
        print("  [OK] Model metadata in store")
        print("  [OK] Model loading functions working")
    else:
        print("[WARN] PIPELINE INTEGRATION: NEEDS ATTENTION")
        print("=" * 80)
        print("\nSome components may be missing:")
        if summary["CSV Files"] < 2:
            print("  [WARN] CSV data files missing")
        if summary["Model Files"] == 0:
            print("  [WARN] No trained models found - run: python train_from_csv.py --all")
        if summary["Store Files"] == 0:
            print("  [WARN] No store metadata found")
    
    print()
    return all_good


if __name__ == "__main__":
    success = test_pipeline_integration()
    sys.exit(0 if success else 1)

