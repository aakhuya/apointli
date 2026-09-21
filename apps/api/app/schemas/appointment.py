from pydantic import BaseModel, Field


class CreateAppointmentRequest(BaseModel):
    staff_id: str
    service_id: str
    location_id: str | None = None

    # Optional: attach to an existing customer
    customer_id: str | None = None

    # Or create/find a customer inline
    customer_name: str | None = Field(default=None, max_length=200)
    customer_email: str | None = Field(default=None, max_length=255)
    customer_phone: str | None = Field(default=None, max_length=50)

    # ISO8601 UTC datetime
    start_time: str
    notes: str | None = Field(default=None, max_length=2000)


class CustomerSnapshot(BaseModel):
    id: str
    name: str
    email: str | None
    phone: str | None


class AppointmentResponse(BaseModel):
    id: str
    staff_id: str
    staff_name: str
    service_id: str | None
    service_name: str | None
    location_id: str | None
    customer: CustomerSnapshot | None
    start_time: str
    end_time: str
    status: str
    duration_minutes: int
    price: float | None
    currency: str
    notes: str | None
    created_at: str
