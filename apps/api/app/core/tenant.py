import uuid

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.organization import Organization
from app.models.organization_member import MemberRole, OrganizationMember
from app.models.user import User
from app.services.organization import get_membership, get_organization


async def get_current_membership(
    org_id: uuid.UUID = Path(..., description="Organization ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationMember:
    """
    Ensure the current user is a member of the organization in the path.
    Raises 403 if not a member, 404 if the org doesn't exist.
    """
    org = await get_organization(db, org_id)
    if not org or not org.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    membership = await get_membership(db, current_user.id, org_id)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization",
        )

    return membership


async def get_current_org(
    membership: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
) -> Organization:
    """Resolve the Organization from the path."""
    org = await get_organization(db, membership.organization_id)
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )
    return org


def require_role(*allowed: MemberRole):
    """
    Factory that returns a dependency enforcing the current user's role
    is one of the allowed roles for the org in the path.

    Usage:
        @router.post("/", dependencies=[Depends(require_role(MemberRole.OWNER, MemberRole.ADMIN))])
    """
    async def _checker(
        membership: OrganizationMember = Depends(get_current_membership),
    ) -> OrganizationMember:
        if membership.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {', '.join(r.value for r in allowed)}",
            )
        return membership

    return _checker
