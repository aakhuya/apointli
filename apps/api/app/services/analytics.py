"""
Analytics aggregation for the business dashboard.

All queries are scoped to a single organization. Data is aggregated in
SQL (PostgreSQL GROUP BY) so we don't have to pull thousands of rows
into Python.

Time-window queries use UTC boundaries derived from the org's timezone,
so "this month" means the same thing to the business owner and the API.
"""

import uuid
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.organization import Organization
from app.models.service import Service
from app.models.staff import StaffProfile
from app.models.user import User


# ─── Helper: convert org-local dates to UTC boundaries ───
def _org_timezone(org: Organization) -> ZoneInfo:
    try:
        return ZoneInfo(org.timezone)
    except Exception:
        return ZoneInfo("UTC")


def _local_day_utc_range(
    org: Organization, start_local: date, end_local: date
) -> tuple[datetime, datetime]:
    """
    Given a start and end LOCAL date, return the UTC datetime range
    that covers those days in the org's timezone.
    """
    tz = _org_timezone(org)
    start_dt = datetime.combine(start_local, datetime.min.time(), tzinfo=tz)
    end_dt = datetime.combine(
        end_local + timedelta(days=1), datetime.min.time(), tzinfo=tz
    )
    return start_dt.astimezone(timezone.utc), end_dt.astimezone(timezone.utc)


# ─── Overview KPIs ───
async def get_overview(
    db: AsyncSession,
    org: Organization,
    start_date: date,
    end_date: date,
) -> dict:
    """Top-level KPIs: revenue, bookings, completion rate, cancellations."""
    utc_start, utc_end = _local_day_utc_range(org, start_date, end_date)

    # Total appointments in window
    total_result = await db.execute(
        select(func.count(Appointment.id))
        .where(Appointment.organization_id == org.id)
        .where(Appointment.start_time >= utc_start)
        .where(Appointment.start_time < utc_end)
    )
    total = total_result.scalar() or 0

    # Revenue: sum of completed/confirmed/scheduled/checked_in appointments
    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Appointment.service_price), 0))
        .where(Appointment.organization_id == org.id)
        .where(Appointment.start_time >= utc_start)
        .where(Appointment.start_time < utc_end)
        .where(
            Appointment.status.in_(
                [
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS,
                ]
            )
        )
    )
    revenue = float(revenue_result.scalar() or 0)

    # By status
    status_result = await db.execute(
        select(Appointment.status, func.count(Appointment.id))
        .where(Appointment.organization_id == org.id)
        .where(Appointment.start_time >= utc_start)
        .where(Appointment.start_time < utc_end)
        .group_by(Appointment.status)
    )
    status_counts = {row[0].value: row[1] for row in status_result.all()}

    completed = status_counts.get("COMPLETED", 0)
    cancelled = status_counts.get("CANCELLED", 0)
    no_show = status_counts.get("NO_SHOW", 0)

    return {
        "total_appointments": total,
        "revenue": revenue,
        "currency": org.currency,
        "completed": completed,
        "cancelled": cancelled,
        "no_show": no_show,
        "completion_rate": round(completed / total * 100, 1) if total else 0,
        "cancellation_rate": round(cancelled / total * 100, 1) if total else 0,
        "no_show_rate": round(no_show / total * 100, 1) if total else 0,
    }


# ─── Daily revenue + booking trend ───
async def get_daily_trend(
    db: AsyncSession,
    org: Organization,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """
    Return one row per day in the range with revenue + bookings.

    Days with no appointments still appear (with zero values) so charts
    look continuous.
    """
    utc_start, utc_end = _local_day_utc_range(org, start_date, end_date)
    tz = _org_timezone(org)

    # Group by local date — we need to convert start_time to org timezone
    # in the SQL. Using timezone() function.
    local_date_expr = func.date(
        func.timezone(org.timezone, Appointment.start_time)
    )

    result = await db.execute(
        select(
            local_date_expr.label("day"),
            func.count(Appointment.id).label("bookings"),
            func.coalesce(func.sum(Appointment.service_price), 0).label(
                "revenue"
            ),
        )
        .where(Appointment.organization_id == org.id)
        .where(Appointment.start_time >= utc_start)
        .where(Appointment.start_time < utc_end)
        .where(
            Appointment.status.in_(
                [
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS,
                    AppointmentStatus.SCHEDULED,
                ]
            )
        )
        .group_by(local_date_expr)
        .order_by(local_date_expr)
    )

    rows = {row.day.isoformat(): {"bookings": row.bookings, "revenue": float(row.revenue)} for row in result.all()}

    # Fill missing days with zeros
    out = []
    current = start_date
    while current <= end_date:
        key = current.isoformat()
        row = rows.get(key, {"bookings": 0, "revenue": 0.0})
        out.append({
            "date": key,
            "bookings": row["bookings"],
            "revenue": row["revenue"],
        })
        current += timedelta(days=1)

    return out


# ─── Service breakdown ───
async def get_service_breakdown(
    db: AsyncSession,
    org: Organization,
    start_date: date,
    end_date: date,
    limit: int = 5,
) -> list[dict]:
    utc_start, utc_end = _local_day_utc_range(org, start_date, end_date)

    result = await db.execute(
        select(
            Appointment.service_name,
            func.count(Appointment.id).label("bookings"),
            func.coalesce(func.sum(Appointment.service_price), 0).label(
                "revenue"
            ),
        )
        .where(Appointment.organization_id == org.id)
        .where(Appointment.start_time >= utc_start)
        .where(Appointment.start_time < utc_end)
        .where(
            Appointment.status.in_(
                [
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS,
                ]
            )
        )
        .where(Appointment.service_name.is_not(None))
        .group_by(Appointment.service_name)
        .order_by(func.count(Appointment.id).desc())
        .limit(limit)
    )

    return [
        {
            "name": row.service_name,
            "bookings": row.bookings,
            "revenue": float(row.revenue),
        }
        for row in result.all()
    ]


# ─── Staff breakdown ───
async def get_staff_breakdown(
    db: AsyncSession,
    org: Organization,
    start_date: date,
    end_date: date,
    limit: int = 5,
) -> list[dict]:
    utc_start, utc_end = _local_day_utc_range(org, start_date, end_date)

    result = await db.execute(
        select(
            StaffProfile.id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Appointment.id).label("bookings"),
            func.coalesce(func.sum(Appointment.service_price), 0).label(
                "revenue"
            ),
        )
        .join(Appointment, Appointment.staff_id == StaffProfile.id)
        .join(User, User.id == StaffProfile.user_id)
        .where(StaffProfile.organization_id == org.id)
        .where(Appointment.start_time >= utc_start)
        .where(Appointment.start_time < utc_end)
        .where(
            Appointment.status.in_(
                [
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS,
                ]
            )
        )
        .group_by(StaffProfile.id, User.first_name, User.last_name, User.email)
        .order_by(func.count(Appointment.id).desc())
        .limit(limit)
    )

    out = []
    for row in result.all():
        name = " ".join(p for p in [row.first_name, row.last_name] if p) or row.email
        out.append({
            "staff_id": str(row.id),
            "name": name,
            "bookings": row.bookings,
            "revenue": float(row.revenue),
        })
    return out


# ─── Hour-of-day heatmap ───
async def get_hour_heatmap(
    db: AsyncSession,
    org: Organization,
    start_date: date,
    end_date: date,
) -> list[dict]:
    """Bookings by hour of day (in org local time)."""
    utc_start, utc_end = _local_day_utc_range(org, start_date, end_date)

    local_hour = func.extract(
        "hour", func.timezone(org.timezone, Appointment.start_time)
    )

    result = await db.execute(
        select(
            local_hour.label("hour"),
            func.count(Appointment.id).label("count"),
        )
        .where(Appointment.organization_id == org.id)
        .where(Appointment.start_time >= utc_start)
        .where(Appointment.start_time < utc_end)
        .where(
            Appointment.status.in_(
                [
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CHECKED_IN,
                    AppointmentStatus.IN_PROGRESS,
                    AppointmentStatus.SCHEDULED,
                ]
            )
        )
        .group_by(local_hour)
        .order_by(local_hour)
    )

    counts = {int(row.hour): row.count for row in result.all()}

    return [{"hour": h, "count": counts.get(h, 0)} for h in range(24)]
