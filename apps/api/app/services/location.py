import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.location import Location
from app.schemas.location import CreateLocationRequest, UpdateLocationRequest


async def create_location(
    db: AsyncSession, org_id: uuid.UUID, payload: CreateLocationRequest
) -> Location:
    # If this is the first location, force is_primary
    existing = await db.execute(
        select(Location).where(Location.organization_id == org_id)
    )
    is_first = existing.scalars().first() is None

    # If new one is primary, unset others
    if payload.is_primary and not is_first:
        await db.execute(
            update(Location)
            .where(Location.organization_id == org_id)
            .values(is_primary=False)
        )

    location = Location(
        organization_id=org_id,
        name=payload.name,
        is_primary=is_first or payload.is_primary,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        postal_code=payload.postal_code,
        phone=payload.phone,
        email=payload.email,
        timezone=payload.timezone,
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


async def list_locations(
    db: AsyncSession, org_id: uuid.UUID
) -> list[Location]:
    result = await db.execute(
        select(Location)
        .where(Location.organization_id == org_id)
        .order_by(Location.is_primary.desc(), Location.name.asc())
    )
    return list(result.scalars().all())


async def get_location(
    db: AsyncSession, org_id: uuid.UUID, location_id: uuid.UUID
) -> Location | None:
    result = await db.execute(
        select(Location)
        .where(Location.id == location_id)
        .where(Location.organization_id == org_id)
    )
    return result.scalar_one_or_none()


async def update_location(
    db: AsyncSession,
    location: Location,
    payload: UpdateLocationRequest,
) -> Location:
    data = payload.model_dump(exclude_unset=True)

    # If setting this as primary, unset others
    if data.get("is_primary") is True:
        await db.execute(
            update(Location)
            .where(Location.organization_id == location.organization_id)
            .where(Location.id != location.id)
            .values(is_primary=False)
        )

    for key, value in data.items():
        setattr(location, key, value)

    await db.commit()
    await db.refresh(location)
    return location


async def delete_location(db: AsyncSession, location: Location) -> None:
    # Soft delete
    location.is_active = False
    location.is_primary = False
    await db.commit()
