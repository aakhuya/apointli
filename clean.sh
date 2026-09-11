#!/bin/bash
echo "🧹 Cleaning ports 3000, 3001, 3002..."
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null
fuser -k 3002/tcp 2>/dev/null
pkill -f "next" 2>/dev/null
pkill -f "nest" 2>/dev/null
echo "✅ Ports cleared"
