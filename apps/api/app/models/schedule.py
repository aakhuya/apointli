import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Time, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    staff_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("staff_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(100), default="Default", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

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
    rules: Mapped[list["ScheduleRule"]] = relationship(
        "ScheduleRule", back_populates="schedule", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Schedule staff={self.staff_id} name={self.name}>"


class ScheduleRule(Base):
    __tablename__ = "schedule_rules"
    __table_args__ = (
        UniqueConstraint("schedule_id", "day_of_week", name="uq_schedule_day"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    schedule_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("schedules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # 0 = Monday, 6 = Sunday
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)

    # Nullable because "off" days have no hours
    start_time: Mapped[object | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[object | None] = mapped_column(Time, nullable=True)

    break_start: Mapped[object | None] = mapped_column(Time, nullable=True)
    break_end: Mapped[object | None] = mapped_column(Time, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="rules")

    def __repr__(self) -> str:
        return f"<ScheduleRule day={self.day_of_week}>"
