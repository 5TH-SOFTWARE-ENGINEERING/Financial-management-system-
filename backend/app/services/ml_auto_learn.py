# app/services/ml_auto_learn.py
"""
Auto-Learning Service
Automatically retrains AI models when users enter new data (expenses, revenue, inventory, etc.)
Features:
- Automatic model retraining when sufficient new data is available
- Model quality validation before replacing existing models
- Support for multiple model types per metric
- Persistent state tracking
- Integration with advanced training features
- Configurable thresholds and settings
"""

import os
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
from pathlib import Path
from sqlalchemy.orm import Session  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)

from ..core.database import SessionLocal
from ..models.user import UserRole
from .ml_forecasting import MLForecastingService

# Configuration - can be overridden by environment variables
AUTO_LEARN_ENABLED = os.getenv("AUTO_LEARN_ENABLED", "true").lower() == "true"
MIN_NEW_DATA_POINTS = int(os.getenv("AUTO_LEARN_MIN_DATA_POINTS", "10"))
MIN_HOURS_BETWEEN_TRAINING = int(os.getenv("AUTO_LEARN_MIN_HOURS", "24"))
MIN_MODEL_IMPROVEMENT_PCT = float(os.getenv("AUTO_LEARN_MIN_IMPROVEMENT", "5.0"))  # Minimum 5% improvement to replace model
STATE_FILE = Path(__file__).parent.parent.parent / "store" / "auto_learn_state.json"

# Track last training times, new data counts, and training history
_last_training_times: Dict[str, datetime] = {}
_new_data_counts: Dict[str, int] = {}
_training_history: List[Dict[str, Any]] = []

# Load persistent state
def _load_state():
    """Load auto-learning state from file"""
    global _last_training_times, _new_data_counts, _training_history
    try:
        if STATE_FILE.exists():
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                state = json.load(f)
                _last_training_times = {
                    k: datetime.fromisoformat(v) if v else None
                    for k, v in state.get('last_training_times', {}).items()
                }
                _new_data_counts = state.get('new_data_counts', {})
                _training_history = state.get('training_history', [])
                logger.debug(f"Loaded auto-learn state from {STATE_FILE}")
    except Exception as e:
        logger.warning(f"Failed to load auto-learn state: {e}")

def _save_state():
    """Save auto-learning state to file"""
    try:
        STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
        state = {
            'last_training_times': {
                k: v.isoformat() if v else None
                for k, v in _last_training_times.items()
            },
            'new_data_counts': _new_data_counts.copy(),
            'training_history': _training_history[-100:],  # Keep last 100 training records
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, indent=2, default=str)
        logger.debug(f"Saved auto-learn state to {STATE_FILE}")
    except Exception as e:
        logger.warning(f"Failed to save auto-learn state: {e}")

# Load state on module import
_load_state()


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
    _save_state()


def _compare_models(old_result: Optional[Dict[str, Any]], new_result: Dict[str, Any]) -> bool:
    """
    Compare old and new model performance to decide if new model should replace old
    
    Args:
        old_result: Old model training result (None if no existing model)
        new_result: New model training result
    
    Returns:
        True if new model should replace old model
    """
    if old_result is None:
        # No existing model, accept new one
        return True
    
    old_rmse = old_result.get('rmse')
    new_rmse = new_result.get('rmse')
    
    if old_rmse is None or new_rmse is None:
        # Can't compare, accept new model
        return True
    
    # Calculate improvement percentage
    improvement_pct = ((old_rmse - new_rmse) / old_rmse) * 100
    
    # Accept if improvement is significant
    should_replace = improvement_pct >= MIN_MODEL_IMPROVEMENT_PCT
    
    if should_replace:
        logger.info(f"Model improvement: {improvement_pct:.2f}% (RMSE: {old_rmse:.2f} → {new_rmse:.2f})")
    else:
        logger.info(f"Insufficient model improvement: {improvement_pct:.2f}% (needs {MIN_MODEL_IMPROVEMENT_PCT}%). Keeping old model.")
    
    return should_replace


def _train_multiple_models(
    metric: str,
    db: Session,
    start_date: datetime,
    end_date: datetime
) -> Dict[str, Any]:
    """
    Train multiple model types for a metric and return best performing one
    
    Args:
        metric: Metric name ("expense", "revenue", "inventory")
        db: Database session
        start_date: Training start date
        end_date: Training end date
    
    Returns:
        Dictionary with training results for all attempted models
    """
    results = {
        'metric': metric,
        'trained_models': [],
        'best_model': None,
        'training_started': datetime.now(timezone.utc).isoformat()
    }
    
    # Define model training configurations for each metric
    training_configs = {
        "expense": [
            ("arima", lambda: MLForecastingService.train_arima_expenses(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
            ("linear_regression", lambda: MLForecastingService.train_linear_regression_expenses(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
            ("prophet", lambda: MLForecastingService.train_prophet_expenses(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
        ],
        "revenue": [
            ("xgboost", lambda: MLForecastingService.train_xgboost_revenue(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
            ("prophet", lambda: MLForecastingService.train_prophet_revenue(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
            ("lstm", lambda: MLForecastingService.train_lstm_revenue(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
        ],
        "inventory": [
            ("sarima", lambda: MLForecastingService.train_sarima_inventory(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
            ("xgboost", lambda: MLForecastingService.train_xgboost_inventory(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
            ("lstm", lambda: MLForecastingService.train_lstm_inventory(
                db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=False
            )),
        ]
    }
    
    configs = training_configs.get(metric, [])
    best_rmse = float('inf')
    
    for model_type, train_func in configs:
        try:
            logger.info(f"Training {metric} {model_type} model...")
            result = train_func()
            
            if result and result.get('status') == 'trained':
                rmse = result.get('rmse')
                mae = result.get('mae')
                
                model_result = {
                    'model_type': model_type,
                    'status': 'trained',
                    'rmse': rmse,
                    'mae': mae,
                    'r2': result.get('r2'),
                    'mape': result.get('mape'),
                    'data_points': result.get('data_points')
                }
                
                results['trained_models'].append(model_result)
                
                # Track best model by RMSE
                if rmse is not None and rmse < best_rmse:
                    best_rmse = rmse
                    results['best_model'] = model_result
                    results['best_model_type'] = model_type
                
                logger.info(f"✅ Trained {metric} {model_type}: RMSE={rmse:.2f}, MAE={mae:.2f}")
            else:
                logger.warning(f"⚠️ {metric} {model_type} training failed or returned no results")
                
        except Exception as e:
            error_msg = str(e)
            if "Insufficient data" not in error_msg:
                logger.warning(f"⚠️ {metric} {model_type} training failed: {error_msg}")
            else:
                logger.debug(f"{metric} {model_type} skipped: {error_msg}")
    
    results['training_completed'] = datetime.now(timezone.utc).isoformat()
    return results


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
        logger.debug(f"Auto-learning skipped for {metric}: conditions not met")
        return None
    
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    
    try:
        logger.info(f"🔄 Auto-learning triggered for {metric} metric")
        
        # Calculate date range (last 2 years, or 3 years if inventory for more data)
        end_date = datetime.now(timezone.utc)
        days_back = 1095 if metric == "inventory" else 730  # 3 years for inventory, 2 for others
        start_date = end_date - timedelta(days=days_back)
        
        # Get existing model performance for comparison
        existing_models = MLForecastingService.get_trained_models(metric=metric)
        old_best_result = None
        if existing_models:
            # Find best existing model
            best_existing = min(
                (m for m in existing_models.values() if m.get('exists') and m.get('metrics', {}).get('rmse')),
                key=lambda x: x.get('metrics', {}).get('rmse', float('inf')),
                default=None
            )
            if best_existing:
                old_best_result = {
                    'model_type': best_existing.get('model_type'),
                    'rmse': best_existing.get('metrics', {}).get('rmse'),
                    'mae': best_existing.get('metrics', {}).get('mae')
                }
        
        # Train multiple models and select best
        training_results = _train_multiple_models(metric, db, start_date, end_date)
        
        if not training_results.get('trained_models'):
            logger.warning(f"⚠️ No models successfully trained for {metric}")
            return None
        
        best_new_result = training_results.get('best_model')
        
        # Compare with existing model and save if better
        if best_new_result and _compare_models(old_best_result, best_new_result):
            # Save the best model
            best_model_type = training_results.get('best_model_type')
            logger.info(f"💾 Saving best {metric} model: {best_model_type} (RMSE={best_new_result.get('rmse'):.2f})")
            
            # Retrain and save the best model
            try:
                if metric == "expense":
                    if best_model_type == "arima":
                        final_result = MLForecastingService.train_arima_expenses(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    elif best_model_type == "linear_regression":
                        final_result = MLForecastingService.train_linear_regression_expenses(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    elif best_model_type == "prophet":
                        final_result = MLForecastingService.train_prophet_expenses(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                elif metric == "revenue":
                    if best_model_type == "xgboost":
                        final_result = MLForecastingService.train_xgboost_revenue(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    elif best_model_type == "prophet":
                        final_result = MLForecastingService.train_prophet_revenue(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    elif best_model_type == "lstm":
                        final_result = MLForecastingService.train_lstm_revenue(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                elif metric == "inventory":
                    if best_model_type == "sarima":
                        final_result = MLForecastingService.train_sarima_inventory(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    elif best_model_type == "xgboost":
                        final_result = MLForecastingService.train_xgboost_inventory(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    elif best_model_type == "lstm":
                        final_result = MLForecastingService.train_lstm_inventory(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                
                training_results['model_saved'] = True
                training_results['saved_model_type'] = best_model_type
                logger.info(f"✅ Best {metric} model ({best_model_type}) saved successfully")
            except Exception as e:
                logger.error(f"❌ Failed to save best {metric} model: {str(e)}")
                training_results['model_saved'] = False
                training_results['save_error'] = str(e)
        else:
            logger.info(f"📊 Keeping existing {metric} model (new models didn't show sufficient improvement)")
            training_results['model_saved'] = False
            training_results['reason'] = "Insufficient improvement"
        
        # Record training history
        history_entry = {
            'metric': metric,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'new_data_points': _new_data_counts.get(metric, 0),
            'models_trained': len(training_results.get('trained_models', [])),
            'best_model_type': training_results.get('best_model_type'),
            'best_rmse': best_new_result.get('rmse') if best_new_result else None,
            'model_saved': training_results.get('model_saved', False),
            'old_rmse': old_best_result.get('rmse') if old_best_result else None
        }
        _training_history.append(history_entry)
        
        # Update last training time and reset counter
        _last_training_times[metric] = datetime.now(timezone.utc)
        _new_data_counts[metric] = 0
        _save_state()
        
        logger.info(f"✅ Auto-learning completed for {metric}: {len(training_results.get('trained_models', []))} models trained")
        return training_results
        
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
    """Get current auto-learning status and statistics"""
    return {
        "enabled": AUTO_LEARN_ENABLED,
        "configuration": {
            "min_new_data_points": MIN_NEW_DATA_POINTS,
            "min_hours_between_training": MIN_HOURS_BETWEEN_TRAINING,
            "min_model_improvement_pct": MIN_MODEL_IMPROVEMENT_PCT,
            "state_file": str(STATE_FILE)
        },
        "last_training_times": {
            metric: time.isoformat() if time else None
            for metric, time in _last_training_times.items()
        },
        "new_data_counts": _new_data_counts.copy(),
        "should_retrain": {
            metric: should_retrain(metric)
            for metric in ["expense", "revenue", "inventory"]
        },
        "training_history": {
            "total_trainings": len(_training_history),
            "recent_trainings": _training_history[-10:] if _training_history else []
        },
        "next_retrain_estimates": {
            metric: _estimate_next_retrain_time(metric)
            for metric in ["expense", "revenue", "inventory"]
        }
    }


def _estimate_next_retrain_time(metric: str) -> Optional[str]:
    """Estimate when next retraining might occur for a metric"""
    if not AUTO_LEARN_ENABLED:
        return None
    
    last_training = _last_training_times.get(metric)
    new_data_count = _new_data_counts.get(metric, 0)
    
    if new_data_count >= MIN_NEW_DATA_POINTS:
        # Has enough data, check time constraint
        if last_training:
            time_since = datetime.now(timezone.utc) - last_training
            hours_since = time_since.total_seconds() / 3600
            if hours_since >= MIN_HOURS_BETWEEN_TRAINING:
                return "ready_now"
            else:
                hours_remaining = MIN_HOURS_BETWEEN_TRAINING - hours_since
                next_time = datetime.now(timezone.utc) + timedelta(hours=hours_remaining)
                return f"in_{hours_remaining:.1f}_hours ({next_time.isoformat()})"
        else:
            return "ready_now"
    else:
        # Needs more data
        data_needed = MIN_NEW_DATA_POINTS - new_data_count
        return f"needs_{data_needed}_more_data_points"


def reset_auto_learn_state(metric: Optional[str] = None, clear_history: bool = False):
    """Reset auto-learning state (for testing or manual reset)"""
    global _new_data_counts, _last_training_times, _training_history
    
    if metric:
        _new_data_counts[metric] = 0
        if metric in _last_training_times:
            del _last_training_times[metric]
        if clear_history:
            _training_history = [h for h in _training_history if h.get('metric') != metric]
    else:
        _new_data_counts.clear()
        _last_training_times.clear()
        if clear_history:
            _training_history.clear()
    
    _save_state()
    logger.info(f"Auto-learn state reset for {metric or 'all metrics'}")


def get_training_statistics() -> Dict[str, Any]:
    """Get detailed training statistics"""
    if not _training_history:
        return {"message": "No training history available"}
    
    # Group by metric
    by_metric = {}
    for entry in _training_history:
        metric = entry.get('metric')
        if metric not in by_metric:
            by_metric[metric] = []
        by_metric[metric].append(entry)
    
    stats = {}
    for metric, entries in by_metric.items():
        successful = [e for e in entries if e.get('model_saved', False)]
        stats[metric] = {
            "total_trainings": len(entries),
            "successful_updates": len(successful),
            "success_rate": (len(successful) / len(entries) * 100) if entries else 0,
            "avg_models_trained_per_session": sum(e.get('models_trained', 0) for e in entries) / len(entries) if entries else 0,
            "last_training": entries[-1].get('timestamp') if entries else None,
            "best_rmse_achieved": min(
                (e.get('best_rmse') for e in entries if e.get('best_rmse') is not None),
                default=None
            )
        }
    
    return {
        "summary": {
            "total_training_sessions": len(_training_history),
            "metrics_trained": list(by_metric.keys()),
            "overall_success_rate": (
                sum(1 for e in _training_history if e.get('model_saved', False)) / len(_training_history) * 100
                if _training_history else 0
            )
        },
        "by_metric": stats
    }

