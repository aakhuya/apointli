#!/bin/bash
echo "🚀 Starting apointli dev stack in tmux..."

# Ensure Docker is running
cd ~/apointli
docker compose up -d
echo "✅ Docker containers up"

# Create a tmux session with 4 windows
SESSION="apointli"

# Kill existing session
tmux kill-session -t $SESSION 2>/dev/null

# Start new session with API
tmux new-session -d -s $SESSION -n "api"
tmux send-keys -t $SESSION:api "cd ~/apointli/apps/api && source venv/bin/activate && uvicorn app.main:app --reload --port 3001" C-m

# New window: Celery worker
tmux new-window -t $SESSION -n "celery"
tmux send-keys -t $SESSION:celery "cd ~/apointli/apps/api && source venv/bin/activate && celery -A app.workers.celery_app worker --loglevel=info" C-m

# New window: Celery beat
tmux new-window -t $SESSION -n "beat"
tmux send-keys -t $SESSION:beat "cd ~/apointli/apps/api && source venv/bin/activate && celery -A app.workers.celery_app beat --loglevel=info" C-m

# New window: Web
tmux new-window -t $SESSION -n "web"
tmux send-keys -t $SESSION:web "cd ~/apointli/apps/web && npm run dev" C-m

# Focus on the API window
tmux select-window -t $SESSION:api

echo "✅ All services launched in tmux session '$SESSION'"
echo ""
echo "Commands:"
echo "  tmux attach -t $SESSION      # attach to session"
echo "  Ctrl+B then 0-3              # switch between windows"
echo "  Ctrl+B then D                # detach (services keep running)"
echo "  tmux kill-session -t $SESSION  # stop everything"
echo ""
echo "URLs:"
echo "  Frontend:  http://localhost:3002"
echo "  API docs:  http://localhost:3001/docs"
