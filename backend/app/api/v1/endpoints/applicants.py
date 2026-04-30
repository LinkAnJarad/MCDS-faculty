import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.core.security import require_auth
from app.db.session import get_db
from app.models.applicant import ApplicantStatus
from app.schemas.applicant import ApplicantCreate, ApplicantResponse, ApplicantSummary, ApplicantUpdate

router = APIRouter()


@router.get("", response_model=list[ApplicantSummary], summary="List applicants")
def list_applicants(
    status: ApplicantStatus | None = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    return crud.applicant.get_all(db, status=status, skip=skip, limit=limit)


@router.get("/stats", summary="Applicant status counts for dashboard")
def applicant_stats(
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
) -> dict:
    return crud.applicant.count_by_status(db)


@router.post("", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED, summary="Create applicant")
def create_applicant(
    data: ApplicantCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    if crud.applicant.get_by_email(db, data.email):
        raise HTTPException(status_code=409, detail=f"Applicant with email '{data.email}' already exists.")
    if data.applied_position_id and not crud.position.get_by_id(db, data.applied_position_id):
        raise HTTPException(status_code=400, detail="Position not found.")
    return crud.applicant.create(db, data)


@router.get("/{applicant_id}", response_model=ApplicantResponse, summary="Get applicant")
def get_applicant(
    applicant_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    applicant = crud.applicant.get_by_id(db, applicant_id)
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found.")
    return applicant


@router.put("/{applicant_id}", response_model=ApplicantResponse, summary="Update applicant")
def update_applicant(
    applicant_id: uuid.UUID,
    data: ApplicantUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    applicant = crud.applicant.get_by_id(db, applicant_id)
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found.")
    # Email uniqueness check (only if email is changing)
    if data.email and data.email != applicant.email:
        if crud.applicant.get_by_email(db, data.email):
            raise HTTPException(status_code=409, detail=f"Email '{data.email}' is already in use.")
    return crud.applicant.update(db, applicant, data)


@router.delete("/{applicant_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete applicant")
def delete_applicant(
    applicant_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    applicant = crud.applicant.get_by_id(db, applicant_id)
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found.")
    crud.applicant.delete(db, applicant)
