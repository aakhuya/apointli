"""
Derive "notifications" for the business owner from real activity.

We don't store a notifications table yet — instead we build a feed
from recent events (bookings created, cancelled, etc.). This keeps
the feature useful without schema churn.
"""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment, AppointmentStatus
from app.models.organization import Organization


async def list_recent_notifications(
    db: AsyncSession,
    org: Organization,
    limit: int = 20,
) -> list[dict]:
    """Return recent booking events as a notification feed."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)

    result = await db.execute(
        select(Appointment)
        .where(Appointment.organization_id == org.id)
        .where(Appointment.created_at >= cutoff)
        .order_by(Appointment.created_at.desc())
        .limit(limit)
    )
    appointments = list(result.scalars().all())

    items = []
    for appt in appointments:
        customer = appt.customer_name or "A customer"
        service = appt.service_name or "an appointment"

        if appt.status == AppointmentStatus.CANCELLED:
            title = f"{customer} cancelled"
            body = f"{service} on {appt.start_time.strftime('%b %d, %I:%M %p')}"
            ntype = "cancellation"
        elif appt.status == AppointmentStatus.NO_SHOW:
            title = f"{customer} no-showed"
            body = f"{service} on {appt.start_time.strftime('%b %d, %I:%M %p')}"
            ntype = "no_show"
        else:
            title = f"New booking from {customer}"
            body = f"{service} on {appt.start_time.strftime('%b %d, %I:%M %p')}"
            ntype = "booking"

        items.append(
            {
                "id": str(appt.id),
                "type": ntype,
                "title": title,
                "body": body,
                "created_at": appt.created_at.isoformat(),
                "link": f"/app/appointments",
            }
        )

    return items
