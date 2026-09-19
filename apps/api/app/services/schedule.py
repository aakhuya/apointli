import uuid
from datetime import time as dt_time

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.schedule import Schedule, ScheduleRule
from app.models.staff import StaffProfile
from app.schemas.schedule import ScheduleRuleInput, UpdateScheduleRequest


class ScheduleError(Exception):
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


async def get_schedule_for_staff(
    db: AsyncSession, staff_id: uuid.UUID
) -> Schedule | None:
    result = await db.execute(
        select(Schedule)
        .options(selectinload(Schedule.rules))
        .where(Schedule.staff_id == staff_id)
        .where(Schedule.is_default.is_(True))
    )
    return result.scalar_one_or_none()


async def upsert_schedule(
    db: AsyncSession,
    staff: StaffProfile,
    payload: UpdateScheduleRequest,
) -> Schedule:
    """
    Replace the staff member's default schedule with the given rules.
    Creates the schedule if it doesn't exist yet.
    """
    schedule = await get_schedule_for_staff(db, staff.id)

    if schedule is None:
        schedule = Schedule(
            staff_id=staff.id,
            name="Default",
            is_default=True,
            is_active=True,
        )
        db.add(schedule)
        await db.flush()  # get schedule.id
    else:
        # Delete existing rules and recreate
        await db.execute(
            delete(ScheduleRule).where(ScheduleRule.schedule_id == schedule.id)
        )

    for rule_input in payload.rules:
        rule = ScheduleRule(
            schedule_id=schedule.id,
            day_of_week=rule_input.day_of_week,
            is_active=rule_input.is_active,
            start_time=_parse_time(rule_input.start_time),
            end_time=_parse_time(rule_input.end_time),
            break_start=_parse_time(rule_input.break_start),
            break_end=_parse_time(rule_input.break_end),
        )
        db.add(rule)

    await db.commit()
    await db.refresh(schedule)

    # Reload with rules
    result = await db.execute(
        select(Schedule)
        .options(selectinload(Schedule.rules))
        .where(Schedule.id == schedule.id)
    )
    return result.scalar_one()


async def delete_schedule(db: AsyncSession, staff_id: uuid.UUID) -> None:
    schedule = await get_schedule_for_staff(db, staff_id)
    if schedule:
        await db.delete(schedule)
        await db.commit()


def rules_to_response(schedule: Schedule) -> list[dict]:
    """Return rules sorted by day_of_week with formatted time strings."""
    rules = sorted(schedule.rules, key=lambda r: r.day_of_week)
    return [
        {
            "day_of_week": r.day_of_week,
            "is_active": r.is_active,
            "start_time": _format_time(r.start_time),
            "end_time": _format_time(r.end_time),
            "break_start": _format_time(r.break_start),
            "break_end": _format_time(r.break_end),
        }
        for r in rules
    ]
