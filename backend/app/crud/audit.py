from sqlalchemy.orm import Session # type: ignore[import-untyped]
from sqlalchemy import and_, desc # type: ignore[import-untyped]
from typing import Optional, List
from datetime import datetime
from ..models.audit import AuditLog, AuditAction


class CRUDAuditLog:
    def get(self, db: Session, id: int) -> Optional[AuditLog]:
        return db.query(AuditLog).filter(AuditLog.id == id).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).filter(AuditLog.user_id == user_id).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    def get_by_action(self, db: Session, action: AuditAction, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).filter(AuditLog.action == action).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    def get_by_resource(self, db: Session, resource_type: str, resource_id: int, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).filter(
            and_(AuditLog.resource_type == resource_type, AuditLog.resource_id == resource_id)
        ).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    def get_by_date_range(self, db: Session, start_date: datetime, end_date: datetime, skip: int = 0, limit: int = 100) -> List[AuditLog]:
        return db.query(AuditLog).filter(
            and_(AuditLog.created_at >= start_date, AuditLog.created_at <= end_date)
        ).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    def create(self, db: Session, user_id: int, action: AuditAction, resource_type: str, 
               resource_id: Optional[int] = None, old_values: Optional[str] = None, 
               new_values: Optional[str] = None, ip_address: Optional[str] = None, 
               user_agent: Optional[str] = None) -> AuditLog:
        db_obj = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> AuditLog:
        obj = db.query(AuditLog).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def cleanup_old(self, db: Session, days: int = 365) -> int:
        """Delete audit logs older than specified days and return count of deleted records"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        old_logs = db.query(AuditLog).filter(AuditLog.created_at < cutoff_date).all()
        
        count = len(old_logs)
        for log in old_logs:
            db.delete(log)
        
        db.commit()
        return count


audit_log = CRUDAuditLog()
