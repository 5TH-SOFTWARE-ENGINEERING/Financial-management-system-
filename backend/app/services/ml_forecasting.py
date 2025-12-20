# app/services/ml_forecasting.py
"""
AI/ML Forecasting Service
Implements all AI models for forecasting: ARIMA, SARIMA, Prophet, XGBoost, LSTM, Linear Regression
"""

import os
import json
import logging
import sys
import warnings
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta, timezone
from pathlib import Path
from sqlalchemy.orm import Session  # type: ignore[import-untyped]

# Suppress pandas warnings about timezone
warnings.filterwarnings('ignore', category=UserWarning, module='pandas')

# ML Libraries
try:
    from statsmodels.tsa.arima.model import ARIMA  # type: ignore[import-untyped]
    from statsmodels.tsa.statespace.sarimax import SARIMAX  # type: ignore[import-untyped]
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False

try:
    from prophet import Prophet  # type: ignore[import-untyped]
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

try:
    from sklearn.linear_model import LinearRegression  # type: ignore[import-untyped]
    from sklearn.preprocessing import StandardScaler  # type: ignore[import-untyped]
    from sklearn.metrics import mean_absolute_error, mean_squared_error  # type: ignore[import-untyped]
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import xgboost as xgb  # type: ignore[import-untyped]
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    import tensorflow as tf  # type: ignore[import-untyped]
    from tensorflow import keras  # type: ignore[import-untyped]
    from tensorflow.keras.models import Sequential  # type: ignore[import-untyped]
    from tensorflow.keras.layers import LSTM, Dense, Dropout  # type: ignore[import-untyped]
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

try:
    from pyod.models.iforest import IForest  # type: ignore[import-untyped]
    PYOD_AVAILABLE = True
except ImportError:
    PYOD_AVAILABLE = False

from ..models.user import UserRole
from ..crud.revenue import revenue as revenue_crud
from ..crud.expense import expense as expense_crud
from ..crud.inventory import inventory as inventory_crud

logger = logging.getLogger(__name__)

# Model storage directory
MODELS_DIR = Path("models")
if not MODELS_DIR.exists():
    MODELS_DIR.mkdir(exist_ok=True)


class MLForecastingService:
    """AI/ML Forecasting Service with model training and persistence"""
    
    @staticmethod
    def _get_model_path(metric: str, model_type: str, user_id: Optional[int] = None) -> Path:
        """Get path for saved model"""
        if user_id:
            return MODELS_DIR / f"{metric}_{model_type}_user_{user_id}.pkl"
        return MODELS_DIR / f"{metric}_{model_type}.pkl"
    
    @staticmethod
    def _prepare_time_series_data(
        db: Session,
        metric: str,  # "revenue", "expense", "inventory"
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        period: str = "monthly"  # "daily", "weekly", "monthly"
    ) -> pd.DataFrame:
        """Prepare time series data as pandas DataFrame with dates"""
        data_points = []
        dates = []
        
        # Get revenue data
        if metric in ["revenue", "profit"]:
            if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
                revenues = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                for r in revenues:
                    if r.is_approved:  # Only approved entries
                        data_points.append(float(r.amount))
                        dates.append(r.date if r.date else r.created_at)
            elif user_role == UserRole.MANAGER:
                from ..crud.user import user as user_crud
                subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
                all_revenues = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                for r in all_revenues:
                    if r.created_by_id in subordinate_ids and r.is_approved:
                        data_points.append(float(r.amount))
                        dates.append(r.date if r.date else r.created_at)
            else:
                user_revenues = revenue_crud.get_by_user(db, user_id, 0, 10000)
                for r in user_revenues:
                    if start_date <= (r.date if r.date else r.created_at) <= end_date and r.is_approved:
                        data_points.append(float(r.amount))
                        dates.append(r.date if r.date else r.created_at)
        
        # Get expense data
        if metric in ["expense", "profit"]:
            expense_amounts = []
            expense_dates = []
            
            if user_role in [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN]:
                expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                for e in expenses:
                    if e.is_approved:
                        expense_amounts.append(float(e.amount))
                        expense_dates.append(e.date if e.date else e.created_at)
            elif user_role == UserRole.MANAGER:
                from ..crud.user import user as user_crud
                subordinate_ids = [sub.id for sub in user_crud.get_hierarchy(db, user_id)] + [user_id]
                all_expenses = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
                for e in all_expenses:
                    if e.created_by_id in subordinate_ids and e.is_approved:
                        expense_amounts.append(float(e.amount))
                        expense_dates.append(e.date if e.date else e.created_at)
            else:
                user_expenses = expense_crud.get_by_user(db, user_id, 0, 10000)
                for e in user_expenses:
                    if start_date <= (e.date if e.date else e.created_at) <= end_date and e.is_approved:
                        expense_amounts.append(float(e.amount))
                        expense_dates.append(e.date if e.date else e.created_at)
            
            if metric == "profit":
                # For profit, combine revenue and expenses by date
                combined = {}
                for date, amount in zip(dates, data_points):
                    key = date.strftime("%Y-%m-%d") if isinstance(date, datetime) else date
                    combined[key] = combined.get(key, 0) + amount
                for date, amount in zip(expense_dates, expense_amounts):
                    key = date.strftime("%Y-%m-%d") if isinstance(date, datetime) else date
                    combined[key] = combined.get(key, 0) - amount
                
                data_points = list(combined.values())
                dates = [datetime.fromisoformat(k) if isinstance(k, str) else k for k in combined.keys()]
            else:
                data_points.extend(expense_amounts)
                dates.extend(expense_dates)
        
        # Get inventory data
        if metric == "inventory":
            # Get inventory items and their quantities over time
            items = inventory_crud.get_multi(db, 0, 1000)
            for item in items:
                if item.is_active:
                    # Use current quantity as data point (in production, track historical quantities)
                    data_points.append(float(item.quantity))
                    dates.append(item.updated_at if item.updated_at else item.created_at)
        
        if not data_points or not dates:
            return pd.DataFrame()
        
        # Normalize dates to timezone-aware UTC
        normalized_dates = []
        for date in dates:
            if isinstance(date, datetime):
                # Convert to UTC if timezone-aware, otherwise assume UTC
                if date.tzinfo is not None:
                    normalized_dates.append(date.astimezone(timezone.utc))
                else:
                    normalized_dates.append(date.replace(tzinfo=timezone.utc))
            else:
                normalized_dates.append(date)
        
        # Create DataFrame - convert to UTC timezone-aware datetimes
        df = pd.DataFrame({
            'date': pd.to_datetime(normalized_dates, utc=True),
            'value': data_points
        })
        
        # Group by period
        if period == "daily":
            df['date_only'] = df['date'].dt.date
            df = df.groupby('date_only')['value'].sum().reset_index()
            df['date'] = pd.to_datetime(df['date_only'], utc=True)
            df = df.drop('date_only', axis=1)
        elif period == "weekly":
            df['week'] = df['date'].dt.to_period('W')
            df = df.groupby('week')['value'].sum().reset_index()
            df['date'] = pd.to_datetime(df['week'].astype(str), utc=True)
            df = df.drop('week', axis=1)
        elif period == "monthly":
            df['month'] = df['date'].dt.to_period('M')
            df = df.groupby('month')['value'].sum().reset_index()
            df['date'] = pd.to_datetime(df['month'].astype(str), utc=True)
            df = df.drop('month', axis=1)
        
        df = df.sort_values('date').reset_index(drop=True)
        return df
    
    # ============================================================================
    # EXPENSES MODELS
    # ============================================================================
    
    @staticmethod
    def train_arima_expenses(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        order: Tuple[int, int, int] = (1, 1, 1),
        save_model: bool = True
    ) -> Dict[str, Any]:
        """Train ARIMA model for expenses forecasting"""
        if not STATSMODELS_AVAILABLE:
            raise ImportError("statsmodels is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "expense", start_date, end_date, user_id, user_role, "monthly"
            )
            
            if len(df) < 10:
                raise ValueError(f"Insufficient data: need at least 10 data points, got {len(df)}")
            
            # Fit ARIMA model
            model = ARIMA(df['value'], order=order)
            fitted_model = model.fit()
            
            # Calculate metrics
            predictions = fitted_model.fittedvalues
            mae = mean_absolute_error(df['value'], predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(df['value'], predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("expense", "arima", user_id)
                joblib.dump(fitted_model, model_path)
            
            return {
                "model_type": "arima",
                "metric": "expense",
                "status": "trained",
                "order": order,
                "aic": float(fitted_model.aic),
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"ARIMA training failed: {str(e)}")
            raise
    
    @staticmethod
    def train_prophet_expenses(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        save_model: bool = True
    ) -> Dict[str, Any]:
        """Train Prophet model for expenses forecasting"""
        if not PROPHET_AVAILABLE:
            raise ImportError("prophet is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "expense", start_date, end_date, user_id, user_role, "daily"
            )
            
            if len(df) < 48:  # Allow slightly less for monthly data
                raise ValueError(f"Insufficient data: need at least 48 data points, got {len(df)}")
            
            # Prophet requires 'ds' and 'y' columns
            prophet_df = pd.DataFrame({
                'ds': df['date'],
                'y': df['value']
            })
            
            # Fit Prophet model with error handling for stan_backend issues
            # Note: Prophet has known issues on Windows/Python 3.12 with stan_backend
            try:
                model = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=True,
                    daily_seasonality=False,
                    seasonality_mode='multiplicative'
                )
                model.fit(prophet_df)
            except (AttributeError, ImportError, RuntimeError) as e:
                error_str = str(e).lower()
                if 'stan_backend' in error_str or 'cmdstanpy' in error_str or 'cmdstan' in error_str:
                    # Prophet stan_backend issue - this is a known Windows/Python 3.12 issue
                    raise ImportError(
                        "Prophet stan_backend not available. This is a known issue on Windows/Python 3.12. "
                        "Prophet requires cmdstanpy which may not be properly installed. "
                        "Try: pip install cmdstanpy or use alternative models (ARIMA, XGBoost, LSTM)."
                    )
                else:
                    raise
            
            # Generate in-sample predictions for metrics
            future = model.make_future_dataframe(periods=0)
            forecast = model.predict(future)
            
            # Calculate metrics
            predictions = forecast['yhat'].iloc[:len(prophet_df)]
            mae = mean_absolute_error(prophet_df['y'], predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(prophet_df['y'], predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("expense", "prophet", user_id)
                joblib.dump(model, model_path)
            
            return {
                "model_type": "prophet",
                "metric": "expense",
                "status": "trained",
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Prophet training failed: {str(e)}")
            raise
    
    @staticmethod
    def train_linear_regression_expenses(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        save_model: bool = True
    ) -> Dict[str, Any]:
        """Train Linear Regression model for expenses forecasting"""
        if not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "expense", start_date, end_date, user_id, user_role, "monthly"
            )
            
            if len(df) < 5:
                raise ValueError(f"Insufficient data: need at least 5 data points, got {len(df)}")
            
            # Create features (time index)
            X = np.arange(len(df)).reshape(-1, 1)
            y = df['value'].values
            
            # Train model
            model = LinearRegression()
            model.fit(X, y)
            
            # Calculate metrics
            predictions = model.predict(X)
            mae = mean_absolute_error(y, predictions)
            rmse = np.sqrt(mean_squared_error(y, predictions))
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("expense", "linear_regression", user_id)
                joblib.dump(model, model_path)
            
            return {
                "model_type": "linear_regression",
                "metric": "expense",
                "status": "trained",
                "coefficient": float(model.coef_[0]),
                "intercept": float(model.intercept_),
                "mae": float(mae),
                "rmse": float(rmse),
                "r2_score": float(model.score(X, y)),
                "data_points": len(df),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Linear Regression training failed: {str(e)}")
            raise
    
    # ============================================================================
    # REVENUE MODELS
    # ============================================================================
    
    @staticmethod
    def train_prophet_revenue(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        save_model: bool = True
    ) -> Dict[str, Any]:
        """Train Prophet model for revenue forecasting"""
        if not PROPHET_AVAILABLE:
            raise ImportError("prophet is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "revenue", start_date, end_date, user_id, user_role, "daily"
            )
            
            if len(df) < 48:  # Allow slightly less for monthly data
                raise ValueError(f"Insufficient data: need at least 48 data points, got {len(df)}")
            
            # Prophet requires 'ds' and 'y' columns
            prophet_df = pd.DataFrame({
                'ds': df['date'],
                'y': df['value']
            })
            
            # Fit Prophet model with error handling for stan_backend issues
            # Note: Prophet has known issues on Windows/Python 3.12 with stan_backend
            try:
                model = Prophet(
                    yearly_seasonality=True,
                    weekly_seasonality=True,
                    daily_seasonality=False,
                    seasonality_mode='multiplicative'
                )
                model.fit(prophet_df)
            except (AttributeError, ImportError, RuntimeError) as e:
                error_str = str(e).lower()
                if 'stan_backend' in error_str or 'cmdstanpy' in error_str or 'cmdstan' in error_str:
                    # Prophet stan_backend issue - this is a known Windows/Python 3.12 issue
                    raise ImportError(
                        "Prophet stan_backend not available. This is a known issue on Windows/Python 3.12. "
                        "Prophet requires cmdstanpy which may not be properly installed. "
                        "Try: pip install cmdstanpy or use alternative models (ARIMA, XGBoost, LSTM)."
                    )
                else:
                    raise
            
            # Generate in-sample predictions for metrics
            future = model.make_future_dataframe(periods=0)
            forecast = model.predict(future)
            
            # Calculate metrics
            predictions = forecast['yhat'].iloc[:len(prophet_df)]
            mae = mean_absolute_error(prophet_df['y'], predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(prophet_df['y'], predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("revenue", "prophet", user_id)
                joblib.dump(model, model_path)
            
            return {
                "model_type": "prophet",
                "metric": "revenue",
                "status": "trained",
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Prophet revenue training failed: {str(e)}")
            raise
    
    @staticmethod
    def train_xgboost_revenue(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        save_model: bool = True
    ) -> Dict[str, Any]:
        """Train XGBoost model for revenue forecasting"""
        if not XGBOOST_AVAILABLE:
            raise ImportError("xgboost is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "revenue", start_date, end_date, user_id, user_role, "monthly"
            )
            
            if len(df) < 20:
                raise ValueError(f"Insufficient data: need at least 20 data points, got {len(df)}")
            
            # Create features (lagged values, rolling statistics)
            window_size = 3
            X = []
            y = []
            
            for i in range(window_size, len(df)):
                features = df['value'].iloc[i-window_size:i].tolist()
                features.append(df['value'].iloc[i-window_size:i].mean())
                features.append(df['value'].iloc[i-window_size:i].std())
                # Add time features
                features.append(df['date'].iloc[i].month)
                features.append(df['date'].iloc[i].year)
                X.append(features)
                y.append(df['value'].iloc[i])
            
            X = np.array(X)
            y = np.array(y)
            
            # Train XGBoost model
            model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            )
            model.fit(X, y)
            
            # Calculate metrics
            predictions = model.predict(X)
            mae = mean_absolute_error(y, predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(y, predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("revenue", "xgboost", user_id)
                joblib.dump(model, model_path)
            
            return {
                "model_type": "xgboost",
                "metric": "revenue",
                "status": "trained",
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"XGBoost revenue training failed: {str(e)}")
            raise
    
    @staticmethod
    def train_lstm_revenue(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        save_model: bool = True,
        epochs: int = 50,
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """Train LSTM model for revenue forecasting"""
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("tensorflow is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "revenue", start_date, end_date, user_id, user_role, "monthly"
            )
            
            if len(df) < 30:
                raise ValueError(f"Insufficient data: need at least 30 data points, got {len(df)}")
            
            # Normalize data
            scaler = StandardScaler() if SKLEARN_AVAILABLE else None
            values = df['value'].values.reshape(-1, 1)
            
            if scaler:
                values_scaled = scaler.fit_transform(values)
            else:
                values_scaled = values
            
            # Create sequences for LSTM
            sequence_length = 3
            X, y = [], []
            
            for i in range(sequence_length, len(values_scaled)):
                X.append(values_scaled[i-sequence_length:i, 0])
                y.append(values_scaled[i, 0])
            
            X = np.array(X)
            y = np.array(y)
            X = X.reshape((X.shape[0], X.shape[1], 1))
            
            # Build LSTM model
            model = Sequential([
                LSTM(50, activation='relu', input_shape=(sequence_length, 1)),
                Dropout(0.2),
                Dense(1)
            ])
            model.compile(optimizer='adam', loss='mse')
            
            # Train model
            history = model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0, validation_split=0.2)
            
            # Calculate metrics
            predictions_scaled = model.predict(X, verbose=0)
            if scaler:
                predictions = scaler.inverse_transform(predictions_scaled)
                y_actual = scaler.inverse_transform(y.reshape(-1, 1))
            else:
                predictions = predictions_scaled
                y_actual = y.reshape(-1, 1)
            
            mae = mean_absolute_error(y_actual, predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(y_actual, predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model and scaler
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("revenue", "lstm", user_id)
                model.save(str(model_path))
                if scaler:
                    scaler_path = model_path.with_suffix('.scaler.pkl')
                    joblib.dump(scaler, scaler_path)
            
            return {
                "model_type": "lstm",
                "metric": "revenue",
                "status": "trained",
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "epochs": epochs,
                "final_loss": float(history.history['loss'][-1]),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"LSTM revenue training failed: {str(e)}")
            raise
    
    # ============================================================================
    # INVENTORY MODELS
    # ============================================================================
    
    @staticmethod
    def train_sarima_inventory(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        order: Tuple[int, int, int] = (1, 1, 1),
        seasonal_order: Tuple[int, int, int, int] = (1, 1, 1, 12),
        save_model: bool = True
    ) -> Dict[str, Any]:
        """Train SARIMA model for inventory forecasting"""
        if not STATSMODELS_AVAILABLE:
            raise ImportError("statsmodels is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "inventory", start_date, end_date, user_id, user_role, "monthly"
            )
            
            if len(df) < 24:  # Need at least 2 years for seasonality
                raise ValueError(f"Insufficient data: need at least 24 data points, got {len(df)}")
            
            # Fit SARIMA model
            model = SARIMAX(df['value'], order=order, seasonal_order=seasonal_order)
            fitted_model = model.fit(disp=False)
            
            # Calculate metrics
            predictions = fitted_model.fittedvalues
            mae = mean_absolute_error(df['value'], predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(df['value'], predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("inventory", "sarima", user_id)
                joblib.dump(fitted_model, model_path)
            
            return {
                "model_type": "sarima",
                "metric": "inventory",
                "status": "trained",
                "order": order,
                "seasonal_order": seasonal_order,
                "aic": float(fitted_model.aic),
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"SARIMA training failed: {str(e)}")
            raise
    
    @staticmethod
    def train_xgboost_inventory(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        save_model: bool = True
    ) -> Dict[str, Any]:
        """Train XGBoost model for inventory forecasting"""
        if not XGBOOST_AVAILABLE:
            raise ImportError("xgboost is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "inventory", start_date, end_date, user_id, user_role, "monthly"
            )
            
            if len(df) < 20:
                raise ValueError(f"Insufficient data: need at least 20 data points, got {len(df)}")
            
            # Create features
            window_size = 3
            X = []
            y = []
            
            for i in range(window_size, len(df)):
                features = df['value'].iloc[i-window_size:i].tolist()
                features.append(df['value'].iloc[i-window_size:i].mean())
                features.append(df['value'].iloc[i-window_size:i].std())
                features.append(df['date'].iloc[i].month)
                features.append(df['date'].iloc[i].year)
                X.append(features)
                y.append(df['value'].iloc[i])
            
            X = np.array(X)
            y = np.array(y)
            
            # Train XGBoost model
            model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            )
            model.fit(X, y)
            
            # Calculate metrics
            predictions = model.predict(X)
            mae = mean_absolute_error(y, predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(y, predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("inventory", "xgboost", user_id)
                joblib.dump(model, model_path)
            
            return {
                "model_type": "xgboost",
                "metric": "inventory",
                "status": "trained",
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"XGBoost inventory training failed: {str(e)}")
            raise
    
    @staticmethod
    def train_lstm_inventory(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None,
        save_model: bool = True,
        epochs: int = 50,
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """Train LSTM model for inventory forecasting"""
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("tensorflow is not installed")
        
        try:
            # Prepare data
            df = MLForecastingService._prepare_time_series_data(
                db, "inventory", start_date, end_date, user_id, user_role, "monthly"
            )
            
            if len(df) < 30:
                raise ValueError(f"Insufficient data: need at least 30 data points, got {len(df)}")
            
            # Normalize data
            scaler = StandardScaler() if SKLEARN_AVAILABLE else None
            values = df['value'].values.reshape(-1, 1)
            
            if scaler:
                values_scaled = scaler.fit_transform(values)
            else:
                values_scaled = values
            
            # Create sequences for LSTM
            sequence_length = 3
            X, y = [], []
            
            for i in range(sequence_length, len(values_scaled)):
                X.append(values_scaled[i-sequence_length:i, 0])
                y.append(values_scaled[i, 0])
            
            X = np.array(X)
            y = np.array(y)
            X = X.reshape((X.shape[0], X.shape[1], 1))
            
            # Build LSTM model
            model = Sequential([
                LSTM(50, activation='relu', input_shape=(sequence_length, 1)),
                Dropout(0.2),
                Dense(1)
            ])
            model.compile(optimizer='adam', loss='mse')
            
            # Train model
            history = model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0, validation_split=0.2)
            
            # Calculate metrics
            predictions_scaled = model.predict(X, verbose=0)
            if scaler:
                predictions = scaler.inverse_transform(predictions_scaled)
                y_actual = scaler.inverse_transform(y.reshape(-1, 1))
            else:
                predictions = predictions_scaled
                y_actual = y.reshape(-1, 1)
            
            mae = mean_absolute_error(y_actual, predictions) if SKLEARN_AVAILABLE else None
            rmse = np.sqrt(mean_squared_error(y_actual, predictions)) if SKLEARN_AVAILABLE else None
            
            # Save model and scaler
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("inventory", "lstm", user_id)
                model.save(str(model_path))
                if scaler:
                    scaler_path = model_path.with_suffix('.scaler.pkl')
                    joblib.dump(scaler, scaler_path)
            
            return {
                "model_type": "lstm",
                "metric": "inventory",
                "status": "trained",
                "mae": float(mae) if mae else None,
                "rmse": float(rmse) if rmse else None,
                "data_points": len(df),
                "epochs": epochs,
                "final_loss": float(history.history['loss'][-1]),
                "model_path": str(model_path) if model_path else None,
                "trained_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"LSTM inventory training failed: {str(e)}")
            raise
    
    # ============================================================================
    # BATCH TRAINING
    # ============================================================================
    
    @staticmethod
    def train_all_models(
        db: Session,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        user_role: Optional[UserRole] = None
    ) -> Dict[str, Any]:
        """Train all models for all metrics"""
        results = {
            "expenses": {},
            "revenue": {},
            "inventory": {},
            "errors": []
        }
        
        # Train Expenses Models
        try:
            results["expenses"]["arima"] = MLForecastingService.train_arima_expenses(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Expenses ARIMA: {error_msg}")
            # Only log non-data-errors with full traceback
            if "Insufficient data" not in error_msg:
                logger.error(f"Expenses ARIMA training error: {error_msg}", exc_info=True)
        
        try:
            results["expenses"]["prophet"] = MLForecastingService.train_prophet_expenses(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Expenses Prophet: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Expenses Prophet training error: {error_msg}", exc_info=True)
        
        try:
            results["expenses"]["linear_regression"] = MLForecastingService.train_linear_regression_expenses(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Expenses Linear Regression: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Expenses Linear Regression training error: {error_msg}", exc_info=True)
        
        # Train Revenue Models
        try:
            results["revenue"]["prophet"] = MLForecastingService.train_prophet_revenue(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Revenue Prophet: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Revenue Prophet training error: {error_msg}", exc_info=True)
        
        try:
            results["revenue"]["xgboost"] = MLForecastingService.train_xgboost_revenue(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Revenue XGBoost: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Revenue XGBoost training error: {error_msg}", exc_info=True)
        
        try:
            results["revenue"]["lstm"] = MLForecastingService.train_lstm_revenue(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Revenue LSTM: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Revenue LSTM training error: {error_msg}", exc_info=True)
        
        # Train Inventory Models
        try:
            results["inventory"]["sarima"] = MLForecastingService.train_sarima_inventory(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Inventory SARIMA: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Inventory SARIMA training error: {error_msg}", exc_info=True)
        
        try:
            results["inventory"]["xgboost"] = MLForecastingService.train_xgboost_inventory(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Inventory XGBoost: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Inventory XGBoost training error: {error_msg}", exc_info=True)
        
        try:
            results["inventory"]["lstm"] = MLForecastingService.train_lstm_inventory(
                db, start_date, end_date, user_id, user_role
            )
        except Exception as e:
            error_msg = str(e)
            results["errors"].append(f"Inventory LSTM: {error_msg}")
            if "Insufficient data" not in error_msg:
                logger.error(f"Inventory LSTM training error: {error_msg}", exc_info=True)
        
        results["trained_at"] = datetime.now(timezone.utc).isoformat()
        return results
    
    # ============================================================================
    # FORECAST GENERATION (Using Trained Models)
    # ============================================================================
    
    @staticmethod
    def generate_forecast_with_trained_model(
        metric: str,  # "revenue", "expense", "inventory"
        model_type: str,  # "arima", "sarima", "prophet", "xgboost", "lstm", "linear_regression"
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None,
        periods: int = 12
    ) -> List[Dict[str, Any]]:
        """Generate forecast using a trained model"""
        model_path = MLForecastingService._get_model_path(metric, model_type, user_id)
        
        if not model_path.exists():
            raise FileNotFoundError(f"Trained model not found: {model_path}")
        
        try:
            if model_type in ["arima", "sarima"]:
                model = joblib.load(model_path)
                forecast_result = model.forecast(steps=periods)
                forecast_data = []
                current_date = start_date
                
                for i, value in enumerate(forecast_result):
                    forecast_data.append({
                        "period": current_date.strftime("%Y-%m"),
                        "date": current_date.isoformat(),
                        "forecasted_value": float(value),
                        "method": model_type,
                        "confidence_interval": None  # ARIMA doesn't provide CI by default
                    })
                    
                    if current_date.month == 12:
                        current_date = current_date.replace(year=current_date.year + 1, month=1)
                    else:
                        current_date = current_date.replace(month=current_date.month + 1)
                
                return forecast_data
            
            elif model_type == "prophet":
                model = joblib.load(model_path)
                future = model.make_future_dataframe(periods=periods)
                forecast = model.predict(future)
                
                # Filter to only future dates
                forecast_future = forecast[forecast['ds'] >= start_date]
                forecast_future = forecast_future[forecast_future['ds'] <= end_date]
                
                forecast_data = []
                for _, row in forecast_future.iterrows():
                    forecast_data.append({
                        "period": row['ds'].strftime("%Y-%m"),
                        "date": row['ds'].isoformat(),
                        "forecasted_value": float(row['yhat']),
                        "method": "prophet",
                        "yhat_lower": float(row['yhat_lower']),
                        "yhat_upper": float(row['yhat_upper'])
                    })
                
                return forecast_data
            
            elif model_type == "xgboost":
                # XGBoost requires historical data to create features
                # This is a simplified version - in production, you'd need to pass historical data
                model = joblib.load(model_path)
                # Note: XGBoost forecast generation needs feature engineering
                # This would require historical data context
                raise NotImplementedError("XGBoost forecast generation requires historical data context")
            
            elif model_type == "lstm":
                # LSTM requires historical data to create sequences
                model = keras.models.load_model(str(model_path))
                scaler_path = model_path.with_suffix('.scaler.pkl')
                
                if scaler_path.exists():
                    scaler = joblib.load(scaler_path)
                else:
                    scaler = None
                
                # Note: LSTM forecast generation needs historical data context
                raise NotImplementedError("LSTM forecast generation requires historical data context")
            
            elif model_type == "linear_regression":
                model = joblib.load(model_path)
                # Linear regression needs time index
                # This is a simplified version
                forecast_data = []
                current_date = start_date
                time_index = 0  # Would need to be calculated from historical data
                
                for i in range(periods):
                    prediction = model.predict([[time_index + i]])[0]
                    forecast_data.append({
                        "period": current_date.strftime("%Y-%m"),
                        "date": current_date.isoformat(),
                        "forecasted_value": float(prediction),
                        "method": "linear_regression"
                    })
                    
                    if current_date.month == 12:
                        current_date = current_date.replace(year=current_date.year + 1, month=1)
                    else:
                        current_date = current_date.replace(month=current_date.month + 1)
                
                return forecast_data
            
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
        
        except Exception as e:
            logger.error(f"Forecast generation failed: {str(e)}", exc_info=True)
            raise

