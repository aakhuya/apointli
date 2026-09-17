import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.tenant import get_current_membership, get_current_org, require_role
from app.models.organization import Organization
from app.models.organization_member import MemberRole, OrganizationMember
from app.models.user import User
from app.schemas.organization import (
    AddMemberRequest,
    CreateOrganizationRequest,
    MemberResponse,
    OrganizationResponse,
    OrganizationSummary,
    UpdateMemberRoleRequest,
)
from app.services.organization import (
    OrgError,
    add_member,
    create_organization,
    get_membership,
    list_members,
    list_user_organizations,
    remove_member,
    update_member_role,
)

router = APIRouter()


def _org_response(org: Organization, role: MemberRole) -> OrganizationResponse:
    return OrganizationResponse(
        id=str(org.id),
        name=org.name,
        slug=org.slug,
        description=org.description,
        logo_url=org.logo_url,
        cover_url=org.cover_url,
        website=org.website,
        phone=org.phone,
        email=org.email,
        address=org.address,
        city=org.city,
        state=org.state,
        country=org.country,
        postal_code=org.postal_code,
        timezone=org.timezone,
        currency=org.currency,
        is_active=org.is_active,
        role=role,
    )


def _member_response(m: OrganizationMember) -> MemberResponse:
    return MemberResponse(
        id=str(m.id),
        user_id=str(m.user_id),
        email=m.user.email,
        first_name=m.user.first_name,
        last_name=m.user.last_name,
        role=m.role,
        accepted_at=m.accepted_at.isoformat() if m.accepted_at else None,
    )


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
async def create_org(
    payload: CreateOrganizationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationResponse:
    """Create a new organization. The creator becomes OWNER."""
    org, membership = await create_organization(db, current_user, payload)
    return _org_response(org, membership.role)


@router.get("", response_model=list[OrganizationSummary])
async def list_my_orgs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrganizationSummary]:
    """List all organizations the current user is a member of."""
    rows = await list_user_organizations(db, current_user)
    return [
        OrganizationSummary(
            id=str(org.id),
            name=org.name,
            slug=org.slug,
            description=org.description,
            logo_url=org.logo_url,
        )
        for org, _role in rows
    ]


@router.get("/{org_id}", response_model=OrganizationResponse)
async def get_org(
    org: Organization = Depends(get_current_org),
    membership: OrganizationMember = Depends(get_current_membership),
) -> OrganizationResponse:
    """Get details for an organization. Requires membership."""
    return _org_response(org, membership.role)


# ─── Members ───
@router.get("/{org_id}/members", response_model=list[MemberResponse])
async def get_org_members(
    org: Organization = Depends(get_current_org),
    _: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> list[MemberResponse]:
    """List members of an organization. Requires membership."""
    members = await list_members(db, org.id)
    return [_member_response(m) for m in members]


@router.post(
    "/{org_id}/members",
    response_model=MemberResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(MemberRole.OWNER, MemberRole.ADMIN))],
)
async def add_org_member(
    payload: AddMemberRequest,
    org: Organization = Depends(get_current_org),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MemberResponse:
    """Add a member by email. Requires OWNER or ADMIN."""
    try:
        membership = await add_member(db, org, current_user, payload.email, payload.role)
    except OrgError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # Reload with user relationship
    members = await list_members(db, org.id)
    target = next((m for m in members if m.id == membership.id), None)
    return _member_response(target or membership)


@router.patch(
    "/{org_id}/members/{member_id}",
    response_model=MemberResponse,
    dependencies=[Depends(require_role(MemberRole.OWNER, MemberRole.ADMIN))],
)
async def update_role(
    member_id: uuid.UUID,
    payload: UpdateMemberRoleRequest,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> MemberResponse:
    """Update a member's role. Requires OWNER or ADMIN."""
    members = await list_members(db, org.id)
    target = next((m for m in members if m.id == member_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    try:
        updated = await update_member_role(db, target, payload.role)
    except OrgError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    # Reload with user relationship
    members = await list_members(db, org.id)
    target = next((m for m in members if m.id == member_id), None)
    return _member_response(target or updated)


@router.delete(
    "/{org_id}/members/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(MemberRole.OWNER, MemberRole.ADMIN))],
)
async def delete_member(
    member_id: uuid.UUID,
    org: Organization = Depends(get_current_org),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a member. Requires OWNER or ADMIN."""
    members = await list_members(db, org.id)
    target = next((m for m in members if m.id == member_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")

    try:
        await remove_member(db, target)
    except OrgError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
