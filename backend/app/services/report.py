import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from ..crud.report import report as report_crud
from ..crud.revenue import revenue as revenue_crud
from ..crud.expense import expense as expense_crud
from ..crud.user import user as user_crud
from ..models.report import Report, ReportType, ReportStatus
from ..models.user import User, UserRole
from ..core.database import get_db


class ReportService:
    """Service for generating and managing reports"""
    
    @staticmethod
    def generate_report(report_id: int) -> bool:
        """Generate a report in the background"""
        db = next(get_db())
        
        try:
            report = report_crud.get(db, report_id)
            if not report:
                print(f"Report {report_id} not found")
                return False
            
            if report.status != ReportStatus.GENERATING:
                print(f"Report {report_id} is not in generating status")
                return False
            
            # Generate report based on type
            if report.type == ReportType.FINANCIAL_SUMMARY:
                file_path = ReportService._generate_financial_summary(db, report)
            elif report.type == ReportType.REVENUE_REPORT:
                file_path = ReportService._generate_revenue_report(db, report)
            elif report.type == ReportType.EXPENSE_REPORT:
                file_path = ReportService._generate_expense_report(db, report)
            elif report.type == ReportType.PROFIT_LOSS:
                file_path = ReportService._generate_profit_loss_report(db, report)
            elif report.type == ReportType.CASH_FLOW:
                file_path = ReportService._generate_cash_flow_report(db, report)
            elif report.type == ReportType.BUDGET_VS_ACTUAL:
                file_path = ReportService._generate_budget_vs_actual_report(db, report)
            elif report.type == ReportType.AUDIT_REPORT:
                file_path = ReportService._generate_audit_report(db, report)
            else:
                print(f"Unsupported report type: {report.type}")
                report_crud.mark_failed(db, report_id)
                return False
            
            # Update report with file info
            if file_path and os.path.exists(file_path):
                file_size = os.path.getsize(file_path)
                report_crud.mark_completed(db, report_id, file_path, file_size)
                print(f"Report {report_id} generated successfully")
                return True
            else:
                report_crud.mark_failed(db, report_id)
                print(f"Report {report_id} generation failed")
                return False
                
        except Exception as e:
            print(f"Error generating report {report_id}: {str(e)}")
            report_crud.mark_failed(db, report_id)
            return False
        finally:
            db.close()
    
    @staticmethod
    def _generate_financial_summary(db: Session, report: Report) -> str:
        """Generate financial summary report"""
        # Parse parameters
        params = json.loads(report.parameters or "{}")
        start_date = datetime.fromisoformat(params.get("start_date", (datetime.now() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(params.get("end_date", datetime.now().isoformat()))
        
        # Get financial data
        total_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
        total_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
        profit = total_revenue - total_expenses
        
        revenue_by_category = revenue_crud.get_summary_by_category(db, start_date, end_date)
        expenses_by_category = expense_crud.get_summary_by_category(db, start_date, end_date)
        
        # Generate report content
        report_data = {
            "title": report.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_revenue": total_revenue,
                "total_expenses": total_expenses,
                "profit": profit,
                "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
            },
            "revenue_by_category": revenue_by_category,
            "expenses_by_category": expenses_by_category,
            "generated_at": datetime.now().isoformat()
        }
        
        # Save as JSON file (in production, this would be PDF)
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        file_path = f"{reports_dir}/financial_summary_{report.id}.json"
        with open(file_path, "w") as f:
            json.dump(report_data, f, indent=2)
        
        return file_path
    
    @staticmethod
    def _generate_revenue_report(db: Session, report: Report) -> str:
        """Generate detailed revenue report"""
        params = json.loads(report.parameters or "{}")
        start_date = datetime.fromisoformat(params.get("start_date", (datetime.now() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(params.get("end_date", datetime.now().isoformat()))
        
        # Get revenue entries
        revenue_entries = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
        
        # Group by category and source
        category_summary = revenue_crud.get_summary_by_category(db, start_date, end_date)
        
        report_data = {
            "title": report.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "total_revenue": sum(float(entry.amount) for entry in revenue_entries),
            "entry_count": len(revenue_entries),
            "category_summary": category_summary,
            "entries": [
                {
                    "id": entry.id,
                    "title": entry.title,
                    "amount": entry.amount,
                    "category": entry.category.value,
                    "source": entry.source,
                    "date": entry.date.isoformat(),
                    "created_by": entry.created_by.username if entry.created_by else "Unknown"
                }
                for entry in revenue_entries
            ],
            "generated_at": datetime.now().isoformat()
        }
        
        # Save file
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        file_path = f"{reports_dir}/revenue_report_{report.id}.json"
        with open(file_path, "w") as f:
            json.dump(report_data, f, indent=2)
        
        return file_path
    
    @staticmethod
    def _generate_expense_report(db: Session, report: Report) -> str:
        """Generate detailed expense report"""
        params = json.loads(report.parameters or "{}")
        start_date = datetime.fromisoformat(params.get("start_date", (datetime.now() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(params.get("end_date", datetime.now().isoformat()))
        
        # Get expense entries
        expense_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
        
        # Group by category and vendor
        category_summary = expense_crud.get_summary_by_category(db, start_date, end_date)
        vendor_summary = expense_crud.get_summary_by_vendor(db, start_date, end_date)
        
        report_data = {
            "title": report.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "total_expenses": sum(float(entry.amount) for entry in expense_entries),
            "entry_count": len(expense_entries),
            "category_summary": category_summary,
            "vendor_summary": vendor_summary,
            "entries": [
                {
                    "id": entry.id,
                    "title": entry.title,
                    "amount": entry.amount,
                    "category": entry.category.value,
                    "vendor": entry.vendor,
                    "date": entry.date.isoformat(),
                    "created_by": entry.created_by.username if entry.created_by else "Unknown"
                }
                for entry in expense_entries
            ],
            "generated_at": datetime.now().isoformat()
        }
        
        # Save file
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        file_path = f"{reports_dir}/expense_report_{report.id}.json"
        with open(file_path, "w") as f:
            json.dump(report_data, f, indent=2)
        
        return file_path
    
    @staticmethod
    def _generate_profit_loss_report(db: Session, report: Report) -> str:
        """Generate profit and loss statement"""
        params = json.loads(report.parameters or "{}")
        start_date = datetime.fromisoformat(params.get("start_date", (datetime.now() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(params.get("end_date", datetime.now().isoformat()))
        
        # Get financial data
        total_revenue = revenue_crud.get_total_by_period(db, start_date, end_date)
        total_expenses = expense_crud.get_total_by_period(db, start_date, end_date)
        profit = total_revenue - total_expenses
        
        # Get detailed breakdowns
        revenue_by_category = revenue_crud.get_summary_by_category(db, start_date, end_date)
        expenses_by_category = expense_crud.get_summary_by_category(db, start_date, end_date)
        
        report_data = {
            "title": report.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "profit_loss_statement": {
                "revenue": {
                    "total": total_revenue,
                    "by_category": revenue_by_category
                },
                "expenses": {
                    "total": total_expenses,
                    "by_category": expenses_by_category
                },
                "profit": profit,
                "profit_margin": (profit / total_revenue * 100) if total_revenue > 0 else 0
            },
            "generated_at": datetime.now().isoformat()
        }
        
        # Save file
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        file_path = f"{reports_dir}/profit_loss_{report.id}.json"
        with open(file_path, "w") as f:
            json.dump(report_data, f, indent=2)
        
        return file_path
    
    @staticmethod
    def _generate_cash_flow_report(db: Session, report: Report) -> str:
        """Generate cash flow report"""
        params = json.loads(report.parameters or "{}")
        start_date = datetime.fromisoformat(params.get("start_date", (datetime.now() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(params.get("end_date", datetime.now().isoformat()))
        
        # Get cash flow data
        revenue_entries = revenue_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
        expense_entries = expense_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
        
        # Calculate daily cash flow
        cash_flow_by_day = {}
        for entry in revenue_entries:
            day = entry.date.date().isoformat()
            if day not in cash_flow_by_day:
                cash_flow_by_day[day] = {"inflow": 0, "outflow": 0, "net": 0}
            cash_flow_by_day[day]["inflow"] += float(entry.amount)
            cash_flow_by_day[day]["net"] += float(entry.amount)
        
        for entry in expense_entries:
            day = entry.date.date().isoformat()
            if day not in cash_flow_by_day:
                cash_flow_by_day[day] = {"inflow": 0, "outflow": 0, "net": 0}
            cash_flow_by_day[day]["outflow"] += float(entry.amount)
            cash_flow_by_day[day]["net"] -= float(entry.amount)
        
        total_inflow = sum(day["inflow"] for day in cash_flow_by_day.values())
        total_outflow = sum(day["outflow"] for day in cash_flow_by_day.values())
        net_cash_flow = total_inflow - total_outflow
        
        report_data = {
            "title": report.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_inflow": total_inflow,
                "total_outflow": total_outflow,
                "net_cash_flow": net_cash_flow
            },
            "daily_cash_flow": cash_flow_by_day,
            "generated_at": datetime.now().isoformat()
        }
        
        # Save file
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        file_path = f"{reports_dir}/cash_flow_{report.id}.json"
        with open(file_path, "w") as f:
            json.dump(report_data, f, indent=2)
        
        return file_path
    
    @staticmethod
    def _generate_budget_vs_actual_report(db: Session, report: Report) -> str:
        """Generate budget vs actual report"""
        # Note: Budget functionality would require a budget table/model
        # For now, we calculate budget as a percentage of previous period's expenses
        params = json.loads(report.parameters or "{}")
        start_date = datetime.fromisoformat(params.get("start_date", (datetime.now() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(params.get("end_date", datetime.now().isoformat()))
        
        # Get actual expenses by category for current period
        expenses_by_category = expense_crud.get_summary_by_category(db, start_date, end_date)
        
        # Calculate previous period (same duration before start_date)
        period_duration = (end_date - start_date).days
        prev_start = start_date - timedelta(days=period_duration)
        prev_expenses = expense_crud.get_summary_by_category(db, prev_start, start_date)
        
        # Use previous period's expenses as budget baseline (or 110% for growth projection)
        budget_data = {}
        prev_expenses_dict = {item["category"]: item["total"] for item in prev_expenses}
        for expense_cat in expenses_by_category:
            category = expense_cat["category"]
            # Budget is 110% of previous period (allowing for growth)
            budget_data[category] = prev_expenses_dict.get(category, 0) * 1.1
        
        # For categories not in previous period, use a default based on current actual
        for expense_cat in expenses_by_category:
            category = expense_cat["category"]
            if category not in budget_data:
                # Default budget is 120% of current actual
                budget_data[category] = expense_cat["total"] * 1.2
        
        # Compare budget vs actual
        comparison = []
        for expense_cat in expenses_by_category:
            category = expense_cat["category"]
            actual = expense_cat["total"]
            budget = budget_data.get(category, 0)
            variance = actual - budget
            variance_percent = (variance / budget * 100) if budget > 0 else 0
            
            comparison.append({
                "category": category,
                "budget": budget,
                "actual": actual,
                "variance": variance,
                "variance_percent": variance_percent
            })
        
        report_data = {
            "title": report.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "budget_vs_actual": comparison,
            "total_budget": sum(budget_data.values()),
            "total_actual": sum(exp["total"] for exp in expenses_by_category),
            "generated_at": datetime.now().isoformat()
        }
        
        # Save file
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        file_path = f"{reports_dir}/budget_vs_actual_{report.id}.json"
        with open(file_path, "w") as f:
            json.dump(report_data, f, indent=2)
        
        return file_path
    
    @staticmethod
    def _generate_audit_report(db: Session, report: Report) -> str:
        """Generate audit report"""
        params = json.loads(report.parameters or "{}")
        start_date = datetime.fromisoformat(params.get("start_date", (datetime.now() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(params.get("end_date", datetime.now().isoformat()))
        
        # Get audit logs
        from ..crud.audit import audit_log as audit_crud
        audit_logs = audit_crud.get_by_date_range(db, start_date, end_date, 0, 10000)
        
        # Group by action and user
        action_counts = {}
        user_counts = {}
        
        for log in audit_logs:
            action = log.action.value
            user_id = log.user_id
            
            action_counts[action] = action_counts.get(action, 0) + 1
            user_counts[user_id] = user_counts.get(user_id, 0) + 1
        
        # Get user details
        user_details = {}
        for user_id in user_counts.keys():
            user = user_crud.get(db, user_id)
            if user:
                user_details[user_id] = user.username
        
        report_data = {
            "title": report.title,
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "summary": {
                "total_actions": len(audit_logs),
                "unique_users": len(user_counts),
                "action_breakdown": action_counts,
                "user_activity": [
                    {
                        "user_id": user_id,
                        "username": user_details.get(user_id, "Unknown"),
                        "action_count": count
                    }
                    for user_id, count in user_counts.items()
                ]
            },
            "audit_logs": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "username": user_details.get(log.user_id, "Unknown"),
                    "action": log.action.value,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "created_at": log.created_at.isoformat(),
                    "ip_address": log.ip_address
                }
                for log in audit_logs
            ],
            "generated_at": datetime.now().isoformat()
        }
        
        # Save file
        reports_dir = "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        file_path = f"{reports_dir}/audit_report_{report.id}.json"
        with open(file_path, "w") as f:
            json.dump(report_data, f, indent=2)
        
        return file_path
    
    @staticmethod
    def get_report_templates() -> List[Dict[str, Any]]:
        """Get available report templates"""
        return [
            {
                "type": ReportType.FINANCIAL_SUMMARY,
                "name": "Financial Summary",
                "description": "Overview of financial performance including revenue, expenses, and profit",
                "parameters": {
                    "start_date": "datetime",
                    "end_date": "datetime"
                }
            },
            {
                "type": ReportType.REVENUE_REPORT,
                "name": "Revenue Report",
                "description": "Detailed breakdown of revenue by category and source",
                "parameters": {
                    "start_date": "datetime",
                    "end_date": "datetime"
                }
            },
            {
                "type": ReportType.EXPENSE_REPORT,
                "name": "Expense Report",
                "description": "Detailed breakdown of expenses by category and vendor",
                "parameters": {
                    "start_date": "datetime",
                    "end_date": "datetime"
                }
            },
            {
                "type": ReportType.PROFIT_LOSS,
                "name": "Profit & Loss Statement",
                "description": "P&L statement showing revenue, expenses, and profitability",
                "parameters": {
                    "start_date": "datetime",
                    "end_date": "datetime"
                }
            },
            {
                "type": ReportType.CASH_FLOW,
                "name": "Cash Flow Report",
                "description": "Analysis of cash inflows and outflows",
                "parameters": {
                    "start_date": "datetime",
                    "end_date": "datetime"
                }
            },
            {
                "type": ReportType.BUDGET_VS_ACTUAL,
                "name": "Budget vs Actual",
                "description": "Comparison of budgeted amounts vs actual expenses",
                "parameters": {
                    "start_date": "datetime",
                    "end_date": "datetime"
                }
            },
            {
                "type": ReportType.AUDIT_REPORT,
                "name": "Audit Report",
                "description": "System audit logs and user activity",
                "parameters": {
                    "start_date": "datetime",
                    "end_date": "datetime"
                }
            }
        ]
