from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, get_current_membership
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.schemas.notification import NotificationItem, NotificationsResponse
from app.services.notifications import list_recent_notifications

router = APIRouter()


@router.get("", response_model=NotificationsResponse)
async def get_notifications(
    org: Organization = Depends(get_current_org),
    _: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, le=50),
) -> NotificationsResponse:
    items = await list_recent_notifications(db, org, limit)
    # Unread: items created in the last 24h
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    unread = sum(
        1
        for i in items
        if datetime.fromisoformat(i["created_at"]) >= cutoff
    )
    return NotificationsResponse(
        items=[NotificationItem(**i) for i in items],
        unread_count=unread,
    )
