import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.location import Location
from app.models.staff import StaffProfile
from app.models.user import User
from app.schemas.staff import CreateStaffRequest, UpdateStaffRequest


class StaffError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def create_staff(
    db: AsyncSession, org_id: uuid.UUID, payload: CreateStaffRequest
) -> StaffProfile:
    result = await db.execute(
        select(User).where(User.email == payload.email.lower())
    )
    user = result.scalar_one_or_none()
    if not user:
        raise StaffError(
            "No user found with that email. They must register first.",
            status_code=404,
        )

    existing = await db.execute(
        select(StaffProfile)
        .where(StaffProfile.user_id == user.id)
        .where(StaffProfile.organization_id == org_id)
    )
    if existing.scalar_one_or_none():
        raise StaffError(
            "This user is already a staff member of this workspace",
            status_code=409,
        )

    if payload.location_id:
        try:
            loc_id = uuid.UUID(payload.location_id)
        except ValueError:
            raise StaffError("Invalid location_id", status_code=400)
        loc = await db.execute(
            select(Location)
            .where(Location.id == loc_id)
            .where(Location.organization_id == org_id)
        )
        if loc.scalar_one_or_none() is None:
            raise StaffError("Location not found in this organization", status_code=404)

    staff = StaffProfile(
        user_id=user.id,
        organization_id=org_id,
        location_id=uuid.UUID(payload.location_id) if payload.location_id else None,
        title=payload.title,
        bio=payload.bio,
        accepts_bookings=payload.accepts_bookings,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return await get_staff(db, org_id, staff.id)  # type: ignore


async def list_staff(db: AsyncSession, org_id: uuid.UUID) -> list[StaffProfile]:
    result = await db.execute(
        select(StaffProfile)
        .options(
            selectinload(StaffProfile.user),
            selectinload(StaffProfile.location),
        )
        .where(StaffProfile.organization_id == org_id)
        .where(StaffProfile.is_active.is_(True))
        .order_by(StaffProfile.created_at.asc())
    )
    return list(result.scalars().all())


async def get_staff(
    db: AsyncSession, org_id: uuid.UUID, staff_id: uuid.UUID
) -> StaffProfile | None:
    result = await db.execute(
        select(StaffProfile)
        .options(
            selectinload(StaffProfile.user),
            selectinload(StaffProfile.location),
        )
        .where(StaffProfile.id == staff_id)
        .where(StaffProfile.organization_id == org_id)
    )
    return result.scalar_one_or_none()


async def update_staff(
    db: AsyncSession,
    org_id: uuid.UUID,
    staff: StaffProfile,
    payload: UpdateStaffRequest,
) -> StaffProfile:
    data = payload.model_dump(exclude_unset=True)

    if "location_id" in data and data["location_id"] is not None:
        try:
            loc_id = uuid.UUID(data["location_id"])
        except ValueError:
            raise StaffError("Invalid location_id", status_code=400)
        loc = await db.execute(
            select(Location)
            .where(Location.id == loc_id)
            .where(Location.organization_id == org_id)
        )
        if loc.scalar_one_or_none() is None:
            raise StaffError("Location not found in this organization", status_code=404)
        data["location_id"] = loc_id

    for key, value in data.items():
        setattr(staff, key, value)

    await db.commit()
    await db.refresh(staff)
    return await get_staff(db, org_id, staff.id)  # type: ignore


async def delete_staff(db: AsyncSession, staff: StaffProfile) -> None:
    await db.delete(staff)
    await db.commit()
