import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, require_role
from app.models.organization import Organization
from app.models.organization_member import MemberRole
from app.models.staff import StaffProfile
from app.schemas.staff import (
    CreateStaffRequest,
    StaffResponse,
    UpdateStaffRequest,
)
from app.services.staff import (
    StaffError,
    create_staff,
    delete_staff,
    get_staff,
    list_staff,
    update_staff,
)

router = APIRouter()

MANAGER_ROLES = (
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.MANAGER,
)


def _to_response(s: StaffProfile) -> StaffResponse:
    return StaffResponse(
        id=str(s.id),
        user_id=str(s.user_id),
        email=s.user.email,
        first_name=s.user.first_name,
        last_name=s.user.last_name,
        title=s.title,
        bio=s.bio,
        avatar_url=s.avatar_url,
        location_id=str(s.location_id) if s.location_id else None,
        location_name=s.location.name if s.location else None,
        is_active=s.is_active,
        accepts_bookings=s.accepts_bookings,
    )


@router.get("", response_model=list[StaffResponse])
async def list_all(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[StaffResponse]:
    staff = await list_staff(db, org.id)
    return [_to_response(s) for s in staff]


@router.post(
    "",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def create(
    payload: CreateStaffRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> StaffResponse:
    try:
        staff = await create_staff(db, org.id, payload)
    except StaffError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return _to_response(staff)


@router.get("/{staff_id}", response_model=StaffResponse)
async def get_one(
    staff_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> StaffResponse:
    staff = await get_staff(db, org.id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return _to_response(staff)


@router.patch(
    "/{staff_id}",
    response_model=StaffResponse,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def update(
    staff_id: uuid.UUID,
    payload: UpdateStaffRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> StaffResponse:
    staff = await get_staff(db, org.id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    try:
        updated = await update_staff(db, org.id, staff, payload)
    except StaffError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return _to_response(updated)


@router.delete(
    "/{staff_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def delete(
    staff_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> None:
    staff = await get_staff(db, org.id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    await delete_staff(db, staff)
