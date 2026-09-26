"""
Email client using Resend.

In development, if RESEND_API_KEY is not set, emails are logged to the
console instead of sent. This lets you develop offline and see exactly
what would go out.

In production, emails are sent via Resend. Failures are retried by Celery.
"""

import logging
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent / "templates"
env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


def render_template(name: str, **context) -> str:
    template = env.get_template(name)
    return template.render(**context)


async def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: str | None = None,
) -> dict:
    from_email = from_email or settings.EMAIL_FROM

    if not settings.RESEND_API_KEY:
        logger.warning(
            "📧 [DEV MODE] Email would be sent:\n"
            f"  To: {to}\n"
            f"  From: {from_email}\n"
            f"  Subject: {subject}\n"
            f"  Body preview: {html[:300]}..."
        )
        return {"status": "dev_logged", "to": to}

    try:
        import resend
        resend.api_key = settings.RESEND_API_KEY
        result = resend.Emails.send({
            "from": from_email,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info(f"✅ Email sent to {to}: {subject}")
        return {"status": "sent", "id": result.get("id"), "to": to}
    except Exception as e:
        logger.error(f"❌ Failed to send email to {to}: {e}")
        raise
