from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
import enum

from ..core.database import Base

class IPStatus(str, enum.Enum):
    ALLOWED = "allowed"
    BLOCKED = "blocked"

class IPRestriction(Base):
    __tablename__ = "ip_restrictions"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(45), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)
    status = Column(Enum(IPStatus), default=IPStatus.ALLOWED, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
