from pydantic import BaseModel


class NotificationItem(BaseModel):
    id: str
    type: str
    title: str
    body: str | None
    created_at: str
    link: str | None


class NotificationsResponse(BaseModel):
    items: list[NotificationItem]
    unread_count: int
