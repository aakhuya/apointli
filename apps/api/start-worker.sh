#!/bin/bash
# Production start script for Celery worker
set -e

echo "🚀 Starting Celery worker"

exec celery -A app.workers.celery_app worker --loglevel=info --concurrency=2
