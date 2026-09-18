from pydantic import BaseModel, Field


class CreateStaffRequest(BaseModel):
    email: str = Field(description="Email of an existing apointli user")
    title: str | None = Field(default=None, max_length=100)
    bio: str | None = None
    location_id: str | None = None
    accepts_bookings: bool = True


class UpdateStaffRequest(BaseModel):
    title: str | None = Field(default=None, max_length=100)
    bio: str | None = None
    location_id: str | None = None
    is_active: bool | None = None
    accepts_bookings: bool | None = None
    avatar_url: str | None = None


class StaffResponse(BaseModel):
    id: str
    user_id: str
    email: str
    first_name: str | None
    last_name: str | None
    title: str | None
    bio: str | None
    avatar_url: str | None
    location_id: str | None
    location_name: str | None
    is_active: bool
    accepts_bookings: bool

    model_config = {"from_attributes": True}
