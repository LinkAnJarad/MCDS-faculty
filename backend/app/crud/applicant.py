import uuid
from sqlalchemy.orm import Session

from app.models.applicant import Applicant, ApplicantStatus
from app.schemas.applicant import ApplicantCreate, ApplicantUpdate


def get_all(
    db: Session,
    status: ApplicantStatus | None = None,
    skip: int = 0,
    limit: int = 200,
) -> list[Applicant]:
    q = db.query(Applicant)
    if status:
        q = q.filter(Applicant.status == status)
    return q.order_by(Applicant.created_at.desc()).offset(skip).limit(limit).all()


def get_by_id(db: Session, applicant_id: uuid.UUID) -> Applicant | None:
    return db.get(Applicant, applicant_id)


def get_by_email(db: Session, email: str) -> Applicant | None:
    return db.query(Applicant).filter(Applicant.email == email).first()


def create(db: Session, data: ApplicantCreate) -> Applicant:
    applicant = Applicant(**data.model_dump())
    db.add(applicant)
    db.flush()
    db.refresh(applicant)
    return applicant


def update(db: Session, applicant: Applicant, data: ApplicantUpdate) -> Applicant:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(applicant, field, value)
    db.flush()
    db.refresh(applicant)
    return applicant


def delete(db: Session, applicant: Applicant) -> None:
    db.delete(applicant)


def count_by_status(db: Session) -> dict[str, int]:
    """Returns a count breakdown by status — used for dashboard KPIs."""
    rows = (
        db.query(Applicant.status, Applicant.id)
        .all()
    )
    counts: dict[str, int] = {s.value: 0 for s in ApplicantStatus}
    for row in rows:
        counts[row.status.value] += 1
    counts["total"] = sum(counts.values())
    return counts
