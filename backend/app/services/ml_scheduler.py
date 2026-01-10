# app/services/ml_scheduler.py
"""
ML Model Training Scheduler
Automatically retrains AI models on a schedule with advanced features:
- Configurable scheduling per metric
- Integration with auto-learning service
- Multiple scheduling strategies
- Status tracking and reporting
- Flexible cron expressions
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, TYPE_CHECKING, Any, Dict, List
from sqlalchemy.orm import Session  # type: ignore[import-untyped]

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import-untyped]

try:
    from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import-untyped]
    from apscheduler.triggers.cron import CronTrigger  # type: ignore[import-untyped]
    from apscheduler.triggers.interval import IntervalTrigger  # type: ignore[import-untyped]
    APSCHEDULER_AVAILABLE = True
except ImportError as e:
    APSCHEDULER_AVAILABLE = False
    BackgroundScheduler = Any  # type: ignore[assignment, misc]
    CronTrigger = Any  # type: ignore[assignment, misc]
    IntervalTrigger = Any  # type: ignore[assignment, misc]
    logger.warning(f"APScheduler import failed: {e}. Scheduled training will be disabled.")

from ..core.database import SessionLocal
from ..models.user import UserRole
from .ml_forecasting import MLForecastingService
from .ml_auto_learn import trigger_auto_learn

# Configuration from environment variables
SCHEDULER_ENABLED = os.getenv("ML_SCHEDULER_ENABLED", "true").lower() == "true"
DEFAULT_RETRAIN_DAY = os.getenv("ML_SCHEDULER_DAY", "mon")  # Monday
DEFAULT_RETRAIN_HOUR = int(os.getenv("ML_SCHEDULER_HOUR", "2"))  # 2 AM
DEFAULT_RETRAIN_MINUTE = int(os.getenv("ML_SCHEDULER_MINUTE", "0"))

# Global scheduler instance
_scheduler: Optional[Any] = None
_scheduled_jobs: Dict[str, str] = {}  # Track job IDs


def get_scheduler() -> Optional[Any]:
    """Get or create the global scheduler instance"""
    global _scheduler
    
    if not APSCHEDULER_AVAILABLE:
        logger.warning("APScheduler not available. Scheduled training disabled.")
        return None
    
    if not SCHEDULER_ENABLED:
        logger.info("ML Scheduler disabled via configuration")
        return None
    
    if _scheduler is None:
        try:
            _scheduler = BackgroundScheduler()
            _scheduler.start()
            logger.info("ML Training Scheduler started")
        except Exception as e:
            logger.error(f"Failed to start scheduler: {e}", exc_info=True)
            return None
    
    return _scheduler


def schedule_model_retraining(
    hour: int = DEFAULT_RETRAIN_HOUR,
    minute: int = DEFAULT_RETRAIN_MINUTE,
    day_of_week: str = DEFAULT_RETRAIN_DAY,
    use_auto_learn: bool = True
):
    """
    Schedule automatic model retraining
    
    Args:
        hour: Hour of day (0-23)
        minute: Minute of hour (0-59)
        day_of_week: Day of week ("mon", "tue", "wed", "thu", "fri", "sat", "sun") or "daily"
        use_auto_learn: If True, uses auto-learn service (trains multiple models, selects best)
                       If False, uses train_all_models (trains all models)
    
    Returns:
        True if scheduling successful, False otherwise
    """
    scheduler = get_scheduler()
    if not scheduler:
        return False
    
    try:
        job_id = 'retrain_all_models'
        job_func = retrain_all_models_auto_learn if use_auto_learn else retrain_all_models
        
        # Remove existing job if any
        try:
            scheduler.remove_job(job_id)
            if job_id in _scheduled_jobs:
                del _scheduled_jobs[job_id]
        except:
            pass
        
        # Handle daily scheduling
        if day_of_week.lower() == "daily":
            trigger = CronTrigger(hour=hour, minute=minute)
            schedule_desc = f"daily at {hour:02d}:{minute:02d}"
        else:
            trigger = CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute)
            schedule_desc = f"{day_of_week} at {hour:02d}:{minute:02d}"
        
        # Add new job
        scheduler.add_job(
            job_func,
            trigger=trigger,
            id=job_id,
            name='Retrain All ML Models',
            replace_existing=True,
            misfire_grace_time=3600  # 1 hour grace period for missed jobs
        )
        
        _scheduled_jobs[job_id] = schedule_desc
        method = "auto-learn" if use_auto_learn else "full training"
        logger.info(f"Model retraining scheduled ({method}) for {schedule_desc}")
        return True
    except Exception as e:
        logger.error(f"Failed to schedule model retraining: {str(e)}", exc_info=True)
        return False


def schedule_metric_retraining(
    metric: str,
    hour: int = DEFAULT_RETRAIN_HOUR,
    minute: int = DEFAULT_RETRAIN_MINUTE,
    day_of_week: str = DEFAULT_RETRAIN_DAY,
    use_auto_learn: bool = True
):
    """
    Schedule retraining for a specific metric
    
    Args:
        metric: "expense", "revenue", or "inventory"
        hour: Hour of day (0-23)
        minute: Minute of hour (0-59)
        day_of_week: Day of week or "daily"
        use_auto_learn: Use auto-learn service
    
    Returns:
        True if scheduling successful
    """
    scheduler = get_scheduler()
    if not scheduler:
        return False
    
    if metric not in ["expense", "revenue", "inventory"]:
        logger.error(f"Invalid metric: {metric}")
        return False
    
    try:
        job_id = f'retrain_{metric}_models'
        job_func = lambda: retrain_metric_models(metric, use_auto_learn)
        
        # Remove existing job if any
        try:
            scheduler.remove_job(job_id)
            if job_id in _scheduled_jobs:
                del _scheduled_jobs[job_id]
        except:
            pass
        
        # Handle daily scheduling
        if day_of_week.lower() == "daily":
            trigger = CronTrigger(hour=hour, minute=minute)
            schedule_desc = f"daily at {hour:02d}:{minute:02d}"
        else:
            trigger = CronTrigger(day_of_week=day_of_week, hour=hour, minute=minute)
            schedule_desc = f"{day_of_week} at {hour:02d}:{minute:02d}"
        
        scheduler.add_job(
            job_func,
            trigger=trigger,
            id=job_id,
            name=f'Retrain {metric.capitalize()} Models',
            replace_existing=True,
            misfire_grace_time=3600
        )
        
        _scheduled_jobs[job_id] = schedule_desc
        method = "auto-learn" if use_auto_learn else "full training"
        logger.info(f"{metric.capitalize()} model retraining scheduled ({method}) for {schedule_desc}")
        return True
    except Exception as e:
        logger.error(f"Failed to schedule {metric} retraining: {str(e)}", exc_info=True)
        return False


def retrain_all_models():
    """Retrain all models using train_all_models (called by scheduler)"""
    logger.info("Starting scheduled full model retraining...")
    
    db = SessionLocal()
    try:
        # Calculate date range (last 2-3 years depending on metric)
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=730)  # 2 years
        
        logger.info(f"Training period: {start_date.date()} to {end_date.date()}")
        
        # Train all models
        results = MLForecastingService.train_all_models(
            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN
        )
        
        # Log results
        success_count = 0
        error_count = len(results.get("errors", []))
        
        for metric in ["expense", "revenue", "inventory"]:
            metric_key = metric + "s" if metric == "expense" else metric
            for model_type, result in results.get(metric_key, {}).items():
                if result.get("status") == "trained":
                    success_count += 1
                    logger.info(
                        f"[OK] {metric} {model_type}: MAE={result.get('mae')}, "
                        f"RMSE={result.get('rmse')}, Data Points={result.get('data_points')}"
                    )
        
        logger.info(
            f"Scheduled model retraining completed: {success_count} models trained, "
            f"{error_count} errors"
        )
        
        # Notify admins about completion
        try:
            from .notification_service import NotificationService
            from ..models.notification import NotificationType, NotificationPriority
            
            message = f"Scheduled ML training completed. {success_count} models trained successfully."
            if error_count > 0:
                message += f" {error_count} errors occurred."
            
            NotificationService.notify_by_role(
                db=db,
                roles=[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
                title="ML Model Training Completed",
                message=message,
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.MEDIUM if error_count == 0 else NotificationPriority.HIGH,
                action_url="/ml-training"
            )
        except Exception as notif_err:
             logger.error(f"Failed to send ML completion notification: {notif_err}")

        return results
        
    except Exception as e:
        logger.error(f"Scheduled model retraining failed: {str(e)}", exc_info=True)
        # Notify about failure
        try:
            from .notification_service import NotificationService
            from ..models.notification import NotificationType, NotificationPriority
            NotificationService.notify_by_role(
                db=db,
                roles=[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
                title="ML Model Training Failed",
                message=f"Scheduled training failed: {str(e)}",
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.HIGH,
                action_url="/ml-training"
            )
        except:
            pass
        return None
    finally:
        db.close()


def retrain_all_models_auto_learn():
    """Retrain all models using auto-learn service (trains multiple models, selects best)"""
    logger.info("Starting scheduled auto-learn model retraining...")
    
    results = {}
    
    for metric in ["expense", "revenue", "inventory"]:
        try:
            logger.info(f"Auto-learning {metric} models...")
            result = trigger_auto_learn(metric)
            if result:
                results[metric] = result
                models_trained = len(result.get('trained_models', []))
                best_model = result.get('best_model_type')
                best_rmse = result.get('best_model', {}).get('rmse') if result.get('best_model') else None
                
                if result.get('model_saved'):
                    logger.info(
                        f"[OK] {metric}: {models_trained} models trained, "
                        f"best={best_model} (RMSE={best_rmse:.2f}), saved={True}"
                    )
                else:
                    logger.info(
                        f"[INFO] {metric}: {models_trained} models trained, "
                        f"best={best_model} (RMSE={best_rmse:.2f}), kept existing model"
                    )
        except Exception as e:
            logger.error(f"[ERROR] Auto-learn failed for {metric}: {str(e)}", exc_info=True)
            results[metric] = {"error": str(e)}
    
    logger.info("Scheduled auto-learn retraining completed")
    
    # Notify admins
    try:
        from .notification_service import NotificationService
        from ..models.notification import NotificationType, NotificationPriority
        from ..core.database import SessionLocal
        
        db = SessionLocal()
        try:
            success_count = len([r for r in results.values() if "best_model" in r])
            error_count = len([r for r in results.values() if "error" in r])
            
            message = f"Auto-learn training completed. {success_count} metrics optimized."
            if error_count > 0:
                message += f" {error_count} errors."
                
            NotificationService.notify_by_role(
                db=db,
                roles=[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
                title="Auto-Learn Training Completed",
                message=message,
                notification_type=NotificationType.SYSTEM_ALERT,
                priority=NotificationPriority.MEDIUM,
                action_url="/ml-training"
            )
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to send auto-learn notification: {e}")

    return results


def retrain_metric_models(metric: str, use_auto_learn: bool = True):
    """Retrain models for a specific metric"""
    logger.info(f"Starting scheduled retraining for {metric}...")
    
    try:
        if use_auto_learn:
            result = trigger_auto_learn(metric)
            if result:
                models_trained = len(result.get('trained_models', []))
                best_model = result.get('best_model_type')
                saved = result.get('model_saved', False)
                logger.info(f"[OK] {metric}: {models_trained} models trained, best={best_model}, saved={saved}")
            return result
        else:
            # Use train_all_models for specific metric
            db = SessionLocal()
            try:
                end_date = datetime.now(timezone.utc)
                start_date = end_date - timedelta(days=730 if metric != "inventory" else 1095)
                
                # Train specific metric models
                metric_key = metric + "s" if metric == "expense" else metric
                
                if metric == "expense":
                    results = {
                        "arima": MLForecastingService.train_arima_expenses(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        ),
                        "linear_regression": MLForecastingService.train_linear_regression_expenses(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    }
                elif metric == "revenue":
                    results = {
                        "xgboost": MLForecastingService.train_xgboost_revenue(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        ),
                        "prophet": MLForecastingService.train_prophet_revenue(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    }
                elif metric == "inventory":
                    results = {
                        "sarima": MLForecastingService.train_sarima_inventory(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        ),
                        "xgboost": MLForecastingService.train_xgboost_inventory(
                            db, start_date, end_date, user_id=None, user_role=UserRole.ADMIN, save_model=True
                        )
                    }
                
                logger.info(f"[OK] {metric}: {len(results)} models trained")
                
                # Notify about specific metric training
                try:
                    from .notification_service import NotificationService
                    from ..models.notification import NotificationType
                    
                    NotificationService.notify_by_role(
                        db=db,
                        roles=[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
                        title=f"{metric.capitalize()} Models Retrained",
                        message=f"All models for {metric} have been successfully retrained.",
                        notification_type=NotificationType.SYSTEM_ALERT,
                        action_url="/ml-training"
                    )
                except Exception as e:
                    logger.error(f"Failed to send metric notification: {e}")
                
                return results
            finally:
                db.close()
    except Exception as e:
        logger.error(f"[ERROR] Scheduled {metric} retraining failed: {str(e)}", exc_info=True)
        return None


def start_scheduler(use_auto_learn: bool = True):
    """
    Start the scheduler with default settings
    
    Args:
        use_auto_learn: If True, uses auto-learn service (default). If False, uses train_all_models
    """
    scheduler = get_scheduler()
    if scheduler:
        # Schedule retraining every Monday (or configured day) at configured time
        success = schedule_model_retraining(
            hour=DEFAULT_RETRAIN_HOUR,
            minute=DEFAULT_RETRAIN_MINUTE,
            day_of_week=DEFAULT_RETRAIN_DAY,
            use_auto_learn=use_auto_learn
        )
        return success
    return False


def stop_scheduler():
    """Stop the scheduler and clear all jobs"""
    global _scheduler, _scheduled_jobs
    
    if _scheduler:
        try:
            # Remove all scheduled jobs
            for job_id in list(_scheduled_jobs.keys()):
                try:
                    _scheduler.remove_job(job_id)
                except:
                    pass
            
            _scheduled_jobs.clear()
            _scheduler.shutdown()
            _scheduler = None
            logger.info("ML Training Scheduler stopped")
            return True
        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}", exc_info=True)
            return False
    return False


def get_scheduler_status() -> Dict[str, Any]:
    """Get current scheduler status and scheduled jobs"""
    scheduler = get_scheduler()
    
    status = {
        "enabled": SCHEDULER_ENABLED,
        "apscheduler_available": APSCHEDULER_AVAILABLE,
        "scheduler_running": scheduler is not None and scheduler.running if scheduler else False,
        "scheduled_jobs": {},
        "configuration": {
            "default_day": DEFAULT_RETRAIN_DAY,
            "default_hour": DEFAULT_RETRAIN_HOUR,
            "default_minute": DEFAULT_RETRAIN_MINUTE
        }
    }
    
    if scheduler:
        try:
            jobs = scheduler.get_jobs()
            for job in jobs:
                status["scheduled_jobs"][job.id] = {
                    "name": job.name,
                    "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                    "trigger": str(job.trigger)
                }
        except Exception as e:
            logger.warning(f"Failed to get scheduler jobs: {e}")
            status["error"] = str(e)
    
    return status


def pause_scheduler():
    """Pause the scheduler (jobs won't run but scheduler stays active)"""
    scheduler = get_scheduler()
    if scheduler:
        scheduler.pause()
        logger.info("ML Training Scheduler paused")
        return True
    return False


def resume_scheduler():
    """Resume the scheduler"""
    scheduler = get_scheduler()
    if scheduler:
        scheduler.resume()
        logger.info("ML Training Scheduler resumed")
        return True
    return False


def remove_job(job_id: str) -> bool:
    """Remove a specific scheduled job"""
    scheduler = get_scheduler()
    if scheduler:
        try:
            scheduler.remove_job(job_id)
            if job_id in _scheduled_jobs:
                del _scheduled_jobs[job_id]
            logger.info(f"Removed scheduled job: {job_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to remove job {job_id}: {e}")
            return False
    return False

