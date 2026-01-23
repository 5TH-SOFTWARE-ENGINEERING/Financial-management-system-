from typing import List, Optional, Dict
from datetime import datetime, date
from pydantic import BaseModel, Field
from ..models.payroll import EmploymentStatus, PayrollStatus

# Employee Profile Schemas
class EmployeeProfileBase(BaseModel):
    user_id: int
    employee_id: str
    job_title: Optional[str] = None
    department_id: Optional[int] = None
    hire_date: date
    base_salary: float
    payment_frequency: str = "monthly"
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None

class EmployeeProfileCreate(EmployeeProfileBase):
    pass

class EmployeeProfileUpdate(BaseModel):
    job_title: Optional[str] = None
    base_salary: Optional[float] = None
    status: Optional[EmploymentStatus] = None
    bank_account_number: Optional[str] = None
    bank_name: Optional[str] = None

class EmployeeProfile(EmployeeProfileBase):
    id: int
    status: EmploymentStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# Payroll Period Schemas
class PayrollPeriodBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    payment_date: Optional[date] = None

class PayrollPeriodCreate(PayrollPeriodBase):
    pass

class PayrollPeriod(PayrollPeriodBase):
    id: int
    status: PayrollStatus
    total_gross: float
    total_deductions: float
    total_net: float
    created_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Payslip Schemas
class PayslipBase(BaseModel):
    employee_id: int
    period_id: int
    base_salary: float
    allowances: Dict[str, float] = {}
    overtime_amount: float = 0.0
    deductions: Dict[str, float] = {}

class PayslipCreate(PayslipBase):
    pass

class Payslip(PayslipBase):
    id: int
    gross_pay: float
    net_pay: float
    journal_entry_id: Optional[int]
    status: PayrollStatus
    created_at: datetime

    class Config:
        from_attributes = True
