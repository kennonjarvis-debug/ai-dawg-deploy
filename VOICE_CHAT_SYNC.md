# Voice Chat Sync System

## How It Works

The voice chat system routes to different AI personalities (Max, Alex, Sage, Jordan) but these are **simulated** using GPT-4, not connected to actual Claude Code instances.

## Option 1: Real-Time Sync (What You Want)

To connect voice chat to actual running instances:

### Setup

1. **Each instance monitors a shared file** (`/voice-messages.json`)
2. **When you speak**, message gets written to file
3. **Assigned instance reads it** and responds via their Claude Code terminal
4. **Response gets written back** to file
5. **Voice chat reads response** and speaks it

### Implementation Required

**File:** `/voice-messages.json`
```json
{
  "messages": [
    {
      "id": "msg_001",
      "from": "user",
      "to": "sage",
      "text": "What did you build today?",
      "timestamp": "2025-10-03T02:50:00Z",
      "status": "pending"
    },
    {
      "id": "msg_001_response",
      "from": "sage",
      "to": "user",
      "text": "I built the MusicGenerator, VoiceProfileManager, and HarmonyGenerator widgets today!",
      "timestamp": "2025-10-03T02:50:05Z",
      "status": "complete"
    }
  ]
}
```

**Monitor Script** (each instance runs this):
```bash
# /watch-voice-chat.sh
#!/bin/bash

INSTANCE_NAME=$1  # max, alex, sage, or jordan
MESSAGES_FILE="voice-messages.json"

echo "🎤 Instance $INSTANCE_NAME monitoring voice chat..."

while true; do
  # Check for new messages addressed to this instance
  NEW_MSG=$(jq -r ".messages[] | select(.to == \"$INSTANCE_NAME\" and .status == \"pending\") | .text" $MESSAGES_FILE 2>/dev/null | head -1)

  if [ -n "$NEW_MSG" ]; then
    echo "📨 Message received: $NEW_MSG"
    echo "💭 Thinking..."

    # Get response from Claude Code (you'd need to implement this part)
    # For now, this would need manual response or integration with Claude API

    echo "Please respond to: $NEW_MSG"
    read -p "Your response: " RESPONSE

    # Write response back
    # (Would need jq update logic here)

    echo "✅ Response sent!"
  fi

  sleep 2
done
```

**Problem:** Claude Code instances can't automatically generate responses - they need YOU to type the response.

---

## Option 2: Current System (What's Implemented)

**Pros:**
- ✅ Works NOW - no setup needed
- ✅ Instant responses
- ✅ Each "instance" has accurate knowledge of what they built
- ✅ Natural voice conversation

**Cons:**
- ❌ Not actually the real Claude instances
- ❌ Won't know about work done after initial setup

**How to update knowledge:**
Edit `/app/api/voice-chat/route.ts` and update each instance's prompt with new widgets they've built.

---

## Option 3: Hybrid (Best of Both)

**User speaks** → **Voice chat AI responds immediately** → **Also posts to SYNC.md** → **Real instances see it**

This way:
1. You get instant voice responses
2. Real instances see the conversation in SYNC.md
3. They can respond in text (you read their responses in SYNC monitor)

**Implementation:**

Add to `/app/api/voice-chat/route.ts`:
```typescript
// After getting AI response, also post to SYNC.md
const syncMessage = `
### Voice Chat Message to ${respondingAs}
**Date:** ${new Date().toISOString()}
**User said:** "${lastUserMessage.content}"
**${respondingAs} responded:** "${message}"
---
`;

// Append to SYNC.md
fs.appendFileSync('SYNC.md', syncMessage);
```

Then real instances will see the voice conversation in their sync monitor!

---

## Recommendation

**Use Option 3 (Hybrid)**

Why:
1. Voice chat works instantly (no waiting for Claude instances)
2. Real instances stay informed (see conversation in SYNC.md)
3. They can join the conversation by posting responses
4. Best user experience

Want me to implement Option 3?
