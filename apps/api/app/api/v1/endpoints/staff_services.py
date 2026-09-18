import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, require_role
from app.models.organization import Organization
from app.models.organization_member import MemberRole
from app.models.staff_service import StaffService
from app.schemas.staff_service import (
    AssignServiceRequest,
    AvailableServiceResponse,
    StaffServiceResponse,
)
from app.services.staff import get_staff
from app.services.staff_service import (
    StaffServiceError,
    assign_service,
    list_available_services,
    list_staff_services,
    unassign_service,
)

router = APIRouter()

MANAGER_ROLES = (
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.MANAGER,
)


def _to_response(a: StaffService) -> StaffServiceResponse:
    s = a.service
    effective_price = (
        float(a.price_override) if a.price_override is not None else float(s.price) if s.price is not None else None
    )
    effective_duration = a.duration_override_minutes or s.duration_minutes
    return StaffServiceResponse(
        service_id=str(s.id),
        name=s.name,
        duration_minutes=s.duration_minutes,
        price=float(s.price) if s.price is not None else None,
        color=s.color,
        price_override=float(a.price_override) if a.price_override is not None else None,
        duration_override_minutes=a.duration_override_minutes,
        effective_price=effective_price,
        effective_duration_minutes=effective_duration,
        is_active=a.is_active,
    )


async def _get_staff_or_404(
    db: AsyncSession,
    org_id: uuid.UUID,
    staff_id: uuid.UUID,
):
    staff = await get_staff(db, org_id, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff


@router.get("/{staff_id}/services", response_model=list[StaffServiceResponse])
async def list_assigned(
    staff_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[StaffServiceResponse]:
    await _get_staff_or_404(db, org.id, staff_id)
    rows = await list_staff_services(db, staff_id)
    return [_to_response(r) for r in rows]


@router.get(
    "/{staff_id}/available-services",
    response_model=list[AvailableServiceResponse],
)
async def list_available(
    staff_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> list[AvailableServiceResponse]:
    await _get_staff_or_404(db, org.id, staff_id)
    services = await list_available_services(db, org.id, staff_id)
    return [
        AvailableServiceResponse(
            id=str(s.id),
            name=s.name,
            duration_minutes=s.duration_minutes,
            price=float(s.price) if s.price is not None else None,
            color=s.color,
        )
        for s in services
    ]


@router.post(
    "/{staff_id}/services",
    response_model=StaffServiceResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def assign(
    staff_id: uuid.UUID,
    payload: AssignServiceRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> StaffServiceResponse:
    staff = await _get_staff_or_404(db, org.id, staff_id)
    try:
        assignment = await assign_service(
            db,
            org.id,
            staff,
            payload.service_id,
            payload.price_override,
            payload.duration_override_minutes,
        )
    except StaffServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    return _to_response(assignment)


@router.delete(
    "/{staff_id}/services/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(*MANAGER_ROLES))],
)
async def unassign(
    staff_id: uuid.UUID,
    service_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_staff_or_404(db, org.id, staff_id)
    try:
        await unassign_service(db, staff_id, service_id)
    except StaffServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
