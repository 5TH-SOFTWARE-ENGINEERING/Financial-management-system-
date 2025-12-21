# app/services/ml_advanced_training.py
"""
Advanced ML Training Module
Professional-grade training features inspired by OpenAI's model training practices:
- Hyperparameter optimization (Grid Search, Random Search) for ARIMA, SARIMA, XGBoost, LSTM
- Cross-validation (Time Series Walk-Forward)
- Advanced evaluation metrics (R², MAPE, Directional Accuracy, within 10% error)
- Early stopping and learning rate scheduling
- Advanced data preprocessing (outlier detection, missing value handling)
- Feature engineering (lag features, rolling statistics, seasonal encoding)
- Model versioning and comparison
- Training monitoring and logging
- Model validation and quality assessment
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
        max_eval: int = 27,  # Limit evaluations for performance
        seasonal: bool = False
    ) -> Tuple[Tuple[int, int, int], float]:
        """
        Optimize ARIMA/SARIMA parameters using grid search
        
        Args:
            train_data: Training data series
            p_range: Range of AR parameters
            d_range: Range of differencing parameters
            q_range: Range of MA parameters
            max_eval: Maximum number of evaluations
            seasonal: If True, optimize for SARIMA
        
        Returns:
            Best (p, d, q) order and corresponding AIC score
        """
        try:
            if seasonal:
                from statsmodels.tsa.statespace.sarimax import SARIMAX
                ModelClass = SARIMAX
            else:
                from statsmodels.tsa.arima.model import ARIMA
                ModelClass = ARIMA
        except ImportError:
            return (1, 1, 1), float('inf')
        
        best_aic = float('inf')
        best_order = (1, 1, 1)
        
        # Limit search space
        combinations = [(p, d, q) for p in p_range for d in d_range for q in q_range]
        if len(combinations) > max_eval:
            # Use random sampling for better coverage
            import random
            random.seed(42)  # For reproducibility
            combinations = random.sample(combinations, max_eval)
        
        logger.info(f"Optimizing ARIMA parameters: testing {len(combinations)} combinations...")
        
        for idx, order in enumerate(combinations):
            try:
                if seasonal:
                    # For SARIMA, use default seasonal order (1,1,1,12)
                    model = ModelClass(train_data, order=order, seasonal_order=(1, 1, 1, 12))
                else:
                    model = ModelClass(train_data, order=order)
                
                fitted = model.fit(disp=False)
                aic = fitted.aic
                
                if aic < best_aic:
                    best_aic = aic
                    best_order = order
                    logger.debug(f"New best order: {order}, AIC: {aic:.2f}")
                
            except Exception as e:
                logger.debug(f"Failed to fit ARIMA{order}: {str(e)[:50]}")
                continue
        
        logger.info(f"Optimization complete: Best order {best_order}, AIC: {best_aic:.2f}")
        return best_order, best_aic
    
    @staticmethod
    def optimize_sarima_parameters(
        train_data: pd.Series,
        p_range: List[int] = [0, 1, 2],
        d_range: List[int] = [0, 1],
        q_range: List[int] = [0, 1, 2],
        P_range: List[int] = [0, 1],
        D_range: List[int] = [0, 1],
        Q_range: List[int] = [0, 1],
        s: int = 12,
        max_eval: int = 20
    ) -> Tuple[Tuple[int, int, int], Tuple[int, int, int, int], float]:
        """
        Optimize SARIMA parameters
        
        Args:
            train_data: Training data series
            p_range, d_range, q_range: Non-seasonal parameters
            P_range, D_range, Q_range: Seasonal parameters
            s: Seasonal period (12 for monthly, 4 for quarterly)
            max_eval: Maximum evaluations
        
        Returns:
            Best (p, d, q), (P, D, Q, s), and AIC score
        """
        try:
            from statsmodels.tsa.statespace.sarimax import SARIMAX
        except ImportError:
            return (1, 1, 1), (1, 1, 1, s), float('inf')
        
        best_aic = float('inf')
        best_order = (1, 1, 1)
        best_seasonal = (1, 1, 1, s)
        
        # Create all combinations
        non_seasonal = [(p, d, q) for p in p_range for d in d_range for q in q_range]
        seasonal = [(P, D, Q) for P in P_range for D in D_range for Q in Q_range]
        
        total_combinations = len(non_seasonal) * len(seasonal)
        
        if total_combinations > max_eval:
            import random
            random.seed(42)
            # Sample combinations
            sampled_seasonal = random.sample(seasonal, min(len(seasonal), max_eval // len(non_seasonal) + 1))
            sampled_non_seasonal = random.sample(non_seasonal, min(len(non_seasonal), max_eval // len(sampled_seasonal) + 1))
            combinations = [(ns, s) for ns in sampled_non_seasonal for s in sampled_seasonal]
            combinations = random.sample(combinations, min(max_eval, len(combinations)))
        else:
            combinations = [(ns, s) for ns in non_seasonal for s in seasonal]
        
        logger.info(f"Optimizing SARIMA parameters: testing {len(combinations)} combinations...")
        
        for order, seasonal_order in combinations:
            try:
                seasonal_full = (*seasonal_order, s)
                model = SARIMAX(train_data, order=order, seasonal_order=seasonal_full)
                fitted = model.fit(disp=False)
                aic = fitted.aic
                
                if aic < best_aic:
                    best_aic = aic
                    best_order = order
                    best_seasonal = seasonal_full
                    logger.debug(f"New best: order={order}, seasonal={seasonal_full}, AIC={aic:.2f}")
            except Exception as e:
                logger.debug(f"Failed SARIMA order {order} seasonal {seasonal_order}: {str(e)[:50]}")
                continue
        
        logger.info(f"SARIMA optimization complete: order={best_order}, seasonal={best_seasonal}, AIC={best_aic:.2f}")
        return best_order, best_seasonal, best_aic
    
    @staticmethod
    def optimize_xgboost_parameters(
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        metric: str = "rmse"
    ) -> Dict[str, Any]:
        """
        Optimize XGBoost hyperparameters using grid search
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_val: Validation features (optional)
            y_val: Validation targets (optional)
            metric: Metric to optimize ('rmse', 'mae', 'r2')
        
        Returns:
            Dictionary of best hyperparameters
        """
        if not XGBOOST_AVAILABLE or not SKLEARN_AVAILABLE:
            return {
                'n_estimators': 100,
                'max_depth': 5,
                'learning_rate': 0.1,
                'subsample': 0.8,
                'colsample_bytree': 0.8
            }
        
        # Use default params as baseline
        best_params = {
            'n_estimators': 100,
            'max_depth': 5,
            'learning_rate': 0.1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'min_child_weight': 1,
            'gamma': 0
        }
        
        best_score = float('inf') if metric in ['rmse', 'mae'] else -float('inf')
        
        # Expanded search space
        learning_rates = [0.05, 0.1, 0.15, 0.2]
        max_depths = [3, 5, 7]
        subsamples = [0.8, 0.9, 1.0]
        
        logger.info(f"Optimizing XGBoost parameters: testing {len(learning_rates) * len(max_depths) * len(subsamples)} combinations...")
        
        for lr in learning_rates:
            for depth in max_depths:
                for subsample in subsamples:
                    try:
                        model = xgb.XGBRegressor(
                            n_estimators=100,
                            max_depth=depth,
                            learning_rate=lr,
                            subsample=subsample,
                            colsample_bytree=0.8,
                            random_state=42,
                            verbosity=0
                        )
                        model.fit(X_train, y_train)
                        
                        if X_val is not None and y_val is not None:
                            pred = model.predict(X_val)
                            if metric == "rmse":
                                score = np.sqrt(mean_squared_error(y_val, pred))
                            elif metric == "mae":
                                score = mean_absolute_error(y_val, pred)
                            elif metric == "r2":
                                score = r2_score(y_val, pred)
                            else:
                                score = mean_squared_error(y_val, pred)
                        else:
                            pred = model.predict(X_train)
                            if metric == "rmse":
                                score = np.sqrt(mean_squared_error(y_train, pred))
                            elif metric == "mae":
                                score = mean_absolute_error(y_train, pred)
                            elif metric == "r2":
                                score = r2_score(y_train, pred)
                            else:
                                score = mean_squared_error(y_train, pred)
                        
                        # For R², higher is better
                        is_better = (score > best_score) if metric == "r2" else (score < best_score)
                        
                        if is_better:
                            best_score = score
                            best_params['learning_rate'] = lr
                            best_params['max_depth'] = depth
                            best_params['subsample'] = subsample
                            logger.debug(f"New best XGBoost: lr={lr}, depth={depth}, subsample={subsample}, {metric}={score:.4f}")
                    except Exception as e:
                        logger.debug(f"XGBoost optimization failed: {str(e)[:50]}")
                        continue
        
        logger.info(f"XGBoost optimization complete: {best_params}, best {metric}={best_score:.4f}")
        return best_params
    
    @staticmethod
    def optimize_lstm_parameters(
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        units_range: List[int] = [32, 50, 64],
        dropout_range: List[float] = [0.1, 0.2, 0.3],
        max_eval: int = 9
    ) -> Dict[str, Any]:
        """
        Optimize LSTM hyperparameters
        
        Args:
            X_train: Training sequences
            y_train: Training targets
            X_val: Validation sequences (optional)
            y_val: Validation targets (optional)
            units_range: Number of LSTM units to try
            dropout_range: Dropout rates to try
            max_eval: Maximum evaluations
        
        Returns:
            Dictionary of best hyperparameters
        """
        if not TENSORFLOW_AVAILABLE or not SKLEARN_AVAILABLE:
            return {
                'units': 50,
                'dropout': 0.2,
                'batch_size': 32,
                'epochs': 50
            }
        
        best_params = {
            'units': 50,
            'dropout': 0.2,
            'batch_size': 32,
            'epochs': 50
        }
        
        best_score = float('inf')
        combinations = [(u, d) for u in units_range for d in dropout_range]
        
        if len(combinations) > max_eval:
            import random
            random.seed(42)
            combinations = random.sample(combinations, max_eval)
        
        logger.info(f"Optimizing LSTM parameters: testing {len(combinations)} combinations...")
        
        for units, dropout in combinations:
            try:
                from tensorflow.keras.models import Sequential
                from tensorflow.keras.layers import LSTM, Dense, Dropout as KerasDropout
                from tensorflow.keras.optimizers import Adam
                
                model = Sequential([
                    LSTM(units, activation='relu', input_shape=(X_train.shape[1], X_train.shape[2])),
                    KerasDropout(dropout),
                    Dense(1)
                ])
                model.compile(optimizer=Adam(learning_rate=0.001), loss='mse')
                
                # Quick training with fewer epochs for optimization
                history = model.fit(
                    X_train, y_train,
                    epochs=10,  # Reduced for speed
                    batch_size=32,
                    validation_data=(X_val, y_val) if X_val is not None else None,
                    verbose=0
                )
                
                # Use validation loss if available, else training loss
                if X_val is not None and 'val_loss' in history.history:
                    score = min(history.history['val_loss'])
                else:
                    score = min(history.history['loss'])
                
                if score < best_score:
                    best_score = score
                    best_params['units'] = units
                    best_params['dropout'] = dropout
                    logger.debug(f"New best LSTM: units={units}, dropout={dropout}, loss={score:.6f}")
            except Exception as e:
                logger.debug(f"LSTM optimization failed: {str(e)[:50]}")
                continue
        
        logger.info(f"LSTM optimization complete: {best_params}, best loss={best_score:.6f}")
        return best_params


class AdvancedDataPreprocessor:
    """Advanced data preprocessing and feature engineering"""
    
    @staticmethod
    def detect_outliers(df: pd.DataFrame, method: str = "iqr", return_outliers: bool = False) -> pd.DataFrame:
        """
        Detect and handle outliers
        
        Args:
            df: DataFrame with 'value' column
            method: 'iqr' (Interquartile Range), 'zscore', or 'isolation_forest'
            return_outliers: If True, return outliers separately
        
        Returns:
            DataFrame with outliers removed (or tuple of (cleaned_df, outliers_df) if return_outliers=True)
        """
        df_clean = df.copy()
        outliers_mask = pd.Series([False] * len(df), index=df.index)
        
        if method == "iqr":
            Q1 = df['value'].quantile(0.25)
            Q3 = df['value'].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers_mask = (df['value'] < lower_bound) | (df['value'] > upper_bound)
            df_clean = df_clean[~outliers_mask]
        
        elif method == "zscore":
            try:
                from scipy import stats  # type: ignore[import-untyped]
                z_scores = np.abs(stats.zscore(df['value']))
                outliers_mask = z_scores >= 3
                df_clean = df_clean[~outliers_mask]
            except ImportError:
                # Fallback to IQR if scipy not available
                Q1 = df['value'].quantile(0.25)
                Q3 = df['value'].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers_mask = (df['value'] < lower_bound) | (df['value'] > upper_bound)
                df_clean = df_clean[~outliers_mask]
        
        elif method == "isolation_forest":
            try:
                from pyod.models.iforest import IForest
                if len(df) > 10:  # Need minimum data points
                    X = df['value'].values.reshape(-1, 1)
                    clf = IForest(contamination=0.1, random_state=42)
                    clf.fit(X)
                    outliers_mask = clf.predict(X) == 1
                    df_clean = df_clean[~outliers_mask]
                else:
                    logger.warning("Insufficient data for Isolation Forest, using IQR instead")
                    return AdvancedDataPreprocessor.detect_outliers(df, method="iqr", return_outliers=return_outliers)
            except ImportError:
                logger.warning("Isolation Forest not available, using IQR instead")
                return AdvancedDataPreprocessor.detect_outliers(df, method="iqr", return_outliers=return_outliers)
        
        df_clean = df_clean.reset_index(drop=True)
        
        if return_outliers:
            outliers_df = df[outliers_mask].reset_index(drop=True)
            return df_clean, outliers_df
        return df_clean
    
    @staticmethod
    def handle_missing_values(df: pd.DataFrame, method: str = "forward_fill") -> pd.DataFrame:
        """
        Handle missing values in time series data
        
        Args:
            df: DataFrame with 'date' and 'value' columns
            method: 'forward_fill', 'backward_fill', 'interpolate', 'mean', 'zero'
        
        Returns:
            DataFrame with missing values handled
        """
        df_clean = df.copy().sort_values('date')
        
        if method == "forward_fill":
            df_clean['value'] = df_clean['value'].fillna(method='ffill')
        elif method == "backward_fill":
            df_clean['value'] = df_clean['value'].fillna(method='bfill')
        elif method == "interpolate":
            df_clean['value'] = df_clean['value'].interpolate(method='time')
        elif method == "mean":
            df_clean['value'] = df_clean['value'].fillna(df_clean['value'].mean())
        elif method == "zero":
            df_clean['value'] = df_clean['value'].fillna(0)
        
        # If still NaN, use forward then backward fill
        df_clean['value'] = df_clean['value'].fillna(method='ffill').fillna(method='bfill').fillna(0)
        
        return df_clean
    
    @staticmethod
    def engineer_features(df: pd.DataFrame, include_all: bool = True) -> pd.DataFrame:
        """
        Advanced feature engineering for time series
        
        Args:
            df: DataFrame with 'date' and 'value' columns
            include_all: If True, includes all features; if False, only essential features
        
        Adds:
        - Lag features (1, 2, 3, 7, 30 periods)
        - Rolling statistics (mean, std, min, max) with multiple windows
        - Time-based features (year, month, quarter, day of year, day of week)
        - Trend features
        - Seasonal features (sine/cosine encoding)
        - Difference features
        - Exponential moving averages
        """
        df_feat = df.copy().sort_values('date').reset_index(drop=True)
        
        # Time-based features
        df_feat['year'] = df_feat['date'].dt.year
        df_feat['month'] = df_feat['date'].dt.month
        df_feat['quarter'] = df_feat['date'].dt.quarter
        df_feat['day_of_year'] = df_feat['date'].dt.dayofyear
        
        if include_all:
            df_feat['day_of_week'] = df_feat['date'].dt.dayofweek
            df_feat['week_of_year'] = df_feat['date'].dt.isocalendar().week
            df_feat['is_month_start'] = df_feat['date'].dt.is_month_start.astype(int)
            df_feat['is_month_end'] = df_feat['date'].dt.is_month_end.astype(int)
            df_feat['is_quarter_start'] = df_feat['date'].dt.is_quarter_start.astype(int)
            df_feat['is_quarter_end'] = df_feat['date'].dt.is_quarter_end.astype(int)
        
        # Lag features
        lag_periods = [1, 2, 3, 7, 30] if include_all else [1, 2, 3]
        for lag in lag_periods:
            if lag < len(df_feat):
                df_feat[f'lag_{lag}'] = df_feat['value'].shift(lag)
        
        # Rolling statistics
        windows = [3, 7, 30] if include_all else [3, 7]
        for window in windows:
            if window < len(df_feat):
                df_feat[f'rolling_mean_{window}'] = df_feat['value'].rolling(window=window, min_periods=1).mean()
                df_feat[f'rolling_std_{window}'] = df_feat['value'].rolling(window=window, min_periods=1).std().fillna(0)
                
                if include_all:
                    df_feat[f'rolling_min_{window}'] = df_feat['value'].rolling(window=window, min_periods=1).min()
                    df_feat[f'rolling_max_{window}'] = df_feat['value'].rolling(window=window, min_periods=1).max()
                    df_feat[f'rolling_median_{window}'] = df_feat['value'].rolling(window=window, min_periods=1).median()
        
        # Exponential moving average
        spans = [3, 7, 14] if include_all else [3, 7]
        for span in spans:
            if span < len(df_feat):
                df_feat[f'ema_{span}'] = df_feat['value'].ewm(span=span, adjust=False).mean()
        
        # Trend
        df_feat['trend'] = np.arange(len(df_feat))
        
        # Difference features (for stationarity)
        df_feat['diff_1'] = df_feat['value'].diff(1)
        if include_all:
            df_feat['diff_2'] = df_feat['value'].diff(2)
            df_feat['pct_change_1'] = df_feat['value'].pct_change(1).fillna(0)
        
        # Seasonal features (sine/cosine encoding for cyclical patterns)
        if include_all:
            # Monthly seasonality
            df_feat['month_sin'] = np.sin(2 * np.pi * df_feat['month'] / 12)
            df_feat['month_cos'] = np.cos(2 * np.pi * df_feat['month'] / 12)
            
            # Quarterly seasonality
            df_feat['quarter_sin'] = np.sin(2 * np.pi * df_feat['quarter'] / 4)
            df_feat['quarter_cos'] = np.cos(2 * np.pi * df_feat['quarter'] / 4)
        
        # Percentage change from rolling mean
        if include_all:
            for window in [7, 30]:
                if window < len(df_feat):
                    rolling_mean = df_feat['value'].rolling(window=window, min_periods=1).mean()
                    df_feat[f'pct_from_rolling_mean_{window}'] = ((df_feat['value'] - rolling_mean) / rolling_mean * 100).fillna(0)
        
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
        try:
            metadata_path = model_path.with_suffix('.metadata.json')
            # Ensure parent directory exists
            metadata_path.parent.mkdir(parents=True, exist_ok=True)
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, default=str, ensure_ascii=False)
            logger.debug(f"Saved model metadata to {metadata_path}")
        except Exception as e:
            logger.warning(f"Failed to save model metadata: {e}")
    
    @staticmethod
    def load_model_metadata(model_path: Path) -> Optional[Dict[str, Any]]:
        """Load model metadata"""
        try:
            metadata_path = model_path.with_suffix('.metadata.json')
            if metadata_path.exists():
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load model metadata from {model_path}: {e}")
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
    
    @staticmethod
    def compare_models(
        metadata_paths: List[Path]
    ) -> Dict[str, Any]:
        """
        Compare multiple model versions
        
        Args:
            metadata_paths: List of metadata file paths to compare
        
        Returns:
            Comparison report with best model identified
        """
        models_info = []
        
        for meta_path in metadata_paths:
            try:
                with open(meta_path, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                
                metrics = metadata.get('metrics', {})
                models_info.append({
                    'path': str(meta_path),
                    'model_type': metadata.get('model_type'),
                    'metric': metadata.get('metric'),
                    'trained_at': metadata.get('trained_at'),
                    'mae': metrics.get('mae'),
                    'rmse': metrics.get('rmse'),
                    'r2': metrics.get('r2'),
                    'mape': metrics.get('mape')
                })
            except Exception as e:
                logger.warning(f"Failed to load metadata from {meta_path}: {e}")
                continue
        
        if not models_info:
            return {"error": "No valid model metadata found"}
        
        # Find best model by RMSE (lower is better)
        best_model = min(models_info, key=lambda x: x.get('rmse', float('inf')) if x.get('rmse') else float('inf'))
        
        return {
            "models_compared": len(models_info),
            "best_model": best_model,
            "all_models": models_info,
            "comparison_date": datetime.now(timezone.utc).isoformat()
        }


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
    monitor: str = "val_loss",
    restore_best_weights: bool = True,
    reduce_lr: bool = True,
    verbose: int = 1
) -> List[Any]:
    """
    Create advanced callbacks for neural network training
    
    Args:
        patience: Number of epochs to wait before early stopping
        min_delta: Minimum change to qualify as improvement
        monitor: Metric to monitor
        restore_best_weights: Whether to restore best weights on stop
        reduce_lr: Whether to include learning rate reduction
        verbose: Verbosity level
    
    Returns:
        List of Keras callbacks (EarlyStopping, ReduceLROnPlateau, etc.)
    """
    if not TENSORFLOW_AVAILABLE:
        return []
    
    callbacks = []
    
    # Early stopping
    callbacks.append(
        EarlyStopping(
            monitor=monitor,
            patience=patience,
            min_delta=min_delta,
            restore_best_weights=restore_best_weights,
            verbose=verbose
        )
    )
    
    # Learning rate reduction
    if reduce_lr:
        callbacks.append(
            ReduceLROnPlateau(
                monitor=monitor,
                factor=0.5,
                patience=max(patience // 2, 3),
                min_lr=1e-7,
                verbose=verbose
            )
        )
    
    # Model checkpoint (optional, can be added if needed)
    # from tensorflow.keras.callbacks import ModelCheckpoint
    # callbacks.append(ModelCheckpoint(...))
    
    return callbacks


class ModelValidator:
    """Model validation and quality assessment utilities"""
    
    @staticmethod
    def validate_model_performance(
        y_true: np.ndarray,
        y_pred: np.ndarray,
        min_r2: float = 0.0,
        max_mape: float = 100.0,
        min_directional_accuracy: float = 50.0
    ) -> Dict[str, Any]:
        """
        Validate model performance against thresholds
        
        Args:
            y_true: True values
            y_pred: Predicted values
            min_r2: Minimum R² score required
            max_mape: Maximum MAPE allowed
            min_directional_accuracy: Minimum directional accuracy required
        
        Returns:
            Dictionary with validation results and pass/fail status
        """
        metrics = AdvancedEvaluationMetrics.calculate_all_metrics(y_true, y_pred)
        
        r2 = metrics.get('r2', -float('inf'))
        mape = metrics.get('mape', float('inf'))
        da = metrics.get('directional_accuracy', 0.0)
        
        validation = {
            'r2_pass': r2 >= min_r2,
            'mape_pass': mape <= max_mape if mape is not None else True,
            'directional_accuracy_pass': da >= min_directional_accuracy if da is not None else True,
            'r2': r2,
            'mape': mape,
            'directional_accuracy': da,
            'overall_pass': (
                r2 >= min_r2 and
                (mape is None or mape <= max_mape) and
                (da is None or da >= min_directional_accuracy)
            )
            }
        
        return validation
    
    @staticmethod
    def assess_model_quality(metrics: Dict[str, float]) -> Dict[str, Any]:
        """
        Assess model quality based on metrics
        
        Args:
            metrics: Dictionary of model metrics
        
        Returns:
            Quality assessment with grades and recommendations
        """
        r2 = metrics.get('r2', -float('inf'))
        mape = metrics.get('mape', float('inf'))
        mae = metrics.get('mae', float('inf'))
        rmse = metrics.get('rmse', float('inf'))
        
        # Grade R²
        if r2 >= 0.9:
            r2_grade = "Excellent"
        elif r2 >= 0.7:
            r2_grade = "Good"
        elif r2 >= 0.5:
            r2_grade = "Fair"
        elif r2 >= 0.3:
            r2_grade = "Poor"
        else:
            r2_grade = "Very Poor"
        
        # Grade MAPE
        if mape is None:
            mape_grade = "N/A"
        elif mape < 10:
            mape_grade = "Excellent"
        elif mape < 20:
            mape_grade = "Good"
        elif mape < 30:
            mape_grade = "Fair"
        elif mape < 50:
            mape_grade = "Poor"
        else:
            mape_grade = "Very Poor"
        
        # Overall assessment
        if r2 >= 0.7 and (mape is None or mape < 20):
            overall_quality = "Good"
            recommendation = "Model is ready for production use"
        elif r2 >= 0.5 and (mape is None or mape < 30):
            overall_quality = "Fair"
            recommendation = "Model can be used but consider retraining with more data or hyperparameter tuning"
        else:
            overall_quality = "Poor"
            recommendation = "Model needs improvement. Consider: more training data, feature engineering, or different model type"
        
        return {
            'r2_grade': r2_grade,
            'mape_grade': mape_grade,
            'overall_quality': overall_quality,
            'recommendation': recommendation,
            'metrics_summary': {
                'r2': r2,
                'mape': mape,
                'mae': mae,
                'rmse': rmse
            }
        }

