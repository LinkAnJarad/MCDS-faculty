"""
Optimization endpoints — POST /api/v1/optimization/run
                         POST /api/v1/optimization/simulate (what-if, no DB writes)
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.core.security import require_auth
from app.db.session import get_db
from app.engines import mcdm as mcdm_engine
from app.engines import optimizer as opt_engine
from app.models.allocation import Allocation
from app.schemas.optimization import OptimizationResultOut, RunOptimizationRequest, CommitOptimizationRequest

router = APIRouter()


def _run(req: RunOptimizationRequest, db: Session) -> OptimizationResultOut:
    """Shared logic for both /run and /simulate."""

    # ── Load open positions ───────────────────────────────────────────────────
    positions = crud.position.get_all(db, limit=500)
    positions = [p for p in positions if p.is_open]
    if req.position_ids:
        pid_set = set(req.position_ids)
        positions = [p for p in positions if str(p.id) in pid_set]
    if not positions:
        raise HTTPException(status_code=422, detail="No open positions found for optimization.")

    # ── Load applicants (scored, pending/shortlisted) ─────────────────────────
    all_applicants = crud.applicant.get_all(db, limit=1000)
    eligible = [
        a for a in all_applicants
        if (a.status.value if hasattr(a.status, "value") else str(a.status))
        in ("pending", "shortlisted", "hired") or a.is_internal
    ]
    if req.applicant_ids:
        aid_set = set(req.applicant_ids)
        eligible = [a for a in eligible if str(a.id) in aid_set]
    if req.applicant_type == "external":
        eligible = [a for a in eligible if not a.is_internal]
    elif req.applicant_type == "internal":
        eligible = [a for a in eligible if a.is_internal]
    if not eligible:
        raise HTTPException(status_code=422, detail="No eligible applicants (pending/shortlisted) found.")

    # ── Determine MCDM scores ─────────────────────────────────────────────────
    if req.custom_weights:
        # What-if mode: re-run MCDM with custom weights (transient, no DB write)
        active_criteria = crud.criteria.get_all(db, active_only=True)
        if not active_criteria:
            raise HTTPException(status_code=422, detail="No active criteria for custom weight evaluation.")
        try:
            eval_result = mcdm_engine.run_evaluation(
                applicants=eligible,
                active_criteria=active_criteria,
                custom_weights=req.custom_weights,
            )
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        scores = {r.applicant_id: r.mcdm_score for r in eval_result.rankings}
    else:
        # Use stored mcdm_scores; fall back to 0 if not yet evaluated
        scores = {
            str(a.id): float(a.mcdm_score) if a.mcdm_score is not None else 0.0
            for a in eligible
        }

    # ── Run optimizer ─────────────────────────────────────────────────────────
    opt_result = opt_engine.run_optimization(
        applicants=eligible,
        positions=positions,
        scores=scores,
        maximize_coverage=req.maximize_coverage,
    )

    return OptimizationResultOut(
        status=opt_result.status,
        total_score=opt_result.total_score,
        allocation_count=len(opt_result.allocations),
        allocations=[
            {
                "applicant_id": al.applicant_id,
                "applicant_name": al.applicant_name,
                "position_id": al.position_id,
                "position_title": al.position_title,
                "department_name": al.department_name,
                "alignment_score": al.alignment_score,
                "teaching_units": al.teaching_units,
            }
            for al in opt_result.allocations
        ],
        unallocated_applicant_names=opt_result.unallocated_applicant_names,
        unfilled_position_titles=opt_result.unfilled_position_titles,
        solver_message=opt_result.solver_message,
        solved_at=opt_result.solved_at,
        scores_saved=False,
    )


@router.post("/run", response_model=OptimizationResultOut, summary="Run LP optimization")
def run_optimization(
    req: RunOptimizationRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    """
    Runs the PuLP Binary Integer Program to assign applicants to open positions.
    Optionally saves results to the Allocation table (`save_allocations=True`).
    """
    result = _run(req, db)

    if req.save_allocations and result.status == "Optimal":
        # Clear previous allocations for affected positions
        position_ids = {al.position_id for al in result.allocations}
        db.query(Allocation).filter(
            Allocation.position_id.in_([uuid.UUID(pid) for pid in position_ids])
        ).delete(synchronize_session=False)

        # Build position → department map for the insert
        pos_objects = {str(p.id): p for p in crud.position.get_all(db, limit=500)}

        # Insert new allocations and update applicant status
        for al in result.allocations:
            pos = pos_objects.get(al.position_id)
            dept_id = pos.department_id if pos else None
            if not dept_id:
                continue  # skip if position has no department (shouldn't happen)
            
            applicant_uuid = uuid.UUID(al.applicant_id)
            
            db.add(Allocation(
                applicant_id=applicant_uuid,
                position_id=uuid.UUID(al.position_id),
                department_id=dept_id,
                allocated_units=al.teaching_units,
                alignment_score=al.alignment_score,
                notes=f"Auto-allocated by LP optimizer (score={al.alignment_score:.4f})",
            ))
            
            # Update applicant status to hired
            applicant = crud.applicant.get_by_id(db, applicant_uuid)
            if applicant:
                applicant.status = "hired"
            
            # Close the position as it is now filled
            if pos:
                pos.is_open = False

        db.flush()
        result.scores_saved = True

    return result


@router.post("/simulate", response_model=OptimizationResultOut, summary="What-if simulation (no DB writes)")
def simulate_optimization(
    req: RunOptimizationRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    """
    Runs the optimizer without saving any results to the database.
    Intended for what-if scenario analysis (e.g. custom weight overrides,
    different objective, subsets of applicants/positions).
    """
    req.save_allocations = False  # enforce no-save for simulation
    return _run(req, db)

@router.post("/commit", summary="Commit reviewed allocations to DB")
def commit_optimization(
    req: CommitOptimizationRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    """
    Manually commit a list of reviewed allocations to the database.
    """
    if not req.allocations:
        return {"status": "ok", "message": "No allocations to commit", "count": 0}

    # Clear previous allocations for affected positions
    position_ids = {al.position_id for al in req.allocations}
    db.query(Allocation).filter(
        Allocation.position_id.in_([uuid.UUID(pid) for pid in position_ids])
    ).delete(synchronize_session=False)

    pos_objects = {str(p.id): p for p in crud.position.get_all(db, limit=500)}

    for al in req.allocations:
        pos = pos_objects.get(al.position_id)
        dept_id = pos.department_id if pos else None
        if not dept_id:
            continue
        
        applicant_uuid = uuid.UUID(al.applicant_id)
        
        db.add(Allocation(
            applicant_id=applicant_uuid,
            position_id=uuid.UUID(al.position_id),
            department_id=dept_id,
            allocated_units=al.teaching_units,
            alignment_score=al.alignment_score,
            notes=f"Manually committed allocation (score={al.alignment_score:.4f})",
        ))
        
        applicant = crud.applicant.get_by_id(db, applicant_uuid)
        if applicant:
            applicant.status = "hired"
        
        if pos:
            pos.is_open = False

    db.flush()
    return {"status": "ok", "message": "Allocations committed successfully", "count": len(req.allocations)}
