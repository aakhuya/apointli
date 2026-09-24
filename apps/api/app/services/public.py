import uuid
from datetime import date as date_type

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.location import Location
from app.models.organization import Organization
from app.models.service import Service
from app.models.staff import StaffProfile
from app.models.staff_service import StaffService
from app.models.user import User
from app.schemas.appointment import CreateAppointmentRequest
from app.schemas.public import PublicCreateAppointmentRequest
from app.services.appointment import BookingError, create_appointment


class PublicError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def get_active_business_by_slug(
    db: AsyncSession, slug: str
) -> Organization | None:
    result = await db.execute(
        select(Organization)
        .where(Organization.slug == slug.lower())
        .where(Organization.is_active.is_(True))
    )
    return result.scalar_one_or_none()


async def get_public_business_data(
    db: AsyncSession, org: Organization
) -> dict:
    """Fetch everything needed for the public business page."""
    # Locations (active)
    locations_result = await db.execute(
        select(Location)
        .where(Location.organization_id == org.id)
        .where(Location.is_active.is_(True))
        .order_by(Location.is_primary.desc(), Location.name.asc())
    )
    locations = list(locations_result.scalars().all())

    # Services (active, bookable online)
    services_result = await db.execute(
        select(Service)
        .where(Service.organization_id == org.id)
        .where(Service.is_active.is_(True))
        .where(Service.is_bookable_online.is_(True))
        .order_by(Service.name.asc())
    )
    services = list(services_result.scalars().all())

    # Staff (active, accepts bookings)
    staff_result = await db.execute(
        select(StaffProfile)
        .options(selectinload(StaffProfile.user))
        .where(StaffProfile.organization_id == org.id)
        .where(StaffProfile.is_active.is_(True))
        .where(StaffProfile.accepts_bookings.is_(True))
        .order_by(StaffProfile.created_at.asc())
    )
    staff_profiles = list(staff_result.scalars().all())

    return {
        "locations": locations,
        "services": services,
        "staff": staff_profiles,
    }


async def get_public_staff_for_service(
    db: AsyncSession, org_id: uuid.UUID, service_id: uuid.UUID
) -> list[StaffProfile]:
    """Staff members who provide a given service."""
    result = await db.execute(
        select(StaffProfile)
        .join(StaffService, StaffService.staff_id == StaffProfile.id)
        .options(selectinload(StaffProfile.user))
        .where(StaffProfile.organization_id == org_id)
        .where(StaffProfile.is_active.is_(True))
        .where(StaffProfile.accepts_bookings.is_(True))
        .where(StaffService.service_id == service_id)
        .where(StaffService.is_active.is_(True))
        .order_by(StaffProfile.created_at.asc())
    )
    return list(result.scalars().all())


async def create_public_appointment(
    db: AsyncSession,
    org: Organization,
    payload: PublicCreateAppointmentRequest,
) -> Appointment:
    """Public booking. No auth required, but validates everything."""
    if not payload.customer_name.strip():
        raise PublicError("Customer name is required", status_code=400)

    # Reuse the concurrency-safe booking flow
    create_payload = CreateAppointmentRequest(
        staff_id=payload.staff_id,
        service_id=payload.service_id,
        customer_name=payload.customer_name.strip(),
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        start_time=payload.start_time,
        notes=payload.notes,
    )

    try:
        appointment = await create_appointment(db, org.id, create_payload)
    except BookingError as e:
        raise PublicError(e.message, status_code=e.status_code)

    return appointment
