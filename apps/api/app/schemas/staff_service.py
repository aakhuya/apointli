from pydantic import BaseModel


class AssignServiceRequest(BaseModel):
    service_id: str
    price_override: float | None = None
    duration_override_minutes: int | None = None


class StaffServiceResponse(BaseModel):
    service_id: str
    name: str
    duration_minutes: int
    price: float | None
    color: str
    price_override: float | None
    duration_override_minutes: int | None
    effective_price: float | None
    effective_duration_minutes: int
    is_active: bool


class AvailableServiceResponse(BaseModel):
    id: str
    name: str
    duration_minutes: int
    price: float | None
    color: str
