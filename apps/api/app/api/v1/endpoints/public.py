import uuid
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.appointment import Appointment
from app.models.organization import Organization
from app.models.staff import StaffProfile
from app.schemas.public import (
    PublicAppointmentResponse,
    PublicBusinessResponse,
    PublicCreateAppointmentRequest,
    PublicLocation,
    PublicService,
    PublicStaff,
)
from app.services.availability import AvailabilityError, compute_availability
from app.services.public import (
    PublicError,
    create_public_appointment,
    get_active_business_by_slug,
    get_public_business_data,
    get_public_staff_for_service,
)
from app.services.service import get_service
from app.services.staff import get_staff

router = APIRouter()


async def _get_org_or_404(db: AsyncSession, slug: str) -> Organization:
    org = await get_active_business_by_slug(db, slug)
    if not org:
        raise HTTPException(status_code=404, detail="Business not found")
    return org


@router.get("/{slug}", response_model=PublicBusinessResponse)
async def get_business(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> PublicBusinessResponse:
    org = await _get_org_or_404(db, slug)
    data = await get_public_business_data(db, org)

    return PublicBusinessResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        description=org.description,
        logo_url=org.logo_url,
        cover_url=org.cover_url,
        website=org.website,
        phone=org.phone,
        email=org.email,
        timezone=org.timezone,
        currency=org.currency,
        is_active=org.is_active,
        locations=[
            PublicLocation(
                id=str(loc.id),
                name=loc.name,
                address=loc.address,
                city=loc.city,
                country_code=loc.country_code,
                timezone=loc.timezone,
                currency=loc.currency,
            )
            for loc in data["locations"]
        ],
        services=[
            PublicService(
                id=str(s.id),
                name=s.name,
                description=s.description,
                duration_minutes=s.duration_minutes,
                price=float(s.price) if s.price is not None else None,
                currency=s.currency,
                color=s.color,
            )
            for s in data["services"]
        ],
        staff=[
            PublicStaff(
                id=str(st.id),
                name=" ".join(
                    p for p in [st.user.first_name, st.user.last_name] if p
                )
                or st.user.email,
                title=st.title,
                bio=st.bio,
                avatar_url=st.avatar_url,
            )
            for st in data["staff"]
        ],
    )


@router.get("/{slug}/services/{service_id}/staff", response_model=list[PublicStaff])
async def get_staff_for_service(
    slug: str,
    service_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[PublicStaff]:
    org = await _get_org_or_404(db, slug)
    staff = await get_public_staff_for_service(db, org.id, service_id)
    return [
        PublicStaff(
            id=str(st.id),
            name=" ".join(p for p in [st.user.first_name, st.user.last_name] if p)
            or st.user.email,
            title=st.title,
            bio=st.bio,
            avatar_url=st.avatar_url,
        )
        for st in staff
    ]


@router.get("/{slug}/availability")
async def get_availability(
    slug: str,
    staff_id: uuid.UUID = Query(...),
    service_id: uuid.UUID = Query(...),
    target_date: date_type = Query(..., alias="date"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    org = await _get_org_or_404(db, slug)

    staff = await get_staff(db, org.id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    service = await get_service(db, org.id, service_id)
    if not service or not service.is_bookable_online:
        raise HTTPException(status_code=404, detail="Service not available")

    try:
        slots = await compute_availability(db, staff_id, service, target_date)
    except AvailabilityError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    tz = slots[0]["timezone"] if slots else org.timezone
    return {
        "date": target_date.isoformat(),
        "timezone": tz,
        "slots": slots,
    }


@router.post(
    "/{slug}/appointments",
    response_model=PublicAppointmentResponse,
    status_code=201,
)
async def create_appointment(
    slug: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
) -> PublicAppointmentResponse:
    org = await _get_org_or_404(db, slug)

    try:
        validated = PublicCreateAppointmentRequest(**payload)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        appointment = await create_public_appointment(db, org, validated)
    except PublicError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # Reload with relationships for the response
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.staff).selectinload(StaffProfile.user),
            selectinload(Appointment.location),
        )
        .where(Appointment.id == appointment.id)
    )
    reloaded = result.scalar_one()

    staff_name = "Staff"
    if reloaded.staff and reloaded.staff.user:
        staff_name = (
            " ".join(
                p
                for p in [reloaded.staff.user.first_name, reloaded.staff.user.last_name]
                if p
            )
            or reloaded.staff.user.email
        )

    return PublicAppointmentResponse(
        id=str(reloaded.id),
        business_name=org.name,
        business_slug=org.slug,
        staff_name=staff_name,
        service_name=reloaded.service_name or "",
        customer_name=reloaded.customer_name or "",
        start_time=reloaded.start_time.isoformat(),
        end_time=reloaded.end_time.isoformat(),
        timezone=org.timezone,
        price=float(reloaded.service_price) if reloaded.service_price is not None else None,
        currency=reloaded.currency,
        location_name=reloaded.location.name if reloaded.location else None,
        location_address=reloaded.location.address if reloaded.location else None,
    )
