#!/bin/bash

echo "🚀 Starting Apointli..."

# Kill any processes on ports
echo "🧹 Cleaning up ports..."
fuser -k 3001/tcp 2>/dev/null
fuser -k 3002/tcp 2>/dev/null

# Start backend
echo "📦 Starting backend on port 3001..."
cd apps/api
npm run start:dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend on port 3002..."
cd ../web
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Apointli is running!"
echo "   - Backend:  http://localhost:3001/api/v1"
echo "   - Frontend: http://localhost:3002"
echo "   - Health:   http://localhost:3001/api/v1/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
wait
