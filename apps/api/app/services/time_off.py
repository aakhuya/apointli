import uuid
from datetime import date, time as dt_time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.time_off import TimeOff
from app.schemas.time_off import CreateTimeOffRequest


class TimeOffError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _parse_time(value: str | None) -> dt_time | None:
    if not value:
        return None
    h, m = value.split(":")
    return dt_time(hour=int(h), minute=int(m))


def _format_time(value: dt_time | None) -> str | None:
    if not value:
        return None
    return f"{value.hour:02d}:{value.minute:02d}"


async def create_time_off(
    db: AsyncSession, staff_id: uuid.UUID, payload: CreateTimeOffRequest
) -> TimeOff:
    # Check for overlapping existing time off
    result = await db.execute(
        select(TimeOff)
        .where(TimeOff.staff_profile_id == staff_id)
        .where(TimeOff.start_date <= payload.end_date)
        .where(TimeOff.end_date >= payload.start_date)
    )
    existing = list(result.scalars().all())

    # If any full-day overlaps exist, reject
    for t in existing:
        if not t.start_time and not t.end_time:
            raise TimeOffError(
                "Overlaps an existing full-day time off",
                status_code=409,
            )
        if not payload.start_time and not payload.end_time:
            raise TimeOffError(
                "A full-day entry overlaps existing partial time off on these dates",
                status_code=409,
            )

    record = TimeOff(
        staff_profile_id=staff_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        start_time=_parse_time(payload.start_time),
        end_time=_parse_time(payload.end_time),
        reason=payload.reason,
        is_approved=True,  # managers adding it themselves = approved
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_time_off(
    db: AsyncSession, staff_id: uuid.UUID
) -> list[TimeOff]:
    result = await db.execute(
        select(TimeOff)
        .where(TimeOff.staff_profile_id == staff_id)
        .order_by(TimeOff.start_date.desc())
    )
    return list(result.scalars().all())


async def delete_time_off(db: AsyncSession, time_off_id: uuid.UUID, staff_id: uuid.UUID) -> None:
    result = await db.execute(
        select(TimeOff)
        .where(TimeOff.id == time_off_id)
        .where(TimeOff.staff_profile_id == staff_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise TimeOffError("Time off not found", status_code=404)
    await db.delete(record)
    await db.commit()


def to_response(t: TimeOff) -> dict:
    return {
        "id": str(t.id),
        "staff_id": str(t.staff_profile_id),
        "start_date": t.start_date.isoformat(),
        "end_date": t.end_date.isoformat(),
        "start_time": _format_time(t.start_time),
        "end_time": _format_time(t.end_time),
        "reason": t.reason,
        "is_approved": t.is_approved,
    }
