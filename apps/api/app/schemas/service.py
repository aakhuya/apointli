from pydantic import BaseModel, Field


class CreateServiceRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    duration_minutes: int = Field(gt=0, le=1440)
    price: float | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", max_length=3)
    color: str = Field(default="#0a1628", max_length=7)
    buffer_before_minutes: int = Field(default=0, ge=0, le=120)
    buffer_after_minutes: int = Field(default=0, ge=0, le=120)
    is_bookable_online: bool = True


class UpdateServiceRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    duration_minutes: int | None = Field(default=None, gt=0, le=1440)
    price: float | None = Field(default=None, ge=0)
    color: str | None = Field(default=None, max_length=7)
    buffer_before_minutes: int | None = Field(default=None, ge=0, le=120)
    buffer_after_minutes: int | None = Field(default=None, ge=0, le=120)
    is_active: bool | None = None
    is_bookable_online: bool | None = None


class ServiceResponse(BaseModel):
    id: str
    name: str
    description: str | None
    duration_minutes: int
    price: float | None
    currency: str
    color: str
    buffer_before_minutes: int
    buffer_after_minutes: int
    is_active: bool
    is_bookable_online: bool

    model_config = {"from_attributes": True}
