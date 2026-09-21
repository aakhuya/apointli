"""
The availability engine.

Given a staff member, a service, and a date, produce the list of valid
bookable time slots — respecting working hours, breaks, time-off,
existing appointments, and service buffers.

All time computations happen in the staff member's timezone. Storage of
appointments is always in UTC; conversion happens at the boundary.
"""

import uuid
from datetime import date, datetime, time as dt_time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment, AppointmentStatus  # type: ignore
from app.models.schedule import Schedule, ScheduleRule
from app.models.service import Service
from app.models.staff import StaffProfile
from app.models.time_off import TimeOff


# Slot granularity — the interval between candidate slot start times
SLOT_GRANULARITY_MINUTES = 15


class AvailabilityError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _to_minutes(t: dt_time) -> int:
    return t.hour * 60 + t.minute


def _from_minutes(m: int) -> dt_time:
    return dt_time(hour=m // 60, minute=m % 60)


def _overlap(a_start: int, a_end: int, b_start: int, b_end: int) -> bool:
    """True if [a_start, a_end) overlaps [b_start, b_end)."""
    return a_start < b_end and b_start < a_end


async def compute_availability(
    db: AsyncSession,
    staff_id: uuid.UUID,
    service: Service,
    target_date: date,
    granularity_minutes: int = SLOT_GRANULARITY_MINUTES,
) -> list[dict]:
    """
    Return list of {start: ISO8601 UTC, end: ISO8601 UTC, local_start: "HH:MM"}
    for all bookable slots.
    """
    # 1. Load staff with location (for timezone)
    result = await db.execute(
        select(StaffProfile)
        .options(selectinload(StaffProfile.location))
        .where(StaffProfile.id == staff_id)
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise AvailabilityError("Staff member not found", status_code=404)

    # Determine timezone
    tz_name = "UTC"
    if staff.location and staff.location.timezone:
        tz_name = staff.location.timezone
    elif staff.organization and staff.organization.timezone:  # type: ignore
        tz_name = staff.organization.timezone  # type: ignore
    tz = ZoneInfo(tz_name)

    # 2. Get the schedule rule for this weekday
    # Python's weekday(): Monday=0 ... Sunday=6
    day_of_week = target_date.weekday()

    result = await db.execute(
        select(ScheduleRule)
        .join(Schedule, Schedule.id == ScheduleRule.schedule_id)
        .where(Schedule.staff_id == staff_id)
        .where(Schedule.is_default.is_(True))
        .where(ScheduleRule.day_of_week == day_of_week)
    )
    rule = result.scalar_one_or_none()

    if not rule or not rule.is_active or not rule.start_time or not rule.end_time:
        return []  # staff doesn't work this day

    work_start = _to_minutes(rule.start_time)
    work_end = _to_minutes(rule.end_time)

    break_start = _to_minutes(rule.break_start) if rule.break_start else None
    break_end = _to_minutes(rule.break_end) if rule.break_end else None

    # 3. Compute effective service duration including buffers
    duration = service.duration_minutes
    buffer_before = service.buffer_before_minutes
    buffer_after = service.buffer_after_minutes
    total_duration = buffer_before + duration + buffer_after

    # 4. Load existing appointments for this date (in UTC, then convert to local)
    # Staff's local day
    local_start = datetime.combine(target_date, dt_time(0, 0, 0), tzinfo=tz)
    local_end = local_start + timedelta(days=1)
    utc_start = local_start.astimezone(ZoneInfo("UTC"))
    utc_end = local_end.astimezone(ZoneInfo("UTC"))

    result = await db.execute(
        select(Appointment)
        .where(Appointment.staff_profile_id == staff_id)
        .where(Appointment.start_time < utc_end)
        .where(Appointment.end_time > utc_start)
        .where(
            Appointment.status.in_(
                [
                    AppointmentStatus.SCHEDULED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS,
                ]
            )
        )
    )
    appointments = list(result.scalars().all())

    # Convert appointments to local minutes-of-day
    blocked_by_appointments: list[tuple[int, int]] = []
    for appt in appointments:
        local_a_start = appt.start_time.astimezone(tz)
        local_a_end = appt.end_time.astimezone(tz)
        # Only consider blocks that fall on this date
        if local_a_start.date() == target_date:
            blocked_by_appointments.append(
                (
                    local_a_start.hour * 60 + local_a_start.minute,
                    local_a_end.hour * 60 + local_a_end.minute,
                )
            )
        # An appointment that starts the previous day and bleeds into today
        elif local_a_start.date() < target_date < local_a_end.date():
            blocked_by_appointments.append((0, local_a_end.hour * 60 + local_a_end.minute))
        # An appointment that starts today and bleeds into tomorrow
        elif local_a_start.date() == target_date and local_a_end.date() > target_date:
            blocked_by_appointments.append((local_a_start.hour * 60 + local_a_start.minute, 24 * 60))

    # 5. Load time-off covering this date
    result = await db.execute(
        select(TimeOff)
        .where(TimeOff.staff_profile_id == staff_id)
        .where(TimeOff.start_date <= target_date)
        .where(TimeOff.end_date >= target_date)
    )
    time_offs = list(result.scalars().all())

    blocked_by_time_off: list[tuple[int, int]] = []
    for t in time_offs:
        if t.start_time and t.end_time:
            # Partial day — only applies if the target date is within range
            blocked_by_time_off.append(
                (_to_minutes(t.start_time), _to_minutes(t.end_time))
            )
        else:
            # Full day
            blocked_by_time_off.append((0, 24 * 60))

    # 6. Generate candidate slots and filter
    now_utc = datetime.now(ZoneInfo("UTC"))
    candidates: list[dict] = []

    slot_start = work_start
    while slot_start + total_duration <= work_end:
        slot_end = slot_start + total_duration

        # a) Must not overlap break
        if break_start is not None and break_end is not None:
            if _overlap(slot_start, slot_end, break_start, break_end):
                slot_start += granularity_minutes
                continue

        # b) Must not overlap appointments
        if any(_overlap(slot_start, slot_end, a, b) for a, b in blocked_by_appointments):
            slot_start += granularity_minutes
            continue

        # c) Must not overlap time-off
        if any(_overlap(slot_start, slot_end, a, b) for a, b in blocked_by_time_off):
            slot_start += granularity_minutes
            continue

        # d) Must be in the future (account for buffer_before)
        slot_local_start = datetime.combine(
            target_date, _from_minutes(slot_start), tzinfo=tz
        )
        # The "commit" moment is when the actual service starts,
        # so check now against (slot_start + buffer_before)
        commit_local = slot_local_start + timedelta(minutes=buffer_before)
        commit_utc = commit_local.astimezone(ZoneInfo("UTC"))
        if commit_utc <= now_utc:
            slot_start += granularity_minutes
            continue

        # Slot is valid — compute UTC boundaries of the *service* (not buffers)
        service_local_start = slot_local_start + timedelta(minutes=buffer_before)
        service_local_end = service_local_start + timedelta(minutes=duration)

        candidates.append(
            {
                "start": service_local_start.astimezone(ZoneInfo("UTC")).isoformat(),
                "end": service_local_end.astimezone(ZoneInfo("UTC")).isoformat(),
                "local_start": f"{service_local_start.hour:02d}:{service_local_start.minute:02d}",
                "local_end": f"{service_local_end.hour:02d}:{service_local_end.minute:02d}",
                "timezone": tz_name,
            }
        )

        slot_start += granularity_minutes

    return candidates
