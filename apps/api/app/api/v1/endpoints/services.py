import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, require_role
from app.models.organization import Organization
from app.models.organization_member import MemberRole
from app.schemas.service import (
    CreateServiceRequest,
    ServiceResponse,
    UpdateServiceRequest,
)
from app.services.service import (
    create_service,
    delete_service,
    get_service,
    list_services,
    update_service,
)

router = APIRouter()

MANAGER_ROLES = (
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.MANAGER,
)


def _to_response(s) -> ServiceResponse:
    return ServiceResponse(
        id=str(s.id),
        name=s.name,
        description=s.description,
        duration_minutes=s.duration_minutes,
        price=float(s.price) if s.price is not None else None,
        currency=s.currency,
        color=s.color,
        buffer_before_minutes=s.buffer_before_minutes,
        buffer_after_minutes=s.buffer_after_minutes,
        is_active=s.is_active,
        is_bookable_online=s.is_bookable_online,
    )


@router.get("", response_model=list[ServiceResponse])
async def list_all(
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[ServiceResponse]:
    services = await list_services(db, org.id)
    return [_to_response(s) for s in services]


@router.post(
    "",
    response_model=ServiceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def create(
    payload: CreateServiceRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ServiceResponse:
    service = await create_service(db, org.id, payload)
    return _to_response(service)


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_one(
    service_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ServiceResponse:
    service = await get_service(db, org.id, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return _to_response(service)


@router.patch(
    "/{service_id}",
    response_model=ServiceResponse,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def update(
    service_id: uuid.UUID,
    payload: UpdateServiceRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> ServiceResponse:
    service = await get_service(db, org.id, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    updated = await update_service(db, service, payload)
    return _to_response(updated)


@router.delete(
    "/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def delete(
    service_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> None:
    service = await get_service(db, org.id, service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    await delete_service(db, service)
