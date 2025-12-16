from sqlalchemy import create_engine # type: ignore[import-untyped]
from sqlalchemy.ext.declarative import declarative_base # type: ignore[import-untyped]
from sqlalchemy.orm import sessionmaker # type: ignore[import-untyped]
from sqlalchemy.pool import StaticPool # type: ignore[import-untyped]

from .config import settings


engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all database tables."""
    Base.metadata.drop_all(bind=engine)
