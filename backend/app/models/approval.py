from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from ..core.database import Base


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ApprovalType(str, enum.Enum):
    REVENUE = "revenue"
    EXPENSE = "expense"
    REPORT = "report"


class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    type = Column(Enum(ApprovalType), nullable=False)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    revenue_entry_id = Column(Integer, ForeignKey("revenue_entries.id"), nullable=True)
    expense_entry_id = Column(Integer, ForeignKey("expense_entries.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    approved_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    priority = Column(String, default="medium")  # low, medium, high, urgent

    # Relationships
    requester = relationship("User", back_populates="approval_workflows")
    approver = relationship("User", foreign_keys=[approver_id])
    revenue_entry = relationship("RevenueEntry", back_populates="approval_workflows")
    expense_entry = relationship("ExpenseEntry", back_populates="approval_workflows")
    comments = relationship("ApprovalComment", back_populates="workflow")


class ApprovalComment(Base):
    __tablename__ = "approval_comments"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("approval_workflows.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    workflow = relationship("ApprovalWorkflow", back_populates="comments")
    user = relationship("User")
