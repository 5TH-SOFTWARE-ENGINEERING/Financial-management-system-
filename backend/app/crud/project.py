from sqlalchemy.orm import Session # type: ignore[import-untyped]
from typing import Optional, List
from datetime import datetime

from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectUpdate


class CRUDProject:
    def get(self, db: Session, id: int) -> Optional[Project]:
        return db.query(Project).filter(Project.id == id).first()

    def get_multi(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        status: Optional[str] = None,
        department: Optional[str] = None
    ) -> List[Project]:
        query = db.query(Project)
        
        if status:
            if status.lower() == 'active':
                query = query.filter(Project.is_active == True)
            elif status.lower() == 'inactive':
                query = query.filter(Project.is_active == False)
        
        if department:
            query = query.filter(Project.department_id == department)
        
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, obj_in: ProjectCreate, created_by_id: Optional[int] = None) -> Project:
        db_obj = Project(
            name=obj_in.name,
            description=obj_in.description,
            department_id=obj_in.department_id,
            assigned_users=obj_in.assigned_users if obj_in.assigned_users else [],
            budget=float(obj_in.budget) if obj_in.budget else None,
            start_date=obj_in.start_date,
            end_date=obj_in.end_date,
            is_active=obj_in.is_active,
            created_by_id=created_by_id,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, db_obj: Project, obj_in: ProjectUpdate) -> Project:
        update_data = obj_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == 'budget' and value is not None:
                setattr(db_obj, field, float(value))
            elif field == 'assigned_users' and value is not None:
                setattr(db_obj, field, value)
            else:
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> Project:
        obj = db.query(Project).filter(Project.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
        return obj


project = CRUDProject()

