from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.fixed_asset import FixedAsset, DepreciationLog, DepreciationMethod, FixedAssetStatus
from ..schemas.fixed_asset import FixedAssetCreate, FixedAssetUpdate

class CRUDFixedAsset:
    def get(self, db: Session, id: int) -> Optional[FixedAsset]:
        return db.query(FixedAsset).filter(FixedAsset.id == id).first()

    def get_multi(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[FixedAsset]:
        return db.query(FixedAsset).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: FixedAssetCreate, created_by_id: int) -> FixedAsset:
        db_obj = FixedAsset(
            **obj_in.dict(),
            current_book_value=obj_in.purchase_cost,
            created_by_id=created_by_id,
            status=FixedAssetStatus.ACTIVE
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, *, db_obj: FixedAsset, obj_in: FixedAssetUpdate
    ) -> FixedAsset:
        obj_data = obj_in.dict(exclude_unset=True)
        for field in obj_data:
            setattr(db_obj, field, obj_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> FixedAsset:
        obj = db.query(FixedAsset).get(id)
        db.delete(obj)
        db.commit()
        return obj

fixed_asset = CRUDFixedAsset()
