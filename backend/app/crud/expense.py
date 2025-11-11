from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import Optional, List
from datetime import datetime
from ..models.expense import ExpenseEntry, ExpenseCategory
from ..schemas.expense import ExpenseCreate, ExpenseUpdate


class CRUDExpense:
    def get(self, db: Session, id: int) -> Optional[ExpenseEntry]:
        return db.query(ExpenseEntry).filter(ExpenseEntry.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[ExpenseEntry]:
        return db.query(ExpenseEntry).offset(skip).limit(limit).all()

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[ExpenseEntry]:
        return db.query(ExpenseEntry).filter(ExpenseEntry.created_by_id == user_id).offset(skip).limit(limit).all()

    def get_by_date_range(self, db: Session, start_date: datetime, end_date: datetime, skip: int = 0, limit: int = 100) -> List[ExpenseEntry]:
        return db.query(ExpenseEntry).filter(
            and_(ExpenseEntry.date >= start_date, ExpenseEntry.date <= end_date)
        ).offset(skip).limit(limit).all()

    def get_by_category(self, db: Session, category: ExpenseCategory, skip: int = 0, limit: int = 100) -> List[ExpenseEntry]:
        return db.query(ExpenseEntry).filter(ExpenseEntry.category == category).offset(skip).limit(limit).all()

    def get_by_vendor(self, db: Session, vendor: str, skip: int = 0, limit: int = 100) -> List[ExpenseEntry]:
        return db.query(ExpenseEntry).filter(ExpenseEntry.vendor == vendor).offset(skip).limit(limit).all()

    def get_total_by_period(self, db: Session, start_date: datetime, end_date: datetime) -> float:
        result = db.query(func.sum(ExpenseEntry.amount)).filter(
            and_(ExpenseEntry.date >= start_date, ExpenseEntry.date <= end_date)
        ).scalar()
        return result or 0.0

    def get_summary_by_category(self, db: Session, start_date: datetime, end_date: datetime) -> List[dict]:
        result = db.query(
            ExpenseEntry.category,
            func.sum(ExpenseEntry.amount).label('total'),
            func.count(ExpenseEntry.id).label('count')
        ).filter(
            and_(ExpenseEntry.date >= start_date, ExpenseEntry.date <= end_date)
        ).group_by(ExpenseEntry.category).all()
        
        return [
            {"category": row.category, "total": row.total, "count": row.count}
            for row in result
        ]

    def get_summary_by_vendor(self, db: Session, start_date: datetime, end_date: datetime) -> List[dict]:
        result = db.query(
            ExpenseEntry.vendor,
            func.sum(ExpenseEntry.amount).label('total'),
            func.count(ExpenseEntry.id).label('count')
        ).filter(
            and_(ExpenseEntry.date >= start_date, ExpenseEntry.date <= end_date)
        ).group_by(ExpenseEntry.vendor).all()
        
        return [
            {"vendor": row.vendor, "total": row.total, "count": row.count}
            for row in result
        ]

    def create(self, db: Session, obj_in: ExpenseCreate, created_by_id: int) -> ExpenseEntry:
        db_obj = ExpenseEntry(
            title=obj_in.title,
            description=obj_in.description,
            amount=float(obj_in.amount),
            category=obj_in.category,
            vendor=obj_in.vendor,
            date=obj_in.date,
            is_recurring=obj_in.is_recurring,
            recurring_frequency=obj_in.recurring_frequency,
            attachment_url=obj_in.attachment_url,
            receipt_url=obj_in.receipt_url,
            created_by_id=created_by_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: ExpenseEntry, obj_in: ExpenseUpdate) -> ExpenseEntry:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == 'amount' and value is not None:
                setattr(db_obj, field, float(value))
            else:
                setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> ExpenseEntry:
        obj = db.query(ExpenseEntry).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def approve(self, db: Session, id: int, approved_by_id: int) -> ExpenseEntry:
        obj = db.query(ExpenseEntry).get(id)
        obj.is_approved = True
        obj.approved_by_id = approved_by_id
        obj.approved_at = datetime.utcnow()
        db.commit()
        db.refresh(obj)
        return obj

    def get_pending_approval(self, db: Session, skip: int = 0, limit: int = 100) -> List[ExpenseEntry]:
        return db.query(ExpenseEntry).filter(ExpenseEntry.is_approved == False).offset(skip).limit(limit).all()


expense = CRUDExpense()
