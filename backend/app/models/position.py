import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Position(Base):
    """
    An open faculty position within a department.
    Positions define the requirements that applicants must meet
    and serve as the allocation targets in the optimization engine.
    """
    __tablename__ = "positions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    required_units: Mapped[int] = mapped_column(Integer, nullable=False, default=18)
    requires_phd: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    required_specialization: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)

    # Relationships (back-populated during Phase 2+)
    department = relationship("Department", back_populates=None, lazy="select")

    def __repr__(self) -> str:
        return f"<Position {self.title!r} dept={self.department_id}>"
