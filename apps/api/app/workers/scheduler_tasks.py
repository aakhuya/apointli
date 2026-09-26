"""
Celery Beat scheduled tasks.

Runs periodically to scan for work that needs doing:
- Send appointment reminders (~24h before)
- (future) cleanup of expired tokens, sessions, etc.
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.appointment import Appointment, AppointmentStatus
from app.models.organization import Organization
from app.models.staff import StaffProfile
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run(coro):
    """Run an async coroutine from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _find_reminders_due() -> list[dict]:
    """Find appointments that need a reminder sent right now."""
    now = datetime.now(timezone.utc)
    # Target: appointments that start between 23h and 25h from now
    # The 2-hour window ensures we catch every appointment exactly once
    # even if the hourly run has slight delays.
    window_start = now + timedelta(hours=23)
    window_end = now + timedelta(hours=25)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Appointment)
            .options(
                selectinload(Appointment.organization),
                selectinload(Appointment.staff).selectinload(StaffProfile.user),
                selectinload(Appointment.location),
            )
            .where(Appointment.start_time >= window_start)
            .where(Appointment.start_time <= window_end)
            .where(
                Appointment.status.in_(
                    [
                        AppointmentStatus.SCHEDULED,
                        AppointmentStatus.CONFIRMED,
                    ]
                )
            )
            .where(Appointment.customer_email.is_not(None))
        )
        appointments = list(result.scalars().all())

    payloads = []
    for appt in appointments:
        if not appt.organization:
            continue

        staff_name = "Staff"
        if appt.staff and appt.staff.user:
            parts = [appt.staff.user.first_name, appt.staff.user.last_name]
            staff_name = (
                " ".join(p for p in parts if p) or appt.staff.user.email
            )

        payloads.append(
            {
                "to": appt.customer_email,
                "start_time_iso": appt.start_time.isoformat(),
                "timezone": appt.organization.timezone,
                "business_name": appt.organization.name,
                "service_name": appt.service_name or "",
                "staff_name": staff_name,
                "customer_name": appt.customer_name or "",
                "location_name": appt.location.name if appt.location else None,
                "location_address": appt.location.address
                if appt.location
                else None,
            }
        )

    return payloads


@celery_app.task(name="scheduler.scan_upcoming_appointments")
def scan_upcoming_appointments() -> dict:
    """
    Runs every hour. Finds appointments happening in ~24 hours
    and enqueues reminder emails.
    """
    from app.workers.email_tasks import send_booking_reminder

    try:
        reminders = _run(_find_reminders_due())
        sent = 0
        for r in reminders:
            send_booking_reminder.delay(**r)
            sent += 1

        if sent:
            logger.info(f"📧 Enqueued {sent} appointment reminders")
        else:
            logger.debug("No reminders due this hour")

        return {"enqueued": sent, "checked_at": datetime.now(timezone.utc).isoformat()}
    except Exception:
        logger.exception("Failed to scan upcoming appointments")
        raise
