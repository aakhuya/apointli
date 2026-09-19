from datetime import date

from pydantic import BaseModel, Field, model_validator


class CreateTimeOffRequest(BaseModel):
    start_date: date
    end_date: date
    start_time: str | None = None  # "HH:MM" — None means full day
    end_time: str | None = None
    reason: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def validate(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")

        # If one time is set, both must be
        if bool(self.start_time) != bool(self.end_time):
            raise ValueError("Provide both start_time and end_time, or neither")

        # Same-day time validation
        if (
            self.start_time
            and self.end_time
            and self.start_date == self.end_date
            and self.start_time >= self.end_time
        ):
            raise ValueError("end_time must be after start_time on the same day")

        # Time format
        for label, val in [("start_time", self.start_time), ("end_time", self.end_time)]:
            if val:
                try:
                    h, m = val.split(":")
                    if not (0 <= int(h) <= 23 and 0 <= int(m) <= 59):
                        raise ValueError
                except Exception:
                    raise ValueError(f"{label} must be HH:MM")

        return self


class TimeOffResponse(BaseModel):
    id: str
    staff_id: str
    start_date: str
    end_date: str
    start_time: str | None
    end_time: str | None
    reason: str | None
    is_approved: bool

    model_config = {"from_attributes": True}
