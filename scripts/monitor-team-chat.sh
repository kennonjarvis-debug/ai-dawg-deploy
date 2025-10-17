#!/bin/bash

# Team Chat Monitor for Agents
# Usage: ./scripts/monitor-team-chat.sh <agent-name>
# Example: ./scripts/monitor-team-chat.sh jerry

AGENT_NAME="${1:-jerry}"
CHAT_FILE="_bus/team-chat.jsonl"
LAST_CHECK_FILE="_bus/.last-chat-check-${AGENT_NAME}"

echo "🤖 ${AGENT_NAME} is now monitoring team chat..."
echo "📡 Watching for messages to '${AGENT_NAME}' or 'all'"
echo "---"

# Create chat file if it doesn't exist
mkdir -p _bus
touch "$CHAT_FILE"

# Get last check timestamp
if [ -f "$LAST_CHECK_FILE" ]; then
  LAST_CHECK=$(cat "$LAST_CHECK_FILE")
else
  LAST_CHECK=""
fi

# Monitor loop
while true; do
  # Read new messages since last check
  if [ -n "$LAST_CHECK" ]; then
    NEW_MESSAGES=$(jq -r --arg agent "$AGENT_NAME" --arg since "$LAST_CHECK" \
      'select(.timestamp > $since and (.to == $agent or .to == "all") and .from != $agent) |
       "\(.timestamp) [\(.from) → \(.to)]: \(.message)"' "$CHAT_FILE" 2>/dev/null)
  else
    # First run - get last 5 messages
    NEW_MESSAGES=$(tail -5 "$CHAT_FILE" | jq -r --arg agent "$AGENT_NAME" \
      'select(.to == $agent or .to == "all") and .from != $agent |
       "\(.timestamp) [\(.from) → \(.to)]: \(.message)"' 2>/dev/null)
  fi

  if [ -n "$NEW_MESSAGES" ]; then
    echo ""
    echo "📩 New message(s):"
    echo "$NEW_MESSAGES"
    echo ""

    # Agents can add custom logic here to respond to specific messages
    # Example: Check for commands like "Hey Jerry: status report"
    while IFS= read -r line; do
      if echo "$line" | grep -qi "hey ${AGENT_NAME}"; then
        echo "⚡ Detected command for ${AGENT_NAME}!"
        # Custom handler logic can go here
      fi
    done <<< "$NEW_MESSAGES"
  fi

  # Update last check timestamp
  date -u +"%Y-%m-%dT%H:%M:%S.000Z" > "$LAST_CHECK_FILE"
  LAST_CHECK=$(cat "$LAST_CHECK_FILE")

  # Wait before next check (2 seconds)
  sleep 2
done
