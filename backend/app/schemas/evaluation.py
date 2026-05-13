from pydantic import BaseModel
from typing import Optional


class CriteriaBreakdown(BaseModel):
    criteria_id: str
    criteria_name: str
    data_key: str
    weight: float
    raw_value: float
    normalized_value: float
    weighted_score: float


class ApplicantRankingOut(BaseModel):
    rank: int
    applicant_id: str
    first_name: str
    last_name: str
    email: str
    status: str
    mcdm_score: float
    breakdown: list[CriteriaBreakdown]


class EvaluationResultOut(BaseModel):
    total_applicants: int
    criteria_count: int
    total_weight: float
    rankings: list[ApplicantRankingOut]
    evaluated_at: str
    scores_saved: bool = False


class RunEvaluationRequest(BaseModel):
    save_scores: bool = True
    """If True, persist mcdm_score back to the Applicant table."""

    custom_weights: Optional[dict[str, float]] = None
    """Optional {data_key: weight} overrides for what-if analysis (does not save)."""

    include_statuses: list[str] = ["pending", "shortlisted", "hired"]
    """Which applicant statuses to include in the evaluation."""

    applicant_type: str = "both"
    """Which applicant type to include: 'external', 'internal', or 'both'."""
