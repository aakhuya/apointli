import uuid
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org
from app.models.organization import Organization
from app.schemas.availability import AvailabilityResponse, SlotResponse
from app.services.availability import AvailabilityError, compute_availability
from app.services.service import get_service
from app.services.staff import get_staff

router = APIRouter()


@router.get("", response_model=AvailabilityResponse)
async def get_availability(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
    staff_id: uuid.UUID = Query(...),
    service_id: uuid.UUID = Query(...),
    target_date: date_type = Query(..., alias="date"),
):
    """Compute bookable slots for a staff member and service on a given date."""
    staff = await get_staff(db, org.id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    service = await get_service(db, org.id, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    try:
        slots = await compute_availability(db, staff_id, service, target_date)
    except AvailabilityError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    tz = slots[0]["timezone"] if slots else "UTC"

    return AvailabilityResponse(
        date=target_date.isoformat(),
        timezone=tz,
        slots=[SlotResponse(**s) for s in slots],
    )
