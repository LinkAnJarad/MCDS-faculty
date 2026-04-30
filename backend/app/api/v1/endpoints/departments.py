import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.core.security import require_auth
from app.db.session import get_db
from app.schemas.department import DepartmentCreate, DepartmentResponse, DepartmentUpdate

router = APIRouter()


@router.get("", response_model=list[DepartmentResponse], summary="List departments")
def list_departments(
    skip: int = 0,
    limit: int = 200,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    return crud.department.get_all(db, skip=skip, limit=limit)


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED, summary="Create department")
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    if crud.department.get_by_code(db, data.code):
        raise HTTPException(status_code=409, detail=f"Department code '{data.code}' already exists.")
    return crud.department.create(db, data)


@router.get("/{dept_id}", response_model=DepartmentResponse, summary="Get department")
def get_department(
    dept_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    dept = crud.department.get_by_id(db, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    return dept


@router.put("/{dept_id}", response_model=DepartmentResponse, summary="Update department")
def update_department(
    dept_id: uuid.UUID,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    dept = crud.department.get_by_id(db, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    return crud.department.update(db, dept, data)


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete department")
def delete_department(
    dept_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: dict = Depends(require_auth),
):
    dept = crud.department.get_by_id(db, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")
    crud.department.delete(db, dept)
