# app/services/ml_scheduler.py
"""
ML Model Training Scheduler
Automatically retrains AI models on a schedule
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session  # type: ignore[import-untyped]

try:
    from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import-untyped]
    from apscheduler.triggers.cron import CronTrigger  # type: ignore[import-untyped]
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False

from ..core.database import SessionLocal
from ..models.user import UserRole
from .ml_forecasting import MLForecastingService

logger = logging.getLogger(__name__)

# Global scheduler instance
_scheduler: Optional[BackgroundScheduler] = None


def get_scheduler() -> Optional[BackgroundScheduler]:
    """Get or create the global scheduler instance"""
    global _scheduler
    
    if not APSCHEDULER_AVAILABLE:
        logger.warning("APScheduler not available. Scheduled training disabled.")
        return None
    
    if _scheduler is None:
        _scheduler = BackgroundScheduler()
        _scheduler.start()
        logger.info("ML Training Scheduler started")
    
    return _scheduler


def schedule_model_retraining(
    hour: int = 2,  # 2 AM
    minute: int = 0,
    day_of_week: str = "mon"  # Every Monday
):
    """Schedule automatic model retraining"""
    scheduler = get_scheduler()
    if not scheduler:
        return False
    
    try:
        # Remove existing job if any
        try:
            scheduler.remove_job('retrain_all_models')
        except:
            pass
        
        # Add new job
        scheduler.add_job(
            retrain_all_models,
            trigger=CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute),
            id='retrain_all_models',
            name='Retrain All ML Models',
            replace_existing=True
        )
        
        logger.info(f"Model retraining scheduled for {day_of_week} at {hour:02d}:{minute:02d}")
        return True
    except Exception as e:
        logger.error(f"Failed to schedule model retraining: {str(e)}", exc_info=True)
        return False


def retrain_all_models():
    """Retrain all models (called by scheduler)"""
    logger.info("Starting scheduled model retraining...")
    
    db = SessionLocal()
    try:
        # Calculate date range (last 2 years)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=730)  # 2 years
        
        logger.info(f"Training period: {start_date.date()} to {end_date.date()}")
        
        # Train all models
        results = MLForecastingService.train_all_models(
            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
        )
        
        # Log results
        success_count = 0
        error_count = len(results.get("errors", []))
        
        for metric in ["expenses", "revenue", "inventory"]:
            for model_type, result in results.get(metric, {}).items():
                if result.get("status") == "trained":
                    success_count += 1
                    logger.info(
                        f"✅ {metric} {model_type}: MAE={result.get('mae')}, "
                        f"RMSE={result.get('rmse')}, Data Points={result.get('data_points')}"
                    )
        
        logger.info(
            f"Model retraining completed: {success_count} models trained, "
            f"{error_count} errors"
        )
        
        return results
        
    except Exception as e:
        logger.error(f"Scheduled model retraining failed: {str(e)}", exc_info=True)
        return None
    finally:
        db.close()


def start_scheduler():
    """Start the scheduler with default settings"""
    scheduler = get_scheduler()
    if scheduler:
        # Schedule retraining every Monday at 2 AM
        schedule_model_retraining(hour=2, minute=0, day_of_week="mon")
        return True
    return False


def stop_scheduler():
    """Stop the scheduler"""
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None
        logger.info("ML Training Scheduler stopped")
        return True
    return False

