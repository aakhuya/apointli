from fastapi import APIRouter

from app.core.locales import (
    list_countries,
    list_currencies,
    list_timezones,
)

router = APIRouter()


@router.get("/countries")
async def get_countries() -> list[dict]:
    """All ISO 3166 countries with suggested currency + timezone."""
    return list_countries()


@router.get("/currencies")
async def get_currencies() -> list[dict]:
    """All ISO 4217 currencies with symbols and names."""
    return list_currencies()


@router.get("/timezones")
async def get_timezones() -> list[dict]:
    """All IANA timezones grouped by region."""
    return list_timezones()
