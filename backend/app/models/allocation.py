import uuid
from datetime import datetime

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Allocation(Base):
    """
    Records the result of the optimization engine assigning an
    applicant to a specific position in a specific department.

    Created by the Workload Allocation Module (Phase 3).
    """
    __tablename__ = "allocations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    applicant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("applicants.id", ondelete="CASCADE"), nullable=False
    )
    position_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("positions.id", ondelete="CASCADE"), nullable=False
    )
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    allocated_units: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    alignment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    allocated_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships
    applicant = relationship("Applicant", foreign_keys=[applicant_id], lazy="select")
    position = relationship("Position", foreign_keys=[position_id], lazy="select")
    department = relationship("Department", foreign_keys=[department_id], lazy="select")

    def __repr__(self) -> str:
        return f"<Allocation applicant={self.applicant_id} → position={self.position_id}>"
