from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.models.applicant import ApplicantStatus, HighestDegree


class ApplicantBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    highest_degree: HighestDegree = HighestDegree.bachelors
    dynamic_data: dict = {}
    specialization: Optional[str] = None
    teaching_units_available: int = 18
    applied_position_id: Optional[UUID] = None
    is_internal: bool = False
    status: ApplicantStatus = ApplicantStatus.pending


class ApplicantCreate(ApplicantBase):
    pass


class ApplicantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    highest_degree: Optional[HighestDegree] = None
    dynamic_data: Optional[dict] = None
    specialization: Optional[str] = None
    teaching_units_available: Optional[int] = None
    applied_position_id: Optional[UUID] = None
    is_internal: Optional[bool] = None
    status: Optional[ApplicantStatus] = None


class ApplicantResponse(ApplicantBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    mcdm_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class ApplicantSummary(BaseModel):
    """Lightweight version used for listing."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    first_name: str
    last_name: str
    email: str
    highest_degree: HighestDegree
    dynamic_data: dict
    is_internal: bool
    status: ApplicantStatus
    mcdm_score: Optional[float] = None
    created_at: datetime
