from pydantic import BaseModel, Field


class CreateLocationRequest(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    is_primary: bool = False
    address: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    timezone: str = Field(default="UTC", max_length=50)


class UpdateLocationRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    is_primary: bool | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    email: str | None = None
    timezone: str | None = None
    is_active: bool | None = None


class LocationResponse(BaseModel):
    id: str
    name: str
    is_primary: bool
    address: str | None
    city: str | None
    state: str | None
    country: str | None
    postal_code: str | None
    phone: str | None
    email: str | None
    timezone: str
    is_active: bool

    model_config = {"from_attributes": True}
