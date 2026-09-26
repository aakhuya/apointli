"""
Celery tasks for sending transactional emails.

All tasks are idempotent-safe: sending the same email twice is harmless.
Failures retry with exponential backoff (Celery default: 60s, 120s, 240s, ...).
"""

import asyncio
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from app.core.config import settings
from app.services.email.client import render_template, send_email
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


def _run(coro):
    """Run an async coroutine from a sync Celery task."""
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _format_appointment_context(
    start_time_iso: str,
    timezone: str,
    business_name: str,
    service_name: str,
    staff_name: str,
    customer_name: str,
    customer_email: str | None,
    customer_phone: str | None,
    location_name: str | None,
    location_address: str | None,
) -> dict:
    """Build the shared template context for a booking email."""
    tz = ZoneInfo(timezone)
    start = datetime.fromisoformat(start_time_iso).astimezone(tz)

    date_str = start.strftime("%A, %B %d, %Y")
    time_str = start.strftime("%I:%M %p").lstrip("0")

    from urllib.parse import quote

    gcal_start = start.strftime("%Y%m%dT%H%M%S")
    gcal_end = start.strftime("%Y%m%dT%H%M%S")
    gcal_text = quote(f"{service_name} at {business_name}")
    gcal_dates = f"{gcal_start}/{gcal_end}"
    gcal_details = quote(f"With {staff_name}")
    gcal_location = quote(location_address) if location_address else ""
    gcal_url = (
        f"https://calendar.google.com/calendar/render?action=TEMPLATE"
        f"&text={gcal_text}&dates={gcal_dates}&details={gcal_details}"
    )
    if gcal_location:
        gcal_url += f"&location={gcal_location}"

    return {
        "app_url": settings.APP_BASE_URL,
        "business_name": business_name,
        "service_name": service_name,
        "staff_name": staff_name,
        "customer_name": customer_name,
        "customer_email": customer_email,
        "customer_phone": customer_phone,
        "date_str": date_str,
        "time_str": time_str,
        "location_name": location_name,
        "location_address": location_address,
        "gcal_url": gcal_url,
    }


# ─── Welcome email ───
@celery_app.task(name="email.welcome", bind=True, max_retries=5)
def send_welcome_email(self, to: str, first_name: str) -> dict:
    try:
        html = render_template(
            "welcome.html",
            subject="Welcome to apointli",
            first_name=first_name or "there",
            app_url=settings.APP_BASE_URL,
        )
        return _run(send_email(to=to, subject="Welcome to apointli", html=html))
    except Exception as exc:
        logger.exception(f"Failed to send welcome email to {to}")
        raise self.retry(exc=exc, countdown=60 * 2**self.request.retries)


# ─── Booking confirmation to customer ───
@celery_app.task(name="email.booking_confirmation_customer", bind=True, max_retries=5)
def send_booking_confirmation_customer(
    self,
    to: str,
    start_time_iso: str,
    timezone: str,
    business_name: str,
    service_name: str,
    staff_name: str,
    customer_name: str,
    customer_email: str | None,
    customer_phone: str | None,
    location_name: str | None,
    location_address: str | None,
) -> dict:
    try:
        ctx = _format_appointment_context(
            start_time_iso, timezone, business_name, service_name, staff_name,
            customer_name, customer_email, customer_phone,
            location_name, location_address,
        )
        html = render_template(
            "booking_confirmation_customer.html",
            subject=f"Your booking at {business_name}",
            **ctx,
        )
        return _run(
            send_email(to=to, subject=f"Your booking at {business_name}", html=html)
        )
    except Exception as exc:
        logger.exception(f"Failed to send customer confirmation to {to}")
        raise self.retry(exc=exc, countdown=60 * 2**self.request.retries)


# ─── Booking notification to business ───
@celery_app.task(name="email.booking_notification_business", bind=True, max_retries=5)
def send_booking_notification_business(
    self,
    to: str,
    start_time_iso: str,
    timezone: str,
    business_name: str,
    service_name: str,
    staff_name: str,
    customer_name: str,
    customer_email: str | None,
    customer_phone: str | None,
    location_name: str | None,
    location_address: str | None,
) -> dict:
    try:
        ctx = _format_appointment_context(
            start_time_iso, timezone, business_name, service_name, staff_name,
            customer_name, customer_email, customer_phone,
            location_name, location_address,
        )
        html = render_template(
            "booking_notification_business.html",
            subject=f"New booking — {customer_name}",
            **ctx,
        )
        return _run(
            send_email(to=to, subject=f"New booking — {customer_name}", html=html)
        )
    except Exception as exc:
        logger.exception(f"Failed to send business notification to {to}")
        raise self.retry(exc=exc, countdown=60 * 2**self.request.retries)


# ─── Booking cancellation ───
@celery_app.task(name="email.booking_cancellation", bind=True, max_retries=5)
def send_booking_cancellation(
    self,
    to: str,
    start_time_iso: str,
    timezone: str,
    business_name: str,
    business_slug: str,
    service_name: str,
    customer_name: str,
    cancellation_reason: str | None,
) -> dict:
    try:
        tz = ZoneInfo(timezone)
        start = datetime.fromisoformat(start_time_iso).astimezone(tz)
        date_str = start.strftime("%A, %B %d, %Y")
        time_str = start.strftime("%I:%M %p").lstrip("0")

        html = render_template(
            "booking_cancellation.html",
            subject=f"Appointment cancelled — {business_name}",
            app_url=settings.APP_BASE_URL,
            business_name=business_name,
            service_name=service_name,
            customer_name=customer_name,
            date_str=date_str,
            time_str=time_str,
            cancellation_reason=cancellation_reason,
            booking_url=f"{settings.APP_BASE_URL}/b/{business_slug}",
        )
        return _run(
            send_email(
                to=to,
                subject=f"Appointment cancelled — {business_name}",
                html=html,
            )
        )
    except Exception as exc:
        logger.exception(f"Failed to send cancellation to {to}")
        raise self.retry(exc=exc, countdown=60 * 2**self.request.retries)


# ─── Appointment reminder ───
@celery_app.task(name="email.booking_reminder", bind=True, max_retries=5)
def send_booking_reminder(
    self,
    to: str,
    start_time_iso: str,
    timezone: str,
    business_name: str,
    service_name: str,
    staff_name: str,
    customer_name: str,
    location_name: str | None,
    location_address: str | None,
) -> dict:
    """Send a 24-hour reminder for an upcoming appointment."""
    try:
        ctx = _format_appointment_context(
            start_time_iso, timezone, business_name, service_name, staff_name,
            customer_name, None, None,
            location_name, location_address,
        )
        html = render_template(
            "booking_reminder.html",
            subject=f"Reminder: your appointment at {business_name}",
            **ctx,
        )
        return _run(
            send_email(
                to=to,
                subject=f"Reminder: your appointment at {business_name}",
                html=html,
            )
        )
    except Exception as exc:
        logger.exception(f"Failed to send reminder to {to}")
        raise self.retry(exc=exc, countdown=60 * 2**self.request.retries)
