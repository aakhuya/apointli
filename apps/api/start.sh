#!/bin/bash
# Production start script for the FastAPI web service
set -e

PORT="${PORT:-8000}"

echo "🚀 Starting Apointli API on port $PORT"

# Run migrations (idempotent)
alembic upgrade head

# Start uvicorn with multiple workers
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 2
