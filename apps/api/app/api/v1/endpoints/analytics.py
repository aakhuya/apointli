from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.tenant import get_current_org, get_current_membership
from app.models.organization import Organization
from app.models.organization_member import MemberRole, OrganizationMember
from app.schemas.analytics import (
    AnalyticsResponse,
    DailyTrendRow,
    HourRow,
    OverviewResponse,
    ServiceBreakdownRow,
    StaffBreakdownRow,
)
from app.services.analytics import (
    get_daily_trend,
    get_hour_heatmap,
    get_overview,
    get_service_breakdown,
    get_staff_breakdown,
)

router = APIRouter()

MANAGER_ROLES = (
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.MANAGER,
)


def _check_access(membership: OrganizationMember) -> None:
    if membership.role not in MANAGER_ROLES:
        raise HTTPException(
            status_code=403,
            detail="Requires MANAGER, ADMIN, or OWNER role",
        )


@router.get("", response_model=AnalyticsResponse)
async def get_analytics(
    org: Organization = Depends(get_current_org),
    membership: OrganizationMember = Depends(get_current_membership),
    db: AsyncSession = Depends(get_db),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
) -> AnalyticsResponse:
    _check_access(membership)

    # Default: last 30 days
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=29)

    if start_date > end_date:
        raise HTTPException(400, "start_date must be <= end_date")

    if (end_date - start_date).days > 365:
        raise HTTPException(400, "Date range cannot exceed 365 days")

    overview = await get_overview(db, org, start_date, end_date)
    daily = await get_daily_trend(db, org, start_date, end_date)
    services = await get_service_breakdown(db, org, start_date, end_date)
    staff = await get_staff_breakdown(db, org, start_date, end_date)
    hourly = await get_hour_heatmap(db, org, start_date, end_date)

    return AnalyticsResponse(
        overview=OverviewResponse(**overview),
        daily_trend=[DailyTrendRow(**r) for r in daily],
        services=[ServiceBreakdownRow(**r) for r in services],
        staff=[StaffBreakdownRow(**r) for r in staff],
        hourly=[HourRow(**r) for r in hourly],
    )
