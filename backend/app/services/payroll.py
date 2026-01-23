from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models.payroll import EmployeeProfile, PayrollPeriod, Payslip, PayrollStatus
from ..models.journal_entry import AccountingJournalEntry, JournalEntryLine, JournalEntryStatus, ReferenceType

class PayrollService:
    @staticmethod
    def calculate_payslip(
        employee: EmployeeProfile,
        allowances: Dict[str, float],
        overtime_amount: float,
        deductions: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Calculate gross and net pay for an employee.
        """
        total_allowances = sum(allowances.values())
        total_deductions = sum(deductions.values())
        
        gross_pay = employee.base_salary + total_allowances + overtime_amount
        net_pay = gross_pay - total_deductions
        
        return {
            "base_salary": employee.base_salary,
            "gross_pay": gross_pay,
            "net_pay": net_pay,
            "total_deductions": total_deductions
        }

    @staticmethod
    def generate_period_payslips(db: Session, period_id: int):
        """
        Generates payslips for all active employees for a given period.
        """
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period or period.status != PayrollStatus.DRAFT:
            return None
        
        active_employees = db.query(EmployeeProfile).filter(EmployeeProfile.status == "active").all()
        
        total_gross = 0.0
        total_deductions = 0.0
        total_net = 0.0
        
        for emp in active_employees:
            # Basic calculation for MVP (Real system would have complex tax logic)
            # Default tax deduction of 15%
            tax = emp.base_salary * 0.15
            calc = PayrollService.calculate_payslip(
                employee=emp,
                allowances={},
                overtime_amount=0.0,
                deductions={"Income Tax": tax}
            )
            
            payslip = Payslip(
                employee_id=emp.id,
                period_id=period.id,
                base_salary=emp.base_salary,
                gross_pay=calc["gross_pay"],
                net_pay=calc["net_pay"],
                deductions={"Income Tax": tax},
                status=PayrollStatus.DRAFT
            )
            db.add(payslip)
            
            total_gross += calc["gross_pay"]
            total_deductions += calc["total_deductions"]
            total_net += calc["net_pay"]
            
        period.total_gross = total_gross
        period.total_deductions = total_deductions
        period.total_net = total_net
        
        db.commit()
        return period

    @staticmethod
    def approve_payroll(db: Session, period_id: int, user_id: int):
        """
        Approves the payroll period and creates a journal entry in accounting.
        """
        period = db.query(PayrollPeriod).filter(PayrollPeriod.id == period_id).first()
        if not period or period.status != PayrollStatus.DRAFT:
            return None
        
        period.status = PayrollStatus.APPROVED
        
        # Create Journal Entry
        # Dr Salaries Expense (Total Gross)
        # Cr Cash/Bank (Total Net)
        # Cr Taxes Payable (Total Deductions)
        
        journal_entry = AccountingJournalEntry(
            title=f"Payroll Approval - {period.name}",
            description=f"Payroll for period {period.start_date} to {period.end_date}",
            date=datetime.now(),
            status=JournalEntryStatus.DRAFT,
            reference_type=ReferenceType.EXPENSE,
            reference_id=period.id,
            created_by_id=user_id
        )
        db.add(journal_entry)
        db.flush() # Get journal_entry.id
        
        # Real accounting would use specific Account IDs from COA
        # Mocking for now - in production this would fetch the Salaries Expense Account
        
        db.commit()
        return period

payroll_service = PayrollService()
