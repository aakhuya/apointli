import uuid
from slugify import slugify
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.organization import Organization
from app.models.organization_member import MemberRole, OrganizationMember
from app.models.user import User
from app.schemas.organization import CreateOrganizationRequest


class OrgError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def _generate_unique_slug(db: AsyncSession, name: str) -> str:
    """Create a unique slug from a name."""
    base = slugify(name) or "org"
    slug = base
    counter = 1
    while True:
        existing = await db.execute(
            select(Organization).where(Organization.slug == slug)
        )
        if existing.scalar_one_or_none() is None:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


async def create_organization(
    db: AsyncSession,
    user: User,
    payload: CreateOrganizationRequest,
) -> tuple[Organization, OrganizationMember]:
    """Create an organization and make the creator its OWNER."""
    slug = await _generate_unique_slug(db, payload.name)

    org = Organization(
        name=payload.name,
        slug=slug,
        description=payload.description,
        timezone=payload.timezone,
        currency=payload.currency,
    )
    db.add(org)
    await db.flush()  # get org.id

    membership = OrganizationMember(
        user_id=user.id,
        organization_id=org.id,
        role=MemberRole.OWNER,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(org)
    await db.refresh(membership)
    return org, membership


async def list_user_organizations(
    db: AsyncSession,
    user: User,
) -> list[tuple[Organization, MemberRole]]:
    """Return all organizations the user is a member of, with their role."""
    result = await db.execute(
        select(Organization, OrganizationMember.role)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(OrganizationMember.user_id == user.id)
        .where(Organization.is_active.is_(True))
        .order_by(Organization.created_at.desc())
    )
    return list(result.all())


async def get_organization(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> Organization | None:
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    return result.scalar_one_or_none()


async def get_membership(
    db: AsyncSession,
    user_id: uuid.UUID,
    org_id: uuid.UUID,
) -> OrganizationMember | None:
    result = await db.execute(
        select(OrganizationMember)
        .where(OrganizationMember.user_id == user_id)
        .where(OrganizationMember.organization_id == org_id)
    )
    return result.scalar_one_or_none()


async def list_members(
    db: AsyncSession,
    org_id: uuid.UUID,
) -> list[OrganizationMember]:
    result = await db.execute(
        select(OrganizationMember)
        .options(selectinload(OrganizationMember.user))
        .where(OrganizationMember.organization_id == org_id)
        .order_by(OrganizationMember.created_at.asc())
    )
    return list(result.scalars().all())


async def add_member(
    db: AsyncSession,
    org: Organization,
    inviter: User,
    email: str,
    role: MemberRole,
) -> OrganizationMember:
    """Add a user (by email) to an organization."""
    # Find user
    result = await db.execute(select(User).where(User.email == email.lower()))
    user = result.scalar_one_or_none()
    if not user:
        raise OrgError("No user found with that email", status_code=404)

    # Already a member?
    existing = await get_membership(db, user.id, org.id)
    if existing:
        raise OrgError("User is already a member of this organization", status_code=409)

    membership = OrganizationMember(
        user_id=user.id,
        organization_id=org.id,
        role=role,
        invited_by=inviter.id,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return membership


async def update_member_role(
    db: AsyncSession,
    membership: OrganizationMember,
    new_role: MemberRole,
) -> OrganizationMember:
    """Change a member's role. Guards against removing the last owner."""
    if (
        membership.role == MemberRole.OWNER
        and new_role != MemberRole.OWNER
    ):
        # Count remaining owners
        result = await db.execute(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == membership.organization_id)
            .where(OrganizationMember.role == MemberRole.OWNER)
        )
        owners = list(result.scalars().all())
        if len(owners) <= 1:
            raise OrgError("Cannot change role: organization must have at least one owner", status_code=400)

    membership.role = new_role
    await db.commit()
    await db.refresh(membership)
    return membership


async def remove_member(
    db: AsyncSession,
    membership: OrganizationMember,
) -> None:
    """Remove a member. Guards against removing the last owner."""
    if membership.role == MemberRole.OWNER:
        result = await db.execute(
            select(OrganizationMember)
            .where(OrganizationMember.organization_id == membership.organization_id)
            .where(OrganizationMember.role == MemberRole.OWNER)
        )
        owners = list(result.scalars().all())
        if len(owners) <= 1:
            raise OrgError("Cannot remove the only owner", status_code=400)

    await db.delete(membership)
    await db.commit()
