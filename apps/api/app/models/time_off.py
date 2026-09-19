import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class TimeOff(Base):
    __tablename__ = "time_off"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    staff_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_time: Mapped[object | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[object | None] = mapped_column(Time, nullable=True)

    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    staff: Mapped["StaffProfile"] = relationship("StaffProfile")  # type: ignore # noqa: F821

    def __repr__(self) -> str:
        return f"<TimeOff {self.start_date} → {self.end_date}>"
