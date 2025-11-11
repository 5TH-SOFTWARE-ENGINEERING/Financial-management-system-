from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class RevenueCategory(str, enum.Enum):
    SALES = "sales"
    SERVICES = "services"
    INVESTMENT = "investment"
    RENTAL = "rental"
    OTHER = "other"


class RevenueEntry(Base):
    __tablename__ = "revenue_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    amount = Column(Float, nullable=False)
    category = Column(String, default=RevenueCategory.OTHER)
    source = Column(String)
    date = Column(DateTime(timezone=True), nullable=False)
    is_recurring = Column(Boolean, default=False)
    recurring_frequency = Column(String, nullable=True)  # monthly, quarterly, yearly
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_approved = Column(Boolean, default=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    attachment_url = Column(String, nullable=True)

    # Relationships
    created_by = relationship("User", back_populates="revenue_entries")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    approval_workflows = relationship("ApprovalWorkflow", back_populates="revenue_entry")
