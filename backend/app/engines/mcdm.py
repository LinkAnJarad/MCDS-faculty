"""
Multi-Criteria Decision Making (MCDM) Engine
=============================================
Implements the Weighted Sum Model (WSM):

  1. Collect raw applicant values for each criterion (data_key → Applicant field).
  2. Apply Min-Max normalization per criterion column so all values are 0→1.
  3. Multiply each normalized value by (criterion weight / total active weight).
  4. Sum across all criteria to produce the final MCDM score (0→100 scale).
  5. Rank applicants by descending score.

References: PLAN.md Phase 3 — "Automated Evaluation System"
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.models.applicant import Applicant
from app.models.criteria import Criteria

# Maps HighestDegree enum values to ordinal numbers for numerical comparison
DEGREE_ORDINAL: dict[str, float] = {
    "bachelors": 1.0,
    "masters": 2.0,
    "doctorate": 3.0,
    "post_doctorate": 4.0,
}


@dataclass
class CriteriaScore:
    criteria_id: str
    criteria_name: str
    data_key: str
    weight: float
    raw_value: float
    normalized_value: float
    weighted_score: float  # contribution to total (0–1 range internally)


@dataclass
class ApplicantRanking:
    rank: int
    applicant_id: str
    first_name: str
    last_name: str
    email: str
    status: str
    mcdm_score: float  # 0–100 scale
    breakdown: list[CriteriaScore] = field(default_factory=list)


@dataclass
class EvaluationResult:
    total_applicants: int
    criteria_count: int
    total_weight: float
    rankings: list[ApplicantRanking]
    evaluated_at: str


def _get_raw_value(applicant: Applicant, data_key: str) -> float:
    """
    Extracts a numeric value from an Applicant for the given data_key.
    Converts the `highest_degree` enum to an ordinal scale.
    Falls back to `dynamic_data` if not found as a standard attribute.
    """
    if data_key == "highest_degree":
        degree_val = applicant.highest_degree.value if hasattr(applicant.highest_degree, "value") else str(applicant.highest_degree)
        return DEGREE_ORDINAL.get(degree_val, 1.0)
    
    if hasattr(applicant, data_key):
        value = getattr(applicant, data_key, 0)
    else:
        # Fallback to JSON dynamic data
        value = applicant.dynamic_data.get(data_key, 0) if applicant.dynamic_data else 0

    try:
        return float(value) if value is not None else 0.0
    except (ValueError, TypeError):
        return 0.0


class MCDMStrategy(ABC):
    """
    Abstract base class for Multi-Criteria Decision Making (MCDM) algorithms.
    This structure allows for easy substitution of evaluation models (e.g., AHP, TOPSIS).
    """
    @abstractmethod
    def evaluate(
        self,
        applicants: list[Applicant],
        active_criteria: list[Criteria],
        custom_weights: dict[str, float] | None = None,
    ) -> EvaluationResult:
        pass


class WeightedSumStrategy(MCDMStrategy):
    """
    Implements the Simple Weighted Sum Model (WSM).
    1. Min-Max normalizes criteria values to a 0-1 scale.
    2. Multiplies by the relative weight of the criterion.
    3. Sums all weighted scores per applicant.
    """
    def evaluate(
        self,
        applicants: list[Applicant],
        active_criteria: list[Criteria],
        custom_weights: dict[str, float] | None = None,
    ) -> EvaluationResult:
        
        if not applicants:
            return EvaluationResult(
                total_applicants=0,
                criteria_count=len(active_criteria),
                total_weight=0.0,
                rankings=[],
                evaluated_at=datetime.now(timezone.utc).isoformat(),
            )

        if not active_criteria:
            raise ValueError("No active evaluation criteria found. Please configure criteria first.")

        # Apply custom weights if provided (what-if scenario)
        effective_weights: dict[str, float] = {}
        for crit in active_criteria:
            if custom_weights and crit.data_key in custom_weights:
                effective_weights[crit.data_key] = custom_weights[crit.data_key]
            else:
                effective_weights[crit.data_key] = float(crit.weight)

        total_weight = sum(effective_weights[c.data_key] for c in active_criteria)
        if total_weight <= 0:
            raise ValueError("Total criteria weight is zero. Please assign positive weights.")

        # ── Step 1: Build raw value matrix {criteria.id: [value per applicant]} ──
        raw_matrix: dict[str, list[float]] = {}
        for crit in active_criteria:
            raw_matrix[str(crit.id)] = [
                _get_raw_value(a, crit.data_key) for a in applicants
            ]

        # ── Step 2: Min-Max normalize each column ────────────────────────────────
        norm_matrix: dict[str, list[float]] = {}
        for crit in active_criteria:
            values = raw_matrix[str(crit.id)]
            min_v, max_v = min(values), max(values)
            if abs(max_v - min_v) < 1e-9:
                # All applicants have the same value → equal partial credit
                norm_matrix[str(crit.id)] = [1.0] * len(values)
            else:
                norm_matrix[str(crit.id)] = [
                    (v - min_v) / (max_v - min_v) for v in values
                ]

        # ── Step 3-4: Weighted Sum per applicant ──────────────────────────────────
        rankings: list[ApplicantRanking] = []

        for idx, applicant in enumerate(applicants):
            breakdown: list[CriteriaScore] = []
            total_score = 0.0

            for crit in active_criteria:
                crit_id = str(crit.id)
                raw_v = raw_matrix[crit_id][idx]
                norm_v = norm_matrix[crit_id][idx]
                w = effective_weights[crit.data_key]
                weight_fraction = w / total_weight
                weighted = norm_v * weight_fraction
                total_score += weighted

                breakdown.append(CriteriaScore(
                    criteria_id=crit_id,
                    criteria_name=crit.name,
                    data_key=crit.data_key,
                    weight=w,
                    raw_value=round(raw_v, 4),
                    normalized_value=round(norm_v, 4),
                    weighted_score=round(weighted, 4),
                ))

            rankings.append(ApplicantRanking(
                rank=0,  # filled after sort
                applicant_id=str(applicant.id),
                first_name=applicant.first_name,
                last_name=applicant.last_name,
                email=applicant.email,
                status=applicant.status.value if hasattr(applicant.status, "value") else str(applicant.status),
                mcdm_score=round(total_score * 100, 4),  # convert to 0–100
                breakdown=breakdown,
            ))

        # ── Step 5: Sort and assign ranks ────────────────────────────────────────
        rankings.sort(key=lambda r: r.mcdm_score, reverse=True)
        for i, r in enumerate(rankings):
            r.rank = i + 1

        return EvaluationResult(
            total_applicants=len(rankings),
            criteria_count=len(active_criteria),
            total_weight=total_weight,
            rankings=rankings,
            evaluated_at=datetime.now(timezone.utc).isoformat(),
        )


def run_evaluation(
    applicants: list[Applicant],
    active_criteria: list[Criteria],
    custom_weights: dict[str, float] | None = None,
    strategy: MCDMStrategy | None = None,
) -> EvaluationResult:
    """
    Core MCDM evaluation function acting as the context for the Strategy pattern.

    Args:
        applicants:      List of Applicant ORM objects to score.
        active_criteria: Active Criteria objects (weight + data_key).
        custom_weights:  Optional dict {data_key: weight} for what-if scenarios.
        strategy:        The MCDM evaluation algorithm to use. Defaults to WeightedSumStrategy.

    Returns:
        EvaluationResult with applicants ranked by MCDM score descending.
    """
    if strategy is None:
        strategy = WeightedSumStrategy()
        
    return strategy.evaluate(applicants, active_criteria, custom_weights)
