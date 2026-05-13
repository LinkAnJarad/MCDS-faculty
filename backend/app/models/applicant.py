import enum
import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base import Base


class ApplicantStatus(str, enum.Enum):
    pending = "pending"
    shortlisted = "shortlisted"
    rejected = "rejected"
    hired = "hired"


class HighestDegree(str, enum.Enum):
    bachelors = "bachelors"
    masters = "masters"
    doctorate = "doctorate"
    post_doctorate = "post_doctorate"


class Applicant(Base):
    """
    An individual applying for a faculty position.
    Stores the raw evaluation criteria attributes that the MCDM
    engine will use to calculate scores in Phase 3.
    """
    __tablename__ = "applicants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)

    # Educational & Professional Attributes (MCDM inputs)
    highest_degree: Mapped[HighestDegree] = mapped_column(
        Enum(HighestDegree, name="highestdegree"), nullable=False, default=HighestDegree.bachelors
    )

    specialization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    teaching_units_available: Mapped[int] = mapped_column(Integer, nullable=False, default=18)

    # Dynamic application fields (MCDM inputs beyond the standard ones)
    dynamic_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # Application metadata
    applied_position_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("positions.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[ApplicantStatus] = mapped_column(
        Enum(ApplicantStatus, name="applicantstatus"),
        nullable=False,
        default=ApplicantStatus.pending,
    )
    is_internal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    mcdm_score: Mapped[float | None] = mapped_column(nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    position = relationship("Position", foreign_keys=[applied_position_id], lazy="select")

    def __repr__(self) -> str:
        return f"<Applicant {self.first_name} {self.last_name} status={self.status}>"
