import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, require_role
from app.models.location import Location
from app.models.organization import Organization
from app.models.organization_member import MemberRole
from app.schemas.location import (
    CreateLocationRequest,
    LocationResponse,
    UpdateLocationRequest,
)
from app.services.location import (
    create_location,
    delete_location,
    get_location,
    list_locations,
    update_location,
)

router = APIRouter()

MANAGER_ROLES = (
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.MANAGER,
)


def _to_response(loc: Location) -> LocationResponse:
    return LocationResponse(
        id=str(loc.id),
        name=loc.name,
        is_primary=loc.is_primary,
        address=loc.address,
        city=loc.city,
        state=loc.state,
        country=loc.country,
        postal_code=loc.postal_code,
        phone=loc.phone,
        email=loc.email,
        timezone=loc.timezone,
        is_active=loc.is_active,
    )


@router.get("", response_model=list[LocationResponse])
async def list_all(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[LocationResponse]:
    locations = await list_locations(db, org.id)
    return [_to_response(loc) for loc in locations]


@router.post(
    "",
    response_model=LocationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def create(
    payload: CreateLocationRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> LocationResponse:
    location = await create_location(db, org.id, payload)
    return _to_response(location)


@router.get("/{location_id}", response_model=LocationResponse)
async def get_one(
    location_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> LocationResponse:
    location = await get_location(db, org.id, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return _to_response(location)


@router.patch(
    "/{location_id}",
    response_model=LocationResponse,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def update(
    location_id: uuid.UUID,
    payload: UpdateLocationRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> LocationResponse:
    location = await get_location(db, org.id, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    updated = await update_location(db, location, payload)
    return _to_response(updated)


@router.delete(
    "/{location_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def delete(
    location_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> None:
    location = await get_location(db, org.id, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    await delete_location(db, location)
