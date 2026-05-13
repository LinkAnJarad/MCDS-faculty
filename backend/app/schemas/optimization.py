from pydantic import BaseModel
from typing import Optional


class AllocationItemOut(BaseModel):
    applicant_id: str
    applicant_name: str
    position_id: str
    position_title: str
    department_name: Optional[str]
    alignment_score: float
    teaching_units: int


class OptimizationResultOut(BaseModel):
    status: str
    total_score: float
    allocation_count: int
    allocations: list[AllocationItemOut]
    unallocated_applicant_names: list[str]
    unfilled_position_titles: list[str]
    solver_message: str
    solved_at: str
    scores_saved: bool = False


class RunOptimizationRequest(BaseModel):
    save_allocations: bool = True
    """If True, persist results to the Allocation table."""

    maximize_coverage: bool = False
    """If True, objective maximizes positions filled rather than total score."""

    custom_weights: Optional[dict[str, float]] = None
    """Optional what-if weight overrides {data_key: weight}. Triggers MCDM re-run."""

    position_ids: Optional[list[str]] = None
    """Restrict optimization to a subset of positions. None = all open positions."""

    applicant_ids: Optional[list[str]] = None
    """Restrict optimization to a subset of applicants. None = all scored applicants."""

    applicant_type: str = "both"
    """Which applicant type to include: 'external', 'internal', or 'both'."""

class CommitAllocationItem(BaseModel):
    applicant_id: str
    position_id: str
    teaching_units: int
    alignment_score: float

class CommitOptimizationRequest(BaseModel):
    allocations: list[CommitAllocationItem]
