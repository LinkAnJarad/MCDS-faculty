from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.applicant import Applicant, ApplicantStatus
from app.models.criteria import Criteria
from app.models.allocation import Allocation
from app.models.position import Position
from app.core.security import require_auth

router = APIRouter()


@router.get("", summary="Health check")
def health_check() -> dict:
    """Returns service status. Used by load balancers and monitoring tools."""
    return {"status": "ok", "service": "Faculty DSS API"}


@router.get("/dashboard-stats", summary="Get stats for the dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
) -> dict:
    """
    Returns aggregate counts across the main entities for the dashboard.
    Enforces authentication as these stats are sensitive institutional data.
    """
    # 1. Applicants status breakdown
    total_applicants = db.query(func.count(Applicant.id)).scalar()
    shortlisted = db.query(func.count(Applicant.id)).filter(Applicant.status == ApplicantStatus.shortlisted).scalar()
    pending = db.query(func.count(Applicant.id)).filter(Applicant.status == ApplicantStatus.pending).scalar()
    hired = db.query(func.count(Applicant.id)).filter(Applicant.status == ApplicantStatus.hired).scalar()
    
    # 2. Open Positions
    open_positions = db.query(func.count(Position.id)).filter(Position.is_open == True).scalar()

    # 3. Active Criteria
    active_criteria = db.query(func.count(Criteria.id)).filter(Criteria.is_active == True).scalar()

    # 4. Evaluations Run (Applicants with a score)
    evaluations_run = db.query(func.count(Applicant.id)).filter(Applicant.mcdm_score.isnot(None)).scalar()

    # 5. Allocations (Total entries in allocations table)
    total_allocations = db.query(func.count(Allocation.id)).scalar()

    # ── Chart Data ──
    # A. Score Distribution (0-20, 21-40, etc.)
    # We'll just fetch all non-null scores and bin them in Python for simplicity
    all_scores = db.query(Applicant.mcdm_score).filter(Applicant.mcdm_score.isnot(None)).all()
    bins = {"0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0}
    for (score,) in all_scores:
        s = float(score)
        if s <= 20: bins["0-20"] += 1
        elif s <= 40: bins["21-40"] += 1
        elif s <= 60: bins["41-60"] += 1
        elif s <= 80: bins["61-80"] += 1
        else: bins["81-100"] += 1
    
    score_distribution = [{"name": k, "count": v} for k, v in bins.items()]

    # B. Allocations by Department
    from app.models.department import Department
    dept_allocs = (
        db.query(Department.code, func.count(Allocation.id))
        .join(Allocation, Department.id == Allocation.department_id)
        .group_by(Department.code)
        .all()
    )
    department_allocations = [{"department": code, "allocations": count} for code, count in dept_allocs]

    return {
        "total_applicants": total_applicants or 0,
        "shortlisted": shortlisted or 0,
        "pending": pending or 0,
        "hired": hired or 0,
        "open_positions": open_positions or 0,
        "active_criteria": active_criteria or 0,
        "evaluations_run": evaluations_run or 0,
        "total_allocations": total_allocations or 0,
        "score_distribution": score_distribution,
        "department_allocations": department_allocations,
    }
