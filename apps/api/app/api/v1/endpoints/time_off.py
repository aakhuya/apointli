import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, require_role
from app.models.organization import Organization
from app.models.organization_member import MemberRole
from app.schemas.time_off import CreateTimeOffRequest, TimeOffResponse
from app.services.staff import get_staff
from app.services.time_off import (
    TimeOffError,
    create_time_off,
    delete_time_off,
    list_time_off,
    to_response,
)

router = APIRouter()

MANAGER_ROLES = (MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MANAGER)


async def _get_staff_or_404(db, org_id, staff_id):
    staff = await get_staff(db, org_id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.get("/{staff_id}/time-off", response_model=list[TimeOffResponse])
async def list_all(
    staff_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    await _get_staff_or_404(db, org.id, staff_id)
    records = await list_time_off(db, staff_id)
    return [to_response(r) for r in records]


@router.post(
    "/{staff_id}/time-off",
    response_model=TimeOffResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def create(
    staff_id: uuid.UUID,
    payload: CreateTimeOffRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    await _get_staff_or_404(db, org.id, staff_id)
    try:
        record = await create_time_off(db, staff_id, payload)
    except TimeOffError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return to_response(record)


@router.delete(
    "/{staff_id}/time-off/{time_off_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def delete(
    staff_id: uuid.UUID,
    time_off_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
):
    await _get_staff_or_404(db, org.id, staff_id)
    try:
        await delete_time_off(db, time_off_id, staff_id)
    except TimeOffError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
