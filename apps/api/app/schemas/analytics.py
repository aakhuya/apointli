from pydantic import BaseModel


class OverviewResponse(BaseModel):
    total_appointments: int
    revenue: float
    currency: str
    completed: int
    cancelled: int
    no_show: int
    completion_rate: float
    cancellation_rate: float
    no_show_rate: float


class DailyTrendRow(BaseModel):
    date: str
    bookings: int
    revenue: float


class ServiceBreakdownRow(BaseModel):
    name: str
    bookings: int
    revenue: float


class StaffBreakdownRow(BaseModel):
    staff_id: str
    name: str
    bookings: int
    revenue: float


class HourRow(BaseModel):
    hour: int
    count: int


class AnalyticsResponse(BaseModel):
    overview: OverviewResponse
    daily_trend: list[DailyTrendRow]
    services: list[ServiceBreakdownRow]
    staff: list[StaffBreakdownRow]
    hourly: list[HourRow]
