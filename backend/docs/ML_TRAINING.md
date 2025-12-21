# AI Model Training Quick Start Guide

This guide will help you start training AI models for forecasting in your finance management system.

## 🚀 Quick Start

### 1. Install Dependencies

All required ML libraries are already in `requirements.txt`. Install them:

```bash
cd backend
pip install -r requirements.txt
```

**Key Libraries:**
- `scikit-learn` - Linear Regression, metrics
- `statsmodels` - ARIMA, SARIMA
- `prophet` - Prophet forecasting
- `xgboost` - Gradient boosting
- `tensorflow` & `keras` - LSTM neural networks
- `joblib` - Model persistence
- `pandas` & `numpy` - Data processing

### 2. Train All Models (Recommended)

The easiest way to get started is to train all models at once:

```bash
python train_ai_models.py
```

Or use the `--all` flag:

```bash
python train_ai_models.py --all
```

This will train:
- **Expenses**: ARIMA, Prophet, Linear Regression
- **Revenue**: Prophet, XGBoost, LSTM
- **Inventory**: SARIMA, XGBoost, LSTM

### 3. Train Specific Models

Train a specific model for a specific metric:

```bash
# Train ARIMA for expenses
python train_ai_models.py --metric expense --model arima

# Train Prophet for revenue
python train_ai_models.py --metric revenue --model prophet

# Train LSTM for inventory
python train_ai_models.py --metric inventory --model lstm
```

### 4. Use API Endpoints

You can also train models via API endpoints:

```bash
# Train all models
POST /api/v1/ml/train/all?start_date=2022-01-01&end_date=2024-01-01

# Train specific models
POST /api/v1/ml/train/expenses/arima?start_date=2022-01-01&end_date=2024-01-01
POST /api/v1/ml/train/revenue/prophet?start_date=2022-01-01&end_date=2024-01-01
POST /api/v1/ml/train/inventory/sarima?start_date=2022-01-01&end_date=2024-01-01
```

**Note:** You need admin privileges to train models.

## 📊 Available Models

### Expenses Forecasting
- **ARIMA** - AutoRegressive Integrated Moving Average
- **Prophet** - Facebook Prophet (handles seasonality)
- **Linear Regression** - Simple linear trend

### Revenue Forecasting
- **Prophet** - Best for seasonal patterns
- **XGBoost** - Gradient boosting (handles complex patterns)
- **LSTM** - Deep learning (best for long sequences)

### Inventory Forecasting
- **SARIMA** - Seasonal ARIMA (handles seasonality)
- **XGBoost** - Gradient boosting
- **LSTM** - Deep learning

## 📁 Model Storage

Trained models are saved in the `model/` directory:
- `expense_arima.pkl`
- `revenue_prophet.pkl`
- `inventory_sarima.pkl`
- etc.

## 🔄 Automated Retraining

Models are automatically retrained every Monday at 2 AM by default. The scheduler starts automatically when the backend starts.

To customize the schedule, modify `app/services/ml_scheduler.py`:

```python
schedule_model_retraining(
    hour=2,        # 2 AM
    minute=0,
    day_of_week="mon"  # Monday
)
```

## 📈 Using Trained Models for Forecasting

Once models are trained, you can use them in forecasts:

```python
# Create a forecast using a trained model
POST /api/v1/forecasts
{
    "name": "Revenue Forecast Q1 2024",
    "forecast_type": "revenue",
    "method": "prophet",  # Use trained Prophet model
    "start_date": "2024-01-01",
    "end_date": "2024-03-31"
}
```

## ⚠️ Requirements

### Minimum Data Requirements
- **ARIMA/Linear Regression**: 10+ data points
- **Prophet**: 50+ data points
- **XGBoost**: 20+ data points
- **LSTM**: 30+ data points
- **SARIMA**: 24+ data points (2 years for seasonality)

### Data Quality
- Only **approved** revenue and expense entries are used
- Data is grouped by period (daily, weekly, monthly)
- Missing data is handled automatically

## 🐛 Troubleshooting

### "Insufficient data" Error
- Ensure you have enough historical data
- Check that revenue/expense entries are approved
- Verify date ranges include actual data

### "Model not found" Error
- Train the model first using the training script or API
- Check that the model file exists in `model/` directory

### Import Errors
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Some models require specific libraries (see error message)

### Training Takes Too Long
- LSTM models take the longest (can be 5-10 minutes)
- XGBoost and Prophet are faster (1-2 minutes)
- ARIMA and Linear Regression are fastest (< 1 minute)

## 📚 Next Steps

1. **Train models** with your historical data
2. **Compare model performance** using MAE and RMSE metrics
3. **Use best models** for forecasting
4. **Schedule automatic retraining** to keep models up-to-date
5. **Monitor forecast accuracy** and retrain as needed

## 🔗 Related Files

- `app/services/ml_forecasting.py` - ML training and forecasting logic
- `app/services/ml_scheduler.py` - Automated retraining scheduler
- `app/api/v1/budgeting.py` - API endpoints for training and forecasting
- `train_ai_models.py` - Command-line training script

## 💡 Tips

1. **Start with Prophet** - It's the most robust and handles seasonality well
2. **Use XGBoost** for complex patterns and non-linear relationships
3. **Try LSTM** if you have long sequences (>30 data points)
4. **Compare models** - Train multiple models and compare their MAE/RMSE
5. **Retrain regularly** - Models should be retrained as new data comes in

---

**Happy Forecasting! 🎯**

