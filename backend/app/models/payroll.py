from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, JSON, Enum as SQLEnum, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base

class EmploymentStatus(str, enum.Enum):
    ACTIVE = "active"
    TERMINATED = "terminated"
    ON_LEAVE = "on_leave"

class PayrollStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"

class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    employee_id = Column(String(50), unique=True, index=True) # Official ID
    job_title = Column(String(100))
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    hire_date = Column(Date, nullable=False)
    
    # Salary Info
    base_salary = Column(Float, nullable=False)
    payment_frequency = Column(String(50), default="monthly") # monthly, bi-weekly
    
    # Bank Info for transfers
    bank_account_number = Column(String(100))
    bank_name = Column(String(100))
    
    status = Column(SQLEnum(EmploymentStatus), default=EmploymentStatus.ACTIVE)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="employee_profile")
    department = relationship("Department")

class PayrollPeriod(Base):
    __tablename__ = "payroll_periods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100)) # e.g., "January 2026"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    payment_date = Column(Date)
    
    status = Column(SQLEnum(PayrollStatus), default=PayrollStatus.DRAFT)
    total_gross = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_net = Column(Float, default=0.0)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employee_profiles.id"), nullable=False)
    period_id = Column(Integer, ForeignKey("payroll_periods.id"), nullable=False)
    
    base_salary = Column(Float, nullable=False)
    allowances = Column(JSON, default={}) # e.g., {"Housing": 500, "Transport": 200}
    overtime_amount = Column(Float, default=0.0)
    
    gross_pay = Column(Float, nullable=False)
    
    deductions = Column(JSON, default={}) # e.g., {"Tax": 400, "Health": 50}
    net_pay = Column(Float, nullable=False)
    
    # Link to accounting
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    
    status = Column(SQLEnum(PayrollStatus), default=PayrollStatus.DRAFT)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    employee = relationship("EmployeeProfile")
    period = relationship("PayrollPeriod")
