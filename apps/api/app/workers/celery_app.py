from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "apointli",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.email_tasks",
        "app.workers.scheduler_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Reliability
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_reject_on_worker_lost=True,

    # Retries
    task_default_retry_delay=60,
    task_max_retries=5,

    # Limits
    task_track_started=True,
    task_time_limit=300,
    task_soft_time_limit=240,

    # ─── Scheduled tasks (Celery Beat) ───
    beat_schedule={
        "scan-appointment-reminders-hourly": {
            "task": "scheduler.scan_upcoming_appointments",
            # Every hour, at minute 5 (avoids the top-of-hour rush)
            "schedule": crontab(minute=5),
        },
    },
)
