from pydantic import BaseModel # type: ignore[import-untyped]
from typing import Optional
from datetime import datetime
from ..models.approval import ApprovalStatus, ApprovalType


class ApprovalBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: ApprovalType
    priority: str = "medium"


class ApprovalCreate(ApprovalBase):
    revenue_entry_id: Optional[int] = None
    expense_entry_id: Optional[int] = None


class ApprovalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ApprovalStatus] = None
    approver_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    priority: Optional[str] = None


class ApprovalOut(ApprovalBase):
    id: int
    status: ApprovalStatus
    requester_id: int
    approver_id: Optional[int] = None
    revenue_entry_id: Optional[int] = None
    expense_entry_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class ApprovalCommentBase(BaseModel):
    comment: str


class ApprovalCommentCreate(ApprovalCommentBase):
    workflow_id: int


class ApprovalCommentOut(ApprovalCommentBase):
    id: int
    workflow_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
