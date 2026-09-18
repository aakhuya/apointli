from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    health,
    locations,
    organizations,
    services,
)

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(
    organizations.router, prefix="/organizations", tags=["organizations"]
)
api_router.include_router(
    services.router,
    prefix="/organizations/{org_id}/services",
    tags=["services"],
)
api_router.include_router(
    locations.router,
    prefix="/organizations/{org_id}/locations",
    tags=["locations"],
)
