#!/bin/bash
set -e

echo "🚀 Deploying Steel City Mission Control"

# Auto-detect paths (works on host or container)
if [ -d "/docker/openclaw-cnvy/data/.openclaw" ]; then
  HOST_PATH="/docker/openclaw-cnvy/data/.openclaw/workspace/projects/mission-control-dashboard/steelcity-mission-control"
elif [ -d "/data/.openclaw" ]; then
  HOST_PATH="/data/.openclaw/workspace/projects/mission-control-dashboard/steelcity-mission-control"
else
  HOST_PATH="$(cd "$(dirname "$0")/.." && pwd)"
fi

echo "📁 Project path: $HOST_PATH"
cd "$HOST_PATH"

# Pull latest if git repo
if [ -d .git ]; then
  echo "📥 Pulling latest..."
  git pull origin main || echo "⚠️ Git pull failed — continuing with local"
fi

# Set environment
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-steel-city-2026}"
export AUTH_SECRET="${AUTH_SECRET:-$(openssl rand -hex 32)}"
export LINEAR_API_KEY="${LINEAR_API_KEY:-}"

echo "🔐 Auth secret generated"
echo "🏗️ Building Docker image..."

# Build and run
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

sleep 3

echo ""
echo "✅ Mission Control deployed!"
echo "📊 Dashboard: http://localhost:3001"
echo "🔐 Login: steel-city-2026"
echo ""
docker compose ps
