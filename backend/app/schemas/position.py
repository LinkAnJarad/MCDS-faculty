from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.schemas.department import DepartmentResponse


class PositionBase(BaseModel):
    title: str
    department_id: UUID
    required_units: int = 18
    requires_phd: bool = False
    description: Optional[str] = None
    is_open: bool = True


class PositionCreate(PositionBase):
    pass


class PositionUpdate(BaseModel):
    title: Optional[str] = None
    department_id: Optional[UUID] = None
    required_units: Optional[int] = None
    requires_phd: Optional[bool] = None
    description: Optional[str] = None
    is_open: Optional[bool] = None


class PositionResponse(PositionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    department: Optional[DepartmentResponse] = None
