# app/models/login_history.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
from sqlalchemy.orm import relationship # type: ignore[import-untyped]

from ..core.database import Base


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 max length is 45
    user_agent = Column(Text, nullable=True)  # User agent string can be long
    device = Column(String(255), nullable=True)  # Parsed device info (e.g., "Chrome on Windows")
    location = Column(String(255), nullable=True)  # Location info (e.g., "New York, US")
    success = Column(Boolean, default=True, nullable=False, index=True)
    failure_reason = Column(String(255), nullable=True)  # Reason for failed login
    login_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationship to User
    user = relationship("User", back_populates="login_history")

