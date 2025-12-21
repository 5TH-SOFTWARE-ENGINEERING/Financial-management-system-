# CSV to Model Training Pipeline

This document explains how to use the complete pipeline that reads CSV data, trains ML models, and stores them for use in `ml_forecasting.py`.

## Overview

The pipeline consists of:
1. **CSV Data** (`backend/data/`) - Source data files
2. **Training Script** (`train_from_csv.py`) - Trains models from CSV data
3. **Model Storage** (`backend/model/`) - Trained model files
4. **Model Store** (`backend/store/`) - Model metadata and registry
5. **ML Service** (`ml_forecasting.py`) - Loads and uses trained models

## Quick Start

### Step 1: Prepare CSV Data
Ensure your CSV files are in `backend/data/`:
- `revenue.csv` - Revenue entries
- `expenses.csv` - Expense entries  
- `inventory.csv` - Inventory items

### Step 2: Run the Pipeline
```bash
# Run the complete pipeline
python run_csv_to_model_pipeline.py

# Or train models individually
python train_from_csv.py --all

# Or train a specific model
python train_from_csv.py --metric revenue --model xgboost
```

## Pipeline Components

### 1. CSV Data Loading (`train_from_csv.py`)

The script reads CSV files and converts them to training format:

- **Revenue CSV**: Extracts date and amount columns
- **Expense CSV**: Extracts date and amount columns
- **Inventory CSV**: Creates monthly time series from current inventory values

### 2. Model Training

Models are trained using `MLForecastingService.train_from_custom_data()`:

**Revenue Models:**
- Prophet
- XGBoost
- LSTM

**Expense Models:**
- ARIMA
- Prophet
- Linear Regression

**Inventory Models:**
- SARIMA
- XGBoost
- LSTM

### 3. Model Storage

Trained models are saved to `backend/model/`:
- Model files: `{metric}_{model_type}.pkl` or `.keras` (for LSTM)
- Scaler files: `{metric}_{model_type}.scaler.pkl` (for LSTM)
- Metadata files: `{metric}_{model_type}.metadata.json`

### 4. Model Store

Metadata is stored in `backend/store/` as JSON files:
- File: `{metric}_{model_type}.json`
- Contains: Model path, metrics (MAE, RMSE), training date, source

### 5. Integration with ml_forecasting.py

The `ml_forecasting.py` service automatically:
- Detects models in `backend/model/`
- Loads metadata from `backend/store/`
- Provides functions to load and use trained models

## Usage Examples

### List All Trained Models
```python
from app.services.ml_forecasting import MLForecastingService

models = MLForecastingService.get_trained_models()
for key, info in models.items():
    print(f"{key}: {info['model_path']}")
```

### Load a Trained Model
```python
from app.services.ml_forecasting import MLForecastingService

# Load a specific model
model = MLForecastingService.load_trained_model(
    metric="revenue",
    model_type="xgboost"
)

# Generate forecast
forecast = MLForecastingService.generate_forecast_from_trained(
    metric="revenue",
    model_type="xgboost",
    periods=12
)
```

### Generate Forecast from Trained Model
```python
from datetime import datetime, timezone
from app.services.ml_forecasting import MLForecastingService

forecast = MLForecastingService.generate_forecast_from_trained(
    metric="revenue",
    model_type="xgboost",
    periods=12,
    start_date=datetime(2025, 1, 1, tzinfo=timezone.utc),
    end_date=datetime(2025, 12, 1, tzinfo=timezone.utc)
)

for point in forecast:
    print(f"{point['date']}: {point['forecasted_value']}")
```

## File Structure

```
backend/
├── data/
│   ├── revenue.csv
│   ├── expenses.csv
│   └── inventory.csv
├── model/
│   ├── revenue_xgboost.pkl
│   ├── revenue_lstm.keras
│   ├── expense_arima.pkl
│   └── ...
├── store/
│   ├── revenue_xgboost.json
│   ├── revenue_lstm.json
│   ├── expense_arima.json
│   └── ...
├── train_from_csv.py          # CSV to model training
├── run_csv_to_model_pipeline.py  # Complete pipeline orchestration
└── app/services/
    └── ml_forecasting.py      # Model loading and forecasting
```

## Model Path Resolution

The system automatically resolves model paths:
1. First checks `backend/model/` (absolute path from backend directory)
2. Falls back to `model/` (relative path)
3. Falls back to `models/` (alternative relative path)

## Troubleshooting

### Models Not Found
- Ensure models are trained: `python train_from_csv.py --all`
- Check model directory exists: `ls backend/model/`
- Verify store metadata: `ls backend/store/`

### Training Failures
- Check CSV file format matches expected schema
- Ensure sufficient data points (minimum varies by model type)
- Check for missing dependencies (tensorflow, xgboost, prophet, etc.)

### Load Errors
- Verify model file exists at the path in store metadata
- Check model type matches (LSTM uses `.keras`, others use `.pkl`)
- Ensure required libraries are installed

## Next Steps

After training models:
1. Models are automatically available via `MLForecastingService`
2. Use `generate_forecast_from_trained()` for predictions
3. Models can be retrained with new data by re-running the pipeline
4. Model metadata in `store/` tracks training history

