#!/bin/sh

# Startup script for Railway deployment
# Unified backend server (all services in one!)

echo "🚀 Starting DAWG AI Unified Backend..."
echo "📦 Services: Main Backend + AI Brain + Realtime Voice"
echo "💰 Cost Savings: $15/month (consolidated from 3 services to 1)"

# Start the unified backend server (combines all 3 backend services)
echo "🎛️  Starting Unified Backend Server..."
exec tsx src/backend/unified-server.ts
