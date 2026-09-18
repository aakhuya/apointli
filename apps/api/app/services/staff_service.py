import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.service import Service
from app.models.staff import StaffProfile
from app.models.staff_service import StaffService


class StaffServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def list_staff_services(
    db: AsyncSession,
    staff_id: uuid.UUID,
) -> list[StaffService]:
    result = await db.execute(
        select(StaffService)
        .options(selectinload(StaffService.service))
        .where(StaffService.staff_id == staff_id)
        .order_by(StaffService.created_at.asc())
    )
    return list(result.scalars().all())


async def list_available_services(
    db: AsyncSession,
    org_id: uuid.UUID,
    staff_id: uuid.UUID,
) -> list[Service]:
    """Services belonging to the org that are NOT yet assigned to this staff."""
    assigned = await db.execute(
        select(StaffService.service_id).where(StaffService.staff_id == staff_id)
    )
    assigned_ids = [row[0] for row in assigned.all()]

    query = (
        select(Service)
        .where(Service.organization_id == org_id)
        .where(Service.is_active.is_(True))
    )
    if assigned_ids:
        query = query.where(Service.id.not_in(assigned_ids))
    query = query.order_by(Service.name.asc())

    result = await db.execute(query)
    return list(result.scalars().all())


async def assign_service(
    db: AsyncSession,
    org_id: uuid.UUID,
    staff: StaffProfile,
    service_id: str,
    price_override: float | None = None,
    duration_override_minutes: int | None = None,
) -> StaffService:
    # Validate service_id
    try:
        sid = uuid.UUID(service_id)
    except ValueError:
        raise StaffServiceError("Invalid service_id", status_code=400)

    # Service must belong to the same org
    result = await db.execute(
        select(Service)
        .where(Service.id == sid)
        .where(Service.organization_id == org_id)
    )
    service = result.scalar_one_or_none()
    if not service:
        raise StaffServiceError("Service not found in this organization", status_code=404)

    # Check not already assigned
    existing = await db.execute(
        select(StaffService)
        .where(StaffService.staff_id == staff.id)
        .where(StaffService.service_id == sid)
    )
    if existing.scalar_one_or_none():
        raise StaffServiceError("Service is already assigned to this staff member", status_code=409)

    assignment = StaffService(
        staff_id=staff.id,
        service_id=sid,
        price_override=price_override,
        duration_override_minutes=duration_override_minutes,
    )
    db.add(assignment)
    await db.commit()

    # Reload with service
    result = await db.execute(
        select(StaffService)
        .options(selectinload(StaffService.service))
        .where(StaffService.id == assignment.id)
    )
    return result.scalar_one()


async def unassign_service(
    db: AsyncSession,
    staff_id: uuid.UUID,
    service_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(StaffService)
        .where(StaffService.staff_id == staff_id)
        .where(StaffService.service_id == service_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise StaffServiceError("Assignment not found", status_code=404)
    await db.delete(assignment)
    await db.commit()
