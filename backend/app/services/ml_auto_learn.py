# app/services/ml_auto_learn.py
"""
Auto-Learning Service
Automatically retrains AI models when users enter new data (expenses, revenue, etc.)
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)

from ..core.database import SessionLocal
from ..models.user import UserRole
from .ml_forecasting import MLForecastingService

# Track last training times and new data counts
_last_training_times: Dict[str, datetime] = {}
_new_data_counts: Dict[str, int] = {}

# Configuration
AUTO_LEARN_ENABLED = True  # Enable/disable auto-learning
MIN_NEW_DATA_POINTS = 10  # Minimum new data points before retraining
MIN_HOURS_BETWEEN_TRAINING = 24  # Minimum hours between retraining (to avoid excessive training)


def should_retrain(metric: str) -> bool:
    """Check if we should retrain models for a given metric"""
    if not AUTO_LEARN_ENABLED:
        return False
    
    # Check if we have enough new data points
    new_data_count = _new_data_counts.get(metric, 0)
    if new_data_count < MIN_NEW_DATA_POINTS:
        return False
    
    # Check if enough time has passed since last training
    last_training = _last_training_times.get(metric)
    if last_training:
        time_since_training = datetime.now(timezone.utc) - last_training
        if time_since_training.total_seconds() < MIN_HOURS_BETWEEN_TRAINING * 3600:
            return False
    
    return True


def record_new_data(metric: str, count: int = 1):
    """Record that new data has been added for a metric"""
    _new_data_counts[metric] = _new_data_counts.get(metric, 0) + count
    logger.debug(f"Recorded {count} new data points for {metric}. Total: {_new_data_counts.get(metric, 0)}")


def trigger_auto_learn(metric: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
    """
    Trigger automatic learning/retraining for a specific metric
    
    Args:
        metric: "expense", "revenue", or "inventory"
        db: Optional database session (creates new one if not provided)
    
    Returns:
        Training results dictionary or None if training wasn't triggered
    """
    if not should_retrain(metric):
        return None
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    
    try:
        logger.info(f"🔄 Auto-learning triggered for {metric} metric")
        
        # Calculate date range (last 2 years)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=730)  # 2 years
        
        # Train models based on metric
        results = None
        if metric == "expense":
            # Train expense models
            try:
                result = MLForecastingService.train_arima_expenses(
                    db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                )
                logger.info(f"✅ Auto-learned expense ARIMA: MAE={result.get('mae')}, RMSE={result.get('rmse')}")
            except Exception as e:
                logger.warning(f"⚠️ Auto-learn expense ARIMA failed: {str(e)}")
            
            # Try linear regression (simpler, more reliable)
            try:
                result = MLForecastingService.train_linear_regression_expenses(
                    db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                )
                logger.info(f"✅ Auto-learned expense Linear Regression: MAE={result.get('mae')}, RMSE={result.get('rmse')}")
            except Exception as e:
                logger.warning(f"⚠️ Auto-learn expense Linear Regression failed: {str(e)}")
                
        elif metric == "revenue":
            # Train revenue models
            try:
                result = MLForecastingService.train_xgboost_revenue(
                    db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                )
                logger.info(f"✅ Auto-learned revenue XGBoost: MAE={result.get('mae')}, RMSE={result.get('rmse')}")
            except Exception as e:
                logger.warning(f"⚠️ Auto-learn revenue XGBoost failed: {str(e)}")
                
            # Try linear regression
            try:
                # Note: Linear regression is only for expenses currently
                # Could add revenue linear regression if needed
                pass
            except Exception as e:
                logger.warning(f"⚠️ Auto-learn revenue Linear Regression failed: {str(e)}")
        
        # Update last training time and reset counter
        _last_training_times[metric] = datetime.now(timezone.utc)
        _new_data_counts[metric] = 0
        
        logger.info(f"✅ Auto-learning completed for {metric}")
        return results
        
    except Exception as e:
        logger.error(f"❌ Auto-learning failed for {metric}: {str(e)}", exc_info=True)
        return None
    finally:
        if close_db:
            db.close()


def trigger_auto_learn_background(metric: str):
    """
    Trigger auto-learning in background (for use with background tasks)
    This version doesn't require a DB session parameter
    """
    try:
        trigger_auto_learn(metric)
    except Exception as e:
        logger.error(f"Background auto-learning failed for {metric}: {str(e)}", exc_info=True)


def get_auto_learn_status() -> Dict[str, Any]:
    """Get current auto-learning status"""
    return {
        "enabled": AUTO_LEARN_ENABLED,
        "min_new_data_points": MIN_NEW_DATA_POINTS,
        "min_hours_between_training": MIN_HOURS_BETWEEN_TRAINING,
        "last_training_times": {
            metric: time.isoformat() if time else None
            for metric, time in _last_training_times.items()
        },
        "new_data_counts": _new_data_counts.copy(),
        "should_retrain": {
            metric: should_retrain(metric)
            for metric in ["expense", "revenue", "inventory"]
        }
    }


def reset_auto_learn_state(metric: Optional[str] = None):
    """Reset auto-learning state (for testing or manual reset)"""
    if metric:
        _new_data_counts[metric] = 0
        if metric in _last_training_times:
            del _last_training_times[metric]
    else:
        _new_data_counts.clear()
        _last_training_times.clear()

