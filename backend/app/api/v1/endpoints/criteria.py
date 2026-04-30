import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.core.security import require_auth
from app.db.session import get_db
from app.schemas.criteria import CriteriaCreate, CriteriaResponse, CriteriaUpdate, WeightSummary

router = APIRouter()


@router.get("", response_model=list[CriteriaResponse], summary="List criteria")
def list_criteria(
    active_only: bool = False,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    return crud.criteria.get_all(db, active_only=active_only)


@router.get("/weight-summary", response_model=WeightSummary, summary="Active criteria weight summary")
def weight_summary(
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    """Returns the sum of all active criteria weights and whether it equals 100%."""
    return crud.criteria.get_weight_summary(db)


@router.post("", response_model=CriteriaResponse, status_code=status.HTTP_201_CREATED, summary="Create criteria")
def create_criteria(
    data: CriteriaCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    return crud.criteria.create(db, data)


@router.get("/{criteria_id}", response_model=CriteriaResponse, summary="Get criteria")
def get_criteria(
    criteria_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    criteria = crud.criteria.get_by_id(db, criteria_id)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found.")
    return criteria


@router.put("/{criteria_id}", response_model=CriteriaResponse, summary="Update criteria")
def update_criteria(
    criteria_id: uuid.UUID,
    data: CriteriaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    criteria = crud.criteria.get_by_id(db, criteria_id)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found.")
    return crud.criteria.update(db, criteria, data)


@router.delete("/{criteria_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete criteria")
def delete_criteria(
    criteria_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    criteria = crud.criteria.get_by_id(db, criteria_id)
    if not criteria:
        raise HTTPException(status_code=404, detail="Criteria not found.")
    crud.criteria.delete(db, criteria)
