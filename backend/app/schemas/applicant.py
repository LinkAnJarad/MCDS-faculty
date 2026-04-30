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
    years_experience: int = 0
    research_outputs: int = 0
    certifications: int = 0
    specialization: Optional[str] = None
    teaching_units_available: int = 18
    applied_position_id: Optional[UUID] = None
    status: ApplicantStatus = ApplicantStatus.pending


class ApplicantCreate(ApplicantBase):
    pass


class ApplicantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    highest_degree: Optional[HighestDegree] = None
    years_experience: Optional[int] = None
    research_outputs: Optional[int] = None
    certifications: Optional[int] = None
    specialization: Optional[str] = None
    teaching_units_available: Optional[int] = None
    applied_position_id: Optional[UUID] = None
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
    years_experience: int
    research_outputs: int
    certifications: int
    status: ApplicantStatus
    mcdm_score: Optional[float] = None
    created_at: datetime
