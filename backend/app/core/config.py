
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:amare@localhost/finance_db"
    #  DATABASE_URL: str = "postgresql://postgres:amare@localhost/finance_db"
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # S3 (for backups)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "eu-north-1"
    
    # Application
    APP_NAME: str = "Finance Management System"
    DEBUG: bool = False
    VERSION: str = "1.0.0"
    
    # CORS and Hosts
    ALLOWED_ORIGINS: Optional[str] = "*"
    ALLOWED_HOSTS: Optional[str] = "localhost,127.0.0.1"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: Optional[str] = "logs/app.log"
    
    # Celery
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    # Add these for .env extras (prevents validation errors)
    RATE_LIMIT_PER_MINUTE: int = 60
    MAX_FILE_SIZE: int = 10485760
    REPORT_RETENTION_DAYS: int = 30
    BACKUP_RETENTION_DAYS: int = 90
    AUTO_BACKUP_ENABLED: bool = True
    AUTO_BACKUP_SCHEDULE: str = "0 2 * * *"
    HEALTH_CHECK_ENABLED: bool = True
    METRICS_ENABLED: bool = False
    UPLOAD_DIR: str = "uploads"
    REPORTS_DIR: str = "reports"
    BACKUP_DIR: str = "backups"
    
    class Config:
        env_file = ".env"

settings = Settings()