import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, get_current_membership
from app.models.appointment import Appointment
from app.models.organization import Organization
from app.models.organization_member import MemberRole, OrganizationMember
from app.schemas.appointment import (
    AppointmentResponse,
    CreateAppointmentRequest,
    CustomerSnapshot,
)
from app.services.appointment import (
    BookingError,
    cancel_appointment,
    create_appointment,
    get_appointment,
    list_appointments,
)

router = APIRouter()


def _to_response(a: Appointment) -> AppointmentResponse:
    staff_name = "Unknown"
    if a.staff and a.staff.user:
        parts = [a.staff.user.first_name, a.staff.user.last_name]
        staff_name = " ".join(p for p in parts if p) or a.staff.user.email

    customer: CustomerSnapshot | None = None
    if a.customer_id:
        customer = CustomerSnapshot(
            id=str(a.customer_id),
            name=a.customer_name or "",
            email=a.customer_email,
            phone=a.customer_phone,
        )

    return AppointmentResponse(
        id=str(a.id),
        staff_id=str(a.staff_id),
        staff_name=staff_name,
        service_id=str(a.service_id) if a.service_id else None,
        service_name=a.service_name,
        location_id=str(a.location_id) if a.location_id else None,
        customer=customer,
        start_time=a.start_time.isoformat(),
        end_time=a.end_time.isoformat(),
        status=a.status.value,
        duration_minutes=a.service_duration_minutes or 0,
        price=float(a.service_price) if a.service_price is not None else None,
        currency=a.currency,
        notes=a.notes,
        created_at=a.created_at.isoformat(),
    )


@router.get("", response_model=list[AppointmentResponse])
async def list_all(
    org: Organization = Depends(get_current_org),
    _: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None),
    staff_id: uuid.UUID | None = Query(None),
) -> list[AppointmentResponse]:
    fd = datetime.fromisoformat(from_date) if from_date else None
    td = datetime.fromisoformat(to_date) if to_date else None
    appointments = await list_appointments(db, org.id, fd, td, staff_id)
    return [_to_response(a) for a in appointments]


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create(
    payload: CreateAppointmentRequest,
    org: Organization = Depends(get_current_org),
    _: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> AppointmentResponse:
    try:
        appointment = await create_appointment(db, org.id, payload)
    except BookingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return _to_response(appointment)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_one(
    appointment_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    _: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> AppointmentResponse:
    appointment = await get_appointment(db, org.id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return _to_response(appointment)


@router.post(
    "/{appointment_id}/cancel",
    response_model=AppointmentResponse,
)
async def cancel(
    appointment_id: uuid.UUID,
    reason: str | None = None,
    org: Organization = Depends(get_current_org),
    _: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> AppointmentResponse:
    appointment = await get_appointment(db, org.id, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    try:
        updated = await cancel_appointment(db, appointment, reason)
    except BookingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    # Reload with relationships
    reloaded = await get_appointment(db, org.id, appointment_id)
    return _to_response(reloaded or updated)
