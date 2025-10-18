#!/bin/sh

# Startup script for Railway services
# Determines which server to run based on SERVICE_TYPE environment variable

echo "🚀 Starting DAWG AI service..."
echo "📋 SERVICE_TYPE: ${SERVICE_TYPE:-not set}"

if [ "$SERVICE_TYPE" = "ai-brain" ]; then
  echo "🧠 Starting AI Brain Server (Text Chat - Port 8002)..."
  exec tsx src/backend/ai-brain-server.ts
elif [ "$SERVICE_TYPE" = "realtime-voice" ]; then
  echo "🎤 Starting Realtime Voice Server (Voice Chat - Port 3100)..."
  exec tsx src/backend/realtime-voice-server.ts
elif [ "$SERVICE_TYPE" = "backend" ]; then
  echo "🎛️  Starting DAW Backend Server (Main API - Port 3001)..."
  exec tsx src/backend/server.ts
elif [ "$SERVICE_TYPE" = "gateway" ]; then
  echo "🚪 Starting Gateway Server..."
  exec tsx src/gateway/server.ts
else
  # Default to backend server if not specified
  echo "⚠️  SERVICE_TYPE not set, defaulting to DAW Backend Server..."
  exec tsx src/backend/server.ts
fi
