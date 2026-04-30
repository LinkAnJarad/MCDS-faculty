from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional

# Valid data keys that map to Applicant model attributes
VALID_DATA_KEYS = [
    "years_experience",
    "research_outputs",
    "certifications",
    "highest_degree",
    "teaching_units_available",
]


class CriteriaBase(BaseModel):
    name: str
    description: Optional[str] = None
    weight: float
    data_key: str
    is_active: bool = True

    @field_validator("weight")
    @classmethod
    def weight_must_be_positive(cls, v: float) -> float:
        if v < 0 or v > 100:
            raise ValueError("Weight must be between 0 and 100")
        return v

    @field_validator("data_key")
    @classmethod
    def data_key_must_be_valid(cls, v: str) -> str:
        if v not in VALID_DATA_KEYS:
            raise ValueError(f"data_key must be one of: {VALID_DATA_KEYS}")
        return v


class CriteriaCreate(CriteriaBase):
    pass


class CriteriaUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    weight: Optional[float] = None
    data_key: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("weight")
    @classmethod
    def weight_must_be_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Weight must be between 0 and 100")
        return v


class CriteriaResponse(CriteriaBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class WeightSummary(BaseModel):
    """Total weight of all active criteria."""
    total_weight: float
    is_valid: bool  # True if total == 100.0
    active_count: int
