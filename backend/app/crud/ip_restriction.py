from typing import Optional, List
from sqlalchemy.orm import Session # type: ignore
from ..models.ip_restriction import IPRestriction, IPStatus
from ..schemas.ip_restriction import IPRestrictionCreate, IPRestrictionUpdate

class CRUDIPRestriction:
    def get(self, db: Session, id: int) -> Optional[IPRestriction]:
        return db.query(IPRestriction).filter(IPRestriction.id == id).first()

    def get_by_ip(self, db: Session, ip_address: str) -> Optional[IPRestriction]:
        return db.query(IPRestriction).filter(IPRestriction.ip_address == ip_address).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100) -> List[IPRestriction]:
        return db.query(IPRestriction).order_by(IPRestriction.created_at.desc()).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: IPRestrictionCreate) -> IPRestriction:
        db_obj = IPRestriction(
            ip_address=obj_in.ip_address,
            description=obj_in.description,
            status=obj_in.status,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: IPRestriction, obj_in: IPRestrictionUpdate) -> IPRestriction:
        update_data = obj_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> Optional[IPRestriction]:
        obj = self.get(db, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

    def is_ip_allowed(self, db: Session, ip_address: str) -> bool:
        """
        Check if an IP is allowed.
        If no restrictions exist, allow all.
        If restrictions exist, check if it's explicitly allowed or not blocked.
        """
        restriction = self.get_by_ip(db, ip_address)
        if not restriction:
            return True
        return restriction.status == IPStatus.ALLOWED

ip_restriction = CRUDIPRestriction()
