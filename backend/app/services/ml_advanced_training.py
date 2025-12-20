# app/services/ml_advanced_training.py
"""
Advanced ML Training Module
Professional-grade training features inspired by OpenAI's model training practices:
- Hyperparameter optimization (Grid Search, Random Search)
- Cross-validation (Time Series Walk-Forward)
- Advanced evaluation metrics (R², MAPE, Directional Accuracy)
- Early stopping and learning rate scheduling
- Regularization and feature engineering
- Model versioning and comparison
- Training monitoring and logging
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple, Callable
from datetime import datetime, timezone
from pathlib import Path
import json
import joblib

logger = logging.getLogger(__name__)

# Import ML libraries with error handling
try:
    from sklearn.metrics import (
        mean_absolute_error, mean_squared_error, r2_score,
        mean_absolute_percentage_error
    )
    from sklearn.model_selection import TimeSeriesSplit
    from sklearn.preprocessing import RobustScaler, MinMaxScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

try:
    from tensorflow import keras
    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False


class AdvancedEvaluationMetrics:
    """Comprehensive evaluation metrics for model performance"""
    
    @staticmethod
    def calculate_all_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Calculate comprehensive evaluation metrics
        
        Metrics calculated:
        - MAE (Mean Absolute Error)
        - RMSE (Root Mean Squared Error)
        - R² (Coefficient of Determination)
        - MAPE (Mean Absolute Percentage Error)
        - Directional Accuracy (DA)
        - Max Error
        - Median Absolute Error
        """
        if not SKLEARN_AVAILABLE:
            return {}
        
        y_true = np.array(y_true).flatten()
        y_pred = np.array(y_pred).flatten()
        
        # Remove any NaN or inf values
        mask = np.isfinite(y_true) & np.isfinite(y_pred)
        y_true = y_true[mask]
        y_pred = y_pred[mask]
        
        if len(y_true) == 0:
            return {}
        
        metrics = {
            "mae": float(mean_absolute_error(y_true, y_pred)),
            "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
            "r2": float(r2_score(y_true, y_pred)),
            "max_error": float(np.max(np.abs(y_true - y_pred))),
            "median_ae": float(np.median(np.abs(y_true - y_pred))),
        }
        
        # MAPE (handle division by zero)
        try:
            mape = np.mean(np.abs((y_true - y_pred) / np.where(y_true != 0, y_true, 1))) * 100
            metrics["mape"] = float(mape)
        except:
            metrics["mape"] = None
        
        # Directional Accuracy (percentage of correct direction predictions)
        if len(y_true) > 1:
            true_direction = np.diff(y_true) > 0
            pred_direction = np.diff(y_pred) > 0
            da = np.mean(true_direction == pred_direction) * 100
            metrics["directional_accuracy"] = float(da)
        else:
            metrics["directional_accuracy"] = None
        
        # Mean Error (bias)
        metrics["mean_error"] = float(np.mean(y_pred - y_true))
        
        # Percentage within 10% error
        if np.mean(np.abs(y_true)) > 0:
            within_10pct = np.mean(np.abs(y_true - y_pred) / np.abs(y_true) < 0.1) * 100
            metrics["within_10pct_error"] = float(within_10pct)
        else:
            metrics["within_10pct_error"] = None
        
        return metrics


class TimeSeriesCrossValidator:
    """Time Series Cross-Validation (Walk-Forward Validation)"""
    
    @staticmethod
    def walk_forward_validation(
        df: pd.DataFrame,
        n_splits: int = 5,
        test_size: Optional[int] = None
    ) -> List[Tuple[pd.DataFrame, pd.DataFrame]]:
        """
        Perform walk-forward validation for time series
        
        Args:
            df: DataFrame with 'date' and 'value' columns, sorted by date
            n_splits: Number of splits
            test_size: Size of test set (if None, auto-calculate)
        
        Returns:
            List of (train, test) DataFrame tuples
        """
        if len(df) < 10:
            return [(df, pd.DataFrame())]
        
        splits = []
        total_size = len(df)
        
        if test_size is None:
            test_size = max(1, total_size // (n_splits + 1))
        
        # Walk-forward: each split uses more training data
        for i in range(n_splits):
            train_end = total_size - (n_splits - i) * test_size
            test_start = train_end
            
            if train_end < test_size or test_start >= total_size:
                continue
            
            train_df = df.iloc[:train_end].copy()
            test_df = df.iloc[test_start:test_start + test_size].copy()
            
            if len(train_df) > 0 and len(test_df) > 0:
                splits.append((train_df, test_df))
        
        if len(splits) == 0:
            # Fallback: single split (80/20)
            split_idx = int(0.8 * total_size)
            splits = [(df.iloc[:split_idx], df.iloc[split_idx:])]
        
        return splits


class HyperparameterOptimizer:
    """Hyperparameter optimization using Grid Search and Random Search"""
    
    @staticmethod
    def optimize_arima_parameters(
        train_data: pd.Series,
        p_range: List[int] = [0, 1, 2],
        d_range: List[int] = [0, 1, 2],
        q_range: List[int] = [0, 1, 2],
        max_eval: int = 27  # Limit evaluations for performance
    ) -> Tuple[Tuple[int, int, int], float]:
        """
        Optimize ARIMA parameters using grid search
        
        Returns:
            Best (p, d, q) order and corresponding AIC score
        """
        try:
            from statsmodels.tsa.arima.model import ARIMA
        except ImportError:
            return (1, 1, 1), float('inf')
        
        best_aic = float('inf')
        best_order = (1, 1, 1)
        
        # Limit search space
        combinations = [(p, d, q) for p in p_range for d in d_range for q in q_range]
        if len(combinations) > max_eval:
            # Use random sampling
            import random
            combinations = random.sample(combinations, max_eval)
        
        for order in combinations:
            try:
                model = ARIMA(train_data, order=order)
                fitted = model.fit()
                aic = fitted.aic
                
                if aic < best_aic:
                    best_aic = aic
                    best_order = order
            except:
                continue
        
        return best_order, best_aic
    
    @staticmethod
    def optimize_xgboost_parameters(
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None
    ) -> Dict[str, Any]:
        """
        Optimize XGBoost hyperparameters
        
        Returns:
            Dictionary of best hyperparameters
        """
        if not XGBOOST_AVAILABLE:
            return {}
        
        # Use default params as baseline
        best_params = {
            'n_estimators': 100,
            'max_depth': 5,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8
        }
        
        # Simple optimization: try different learning rates and depths
        best_score = float('inf')
        
        if not SKLEARN_AVAILABLE:
            return best_params
        
        for lr in [0.05, 0.1, 0.2]:
            for depth in [3, 5, 7]:
                try:
                    model = xgb.XGBRegressor(
                        n_estimators=100,
                        max_depth=depth,
                        learning_rate=lr,
                        random_state=42
                    )
                    model.fit(X_train, y_train)
                    
                    if X_val is not None and y_val is not None:
                        pred = model.predict(X_val)
                        score = mean_squared_error(y_val, pred)
                    else:
                        pred = model.predict(X_train)
                        score = mean_squared_error(y_train, pred)
                    
                    if score < best_score:
                        best_score = score
                        best_params['learning_rate'] = lr
                        best_params['max_depth'] = depth
                except:
                    continue
        
        return best_params


class AdvancedDataPreprocessor:
    """Advanced data preprocessing and feature engineering"""
    
    @staticmethod
    def detect_outliers(df: pd.DataFrame, method: str = "iqr") -> pd.DataFrame:
        """
        Detect and handle outliers
        
        Args:
            df: DataFrame with 'value' column
            method: 'iqr' (Interquartile Range) or 'zscore'
        
        Returns:
            DataFrame with outliers removed
        """
        df_clean = df.copy()
        
        if method == "iqr":
            Q1 = df['value'].quantile(0.25)
            Q3 = df['value'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            mask = (df['value'] >= lower_bound) & (df['value'] <= upper_bound)
            df_clean = df_clean[mask]
        
        elif method == "zscore":
            try:
                from scipy import stats  # type: ignore[import-untyped]
                z_scores = np.abs(stats.zscore(df['value']))
                df_clean = df_clean[z_scores < 3]
            except ImportError:
                # Fallback to IQR if scipy not available
                pass
        
        return df_clean.reset_index(drop=True)
    
    @staticmethod
    def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
        """
        Advanced feature engineering for time series
        
        Adds:
        - Lag features
        - Rolling statistics (mean, std, min, max)
        - Time-based features (day of week, month, year, quarter)
        - Trend features
        - Seasonal features
        """
        df_feat = df.copy()
        
        # Time-based features
        df_feat['year'] = df_feat['date'].dt.year
        df_feat['month'] = df_feat['date'].dt.month
        df_feat['quarter'] = df_feat['date'].dt.quarter
        df_feat['day_of_year'] = df_feat['date'].dt.dayofyear
        
        # Lag features
        for lag in [1, 2, 3, 7, 30]:
            if lag < len(df_feat):
                df_feat[f'lag_{lag}'] = df_feat['value'].shift(lag)
        
        # Rolling statistics
        for window in [3, 7, 30]:
            if window < len(df_feat):
                df_feat[f'rolling_mean_{window}'] = df_feat['value'].rolling(window=window).mean()
                df_feat[f'rolling_std_{window}'] = df_feat['value'].rolling(window=window).std()
                df_feat[f'rolling_min_{window}'] = df_feat['value'].rolling(window=window).min()
                df_feat[f'rolling_max_{window}'] = df_feat['value'].rolling(window=window).max()
        
        # Exponential moving average
        for span in [3, 7]:
            if span < len(df_feat):
                df_feat[f'ema_{span}'] = df_feat['value'].ewm(span=span).mean()
        
        # Trend
        df_feat['trend'] = np.arange(len(df_feat))
        
        # Difference (first difference for stationarity)
        df_feat['diff_1'] = df_feat['value'].diff(1)
        
        return df_feat
    
    @staticmethod
    def normalize_data(
        data: np.ndarray,
        method: str = "robust",
        fit_data: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, Optional[Any]]:
        """
        Normalize data using various methods
        
        Args:
            data: Data to normalize
            method: 'robust', 'standard', 'minmax'
            fit_data: Data to fit scaler on (if None, uses data)
        
        Returns:
            Normalized data and scaler object
        """
        if not SKLEARN_AVAILABLE:
            return data, None
        
        fit_on = fit_data if fit_data is not None else data
        
        if method == "robust":
            scaler = RobustScaler()
        elif method == "standard":
            from sklearn.preprocessing import StandardScaler
            scaler = StandardScaler()
        elif method == "minmax":
            scaler = MinMaxScaler()
        else:
            return data, None
        
        scaler.fit(fit_on.reshape(-1, 1))
        normalized = scaler.transform(data.reshape(-1, 1)).flatten()
        
        return normalized, scaler


class ModelVersionManager:
    """Manage model versions and metadata"""
    
    @staticmethod
    def save_model_metadata(
        model_path: Path,
        metadata: Dict[str, Any]
    ):
        """Save model metadata alongside model file"""
        metadata_path = model_path.with_suffix('.metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
    
    @staticmethod
    def load_model_metadata(model_path: Path) -> Optional[Dict[str, Any]]:
        """Load model metadata"""
        metadata_path = model_path.with_suffix('.metadata.json')
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                return json.load(f)
        return None
    
    @staticmethod
    def create_model_version(
        metric: str,
        model_type: str,
        user_id: Optional[int] = None
    ) -> str:
        """Create a version string for the model"""
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        version = f"v{timestamp}"
        return version


class TrainingMonitor:
    """Monitor training progress and log metrics"""
    
    def __init__(self):
        self.history: Dict[str, List[float]] = {}
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
    
    def start(self):
        """Start monitoring"""
        self.start_time = datetime.now(timezone.utc)
        self.history = {}
    
    def log_metric(self, name: str, value: float, epoch: Optional[int] = None):
        """Log a metric value"""
        key = f"{name}" if epoch is None else f"{name}_epoch_{epoch}"
        if key not in self.history:
            self.history[key] = []
        self.history[key].append(value)
    
    def finish(self) -> Dict[str, Any]:
        """Finish monitoring and return summary"""
        self.end_time = datetime.now(timezone.utc)
        duration = (self.end_time - self.start_time).total_seconds() if self.start_time else 0
        
        return {
            "training_duration_seconds": duration,
            "history": self.history,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None
        }


def create_advanced_callbacks(
    patience: int = 10,
    min_delta: float = 0.0001,
    monitor: str = "val_loss"
) -> List[Any]:
    """
    Create advanced callbacks for neural network training
    
    Returns:
        List of Keras callbacks (EarlyStopping, ReduceLROnPlateau, etc.)
    """
    if not TENSORFLOW_AVAILABLE:
        return []
    
    callbacks = [
        EarlyStopping(
            monitor=monitor,
            patience=patience,
            min_delta=min_delta,
            restore_best_weights=True,
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor=monitor,
            factor=0.5,
            patience=patience // 2,
            min_lr=1e-7,
            verbose=1
        )
    ]
    
    return callbacks

