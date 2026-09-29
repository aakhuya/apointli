#!/bin/bash
set -e

PORT="${PORT:-8000}"

echo "🚀 Starting Apointli API on port $PORT"
echo "Running database migrations..."
alembic upgrade head
echo "Migrations complete. Starting uvicorn..."

exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --workers 2
