"""
Linear Programming Optimizer (Faculty Workload Allocation)
==========================================================
Uses PuLP with CBC solver to solve the Binary Integer Programming problem:

  OBJECTIVE:  Maximize total MCDM alignment score of all assignments.
  VARIABLES:  x[i][j] ∈ {0, 1}  — 1 if applicant i is assigned to position j.

  CONSTRAINTS:
    1. Each applicant is assigned to at most 1 position.
    2. Each position is filled by at most 1 applicant.
    3. Hard constraint: if position requires PhD, only doctorate/post_doctorate
       applicants are eligible (forces x[i][j] = 0 for non-PhD applicants).
    4. Hard constraint: applicant's available teaching units must be >= position's
       required units (forces x[i][j] = 0 if units insufficient).

References: PLAN.md Phase 3 — "Optimization and Workload Allocation Module"
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

import pulp

from app.models.applicant import Applicant
from app.models.position import Position

PHD_DEGREES = {"doctorate", "post_doctorate"}


@dataclass
class AllocationItem:
    applicant_id: str
    applicant_name: str
    position_id: str
    position_title: str
    department_name: str | None
    alignment_score: float
    teaching_units: int


@dataclass
class OptimizationResult:
    status: str                              # "Optimal" | "Feasible" | "Infeasible" | "Undefined"
    total_score: float                       # Sum of MCDM scores for all allocations
    allocations: list[AllocationItem] = field(default_factory=list)
    unallocated_applicant_names: list[str] = field(default_factory=list)
    unfilled_position_titles: list[str] = field(default_factory=list)
    solver_message: str = ""
    solved_at: str = ""


def _applicant_degree(applicant: Applicant) -> str:
    return applicant.highest_degree.value if hasattr(applicant.highest_degree, "value") else str(applicant.highest_degree)


def _is_feasible(applicant: Applicant, position: Position) -> bool:
    """
    Returns False (and forces x[i][j]=0) if the assignment violates a hard
    institutional constraint. Currently enforces:
    - PhD requirement
    - Minimum teaching unit availability
    """
    if position.requires_phd and _applicant_degree(applicant) not in PHD_DEGREES:
        return False
    if applicant.teaching_units_available < position.required_units:
        return False
    return True


def run_optimization(
    applicants: list[Applicant],
    positions: list[Position],
    scores: dict[str, float],          # {applicant_id_str: mcdm_score (0-100)}
    maximize_coverage: bool = False,   # True: maximize number filled; False: maximize score
) -> OptimizationResult:
    """
    Solves the faculty-position assignment LP.

    Args:
        applicants:        List of Applicant ORM objects.
        positions:         List of open Position ORM objects.
        scores:            Pre-computed MCDM scores per applicant id (string).
        maximize_coverage: If True, objective maximizes number of positions filled
                           instead of total score (useful for what-if scenario).

    Returns:
        OptimizationResult with solver status and assignment details.
    """
    now = datetime.now(timezone.utc).isoformat()

    if not applicants or not positions:
        return OptimizationResult(
            status="Infeasible",
            total_score=0.0,
            solver_message="No applicants or positions available to optimize.",
            solved_at=now,
        )

    # ── Model ────────────────────────────────────────────────────────────────
    prob = pulp.LpProblem("FacultyAllocation", pulp.LpMaximize)

    # ── Decision variables ───────────────────────────────────────────────────
    # x[i_str][j_str] ∈ {0, 1}
    x: dict[str, dict[str, pulp.LpVariable]] = {}
    for a in applicants:
        a_id = str(a.id)
        x[a_id] = {}
        for p in positions:
            p_id = str(p.id)
            var_name = f"x_{a_id.replace('-','_')}_{p_id.replace('-','_')}"
            x[a_id][p_id] = pulp.LpVariable(var_name, cat="Binary")

    # ── Hard feasibility constraints (force ineligible pairs to 0) ───────────
    for a in applicants:
        a_id = str(a.id)
        for p in positions:
            p_id = str(p.id)
            if not _is_feasible(a, p):
                prob += x[a_id][p_id] == 0, f"infeasible_{a_id}_{p_id}"

    # ── Objective function ────────────────────────────────────────────────────
    if maximize_coverage:
        # Count of filled positions
        prob += pulp.lpSum(
            x[str(a.id)][str(p.id)]
            for a in applicants
            for p in positions
        ), "MaximizeCoverage"
    else:
        # Total MCDM alignment score
        prob += pulp.lpSum(
            x[str(a.id)][str(p.id)] * scores.get(str(a.id), 0.0)
            for a in applicants
            for p in positions
        ), "MaximizeTotalScore"

    # ── Assignment constraints ────────────────────────────────────────────────
    # Each applicant assigned to at most 1 position
    for a in applicants:
        a_id = str(a.id)
        prob += (
            pulp.lpSum(x[a_id][str(p.id)] for p in positions) <= 1,
            f"one_position_per_applicant_{a_id}",
        )

    # Each position filled by at most 1 applicant
    for p in positions:
        p_id = str(p.id)
        prob += (
            pulp.lpSum(x[str(a.id)][p_id] for a in applicants) <= 1,
            f"one_applicant_per_position_{p_id}",
        )

    # ── Solve ────────────────────────────────────────────────────────────────
    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=30)
    prob.solve(solver)

    lp_status = pulp.LpStatus[prob.status]          # "Optimal", "Infeasible", etc.
    lp_value = pulp.value(prob.objective) or 0.0

    # ── Parse results ─────────────────────────────────────────────────────────
    allocations: list[AllocationItem] = []
    allocated_applicant_ids: set[str] = set()
    filled_position_ids: set[str] = set()

    if prob.status in (pulp.LpStatusOptimal, 1):  # optimal or feasible
        for a in applicants:
            a_id = str(a.id)
            for p in positions:
                p_id = str(p.id)
                if pulp.value(x[a_id][p_id]) and pulp.value(x[a_id][p_id]) > 0.5:
                    dept_name = None
                    if p.department:
                        dept_name = p.department.name
                    allocations.append(AllocationItem(
                        applicant_id=a_id,
                        applicant_name=f"{a.first_name} {a.last_name}",
                        position_id=p_id,
                        position_title=p.title,
                        department_name=dept_name,
                        alignment_score=round(scores.get(a_id, 0.0), 4),
                        teaching_units=p.required_units,
                    ))
                    allocated_applicant_ids.add(a_id)
                    filled_position_ids.add(p_id)

    # Identify unallocated applicants and unfilled positions
    unallocated = [
        f"{a.first_name} {a.last_name}"
        for a in applicants
        if str(a.id) not in allocated_applicant_ids
    ]
    unfilled = [
        p.title
        for p in positions
        if str(p.id) not in filled_position_ids
    ]

    # Sort allocations by alignment score descending
    allocations.sort(key=lambda al: al.alignment_score, reverse=True)

    return OptimizationResult(
        status=lp_status,
        total_score=round(lp_value, 4),
        allocations=allocations,
        unallocated_applicant_names=unallocated,
        unfilled_position_titles=unfilled,
        solver_message=f"CBC solver: {lp_status}. {len(allocations)} assignments made.",
        solved_at=now,
    )
