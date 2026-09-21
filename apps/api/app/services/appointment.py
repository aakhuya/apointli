"""
The booking service.

This is where concurrency safety matters. Two customers clicking "Book"
on the same slot at the same millisecond must result in exactly ONE
appointment being created.

Strategy (three layers of defense):

1. Advisory lock — `pg_advisory_xact_lock` on the staff member's UUID.
   This serializes concurrent bookings for the same staff member.

2. Re-check inside the lock — after acquiring the lock, we re-verify the
   slot is still free by querying appointments in the same transaction.

3. Exclusion constraint — Postgres will reject any overlapping insert at
   the DB level. Even if 1 and 2 fail, this catches it.

All three must fail to produce a double-booking.
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.service import Service
from app.models.staff import StaffProfile
from app.models.staff_service import StaffService
from app.schemas.appointment import CreateAppointmentRequest


class BookingError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def _parse_iso(value: str) -> datetime:
    """Parse an ISO8601 datetime and ensure it's timezone-aware UTC."""
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise BookingError(f"Invalid datetime: {value}", status_code=400)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def _get_or_create_customer(
    db: AsyncSession,
    org_id: uuid.UUID,
    payload: CreateAppointmentRequest,
) -> Customer | None:
    """Find an existing customer or create a new one."""
    # If customer_id provided, load it
    if payload.customer_id:
        try:
            cid = uuid.UUID(payload.customer_id)
        except ValueError:
            raise BookingError("Invalid customer_id", status_code=400)
        result = await db.execute(
            select(Customer)
            .where(Customer.id == cid)
            .where(Customer.organization_id == org_id)
        )
        customer = result.scalar_one_or_none()
        if not customer:
            raise BookingError("Customer not found", status_code=404)
        return customer

    # Otherwise we need at least a name or email
    if not payload.customer_name and not payload.customer_email:
        raise BookingError(
            "Provide customer_id or at least customer_name or customer_email",
            status_code=400,
        )

    # Look up by email if provided
    if payload.customer_email:
        result = await db.execute(
            select(Customer)
            .where(Customer.organization_id == org_id)
            .where(Customer.email == payload.customer_email.lower())
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing

    # Create new
    name_parts = (payload.customer_name or "").strip().split(" ", 1)
    first_name = name_parts[0] if name_parts[0] else (payload.customer_email or "Guest")
    last_name = name_parts[1] if len(name_parts) > 1 else None

    customer = Customer(
        organization_id=org_id,
        first_name=first_name,
        last_name=last_name,
        email=payload.customer_email.lower() if payload.customer_email else None,
        phone=payload.customer_phone,
    )
    db.add(customer)
    await db.flush()
    return customer


async def create_appointment(
    db: AsyncSession,
    org_id: uuid.UUID,
    payload: CreateAppointmentRequest,
) -> Appointment:
    """
    Create an appointment with full concurrency safety.

    Wrapped in a transaction. Holds an advisory lock on the staff member
    so concurrent bookings for the same staff are serialized.
    """
    # 1. Validate staff exists in this org
    try:
        staff_uuid = uuid.UUID(payload.staff_id)
        service_uuid = uuid.UUID(payload.service_id)
    except ValueError:
        raise BookingError("Invalid staff_id or service_id", status_code=400)

    result = await db.execute(
        select(StaffProfile)
        .where(StaffProfile.id == staff_uuid)
        .where(StaffProfile.organization_id == org_id)
    )
    staff = result.scalar_one_or_none()
    if not staff:
        raise BookingError("Staff member not found", status_code=404)
    if not staff.accepts_bookings:
        raise BookingError("Staff member is not accepting bookings", status_code=400)

    # 2. Validate service belongs to org
    result = await db.execute(
        select(Service)
        .where(Service.id == service_uuid)
        .where(Service.organization_id == org_id)
        .where(Service.is_active.is_(True))
    )
    service = result.scalar_one_or_none()
    if not service:
        raise BookingError("Service not found", status_code=404)

    # 3. Verify staff provides this service (StaffService relationship)
    result = await db.execute(
        select(StaffService)
        .where(StaffService.staff_id == staff_uuid)
        .where(StaffService.service_id == service_uuid)
        .where(StaffService.is_active.is_(True))
    )
    staff_service = result.scalar_one_or_none()
    if not staff_service:
        raise BookingError(
            "This staff member does not provide this service",
            status_code=400,
        )

    # 4. Parse and compute times
    start_time = _parse_iso(payload.start_time)

    # Apply staff service overrides
    duration = staff_service.duration_override_minutes or service.duration_minutes
    end_time = start_time + timedelta(minutes=duration)

    # Must be in the future
    if start_time <= datetime.now(timezone.utc):
        raise BookingError("Cannot book a time in the past", status_code=400)

    # 5. ACQUIRE ADVISORY LOCK on this staff member
    #    This serializes concurrent bookings for the same staff.
    #    The lock is automatically released at the end of the transaction.
    await db.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:key))"),
        {"key": f"staff:{staff_uuid}"},
    )

    # 6. Re-check overlap AFTER acquiring the lock
    result = await db.execute(
        select(Appointment)
        .where(Appointment.staff_id == staff_uuid)
        .where(Appointment.start_time < end_time)
        .where(Appointment.end_time > start_time)
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
    conflicting = result.scalars().first()
    if conflicting:
        raise BookingError(
            "This time slot is no longer available",
            status_code=409,
        )

    # 7. Resolve the customer
    customer = await _get_or_create_customer(db, org_id, payload)

    # 8. Compute effective price
    effective_price = (
        staff_service.price_override
        if staff_service.price_override is not None
        else service.price
    )

    # 9. Create the appointment
    appointment = Appointment(
        organization_id=org_id,
        staff_id=staff_uuid,
        service_id=service_uuid,
        location_id=uuid.UUID(payload.location_id) if payload.location_id else staff.location_id,
        customer_id=customer.id if customer else None,
        start_time=start_time,
        end_time=end_time,
        service_name=service.name,
        service_duration_minutes=duration,
        service_price=effective_price,
        currency=service.currency,
        status=AppointmentStatus.SCHEDULED,
        customer_name=f"{customer.first_name} {customer.last_name or ''}".strip() if customer else None,
        customer_email=customer.email if customer else None,
        customer_phone=customer.phone if customer else None,
        notes=payload.notes,
    )
    db.add(appointment)

    try:
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        # The exclusion constraint fired — this is the last line of defense
        if "no_overlapping_appointments" in str(e):
            raise BookingError(
                "This time slot is no longer available",
                status_code=409,
            )
        raise BookingError("Booking failed", status_code=500)

    # Reload with all relationships
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.staff).selectinload(StaffProfile.user),
            selectinload(Appointment.service),
            selectinload(Appointment.location),
        )
        .where(Appointment.id == appointment.id)
    )
    return result.scalar_one()


async def list_appointments(
    db: AsyncSession,
    org_id: uuid.UUID,
    from_date: datetime | None = None,
    to_date: datetime | None = None,
    staff_id: uuid.UUID | None = None,
) -> list[Appointment]:
    query = (
        select(Appointment)
        .options(
            selectinload(Appointment.staff).selectinload(StaffProfile.user),
            selectinload(Appointment.service),
            selectinload(Appointment.location),
        )
        .where(Appointment.organization_id == org_id)
    )

    if from_date:
        query = query.where(Appointment.end_time > from_date)
    if to_date:
        query = query.where(Appointment.start_time < to_date)
    if staff_id:
        query = query.where(Appointment.staff_id == staff_id)

    query = query.order_by(Appointment.start_time.asc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_appointment(
    db: AsyncSession, org_id: uuid.UUID, appointment_id: uuid.UUID
) -> Appointment | None:
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.staff).selectinload(StaffProfile.user),
            selectinload(Appointment.service),
            selectinload(Appointment.location),
        )
        .where(Appointment.id == appointment_id)
        .where(Appointment.organization_id == org_id)
    )
    return result.scalar_one_or_none()


async def cancel_appointment(
    db: AsyncSession,
    appointment: Appointment,
    reason: str | None = None,
) -> Appointment:
    if appointment.status in (AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED):
        raise BookingError(
            f"Cannot cancel appointment with status {appointment.status.value}",
            status_code=400,
        )
    appointment.status = AppointmentStatus.CANCELLED
    appointment.cancellation_reason = reason
    appointment.cancelled_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(appointment)
    return appointment
