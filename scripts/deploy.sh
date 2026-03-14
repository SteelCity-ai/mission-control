#!/bin/bash
set -e

echo "🚀 Deploying Steel City Mission Control"

# Pull latest code
cd /data/.openclaw/workspace/projects/mission-control-dashboard/steelcity-mission-control
git pull origin main

# Set environment
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-steel-city-2026}"
export AUTH_SECRET="${AUTH_SECRET:-$(openssl rand -hex 32)}"
export LINEAR_API_KEY="${LINEAR_API_KEY:-}"

# Build and run
docker compose down 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

echo "✅ Mission Control deployed!"
echo "📊 Dashboard: http://localhost:3001"
echo "🔐 Login: steel-city-2026"
