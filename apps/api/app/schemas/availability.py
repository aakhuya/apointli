from pydantic import BaseModel


class SlotResponse(BaseModel):
    start: str  # ISO UTC
    end: str    # ISO UTC
    local_start: str  # "HH:MM"
    local_end: str
    timezone: str


class AvailabilityResponse(BaseModel):
    date: str
    timezone: str
    slots: list[SlotResponse]
