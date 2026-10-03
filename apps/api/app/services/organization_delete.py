"""
Organization deletion service.

Deleting a workspace is destructive and permanent. Only OWNER can do it.
Cascades handle related records via DB foreign keys.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.organization import Organization
from app.models.organization_member import MemberRole, OrganizationMember


class DeleteError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


async def delete_organization(
    db: AsyncSession,
    org: Organization,
    user_id: uuid.UUID,
    confirmation_name: str,
) -> None:
    """
    Permanently delete an organization.

    Requires:
    - Caller must be the OWNER
    - Confirmation name must exactly match org.name
    """
    # Verify caller is OWNER
    result = await db.execute(
        select(OrganizationMember)
        .where(OrganizationMember.user_id == user_id)
        .where(OrganizationMember.organization_id == org.id)
    )
    membership = result.scalar_one_or_none()

    if not membership:
        raise DeleteError("You are not a member of this workspace", status_code=403)

    if membership.role != MemberRole.OWNER:
        raise DeleteError(
            "Only the workspace owner can delete it", status_code=403
        )

    # Verify confirmation name matches exactly
    if confirmation_name.strip() != org.name:
        raise DeleteError(
            "Confirmation name does not match. Type the workspace name exactly.",
            status_code=400,
        )

    # Cascade delete handles related records (members, appointments, etc.)
    await db.delete(org)
    await db.commit()
