# app/models/department.py
from sqlalchemy import Column, Integer, String, Text, DateTime # type: ignore[import-untyped]
from sqlalchemy.sql import func # type: ignore[import-untyped]
from ..core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

