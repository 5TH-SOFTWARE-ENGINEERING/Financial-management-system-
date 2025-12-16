from pydantic import BaseModel # type: ignore[import-untyped]
from typing import Optional
from datetime import datetime
from ..models.report import ReportType, ReportStatus


class ReportBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: ReportType
    parameters: Optional[str] = None
    is_public: bool = False


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ReportStatus] = None
    parameters: Optional[str] = None
    is_public: Optional[bool] = None


class ReportOut(ReportBase):
    id: int
    status: ReportStatus
    file_url: Optional[str] = None
    file_size: Optional[int] = None
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    generated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    download_count: int = 0

    class Config:
        from_attributes = True


class ReportSchedule(BaseModel):
    report_id: int
    frequency: str  # daily, weekly, monthly
    next_run: datetime
    is_active: bool = True
