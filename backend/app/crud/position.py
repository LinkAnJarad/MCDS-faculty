import uuid
from sqlalchemy.orm import Session

from app.models.position import Position
from app.schemas.position import PositionCreate, PositionUpdate


def get_all(db: Session, department_id: uuid.UUID | None = None, skip: int = 0, limit: int = 200) -> list[Position]:
    q = db.query(Position)
    if department_id:
        q = q.filter(Position.department_id == department_id)
    return q.offset(skip).limit(limit).all()


def get_by_id(db: Session, position_id: uuid.UUID) -> Position | None:
    return db.get(Position, position_id)


def create(db: Session, data: PositionCreate) -> Position:
    position = Position(**data.model_dump())
    db.add(position)
    db.flush()
    db.refresh(position)
    return position


def update(db: Session, position: Position, data: PositionUpdate) -> Position:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(position, field, value)
    db.flush()
    db.refresh(position)
    return position


def delete(db: Session, position: Position) -> None:
    db.delete(position)
