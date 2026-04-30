import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.criteria import Criteria
from app.schemas.criteria import CriteriaCreate, CriteriaUpdate, WeightSummary


def get_all(db: Session, active_only: bool = False, skip: int = 0, limit: int = 200) -> list[Criteria]:
    q = db.query(Criteria)
    if active_only:
        q = q.filter(Criteria.is_active == True)  # noqa: E712
    return q.order_by(Criteria.created_at.asc()).offset(skip).limit(limit).all()


def get_by_id(db: Session, criteria_id: uuid.UUID) -> Criteria | None:
    return db.get(Criteria, criteria_id)


def create(db: Session, data: CriteriaCreate) -> Criteria:
    criteria = Criteria(**data.model_dump())
    db.add(criteria)
    db.flush()
    db.refresh(criteria)
    return criteria


def update(db: Session, criteria: Criteria, data: CriteriaUpdate) -> Criteria:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(criteria, field, value)
    db.flush()
    db.refresh(criteria)
    return criteria


def delete(db: Session, criteria: Criteria) -> None:
    db.delete(criteria)


def get_weight_summary(db: Session) -> WeightSummary:
    """Returns the sum and validity of active criteria weights."""
    result = (
        db.query(func.sum(Criteria.weight), func.count(Criteria.id))
        .filter(Criteria.is_active == True)  # noqa: E712
        .one()
    )
    total = float(result[0] or 0.0)
    count = int(result[1] or 0)
    return WeightSummary(
        total_weight=round(total, 4),
        is_valid=abs(total - 100.0) < 0.01,
        active_count=count,
    )
