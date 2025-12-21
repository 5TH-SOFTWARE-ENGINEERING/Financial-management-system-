
# AI/ML Forecasting Guide

## Adding Machine Learning to Your Forecasting System

**Current Status:** Your system uses basic statistical methods (moving average, linear growth, simple regression)  
**New Capability:** AI/ML-powered forecasting with advanced algorithms

---

## 📦 Added ML Libraries

I've added the following libraries to `requirements.txt`:

### 1. **scikit-learn** (1.3.2)
- **Purpose:** General machine learning algorithms
- **Use Cases:** 
  - Random Forest for non-linear patterns
  - Gradient Boosting for complex relationships
  - Support Vector Regression
  - Neural network-based regression
- **Best For:** General forecasting, handling non-linear trends

### 2. **statsmodels** (0.14.1)
- **Purpose:** Statistical time series models
- **Use Cases:**
  - ARIMA (AutoRegressive Integrated Moving Average)
  - SARIMA (Seasonal ARIMA)
  - Exponential Smoothing (Holt-Winters)
  - VAR (Vector Autoregression)
- **Best For:** Traditional time series forecasting with seasonality

### 3. **prophet** (1.1.5)
- **Purpose:** Facebook's time series forecasting tool
- **Use Cases:**
  - Automatic seasonality detection
  - Holiday effects
  - Trend changes
  - Missing data handling
- **Best For:** Business forecasting with clear seasonality patterns

### 4. **xgboost** (2.0.3)
- **Purpose:** Gradient boosting for structured data
- **Use Cases:**
  - Complex non-linear patterns
  - Feature importance analysis
  - High accuracy predictions
- **Best For:** Advanced forecasting with multiple features

### 5. **lightgbm** (4.1.0)
- **Purpose:** Fast gradient boosting
- **Use Cases:**
  - Similar to XGBoost but faster
  - Large datasets
  - Real-time predictions
- **Best For:** Performance-critical forecasting

### 6. **numpy** (1.26.3) & **scipy** (1.11.4)
- **Purpose:** Required dependencies for ML libraries
- **Note:** Already have pandas, which works with these

---

## 🚀 Installation

After updating `requirements.txt`, install the new packages:

```bash
cd backend
pip install -r requirements.txt
```

**Note:** Some libraries (especially Prophet) may require additional system dependencies:
- On Linux: `sudo apt-get install build-essential`
- On macOS: Xcode Command Line Tools
- On Windows: Visual C++ Build Tools

---

## 💡 Implementation Examples

### Example 1: ARIMA Forecasting (statsmodels)

```python
# app/services/forecasting.py - Add this method

from statsmodels.tsa.arima.model import ARIMA
import pandas as pd
import numpy as np

@staticmethod
def generate_arima_forecast(
    db: Session,
    forecast_type: str,
    start_date: datetime,
    end_date: datetime,
    historical_start: datetime,
    historical_end: datetime,
    order: tuple = (1, 1, 1),  # (p, d, q) parameters
    user_id: Optional[int] = None,
    user_role: Optional[UserRole] = None
) -> List[Dict[str, Any]]:
    """Generate forecast using ARIMA model"""
    # Get historical data
    historical_data = ForecastingService._get_historical_data(
        db, forecast_type, historical_start, historical_end, user_id, user_role
    )
    
    if len(historical_data) < 10:  # Need minimum data points
        return []
    
    # Convert to pandas Series with dates
    dates = pd.date_range(start=historical_start, end=historical_end, freq='M')
    series = pd.Series(historical_data[:len(dates)], index=dates[:len(historical_data)])
    
    # Fit ARIMA model
    try:
        model = ARIMA(series, order=order)
        fitted_model = model.fit()
        
        # Generate forecast
        forecast_periods = (end_date - start_date).days // 30  # Monthly
        forecast = fitted_model.forecast(steps=forecast_periods)
        forecast_index = pd.date_range(start=start_date, periods=forecast_periods, freq='M')
        
        forecast_data = []
        for date, value in zip(forecast_index, forecast):
            forecast_data.append({
                "period": date.strftime("%Y-%m"),
                "date": date.isoformat(),
                "forecasted_value": float(value),
                "method": "arima",
                "order": order,
                "aic": float(fitted_model.aic)  # Model quality metric
            })
        
        return forecast_data
    except Exception as e:
        logger.error(f"ARIMA forecast failed: {str(e)}")
        return []
```

### Example 2: Prophet Forecasting (Facebook Prophet)

```python
from prophet import Prophet
import pandas as pd

@staticmethod
def generate_prophet_forecast(
    db: Session,
    forecast_type: str,
    start_date: datetime,
    end_date: datetime,
    historical_start: datetime,
    historical_end: datetime,
    user_id: Optional[int] = None,
    user_role: Optional[UserRole] = None
) -> List[Dict[str, Any]]:
    """Generate forecast using Facebook Prophet"""
    # Get historical data
    historical_data = ForecastingService._get_historical_data(
        db, forecast_type, historical_start, historical_end, user_id, user_role
    )
    
    if len(historical_data) < 10:
        return []
    
    # Prepare data for Prophet (requires 'ds' and 'y' columns)
    dates = pd.date_range(start=historical_start, end=historical_end, freq='D')
    df = pd.DataFrame({
        'ds': dates[:len(historical_data)],
        'y': historical_data[:len(dates)]
    })
    
    try:
        # Initialize and fit Prophet model
        model = Prophet(
            yearly_seasonality=True,   # Detect yearly patterns
            weekly_seasonality=True,    # Detect weekly patterns
            daily_seasonality=False,    # Usually not needed for financial data
            seasonality_mode='multiplicative'  # or 'additive'
        )
        model.fit(df)
        
        # Create future dataframe
        future_periods = (end_date - start_date).days
        future = model.make_future_dataframe(periods=future_periods)
        
        # Generate forecast
        forecast = model.predict(future)
        
        # Filter to only future dates
        forecast_future = forecast[forecast['ds'] >= start_date]
        
        forecast_data = []
        for _, row in forecast_future.iterrows():
            forecast_data.append({
                "period": row['ds'].strftime("%Y-%m"),
                "date": row['ds'].isoformat(),
                "forecasted_value": float(row['yhat']),  # Predicted value
                "method": "prophet",
                "yhat_lower": float(row['yhat_lower']),  # Lower bound
                "yhat_upper": float(row['yhat_upper'])   # Upper bound (confidence interval)
            })
        
        return forecast_data
    except Exception as e:
        logger.error(f"Prophet forecast failed: {str(e)}")
        return []
```

### Example 3: XGBoost Forecasting

```python
from xgboost import XGBRegressor
from sklearn.preprocessing import StandardScaler
import numpy as np

@staticmethod
def generate_xgboost_forecast(
    db: Session,
    forecast_type: str,
    start_date: datetime,
    end_date: datetime,
    historical_start: datetime,
    historical_end: datetime,
    user_id: Optional[int] = None,
    user_role: Optional[UserRole] = None
) -> List[Dict[str, Any]]:
    """Generate forecast using XGBoost"""
    # Get historical data
    historical_data = ForecastingService._get_historical_data(
        db, forecast_type, historical_start, historical_end, user_id, user_role
    )
    
    if len(historical_data) < 20:  # Need more data for ML
        return []
    
    try:
        # Create features (lagged values, rolling statistics)
        window_size = 3
        X = []
        y = []
        
        for i in range(window_size, len(historical_data)):
            # Features: last N values, mean, std
            features = historical_data[i-window_size:i]
            features.append(np.mean(features))
            features.append(np.std(features))
            X.append(features)
            y.append(historical_data[i])
        
        X = np.array(X)
        y = np.array(y)
        
        # Train XGBoost model
        model = XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        model.fit(X, y)
        
        # Generate forecast
        forecast_data = []
        current_features = historical_data[-window_size:]
        current_date = start_date
        
        while current_date <= end_date:
            # Prepare features for prediction
            features = list(current_features[-window_size:])
            features.append(np.mean(features))
            features.append(np.std(features))
            X_pred = np.array([features])
            
            # Predict
            prediction = model.predict(X_pred)[0]
            
            forecast_data.append({
                "period": current_date.strftime("%Y-%m"),
                "date": current_date.isoformat(),
                "forecasted_value": float(prediction),
                "method": "xgboost"
            })
            
            # Update features for next prediction
            current_features.append(prediction)
            
            # Move to next period
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return forecast_data
    except Exception as e:
        logger.error(f"XGBoost forecast failed: {str(e)}")
        return []
```

### Example 4: Ensemble Method (Combine Multiple Models)

```python
@staticmethod
def generate_ensemble_forecast(
    db: Session,
    forecast_type: str,
    start_date: datetime,
    end_date: datetime,
    historical_start: datetime,
    historical_end: datetime,
    user_id: Optional[int] = None,
    user_role: Optional[UserRole] = None,
    weights: Optional[Dict[str, float]] = None
) -> List[Dict[str, Any]]:
    """Generate forecast using ensemble of multiple methods"""
    
    # Default weights (can be adjusted based on model performance)
    if weights is None:
        weights = {
            "arima": 0.3,
            "prophet": 0.4,
            "xgboost": 0.3
        }
    
    # Get forecasts from multiple methods
    forecasts = {}
    
    try:
        forecasts["arima"] = ForecastingService.generate_arima_forecast(
            db, forecast_type, start_date, end_date, 
            historical_start, historical_end, user_id, user_role
        )
    except:
        weights["arima"] = 0
    
    try:
        forecasts["prophet"] = ForecastingService.generate_prophet_forecast(
            db, forecast_type, start_date, end_date,
            historical_start, historical_end, user_id, user_role
        )
    except:
        weights["prophet"] = 0
    
    try:
        forecasts["xgboost"] = ForecastingService.generate_xgboost_forecast(
            db, forecast_type, start_date, end_date,
            historical_start, historical_end, user_id, user_role
        )
    except:
        weights["xgboost"] = 0
    
    # Normalize weights
    total_weight = sum(weights.values())
    if total_weight > 0:
        weights = {k: v/total_weight for k, v in weights.items()}
    
    # Combine forecasts
    ensemble_data = []
    periods = sorted(set(
        item["period"] for forecast_list in forecasts.values() 
        for item in forecast_list
    ))
    
    for period in periods:
        weighted_sum = 0
        for method, forecast_list in forecasts.items():
            for item in forecast_list:
                if item["period"] == period:
                    weighted_sum += item["forecasted_value"] * weights.get(method, 0)
                    break
        
        ensemble_data.append({
            "period": period,
            "date": start_date.isoformat(),  # Adjust as needed
            "forecasted_value": weighted_sum,
            "method": "ensemble",
            "components": {method: weights.get(method, 0) for method in forecasts.keys()}
        })
    
    return ensemble_data
```

---

## 🎯 When to Use Each Method

### **ARIMA (statsmodels)**
- ✅ **Best for:** Short-term forecasts, stationary data
- ✅ **When:** You have at least 20-30 data points
- ✅ **Pros:** Interpretable, handles trends well
- ❌ **Cons:** Requires manual parameter tuning

### **Prophet (Facebook)**
- ✅ **Best for:** Business forecasting with seasonality
- ✅ **When:** You have clear seasonal patterns (monthly, quarterly)
- ✅ **Pros:** Automatic seasonality detection, handles holidays
- ❌ **Cons:** Requires more data (50+ points recommended)

### **XGBoost/LightGBM**
- ✅ **Best for:** Complex patterns, multiple features
- ✅ **When:** You have rich feature data (categories, departments, etc.)
- ✅ **Pros:** High accuracy, feature importance
- ❌ **Cons:** Requires more data, less interpretable

### **Ensemble**
- ✅ **Best for:** Maximum accuracy
- ✅ **When:** You want to combine strengths of multiple methods
- ✅ **Pros:** Most robust, reduces overfitting
- ❌ **Cons:** More complex, slower

---

## 📊 Integration with Existing API

Update your API endpoint to support new methods:

```python
# app/api/v1/budgeting.py

@router.post("/forecasts", response_model=ForecastOut)
def create_forecast(
    forecast_data: ForecastCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create forecast with AI/ML methods"""
    
    method = forecast_data.method  # "arima", "prophet", "xgboost", "ensemble"
    
    if method == "arima":
        forecast_values = ForecastingService.generate_arima_forecast(...)
    elif method == "prophet":
        forecast_values = ForecastingService.generate_prophet_forecast(...)
    elif method == "xgboost":
        forecast_values = ForecastingService.generate_xgboost_forecast(...)
    elif method == "ensemble":
        forecast_values = ForecastingService.generate_ensemble_forecast(...)
    else:
        # Fall back to existing methods
        if method == "moving_average":
            forecast_values = ForecastingService.generate_moving_average_forecast(...)
        # ... etc
```

---

## 🔧 Model Training & Persistence

For production, you'll want to:

1. **Save trained models** to avoid retraining every time:
```python
import joblib
import pickle

# Save model
joblib.dump(model, f'models/forecast_{forecast_type}_{method}.pkl')

# Load model
model = joblib.load(f'models/forecast_{forecast_type}_{method}.pkl')
```

2. **Retrain periodically** (e.g., monthly) with new data
3. **Track model performance** (MAE, RMSE, MAPE)
4. **A/B test** different models

---

## ⚠️ Important Notes

1. **Data Requirements:**
   - ARIMA: Minimum 20-30 data points
   - Prophet: Minimum 50+ data points (better with 100+)
   - XGBoost: Minimum 50+ data points (better with 200+)

2. **Performance:**
   - Prophet can be slow with large datasets
   - XGBoost is fast but requires more memory
   - ARIMA is fast but needs parameter tuning

3. **Seasonality:**
   - Prophet automatically detects seasonality
   - ARIMA requires SARIMA for seasonality
   - XGBoost needs manual feature engineering for seasonality

4. **Error Handling:**
   - Always wrap ML code in try/except
   - Fall back to simpler methods if ML fails
   - Log errors for debugging

---

## 🚀 Next Steps

1. **Install dependencies:** `pip install -r requirements.txt`
2. **Add methods to ForecastingService:** Copy examples above
3. **Update API endpoints:** Add new method options
4. **Test with your data:** Start with Prophet (easiest)
5. **Compare results:** Test different methods on same data
6. **Choose best method:** Based on accuracy and performance

---

## 📚 Resources

- **Prophet Documentation:** https://facebook.github.io/prophet/
- **statsmodels ARIMA:** https://www.statsmodels.org/stable/generated/statsmodels.tsa.arima.model.ARIMA.html
- **XGBoost Guide:** https://xgboost.readthedocs.io/
- **Time Series Forecasting:** https://otexts.com/fpp3/

---

**Ready to implement AI forecasting!** 🎉

Start with Prophet for easiest implementation, then experiment with other methods based on your data characteristics.

