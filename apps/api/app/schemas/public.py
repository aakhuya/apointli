from pydantic import BaseModel


class PublicLocation(BaseModel):
    id: str
    name: str
    address: str | None
    city: str | None
    country_code: str | None
    timezone: str
    currency: str


class PublicService(BaseModel):
    id: str
    name: str
    description: str | None
    duration_minutes: int
    price: float | None
    currency: str
    color: str


class PublicStaff(BaseModel):
    id: str
    name: str
    title: str | None
    bio: str | None
    avatar_url: str | None


class PublicBusinessResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    cover_url: str | None
    website: str | None
    phone: str | None
    email: str | None
    timezone: str
    currency: str
    is_active: bool
    locations: list[PublicLocation]
    services: list[PublicService]
    staff: list[PublicStaff]


class PublicAvailabilityResponse(BaseModel):
    date: str
    timezone: str
    slots: list[dict]


class PublicCreateAppointmentRequest(BaseModel):
    staff_id: str
    service_id: str
    start_time: str
    customer_name: str
    customer_email: str | None = None
    customer_phone: str | None = None
    notes: str | None = None


class PublicAppointmentResponse(BaseModel):
    id: str
    business_name: str
    business_slug: str
    staff_name: str
    service_name: str
    customer_name: str
    start_time: str
    end_time: str
    timezone: str
    price: float | None
    currency: str
    location_name: str | None
    location_address: str | None
