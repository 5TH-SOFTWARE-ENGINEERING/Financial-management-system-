from sqlalchemy.orm import Session
from ..models.account_mapping import AccountMapping
from ..schemas.account_mapping import AccountMappingCreate, AccountMappingUpdate

class CRUDAccountMapping:
    def get(self, db: Session, id: int):
        return db.query(AccountMapping).filter(AccountMapping.id == id).first()

    def get_by_category(self, db: Session, module: str, category: str):
        return db.query(AccountMapping).filter(
            AccountMapping.module == module,
            AccountMapping.category == category
        ).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 100):
        return db.query(AccountMapping).offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: AccountMappingCreate, user_id: int):
        # Check if already exists
        existing = self.get_by_category(db, obj_in.module, obj_in.category)
        if existing:
            existing.account_id = obj_in.account_id
            db.commit()
            db.refresh(existing)
            return existing
            
        db_obj = AccountMapping(
            **obj_in.dict(),
            created_by_id=user_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: AccountMapping, obj_in: AccountMappingUpdate):
        update_data = obj_in.dict(exclude_unset=True)
        for field in update_data:
            setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int):
        obj = db.query(AccountMapping).get(id)
        db.delete(obj)
        db.commit()
        return obj

account_mapping = CRUDAccountMapping()
