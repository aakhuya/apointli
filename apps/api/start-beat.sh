#!/bin/bash
# Production start script for Celery beat (scheduler)
set -e

echo "🚀 Starting Celery beat"

exec celery -A app.workers.celery_app beat --loglevel=info
