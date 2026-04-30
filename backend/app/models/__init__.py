# Import all models here so Alembic's autogenerate can detect them
from app.models.user import User  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.position import Position  # noqa: F401
from app.models.applicant import Applicant  # noqa: F401
from app.models.criteria import Criteria  # noqa: F401
from app.models.allocation import Allocation  # noqa: F401

__all__ = [
    "User",
    "Department",
    "Position",
    "Applicant",
    "Criteria",
    "Allocation",
]
