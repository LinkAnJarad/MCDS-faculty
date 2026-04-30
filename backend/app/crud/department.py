import uuid
from sqlalchemy.orm import Session

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate


def get_all(db: Session, skip: int = 0, limit: int = 200) -> list[Department]:
    return db.query(Department).offset(skip).limit(limit).all()


def get_by_id(db: Session, dept_id: uuid.UUID) -> Department | None:
    return db.get(Department, dept_id)


def get_by_code(db: Session, code: str) -> Department | None:
    return db.query(Department).filter(Department.code == code).first()


def create(db: Session, data: DepartmentCreate) -> Department:
    dept = Department(**data.model_dump())
    db.add(dept)
    db.flush()
    db.refresh(dept)
    return dept


def update(db: Session, dept: Department, data: DepartmentUpdate) -> Department:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dept, field, value)
    db.flush()
    db.refresh(dept)
    return dept


def delete(db: Session, dept: Department) -> None:
    db.delete(dept)
