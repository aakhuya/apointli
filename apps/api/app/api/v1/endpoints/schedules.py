import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, require_role
from app.models.organization import Organization
from app.models.organization_member import MemberRole
from app.schemas.schedule import (
    ScheduleResponse,
    UpdateScheduleRequest,
)
from app.services.schedule import (
    get_schedule_for_staff,
    rules_to_response,
    upsert_schedule,
)
from app.services.staff import get_staff

router = APIRouter()

MANAGER_ROLES = (MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MANAGER)


async def _get_staff_or_404(db, org_id, staff_id):
    staff = await get_staff(db, org_id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.get("/{staff_id}/schedule", response_model=ScheduleResponse | None)
async def get_schedule(
    staff_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    await _get_staff_or_404(db, org.id, staff_id)
    schedule = await get_schedule_for_staff(db, staff_id)
    if not schedule:
        return None
    return ScheduleResponse(
        id=str(schedule.id),
        staff_id=str(schedule.staff_id),
        name=schedule.name,
        is_default=schedule.is_default,
        rules=rules_to_response(schedule),  # type: ignore
    )


@router.put(
    "/{staff_id}/schedule",
    response_model=ScheduleResponse,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def update_schedule(
    staff_id: uuid.UUID,
    payload: UpdateScheduleRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    staff = await _get_staff_or_404(db, org.id, staff_id)
    schedule = await upsert_schedule(db, staff, payload)
    return ScheduleResponse(
        id=str(schedule.id),
        staff_id=str(staff_id),
        name=schedule.name,
        is_default=schedule.is_default,
        rules=rules_to_response(schedule),
    )
