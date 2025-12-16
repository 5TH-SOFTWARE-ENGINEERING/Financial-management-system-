# app/models/project.py
from sqlalchemy import ( # type: ignore[import-untyped]
    Column, Integer, String, Float, DateTime, Text, Boolean, JSON
)
from sqlalchemy.orm import relationship # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]

from ..core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    department_id = Column(String, nullable=True)  # Department name/id
    assigned_users = Column(JSON, nullable=True)  # Array of user IDs
    budget = Column(Float, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by_id = Column(Integer, nullable=True)  # User who created the project

