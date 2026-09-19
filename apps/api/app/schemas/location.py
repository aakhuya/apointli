from pydantic import BaseModel, Field, field_validator

from app.core.locales import is_valid_country, is_valid_currency, is_valid_timezone


class CreateLocationRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    is_primary: bool = False
    address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country_code: str | None = Field(default=None, max_length=2)
    postal_code: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    timezone: str = Field(default="UTC", max_length=64)
    currency: str = Field(default="USD", max_length=3)

    @field_validator("country_code")
    @classmethod
    def check_country(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not is_valid_country(v):
            raise ValueError(f"Unknown country code: {v}")
        return v.upper()

    @field_validator("currency")
    @classmethod
    def check_currency(cls, v: str) -> str:
        if not is_valid_currency(v):
            raise ValueError(f"Unknown currency code: {v}")
        return v.upper()

    @field_validator("timezone")
    @classmethod
    def check_timezone(cls, v: str) -> str:
        if not is_valid_timezone(v):
            raise ValueError(f"Unknown timezone: {v}")
        return v


class UpdateLocationRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    is_primary: bool | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country_code: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    email: str | None = None
    timezone: str | None = None
    currency: str | None = None
    is_active: bool | None = None

    @field_validator("country_code")
    @classmethod
    def check_country(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not is_valid_country(v):
            raise ValueError(f"Unknown country code: {v}")
        return v.upper()

    @field_validator("currency")
    @classmethod
    def check_currency(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not is_valid_currency(v):
            raise ValueError(f"Unknown currency code: {v}")
        return v.upper()

    @field_validator("timezone")
    @classmethod
    def check_timezone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not is_valid_timezone(v):
            raise ValueError(f"Unknown timezone: {v}")
        return v


class LocationResponse(BaseModel):
    id: str
    name: str
    is_primary: bool
    address: str | None
    city: str | None
    state: str | None
    country_code: str | None
    postal_code: str | None
    phone: str | None
    email: str | None
    timezone: str
    currency: str
    is_active: bool

    model_config = {"from_attributes": True}
