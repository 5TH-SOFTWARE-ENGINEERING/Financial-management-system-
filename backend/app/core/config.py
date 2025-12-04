from pydantic_settings import BaseSettings, SettingsConfigDict  # type: ignore
from typing import Optional
from pathlib import Path

# Get the backend directory (parent of app/)
BASE_DIR = Path(__file__).parent.parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else None,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_ignore_empty=True,
        env_nested_delimiter="__"
    )
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:amare@localhost/finance_db"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email Configuration
    # Note: Port 465 uses SSL automatically, port 587 uses STARTTLS
    # The email service auto-detects based on port number
    SMTP_HOST: str = "smtp-relay.brevo.com" 
    SMTP_PORT: int = 587  # Changed to 465 (SSL) to avoid firewall blocking on port 587
    SMTP_USER: str = "9d2610001@smtp-brevo.com"
    SMTP_PASSWORD: str = "xsmtpsib-617f403b1a19eea33ca9a5aaa11c74151aaf28069bff165c4d8bf6bf95ef9659-rhHDr4QIkfIgMaqE"
    SMTP_FROM_EMAIL: str = "honeycursor@gmail.com"
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # S3 (for backups)
    AWS_ACCESS_KEY_ID: str = "AKIAYJ67W4DKWU74AK6X"
    AWS_SECRET_ACCESS_KEY: str = "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"
    AWS_BUCKET_NAME: str = "my-finance-app-backups"
    AWS_REGION: str = "eu-north-1"
    
    # Application
    APP_NAME: str = "Finance Management System"
    DEBUG: bool = True  # Set to False in production
    VERSION: str = "1.0.0"
    
    # CORS and Hosts
    ALLOWED_ORIGINS: Optional[str] = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000"
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

settings = Settings()