#!/bin/bash

echo "🚀 Starting Apointli..."

# Clean up ports
echo "🧹 Cleaning up ports..."
fuser -k 3001/tcp 2>/dev/null
fuser -k 3002/tcp 2>/dev/null

# Preflight: check that dependencies are installed
if [ ! -d "apps/api/node_modules" ] || [ ! -f "apps/api/node_modules/.bin/nest" ]; then
  echo "❌ Backend dependencies missing. Run: cd apps/api && npm install"
  exit 1
fi

if [ ! -d "apps/web/node_modules" ] || [ ! -f "apps/web/node_modules/.bin/next" ]; then
  echo "❌ Frontend dependencies missing. Run: cd apps/web && npm install"
  exit 1
fi

# Start backend
echo "📦 Starting backend on port 3001..."
cd apps/api
npm run start:dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to respond
echo "⏳ Waiting for backend..."
for i in {1..30}; do
  if curl -s http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo "✅ Backend is up"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "❌ Backend did not start in 30s"
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
done

# Start frontend
echo "🎨 Starting frontend on port 3002..."
cd apps/web
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ Apointli is running!"
echo "   - Backend:  http://localhost:3001/api/v1"
echo "   - Frontend: http://localhost:3002"
echo "   - Health:   http://localhost:3001/api/v1/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Stop both on Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
