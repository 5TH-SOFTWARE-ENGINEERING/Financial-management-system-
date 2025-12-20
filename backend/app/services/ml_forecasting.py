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
from ..crud.sale import sale as sale_crud

logger = logging.getLogger(__name__)

# Import advanced training modules
try:
    from .ml_advanced_training import (
        AdvancedEvaluationMetrics,
        TimeSeriesCrossValidator,
        HyperparameterOptimizer,
        AdvancedDataPreprocessor,
        ModelVersionManager,
        TrainingMonitor,
        create_advanced_callbacks
    )
    ADVANCED_TRAINING_AVAILABLE = True
except ImportError as e:
    ADVANCED_TRAINING_AVAILABLE = False
    logger.warning(f"Advanced training modules not available: {e}. Using basic training.")

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
            # Use sales data to create a time series of total inventory value
            # Work backwards from current inventory to reconstruct monthly values
            try:
                # Get all inventory items to calculate current inventory value
                items = inventory_crud.get_multi(db, 0, 1000)
                current_inventory_value = sum(
                    float(item.quantity) * float(item.selling_price) 
                    for item in items 
                    if item.is_active
                )
                
                # Get all sales in the date range (including up to end_date)
                all_sales = sale_crud.get_multi(
                    db, 
                    skip=0, 
                    limit=10000,
                    start_date=start_date,
                    end_date=end_date
                )
                
                # Group sales by month
                monthly_sales = {}
                for sale in all_sales:
                    if sale.created_at:
                        sale_date = sale.created_at.replace(tzinfo=timezone.utc) if sale.created_at.tzinfo is None else sale.created_at
                        month_key = sale_date.strftime('%Y-%m')
                        if month_key not in monthly_sales:
                            monthly_sales[month_key] = 0.0
                        # Add back the sold value (working backwards)
                        monthly_sales[month_key] += float(sale.quantity_sold) * float(sale.selling_price)
                
                # Build monthly inventory value time series (working backwards from current)
                monthly_data = {}
                current_date = end_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                running_value = current_inventory_value
                
                # Work backwards month by month, adding sales to reconstruct historical inventory
                months_to_process = []
                check_date = current_date
                while check_date >= start_date.replace(day=1):
                    months_to_process.append(check_date)
                    if check_date.month == 1:
                        check_date = check_date.replace(year=check_date.year - 1, month=12)
                    else:
                        check_date = check_date.replace(month=check_date.month - 1)
                
                # Process months in forward chronological order
                for month_date in sorted(months_to_process):
                    month_key = month_date.strftime('%Y-%m')
                    # Add back sales from this month to get inventory value at start of month
                    if month_key in monthly_sales:
                        running_value += monthly_sales[month_key]
                    
                    monthly_data[month_key] = {
                        'date': month_date,
                        'total_value': running_value
                    }
                
                # Convert to data_points and dates in chronological order
                for month_key in sorted(monthly_data.keys()):
                    month_data = monthly_data[month_key]
                    data_points.append(max(0, month_data['total_value']))  # Ensure non-negative
                    dates.append(month_data['date'])
                    
                # If we don't have enough data points, supplement with current inventory
                if len(data_points) < 12:
                    # Add additional months with estimated values
                    logger.warning(f"Insufficient inventory time series data: {len(data_points)} months. Supplementing with current inventory value.")
                    if len(data_points) == 0:
                        # No sales data, use current inventory value for each month
                        current_date = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                        while current_date <= end_date:
                            data_points.append(current_inventory_value)
                            dates.append(current_date)
                            if current_date.month == 12:
                                current_date = current_date.replace(year=current_date.year + 1, month=1)
                            else:
                                current_date = current_date.replace(month=current_date.month + 1)
                    
            except Exception as e:
                logger.warning(f"Failed to prepare inventory time series from sales data: {e}")
                # Fallback: Create time series using current inventory value distributed over months
                items = inventory_crud.get_multi(db, 0, 1000)
                current_inventory_value = sum(
                    float(item.quantity) * float(item.selling_price) 
                    for item in items 
                    if item.is_active
                )
                
                # Create monthly data points with current inventory value
                current_date = start_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                while current_date <= end_date:
                    data_points.append(current_inventory_value)
                    dates.append(current_date)
                    if current_date.month == 12:
                        current_date = current_date.replace(year=current_date.year + 1, month=1)
                    else:
                        current_date = current_date.replace(month=current_date.month + 1)
        
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
            
            # Advanced preprocessing: outlier detection
            if ADVANCED_TRAINING_AVAILABLE and len(df) > 20:
                original_len = len(df)
                df = AdvancedDataPreprocessor.detect_outliers(df, method="iqr")
                logger.debug(f"Removed {original_len - len(df)} outliers from ARIMA training data")
            
            # Hyperparameter optimization if order not specified
            if order is None and ADVANCED_TRAINING_AVAILABLE:
                logger.info("Optimizing ARIMA hyperparameters...")
                best_order, best_aic = HyperparameterOptimizer.optimize_arima_parameters(
                    df['value'],
                    p_range=[0, 1, 2],
                    d_range=[0, 1, 2],
                    q_range=[0, 1, 2],
                    max_eval=15
                )
                order = best_order
                logger.info(f"Optimized ARIMA order: {order}, AIC: {best_aic}")
            elif order is None:
                order = (1, 1, 1)
            
            # Fit ARIMA model
            model = ARIMA(df['value'], order=order)
            fitted_model = model.fit()
            
            # Calculate metrics (use advanced metrics if available)
            predictions = fitted_model.fittedvalues
            if ADVANCED_TRAINING_AVAILABLE:
                all_metrics = AdvancedEvaluationMetrics.calculate_all_metrics(
                    df['value'].values, predictions.values
                )
                mae = all_metrics.get('mae')
                rmse = all_metrics.get('rmse')
            else:
                mae = mean_absolute_error(df['value'], predictions) if SKLEARN_AVAILABLE else None
                rmse = np.sqrt(mean_squared_error(df['value'], predictions)) if SKLEARN_AVAILABLE else None
                all_metrics = {'mae': mae, 'rmse': rmse}
            
            # Save model
            model_path = None
            if save_model:
                model_path = MLForecastingService._get_model_path("expense", "arima", user_id)
                joblib.dump(fitted_model, model_path)
                
                # Save metadata with advanced metrics
                if ADVANCED_TRAINING_AVAILABLE:
                    metadata = {
                        "model_type": "arima",
                        "metric": "expense",
                        "order": order,
                        "metrics": all_metrics,
                        "data_points": len(df),
                        "trained_at": datetime.now(timezone.utc).isoformat()
                    }
                    ModelVersionManager.save_model_metadata(model_path, metadata)
            
            result = {
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
            
            # Add advanced metrics if available
            if ADVANCED_TRAINING_AVAILABLE:
                result.update({f"metric_{k}": v for k, v in all_metrics.items() if k not in ['mae', 'rmse']})
            
            return result
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
            
            if len(df) < 36:  # Reduced for monthly data (Prophet can work with less)
                raise ValueError(f"Insufficient data: need at least 36 data points, got {len(df)}")
            
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
            except (AttributeError, ImportError, RuntimeError, Exception) as e:
                error_str = str(e).lower()
                if 'stan_backend' in error_str or 'cmdstanpy' in error_str or 'cmdstan' in error_str:
                    # Prophet stan_backend issue - this is a known Windows/Python 3.12 issue
                    raise ImportError(
                        "Prophet stan_backend not available. This is a known issue on Windows/Python 3.12. "
                        "Prophet requires cmdstanpy which may not be properly installed. "
                        "Try: pip install cmdstanpy or use alternative models (ARIMA, XGBoost, LSTM)."
                    )
                elif 'no module named' in error_str or 'cannot import' in error_str:
                    raise ImportError(f"Prophet dependency error: {str(e)}. Please check Prophet installation.")
                else:
                    # Re-raise with more context
                    raise RuntimeError(f"Prophet model fitting failed: {str(e)}. This may be due to insufficient data or Prophet installation issues.")
            
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
        except (ImportError, ValueError, RuntimeError) as e:
            # Re-raise known exceptions with their original messages
            logger.error(f"Prophet training failed: {str(e)}")
            raise
        except Exception as e:
            # Catch any other unexpected exceptions and wrap them
            error_msg = str(e)
            logger.error(f"Prophet training failed with unexpected error: {error_msg}", exc_info=True)
            # Provide helpful error message
            if 'stan' in error_msg.lower() or 'cmdstan' in error_msg.lower():
                raise ImportError(
                    "Prophet stan_backend error. This is a known issue on Windows/Python 3.12. "
                    "Try using alternative models (ARIMA, XGBoost, LSTM) instead."
                )
            raise RuntimeError(f"Prophet training failed: {error_msg}")
    
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
            
            if len(df) < 36:  # Reduced for monthly data (Prophet can work with less)
                raise ValueError(f"Insufficient data: need at least 36 data points, got {len(df)}")
            
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
            except (AttributeError, ImportError, RuntimeError, Exception) as e:
                error_str = str(e).lower()
                if 'stan_backend' in error_str or 'cmdstanpy' in error_str or 'cmdstan' in error_str:
                    # Prophet stan_backend issue - this is a known Windows/Python 3.12 issue
                    raise ImportError(
                        "Prophet stan_backend not available. This is a known issue on Windows/Python 3.12. "
                        "Prophet requires cmdstanpy which may not be properly installed. "
                        "Try: pip install cmdstanpy or use alternative models (ARIMA, XGBoost, LSTM)."
                    )
                elif 'no module named' in error_str or 'cannot import' in error_str:
                    raise ImportError(f"Prophet dependency error: {str(e)}. Please check Prophet installation.")
                else:
                    # Re-raise with more context
                    raise RuntimeError(f"Prophet model fitting failed: {str(e)}. This may be due to insufficient data or Prophet installation issues.")
            
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
        except (ImportError, ValueError, RuntimeError) as e:
            # Re-raise known exceptions with their original messages
            logger.error(f"Prophet revenue training failed: {str(e)}")
            raise
        except Exception as e:
            # Catch any other unexpected exceptions and wrap them
            error_msg = str(e)
            logger.error(f"Prophet revenue training failed with unexpected error: {error_msg}", exc_info=True)
            # Provide helpful error message
            if 'stan' in error_msg.lower() or 'cmdstan' in error_msg.lower():
                raise ImportError(
                    "Prophet stan_backend error. This is a known issue on Windows/Python 3.12. "
                    "Try using alternative models (ARIMA, XGBoost, LSTM) instead."
                )
            raise RuntimeError(f"Prophet revenue training failed: {error_msg}")
    
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
            
            if len(df) < 12:  # Reduced for monthly data (was 20)
                raise ValueError(f"Insufficient data: need at least 12 data points, got {len(df)}")
            
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
            
            if len(df) < 12:  # Reduced for monthly data (was 30)
                raise ValueError(f"Insufficient data: need at least 12 data points, got {len(df)}")
            
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
            
            # Calculate advanced metrics (must be before metadata saving)
            if ADVANCED_TRAINING_AVAILABLE:
                all_metrics = AdvancedEvaluationMetrics.calculate_all_metrics(
                    y_actual.flatten(), predictions.flatten()
                )
                mae = all_metrics.get('mae')
                rmse = all_metrics.get('rmse')
            else:
                mae = mean_absolute_error(y_actual, predictions) if SKLEARN_AVAILABLE else None
                rmse = np.sqrt(mean_squared_error(y_actual, predictions)) if SKLEARN_AVAILABLE else None
                all_metrics = {'mae': mae, 'rmse': rmse}
            
            # Save model and scaler (Keras 3.x requires .keras extension)
            model_path = None
            if save_model:
                base_path = MLForecastingService._get_model_path("revenue", "lstm", user_id)
                # Change extension to .keras for Keras 3.x compatibility
                model_path = Path(str(base_path).replace('.pkl', '.keras'))
                model.save(str(model_path))
                if scaler:
                    scaler_path = base_path.with_suffix('.scaler.pkl')
                    joblib.dump(scaler, scaler_path)
                
                # Save metadata with advanced metrics
                if ADVANCED_TRAINING_AVAILABLE and 'all_metrics' in locals():
                    metadata = {
                        "model_type": "lstm",
                        "metric": "revenue",
                        "metrics": all_metrics,
                        "data_points": len(df),
                        "epochs": epochs,
                        "final_loss": float(history.history['loss'][-1]),
                        "final_val_loss": float(history.history.get('val_loss', [0])[-1]) if 'val_loss' in history.history else None,
                        "training_history": {
                            "loss": [float(x) for x in history.history['loss']],
                            "val_loss": [float(x) for x in history.history.get('val_loss', [])],
                            "mae": [float(x) for x in history.history.get('mae', [])],
                            "val_mae": [float(x) for x in history.history.get('val_mae', [])]
                        },
                        "trained_at": datetime.now(timezone.utc).isoformat()
                    }
                    ModelVersionManager.save_model_metadata(model_path, metadata)
            
            result = {
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
            
            # Add advanced metrics
            if ADVANCED_TRAINING_AVAILABLE:
                result.update({f"metric_{k}": v for k, v in all_metrics.items() if k not in ['mae', 'rmse']})
                if 'val_loss' in history.history:
                    result["final_val_loss"] = float(history.history['val_loss'][-1])
            
            return result
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
            
            if len(df) < 12:  # Reduced for monthly data (was 20)
                raise ValueError(f"Insufficient data: need at least 12 data points, got {len(df)}")
            
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
            
            if len(df) < 12:  # Reduced for monthly data (was 30)
                raise ValueError(f"Insufficient data: need at least 12 data points, got {len(df)}")
            
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
            
            # Calculate advanced metrics (must be before metadata saving)
            if ADVANCED_TRAINING_AVAILABLE:
                all_metrics = AdvancedEvaluationMetrics.calculate_all_metrics(
                    y_actual.flatten(), predictions.flatten()
                )
                mae = all_metrics.get('mae')
                rmse = all_metrics.get('rmse')
            else:
                mae = mean_absolute_error(y_actual, predictions) if SKLEARN_AVAILABLE else None
                rmse = np.sqrt(mean_squared_error(y_actual, predictions)) if SKLEARN_AVAILABLE else None
                all_metrics = {'mae': mae, 'rmse': rmse}
            
            # Save model and scaler (Keras 3.x requires .keras extension)
            model_path = None
            if save_model:
                base_path = MLForecastingService._get_model_path("inventory", "lstm", user_id)
                # Change extension to .keras for Keras 3.x compatibility
                model_path = Path(str(base_path).replace('.pkl', '.keras'))
                model.save(str(model_path))
                if scaler:
                    scaler_path = base_path.with_suffix('.scaler.pkl')
                    joblib.dump(scaler, scaler_path)
                
                # Save metadata with advanced metrics
                if ADVANCED_TRAINING_AVAILABLE and 'all_metrics' in locals():
                    metadata = {
                        "model_type": "lstm",
                        "metric": "inventory",
                        "metrics": all_metrics,
                        "data_points": len(df),
                        "epochs": epochs,
                        "final_loss": float(history.history['loss'][-1]),
                        "final_val_loss": float(history.history.get('val_loss', [0])[-1]) if 'val_loss' in history.history else None,
                        "training_history": {
                            "loss": [float(x) for x in history.history['loss']],
                            "val_loss": [float(x) for x in history.history.get('val_loss', [])],
                            "mae": [float(x) for x in history.history.get('mae', [])],
                            "val_mae": [float(x) for x in history.history.get('val_mae', [])]
                        },
                        "trained_at": datetime.now(timezone.utc).isoformat()
                    }
                    ModelVersionManager.save_model_metadata(model_path, metadata)
            
            result = {
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
            # Don't show traceback for known Prophet issues or insufficient data
            if "Insufficient data" not in error_msg and "Prophet stan_backend" not in error_msg and "cmdstanpy" not in error_msg:
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
            # Don't show traceback for known Prophet issues or insufficient data
            if "Insufficient data" not in error_msg and "Prophet stan_backend" not in error_msg and "cmdstanpy" not in error_msg:
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
        periods: int = 12,
        db: Optional[Session] = None,
        user_role: Optional[UserRole] = None
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
                if not XGBOOST_AVAILABLE:
                    raise ImportError("xgboost is not installed")
                if db is None:
                    raise ValueError("Database session required for XGBoost forecast generation")
                
                # Load model
                model = joblib.load(model_path)
                
                # Fetch historical data to create features (need window_size + 1 months)
                window_size = 3
                historical_end = start_date - timedelta(days=1)
                historical_start = historical_end - timedelta(days=365)  # Get ~12 months of history
                
                df = MLForecastingService._prepare_time_series_data(
                    db, metric, historical_start, historical_end, user_id, user_role, "monthly"
                )
                
                if len(df) < window_size:
                    raise ValueError(f"Insufficient historical data for XGBoost: need at least {window_size} data points, got {len(df)}")
                
                # Use last window_size values as starting point
                last_values = df['value'].iloc[-window_size:].tolist()
                last_dates = df['date'].iloc[-window_size:].tolist()
                
                # Generate forecast
                forecast_data = []
                current_date = start_date
                prediction_index = 0
                
                while current_date <= end_date and prediction_index < periods:
                    # Create features from last window_size values (same as training)
                    features = last_values[-window_size:].copy()
                    features.append(np.mean(features))
                    features.append(np.std(features) if len(features) > 1 else 0.0)
                    features.append(current_date.month)
                    features.append(current_date.year)
                    
                    # Predict next value
                    prediction = model.predict([features])[0]
                    
                    forecast_data.append({
                        "period": current_date.strftime("%Y-%m"),
                        "date": current_date.isoformat(),
                        "forecasted_value": float(prediction),
                        "method": "xgboost"
                    })
                    
                    # Update last_values for next iteration (rolling window)
                    last_values.append(float(prediction))
                    if len(last_values) > window_size:
                        last_values.pop(0)
                    
                    # Move to next month
                    if current_date.month == 12:
                        current_date = current_date.replace(year=current_date.year + 1, month=1)
                    else:
                        current_date = current_date.replace(month=current_date.month + 1)
                    prediction_index += 1
                
                return forecast_data
            
            elif model_type == "lstm":
                if not TENSORFLOW_AVAILABLE:
                    raise ImportError("tensorflow is not installed")
                if db is None:
                    raise ValueError("Database session required for LSTM forecast generation")
                
                # Load model and scaler
                model = keras.models.load_model(str(model_path))
                scaler_path = model_path.with_suffix('.scaler.pkl')
                
                if scaler_path.exists():
                    scaler = joblib.load(scaler_path)
                else:
                    scaler = None
                
                # Fetch historical data to create sequences
                sequence_length = 3
                historical_end = start_date - timedelta(days=1)
                historical_start = historical_end - timedelta(days=365)  # Get ~12 months of history
                
                df = MLForecastingService._prepare_time_series_data(
                    db, metric, historical_start, historical_end, user_id, user_role, "monthly"
                )
                
                if len(df) < sequence_length:
                    raise ValueError(f"Insufficient historical data for LSTM: need at least {sequence_length} data points, got {len(df)}")
                
                # Use last sequence_length values as starting sequence
                last_sequence = df['value'].iloc[-sequence_length:].values.reshape(-1, 1)
                
                # Normalize if scaler was used
                if scaler:
                    last_sequence_scaled = scaler.transform(last_sequence)
                else:
                    last_sequence_scaled = last_sequence
                
                # Generate forecast
                forecast_data = []
                current_date = start_date
                prediction_index = 0
                current_sequence = last_sequence_scaled.copy()
                
                while current_date <= end_date and prediction_index < periods:
                    # Reshape for LSTM input: (1, sequence_length, 1)
                    sequence_input = current_sequence.reshape(1, sequence_length, 1)
                    
                    # Predict next value
                    prediction_scaled = model.predict(sequence_input, verbose=0)[0, 0]
                    
                    # Denormalize if scaler was used
                    if scaler:
                        prediction = scaler.inverse_transform([[prediction_scaled]])[0, 0]
                    else:
                        prediction = prediction_scaled
                    
                    forecast_data.append({
                        "period": current_date.strftime("%Y-%m"),
                        "date": current_date.isoformat(),
                        "forecasted_value": float(prediction),
                        "method": "lstm"
                    })
                    
                    # Update sequence for next iteration (rolling window)
                    current_sequence = np.append(current_sequence[1:], [[prediction_scaled]], axis=0)
                    
                    # Move to next month
                    if current_date.month == 12:
                        current_date = current_date.replace(year=current_date.year + 1, month=1)
                    else:
                        current_date = current_date.replace(month=current_date.month + 1)
                    prediction_index += 1
                
                return forecast_data
            
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
    
    # ============================================================================
    # CUSTOM DATA TRAINING (Train from user-provided data)
    # ============================================================================
    
    @staticmethod
    def train_from_custom_data(
        data_points: List[Dict[str, Any]],  # List of {"date": str, "value": float}
        model_type: str,
        metric_name: str,
        period: str = "monthly",
        user_id: Optional[int] = None,
        arima_order: Optional[Tuple[int, int, int]] = None,
        sarima_order: Optional[Tuple[int, int, int]] = None,
        sarima_seasonal_order: Optional[Tuple[int, int, int, int]] = None,
        epochs: int = 50,
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """
        Train a model from user-provided custom data
        
        Args:
            data_points: List of dictionaries with "date" (ISO format string) and "value" (float)
            model_type: One of "arima", "sarima", "prophet", "xgboost", "lstm", "linear_regression"
            metric_name: User-defined name for the metric (used for model file naming)
            period: Aggregation period ("daily", "weekly", "monthly")
            user_id: Optional user ID for personal models
            arima_order: Optional ARIMA order tuple (p, d, q)
            sarima_order: Optional SARIMA order tuple (p, d, q)
            sarima_seasonal_order: Optional SARIMA seasonal order tuple (P, D, Q, s)
            epochs: Number of epochs for LSTM
            batch_size: Batch size for LSTM
        
        Returns:
            Dictionary with training results
        """
        try:
            # Convert data points to DataFrame
            dates = []
            values = []
            
            for point in data_points:
                date_str = point.get("date") or point.get("Date") or point.get("ds")
                value = point.get("value") or point.get("Value") or point.get("y")
                
                if not date_str or value is None:
                    continue
                
                # Parse date
                try:
                    date = pd.to_datetime(date_str, utc=True)
                except:
                    try:
                        date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        if date.tzinfo is None:
                            date = date.replace(tzinfo=timezone.utc)
                    except:
                        logger.warning(f"Could not parse date: {date_str}")
                        continue
                
                dates.append(date)
                values.append(float(value))
            
            if len(dates) < 3:
                raise ValueError(f"Insufficient data: need at least 3 data points, got {len(dates)}")
            
            # Create DataFrame
            df = pd.DataFrame({
                'date': pd.to_datetime(dates, utc=True),
                'value': values
            }).sort_values('date').reset_index(drop=True)
            
            # Aggregate by period if needed
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
            
            # Train based on model type
            if model_type == "arima":
                return MLForecastingService._train_arima_from_df(
                    df, metric_name, user_id, arima_order or (1, 1, 1)
                )
            elif model_type == "sarima":
                return MLForecastingService._train_sarima_from_df(
                    df, metric_name, user_id, 
                    sarima_order or (1, 1, 1),
                    sarima_seasonal_order or (1, 1, 1, 12)
                )
            elif model_type == "prophet":
                return MLForecastingService._train_prophet_from_df(
                    df, metric_name, user_id
                )
            elif model_type == "xgboost":
                return MLForecastingService._train_xgboost_from_df(
                    df, metric_name, user_id
                )
            elif model_type == "lstm":
                return MLForecastingService._train_lstm_from_df(
                    df, metric_name, user_id, epochs, batch_size
                )
            elif model_type == "linear_regression":
                return MLForecastingService._train_linear_regression_from_df(
                    df, metric_name, user_id
                )
            else:
                raise ValueError(f"Unsupported model type: {model_type}")
                
        except Exception as e:
            logger.error(f"Custom data training failed: {str(e)}", exc_info=True)
            raise
    
    @staticmethod
    def train_and_forecast_from_custom_data(
        data_points: List[Dict[str, Any]],  # List of {"date": str, "value": float}
        model_type: str,
        metric_name: str,
        forecast_start_date: datetime,
        forecast_end_date: datetime,
        period: str = "monthly",
        user_id: Optional[int] = None,
        save_model: bool = False,
        arima_order: Optional[Tuple[int, int, int]] = None,
        sarima_order: Optional[Tuple[int, int, int]] = None,
        sarima_seasonal_order: Optional[Tuple[int, int, int, int]] = None,
        epochs: int = 50,
        batch_size: int = 32
    ) -> Dict[str, Any]:
        """
        Train a model from user-provided data and immediately generate a forecast
        
        This is a convenience method that trains a model and generates a forecast in one call.
        Perfect for users who want to input data and get a forecast immediately.
        
        Args:
            data_points: List of dictionaries with "date" (ISO format string) and "value" (float)
            model_type: One of "arima", "sarima", "prophet", "xgboost", "lstm", "linear_regression"
            metric_name: User-defined name for the metric
            forecast_start_date: Start date for the forecast
            forecast_end_date: End date for the forecast
            period: Aggregation period ("daily", "weekly", "monthly")
            user_id: Optional user ID for personal models
            save_model: Whether to save the trained model for future use
            arima_order: Optional ARIMA order tuple (p, d, q)
            sarima_order: Optional SARIMA order tuple (p, d, q)
            sarima_seasonal_order: Optional SARIMA seasonal order tuple (P, D, Q, s)
            epochs: Number of epochs for LSTM
            batch_size: Batch size for LSTM
        
        Returns:
            Dictionary with training results and forecast data
        """
        try:
            # First, prepare the data DataFrame (reuse logic from train_from_custom_data)
            dates = []
            values = []
            
            for point in data_points:
                date_str = point.get("date") or point.get("Date") or point.get("ds")
                value = point.get("value") or point.get("Value") or point.get("y")
                
                if not date_str or value is None:
                    continue
                
                # Parse date
                try:
                    date = pd.to_datetime(date_str, utc=True)
                except:
                    try:
                        date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        if date.tzinfo is None:
                            date = date.replace(tzinfo=timezone.utc)
                    except:
                        logger.warning(f"Could not parse date: {date_str}")
                        continue
                
                dates.append(date)
                values.append(float(value))
            
            if len(dates) < 3:
                raise ValueError(f"Insufficient data: need at least 3 data points, got {len(dates)}")
            
            # Create DataFrame
            df = pd.DataFrame({
                'date': pd.to_datetime(dates, utc=True),
                'value': values
            }).sort_values('date').reset_index(drop=True)
            
            # Aggregate by period if needed
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
            
            # Calculate forecast periods
            if period == "monthly":
                periods = (forecast_end_date.year - forecast_start_date.year) * 12 + \
                         (forecast_end_date.month - forecast_start_date.month) + 1
            elif period == "weekly":
                periods = ((forecast_end_date - forecast_start_date).days // 7) + 1
            else:  # daily
                periods = (forecast_end_date - forecast_start_date).days + 1
            
            # Train model and generate forecast based on model type
            forecast_data = []
            model_path = None
            training_result = None
            
            if model_type == "arima":
                # Train ARIMA
                training_result = MLForecastingService._train_arima_from_df(
                    df, metric_name, user_id if save_model else None, arima_order or (1, 1, 1)
                )
                if save_model:
                    model_path = Path(training_result['model_path'])
                else:
                    # Load model from temp location or keep in memory
                    model_path = Path(training_result['model_path'])
                
                # Generate forecast
                model = joblib.load(model_path)
                forecast_result = model.forecast(steps=periods)
                
                current_date = forecast_start_date
                for i, value in enumerate(forecast_result):
                    if current_date > forecast_end_date:
                        break
                    forecast_data.append({
                        "period": current_date.strftime("%Y-%m") if period == "monthly" else current_date.strftime("%Y-%m-%d"),
                        "date": current_date.isoformat(),
                        "forecasted_value": float(value),
                        "method": "arima"
                    })
                    # Move to next period
                    if period == "monthly":
                        if current_date.month == 12:
                            current_date = current_date.replace(year=current_date.year + 1, month=1)
                        else:
                            current_date = current_date.replace(month=current_date.month + 1)
                    elif period == "weekly":
                        current_date = current_date + timedelta(days=7)
                    else:
                        current_date = current_date + timedelta(days=1)
                
                # Clean up temp model if not saving
                if not save_model and model_path.exists():
                    try:
                        model_path.unlink()
                    except:
                        pass
                
            elif model_type == "linear_regression":
                # Train Linear Regression
                training_result = MLForecastingService._train_linear_regression_from_df(
                    df, metric_name, user_id if save_model else None
                )
                if save_model:
                    model_path = Path(training_result['model_path'])
                else:
                    model_path = Path(training_result['model_path'])
                
                # Generate forecast
                model = joblib.load(model_path)
                
                # Create time index for forecast
                last_time_index = len(df) - 1
                current_date = forecast_start_date
                
                for i in range(periods):
                    if current_date > forecast_end_date:
                        break
                    time_index = last_time_index + i + 1
                    prediction = model.predict([[time_index]])[0]
                    
                    forecast_data.append({
                        "period": current_date.strftime("%Y-%m") if period == "monthly" else current_date.strftime("%Y-%m-%d"),
                        "date": current_date.isoformat(),
                        "forecasted_value": float(prediction),
                        "method": "linear_regression"
                    })
                    
                    # Move to next period
                    if period == "monthly":
                        if current_date.month == 12:
                            current_date = current_date.replace(year=current_date.year + 1, month=1)
                        else:
                            current_date = current_date.replace(month=current_date.month + 1)
                    elif period == "weekly":
                        current_date = current_date + timedelta(days=7)
                    else:
                        current_date = current_date + timedelta(days=1)
                
                # Clean up temp model if not saving
                if not save_model and model_path.exists():
                    try:
                        model_path.unlink()
                    except:
                        pass
            
            elif model_type == "prophet":
                # Train Prophet
                training_result = MLForecastingService._train_prophet_from_df(
                    df, metric_name, user_id if save_model else None
                )
                if save_model:
                    model_path = Path(training_result['model_path'])
                else:
                    model_path = Path(training_result['model_path'])
                
                # Generate forecast
                model = joblib.load(model_path)
                future = model.make_future_dataframe(periods=periods)
                forecast_result = model.predict(future)
                
                # Filter to forecast period
                forecast_future = forecast_result[
                    (forecast_result['ds'] >= forecast_start_date) & 
                    (forecast_result['ds'] <= forecast_end_date)
                ]
                
                for _, row in forecast_future.iterrows():
                    forecast_data.append({
                        "period": row['ds'].strftime("%Y-%m") if period == "monthly" else row['ds'].strftime("%Y-%m-%d"),
                        "date": row['ds'].isoformat(),
                        "forecasted_value": float(row['yhat']),
                        "method": "prophet",
                        "yhat_lower": float(row['yhat_lower']),
                        "yhat_upper": float(row['yhat_upper'])
                    })
                
                # Clean up temp model if not saving
                if not save_model and model_path.exists():
                    try:
                        model_path.unlink()
                    except:
                        pass
            
            elif model_type == "xgboost":
                # Train XGBoost
                training_result = MLForecastingService._train_xgboost_from_df(
                    df, metric_name, user_id if save_model else None
                )
                if save_model:
                    model_path = Path(training_result['model_path'])
                else:
                    model_path = Path(training_result['model_path'])
                
                # Generate forecast using last values from training data
                model = joblib.load(model_path)
                window_size = 3
                last_values = df['value'].iloc[-window_size:].tolist()
                
                current_date = forecast_start_date
                for i in range(periods):
                    if current_date > forecast_end_date:
                        break
                    
                    # Create features
                    features = last_values[-window_size:].copy()
                    features.append(np.mean(features))
                    features.append(np.std(features) if len(features) > 1 else 0.0)
                    features.append(current_date.month)
                    features.append(current_date.year)
                    
                    prediction = model.predict([features])[0]
                    
                    forecast_data.append({
                        "period": current_date.strftime("%Y-%m") if period == "monthly" else current_date.strftime("%Y-%m-%d"),
                        "date": current_date.isoformat(),
                        "forecasted_value": float(prediction),
                        "method": "xgboost"
                    })
                    
                    # Update last_values
                    last_values.append(float(prediction))
                    if len(last_values) > window_size:
                        last_values.pop(0)
                    
                    # Move to next period
                    if period == "monthly":
                        if current_date.month == 12:
                            current_date = current_date.replace(year=current_date.year + 1, month=1)
                        else:
                            current_date = current_date.replace(month=current_date.month + 1)
                    elif period == "weekly":
                        current_date = current_date + timedelta(days=7)
                    else:
                        current_date = current_date + timedelta(days=1)
                
                # Clean up temp model if not saving
                if not save_model and model_path.exists():
                    try:
                        model_path.unlink()
                    except:
                        pass
            
            else:
                raise ValueError(f"Forecast generation not yet implemented for {model_type} in train-and-forecast mode. Use train first, then generate forecast separately.")
            
            return {
                "training_result": training_result,
                "forecast_data": forecast_data,
                "metric_name": metric_name,
                "model_type": model_type,
                "forecast_start_date": forecast_start_date.isoformat(),
                "forecast_end_date": forecast_end_date.isoformat(),
                "period": period,
                "model_saved": save_model,
                "model_path": str(model_path) if save_model and model_path else None
            }
            
        except Exception as e:
            logger.error(f"Train and forecast from custom data failed: {str(e)}", exc_info=True)
            raise
    
    @staticmethod
    def _get_custom_model_path(metric_name: str, model_type: str, user_id: Optional[int] = None) -> Path:
        """Get path for custom model"""
        safe_name = metric_name.lower().replace(" ", "_").replace("/", "_")
        if user_id:
            return MODELS_DIR / f"custom_{safe_name}_{model_type}_user_{user_id}.pkl"
        return MODELS_DIR / f"custom_{safe_name}_{model_type}.pkl"
    
    @staticmethod
    def _train_arima_from_df(
        df: pd.DataFrame, metric_name: str, user_id: Optional[int], order: Tuple[int, int, int]
    ) -> Dict[str, Any]:
        """Train ARIMA from DataFrame"""
        if not STATSMODELS_AVAILABLE:
            raise ImportError("statsmodels is not installed")
        
        if len(df) < 10:
            raise ValueError(f"Insufficient data: need at least 10 data points, got {len(df)}")
        
        model = ARIMA(df['value'], order=order)
        fitted_model = model.fit()
        
        predictions = fitted_model.fittedvalues
        mae = mean_absolute_error(df['value'], predictions) if SKLEARN_AVAILABLE else None
        rmse = np.sqrt(mean_squared_error(df['value'], predictions)) if SKLEARN_AVAILABLE else None
        
        model_path = MLForecastingService._get_custom_model_path(metric_name, "arima", user_id)
        joblib.dump(fitted_model, model_path)
        
        return {
            "model_type": "arima",
            "metric": metric_name,
            "status": "trained",
            "order": order,
            "aic": float(fitted_model.aic),
            "mae": float(mae) if mae else None,
            "rmse": float(rmse) if rmse else None,
            "data_points": len(df),
            "model_path": str(model_path),
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    def _train_sarima_from_df(
        df: pd.DataFrame, metric_name: str, user_id: Optional[int],
        order: Tuple[int, int, int], seasonal_order: Tuple[int, int, int, int]
    ) -> Dict[str, Any]:
        """Train SARIMA from DataFrame"""
        if not STATSMODELS_AVAILABLE:
            raise ImportError("statsmodels is not installed")
        
        if len(df) < 24:
            raise ValueError(f"Insufficient data: need at least 24 data points, got {len(df)}")
        
        model = SARIMAX(df['value'], order=order, seasonal_order=seasonal_order)
        fitted_model = model.fit(disp=False)
        
        predictions = fitted_model.fittedvalues
        mae = mean_absolute_error(df['value'], predictions) if SKLEARN_AVAILABLE else None
        rmse = np.sqrt(mean_squared_error(df['value'], predictions)) if SKLEARN_AVAILABLE else None
        
        model_path = MLForecastingService._get_custom_model_path(metric_name, "sarima", user_id)
        joblib.dump(fitted_model, model_path)
        
        return {
            "model_type": "sarima",
            "metric": metric_name,
            "status": "trained",
            "order": order,
            "seasonal_order": seasonal_order,
            "aic": float(fitted_model.aic),
            "mae": float(mae) if mae else None,
            "rmse": float(rmse) if rmse else None,
            "data_points": len(df),
            "model_path": str(model_path),
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    def _train_prophet_from_df(df: pd.DataFrame, metric_name: str, user_id: Optional[int]) -> Dict[str, Any]:
        """Train Prophet from DataFrame"""
        if not PROPHET_AVAILABLE:
            raise ImportError("prophet is not installed")
        
        if len(df) < 36:
            raise ValueError(f"Insufficient data: need at least 36 data points, got {len(df)}")
        
        prophet_df = pd.DataFrame({
            'ds': df['date'],
            'y': df['value']
        })
        
        try:
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode='multiplicative'
            )
            model.fit(prophet_df)
        except (AttributeError, ImportError, RuntimeError, Exception) as e:
            error_str = str(e).lower()
            if 'stan_backend' in error_str or 'cmdstanpy' in error_str or 'cmdstan' in error_str:
                raise ImportError(
                    "Prophet stan_backend error. This is a known issue on Windows/Python 3.12. "
                    "Try using alternative models (ARIMA, XGBoost, LSTM) instead."
                )
            raise
        
        # Calculate metrics
        future = model.make_future_dataframe(periods=0)
        forecast = model.predict(future)
        predictions = forecast['yhat'].iloc[:len(df)]
        mae = mean_absolute_error(df['value'], predictions) if SKLEARN_AVAILABLE else None
        rmse = np.sqrt(mean_squared_error(df['value'], predictions)) if SKLEARN_AVAILABLE else None
        
        model_path = MLForecastingService._get_custom_model_path(metric_name, "prophet", user_id)
        joblib.dump(model, model_path)
        
        return {
            "model_type": "prophet",
            "metric": metric_name,
            "status": "trained",
            "mae": float(mae) if mae else None,
            "rmse": float(rmse) if rmse else None,
            "data_points": len(df),
            "model_path": str(model_path),
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    def _train_xgboost_from_df(df: pd.DataFrame, metric_name: str, user_id: Optional[int]) -> Dict[str, Any]:
        """Train XGBoost from DataFrame"""
        if not XGBOOST_AVAILABLE:
            raise ImportError("xgboost is not installed")
        
        if len(df) < 10:
            raise ValueError(f"Insufficient data: need at least 10 data points, got {len(df)}")
        
        # Create features: lagged values, rolling stats, time features
        window_size = 3
        df_features = df.copy()
        
        for i in range(1, window_size + 1):
            df_features[f'lag_{i}'] = df_features['value'].shift(i)
        
        df_features['rolling_mean'] = df_features['value'].rolling(window=window_size).mean()
        df_features['rolling_std'] = df_features['value'].rolling(window=window_size).std()
        df_features['month'] = df_features['date'].dt.month
        df_features['year'] = df_features['date'].dt.year
        
        df_features = df_features.dropna()
        
        if len(df_features) < 5:
            raise ValueError(f"Insufficient data after feature engineering: need at least 5 data points")
        
        # Prepare features and target
        feature_cols = [f'lag_{i}' for i in range(1, window_size + 1)] + ['rolling_mean', 'rolling_std', 'month', 'year']
        X = df_features[feature_cols].values
        y = df_features['value'].values
        
        model = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
        model.fit(X, y)
        
        predictions = model.predict(X)
        mae = mean_absolute_error(y, predictions) if SKLEARN_AVAILABLE else None
        rmse = np.sqrt(mean_squared_error(y, predictions)) if SKLEARN_AVAILABLE else None
        
        model_path = MLForecastingService._get_custom_model_path(metric_name, "xgboost", user_id)
        joblib.dump(model, model_path)
        
        return {
            "model_type": "xgboost",
            "metric": metric_name,
            "status": "trained",
            "mae": float(mae) if mae else None,
            "rmse": float(rmse) if rmse else None,
            "data_points": len(df_features),
            "model_path": str(model_path),
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    def _train_lstm_from_df(
        df: pd.DataFrame, metric_name: str, user_id: Optional[int], epochs: int, batch_size: int
    ) -> Dict[str, Any]:
        """Train LSTM from DataFrame"""
        if not TENSORFLOW_AVAILABLE:
            raise ImportError("tensorflow is not installed")
        
        if len(df) < 20:
            raise ValueError(f"Insufficient data: need at least 20 data points, got {len(df)}")
        
        # Prepare data for LSTM (sequences)
        sequence_length = 3
        values = df['value'].values.reshape(-1, 1)
        
        # Scale data
        scaler = StandardScaler() if SKLEARN_AVAILABLE else None
        if scaler:
            values_scaled = scaler.fit_transform(values)
        else:
            values_scaled = values
        
        # Create sequences
        X, y = [], []
        for i in range(sequence_length, len(values_scaled)):
            X.append(values_scaled[i-sequence_length:i, 0])
            y.append(values_scaled[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = X.reshape((X.shape[0], X.shape[1], 1))
        
        if len(X) < 5:
            raise ValueError(f"Insufficient data after sequence creation: need at least 5 sequences")
        
        # Build LSTM model
        model = Sequential([
            LSTM(50, activation='relu', input_shape=(sequence_length, 1)),
            Dropout(0.2),
            Dense(1)
        ])
        model.compile(optimizer='adam', loss='mse')
        
        # Train model
        model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0)
        
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
        
        model_path = MLForecastingService._get_custom_model_path(metric_name, "lstm", user_id)
        model.save(str(model_path))
        
        # Save scaler
        if scaler:
            scaler_path = model_path.with_suffix('.scaler.pkl')
            joblib.dump(scaler, scaler_path)
        
        return {
            "model_type": "lstm",
            "metric": metric_name,
            "status": "trained",
            "mae": float(mae) if mae else None,
            "rmse": float(rmse) if rmse else None,
            "data_points": len(df),
            "model_path": str(model_path),
            "trained_at": datetime.now(timezone.utc).isoformat()
        }
    
    @staticmethod
    def _train_linear_regression_from_df(df: pd.DataFrame, metric_name: str, user_id: Optional[int]) -> Dict[str, Any]:
        """Train Linear Regression from DataFrame"""
        if not SKLEARN_AVAILABLE:
            raise ImportError("scikit-learn is not installed")
        
        if len(df) < 5:
            raise ValueError(f"Insufficient data: need at least 5 data points, got {len(df)}")
        
        # Create time index feature
        df['time_index'] = range(len(df))
        X = df[['time_index']].values
        y = df['value'].values
        
        model = LinearRegression()
        model.fit(X, y)
        
        predictions = model.predict(X)
        mae = mean_absolute_error(y, predictions)
        rmse = np.sqrt(mean_squared_error(y, predictions))
        
        model_path = MLForecastingService._get_custom_model_path(metric_name, "linear_regression", user_id)
        joblib.dump(model, model_path)
        
        return {
            "model_type": "linear_regression",
            "metric": metric_name,
            "status": "trained",
            "mae": float(mae),
            "rmse": float(rmse),
            "data_points": len(df),
            "model_path": str(model_path),
            "trained_at": datetime.now(timezone.utc).isoformat()
        }

