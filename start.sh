#!/bin/sh

# Startup script for Railway services
# Determines which server to run based on SERVICE_TYPE environment variable

if [ "$SERVICE_TYPE" = "ai-brain" ]; then
  echo "🧠 Starting AI Brain Server..."
  exec tsx src/backend/ai-brain-server.ts
elif [ "$SERVICE_TYPE" = "gateway" ]; then
  echo "🚪 Starting Gateway Server..."
  exec tsx src/gateway/server.ts
else
  # Default to gateway if not specified
  echo "⚠️  SERVICE_TYPE not set, defaulting to Gateway Server..."
  exec tsx src/gateway/server.ts
fi
