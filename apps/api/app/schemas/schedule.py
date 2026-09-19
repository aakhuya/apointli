from datetime import time

from pydantic import BaseModel, Field, field_validator, model_validator


class ScheduleRuleInput(BaseModel):
    day_of_week: int = Field(ge=0, le=6, description="0=Monday, 6=Sunday")
    is_active: bool = True
    start_time: str | None = None  # "HH:MM"
    end_time: str | None = None
    break_start: str | None = None
    break_end: str | None = None

    @field_validator("start_time", "end_time", "break_start", "break_end")
    @classmethod
    def validate_time(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            h, m = v.split(":")
            hi, mi = int(h), int(m)
            if not (0 <= hi <= 23 and 0 <= mi <= 59):
                raise ValueError
        except Exception:
            raise ValueError(f"Invalid time format: {v}. Use HH:MM")
        return v

    @model_validator(mode="after")
    def validate_times(self):
        if self.is_active:
            if not self.start_time or not self.end_time:
                raise ValueError("Active days need start_time and end_time")
            if self.start_time >= self.end_time:
                raise ValueError("end_time must be after start_time")
            if self.break_start and self.break_end:
                if self.break_start >= self.break_end:
                    raise ValueError("break_end must be after break_start")
                if self.break_start < self.start_time or self.break_end > self.end_time:
                    raise ValueError("Break must be inside working hours")
        return self


class UpdateScheduleRequest(BaseModel):
    """Replace the whole weekly schedule for a staff member."""
    rules: list[ScheduleRuleInput] = Field(min_length=1, max_length=7)

    @model_validator(mode="after")
    def check_unique_days(self):
        days = [r.day_of_week for r in self.rules]
        if len(days) != len(set(days)):
            raise ValueError("Duplicate days in schedule")
        return self


class ScheduleRuleResponse(BaseModel):
    day_of_week: int
    is_active: bool
    start_time: str | None
    end_time: str | None
    break_start: str | None
    break_end: str | None


class ScheduleResponse(BaseModel):
    id: str
    staff_id: str
    name: str
    is_default: bool
    rules: list[ScheduleRuleResponse]
