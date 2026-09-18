import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.service import Service
from app.schemas.service import CreateServiceRequest, UpdateServiceRequest


class ServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def create_service(
    db: AsyncSession, org_id: uuid.UUID, payload: CreateServiceRequest
) -> Service:
    service = Service(
        organization_id=org_id,
        name=payload.name,
        description=payload.description,
        duration_minutes=payload.duration_minutes,
        price=payload.price,
        currency=payload.currency,
        color=payload.color,
        buffer_before_minutes=payload.buffer_before_minutes,
        buffer_after_minutes=payload.buffer_after_minutes,
        is_bookable_online=payload.is_bookable_online,
    )
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


async def list_services(
    db: AsyncSession, org_id: uuid.UUID, active_only: bool = False
) -> list[Service]:
    query = select(Service).where(Service.organization_id == org_id)
    if active_only:
        query = query.where(Service.is_active.is_(True))
    query = query.order_by(Service.name.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_service(
    db: AsyncSession, org_id: uuid.UUID, service_id: uuid.UUID
) -> Service | None:
    result = await db.execute(
        select(Service)
        .where(Service.id == service_id)
        .where(Service.organization_id == org_id)
    )
    return result.scalar_one_or_none()


async def update_service(
    db: AsyncSession, service: Service, payload: UpdateServiceRequest
) -> Service:
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(service, key, value)
    await db.commit()
    await db.refresh(service)
    return service


async def delete_service(db: AsyncSession, service: Service) -> None:
    service.is_active = False
    await db.commit()
