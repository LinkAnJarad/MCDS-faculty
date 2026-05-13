"""
Evaluation endpoints — POST /api/v1/evaluation/run
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.core.security import require_auth
from app.db.session import get_db
from app.engines import mcdm as mcdm_engine
from app.schemas.evaluation import EvaluationResultOut, RunEvaluationRequest

router = APIRouter()


@router.post("/run", response_model=EvaluationResultOut, summary="Run MCDM evaluation")
def run_evaluation(
    req: RunEvaluationRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    """
    Executes the Weighted Sum Model against all matching applicants.

    - Fetches all active criteria from the DB.
    - Filters applicants by `include_statuses`.
    - Normalises per criterion and calculates a composite MCDM score (0-100).
    - Optionally persists the score back to `applicants.mcdm_score`.
    - Returns the full ranked list with per-criterion breakdowns.
    """
    # Load data
    active_criteria = crud.criteria.get_all(db, active_only=True)
    if not active_criteria:
        raise HTTPException(status_code=422, detail="No active criteria found. Please configure evaluation criteria first.")

    all_applicants = crud.applicant.get_all(db, limit=1000)
    target_statuses = set(req.include_statuses)
    applicants = [
        a for a in all_applicants
        if (a.status.value if hasattr(a.status, "value") else str(a.status)) in target_statuses
           or (a.is_internal and "hired" in target_statuses)
    ]
    if req.applicant_type == "external":
        applicants = [a for a in applicants if not a.is_internal]
    elif req.applicant_type == "internal":
        applicants = [a for a in applicants if a.is_internal]

    if not applicants:
        raise HTTPException(
            status_code=422,
            detail=f"No applicants with statuses {req.include_statuses} found.",
        )

    # Run MCDM engine
    try:
        result = mcdm_engine.run_evaluation(
            applicants=applicants,
            active_criteria=active_criteria,
            custom_weights=req.custom_weights,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Persist scores to DB if requested (and no custom weights were used)
    scores_saved = False
    if req.save_scores and not req.custom_weights:
        score_map = {r.applicant_id: r.mcdm_score for r in result.rankings}
        for applicant in applicants:
            a_id = str(applicant.id)
            if a_id in score_map:
                applicant.mcdm_score = score_map[a_id]
        db.flush()
        scores_saved = True

    # Serialize to response model
    rankings_out = [
        {
            "rank": r.rank,
            "applicant_id": r.applicant_id,
            "first_name": r.first_name,
            "last_name": r.last_name,
            "email": r.email,
            "status": r.status,
            "mcdm_score": r.mcdm_score,
            "breakdown": [
                {
                    "criteria_id": b.criteria_id,
                    "criteria_name": b.criteria_name,
                    "data_key": b.data_key,
                    "weight": b.weight,
                    "raw_value": b.raw_value,
                    "normalized_value": b.normalized_value,
                    "weighted_score": b.weighted_score,
                }
                for b in r.breakdown
            ],
        }
        for r in result.rankings
    ]

    return EvaluationResultOut(
        total_applicants=result.total_applicants,
        criteria_count=result.criteria_count,
        total_weight=result.total_weight,
        rankings=rankings_out,
        evaluated_at=result.evaluated_at,
        scores_saved=scores_saved,
    )


@router.get("/results", summary="Current MCDM scores from DB (no re-run)")
def get_evaluation_results(
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
) -> list[dict]:
    """Returns applicants ranked by their stored mcdm_score (without running evaluation)."""
    all_applicants = crud.applicant.get_all(db, limit=1000)
    scored = [a for a in all_applicants if a.mcdm_score is not None]
    scored.sort(key=lambda a: a.mcdm_score, reverse=True)

    return [
        {
            "rank": i + 1,
            "applicant_id": str(a.id),
            "name": f"{a.first_name} {a.last_name}",
            "email": a.email,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "mcdm_score": a.mcdm_score,
        }
        for i, a in enumerate(scored)
    ]
