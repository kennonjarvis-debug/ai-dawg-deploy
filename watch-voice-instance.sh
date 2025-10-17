#!/bin/bash

# Voice Bridge Monitor for Claude Code Instances
# Usage: ./watch-voice-instance.sh <instance-name>
# Example: ./watch-voice-instance.sh sage

INSTANCE_NAME=$1

if [ -z "$INSTANCE_NAME" ]; then
  echo "Usage: ./watch-voice-instance.sh <instance-name>"
  echo "Options: max, alex, sage, jordan"
  exit 1
fi

BRIDGE_FILE="voice-bridge.json"

echo "🎤 Instance '$INSTANCE_NAME' is listening for voice messages..."
echo "📡 Monitoring: $BRIDGE_FILE"
echo ""

LAST_CHECK=$(date +%s)

while true; do
  # Check for new messages
  if [ -f "$BRIDGE_FILE" ]; then
    # Get pending messages for this instance
    PENDING=$(jq -r ".messages[] | select(.to == \"$INSTANCE_NAME\" and .status == \"pending\") | @json" "$BRIDGE_FILE" 2>/dev/null | head -1)

    if [ -n "$PENDING" ]; then
      MSG_ID=$(echo "$PENDING" | jq -r '.id')
      MSG_TEXT=$(echo "$PENDING" | jq -r '.text')

      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "📨 NEW VOICE MESSAGE"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "User said: $MSG_TEXT"
      echo ""
      echo "💭 Please respond in your Claude Code terminal..."
      echo ""
      echo "When done, paste your response below:"
      read -p "Response: " RESPONSE

      # Update message with response
      TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
      jq ".messages |= map(if .id == \"$MSG_ID\" then .response = \"$RESPONSE\" | .status = \"complete\" | .responded_at = \"$TIMESTAMP\" else . end)" "$BRIDGE_FILE" > tmp.json && mv tmp.json "$BRIDGE_FILE"

      echo "✅ Response sent to voice chat!"
      echo ""
    fi
  fi

  sleep 1
done
