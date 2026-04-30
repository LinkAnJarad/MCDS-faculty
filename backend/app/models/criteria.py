import uuid
from datetime import datetime

from sqlalchemy import Boolean, Float, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Criteria(Base):
    """
    An evaluation criterion used by the MCDM engine to score applicants.

    Each criterion has:
    - `weight`: percentage weight in the total score (all active criteria must sum to 100)
    - `data_key`: the attribute name on the Applicant model used for scoring
    - `is_active`: allows HR to toggle criteria without deleting them
    """
    __tablename__ = "criteria"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    data_key: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Maps to an Applicant attribute key used during MCDM calculation",
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<Criteria {self.name!r} weight={self.weight}%>"
