import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.core.security import require_auth
from app.db.session import get_db
from app.schemas.position import PositionCreate, PositionResponse, PositionUpdate

router = APIRouter()


@router.get("", response_model=list[PositionResponse], summary="List positions")
def list_positions(
    department_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    return crud.position.get_all(db, department_id=department_id, skip=skip, limit=limit)


@router.post("", response_model=PositionResponse, status_code=status.HTTP_201_CREATED, summary="Create position")
def create_position(
    data: PositionCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    if not crud.department.get_by_id(db, data.department_id):
        raise HTTPException(status_code=400, detail="Department not found.")
    return crud.position.create(db, data)


@router.get("/{position_id}", response_model=PositionResponse, summary="Get position")
def get_position(
    position_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    pos = crud.position.get_by_id(db, position_id)
    if not pos:
        raise HTTPException(status_code=404, detail="Position not found.")
    return pos


@router.put("/{position_id}", response_model=PositionResponse, summary="Update position")
def update_position(
    position_id: uuid.UUID,
    data: PositionUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    pos = crud.position.get_by_id(db, position_id)
    if not pos:
        raise HTTPException(status_code=404, detail="Position not found.")
    return crud.position.update(db, pos, data)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete position")
def delete_position(
    position_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    pos = crud.position.get_by_id(db, position_id)
    if not pos:
        raise HTTPException(status_code=404, detail="Position not found.")
    crud.position.delete(db, pos)
