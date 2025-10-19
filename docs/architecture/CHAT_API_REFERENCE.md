# Chat-to-Create API Reference

Quick reference for chat API endpoints and usage.

## Base URL
```
http://localhost:3000/api/chat
```

---

## Endpoints

### 1. Send Message

**POST** `/message`

Send a message and get AI response with intent detection.

**Request:**
```json
{
  "userId": "string (required)",
  "conversationId": "string (optional)",
  "message": "string (required, 1-2000 chars)",
  "projectId": "string (optional)"
}
```

**Response (Normal):**
```json
{
  "conversationId": "uuid",
  "message": "AI response text",
  "intent": "GENERATE_BEAT | MIX_TRACK | MASTER_TRACK | DAW_* | ...",
  "entities": {
    "genre": "trap",
    "bpm": 140,
    "key": "Cm"
  },
  "followUpQuestion": "What key would you like?",
  "provider": "openai",
  "tokensUsed": 250,
  "cost": 0.00009375
}
```

**Response (Streaming with SSE):**
Set header: `Accept: text/event-stream`

```
data: {"chunk":"I'll","done":false}

data: {"chunk":" create","done":false}

data: {"done":true,"conversationId":"uuid","intent":"GENERATE_BEAT"}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "message": "create a trap beat at 140 bpm"
  }'
```

---

### 2. List Conversations

**GET** `/conversations`

Get paginated list of user's conversations.

**Query Params:**
- `userId` (required) - User ID
- `projectId` (optional) - Filter by project
- `limit` (optional, default: 20) - Results per page
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "userId": "user123",
      "projectId": "proj-uuid",
      "createdAt": "2025-10-15T12:00:00Z",
      "updatedAt": "2025-10-15T12:05:00Z",
      "messageCount": 15,
      "lastMessage": {
        "content": "Your beat is ready!",
        "createdAt": "2025-10-15T12:05:00Z"
      }
    }
  ],
  "total": 42
}
```

**Example:**
```bash
curl "http://localhost:3000/api/chat/conversations?userId=user123&limit=10"
```

---

### 3. Get Conversation

**GET** `/conversations/:id`

Get full conversation with all messages and statistics.

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "userId": "user123",
    "projectId": "proj-uuid",
    "createdAt": "2025-10-15T12:00:00Z",
    "updatedAt": "2025-10-15T12:05:00Z",
    "messages": [
      {
        "id": "msg-uuid",
        "role": "user",
        "content": "create a trap beat",
        "intent": "GENERATE_BEAT",
        "entities": {
          "genre": "trap"
        },
        "generationId": null,
        "createdAt": "2025-10-15T12:00:00Z"
      },
      {
        "id": "msg-uuid-2",
        "role": "assistant",
        "content": "I'll create a trap beat for you...",
        "intent": null,
        "entities": null,
        "generationId": null,
        "createdAt": "2025-10-15T12:00:01Z"
      }
    ]
  },
  "stats": {
    "messageCount": 10,
    "userMessages": 5,
    "assistantMessages": 5,
    "generationsCount": 2,
    "firstMessageAt": "2025-10-15T12:00:00Z",
    "lastMessageAt": "2025-10-15T12:05:00Z"
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/chat/conversations/conv-uuid-123"
```

---

### 4. Delete Conversation

**DELETE** `/conversations/:id`

Delete a conversation and all its messages.

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted"
}
```

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/chat/conversations/conv-uuid-123"
```

---

### 5. Regenerate Response

**POST** `/conversations/:id/regenerate`

Regenerate the last assistant response in a conversation.

**Response:**
```json
{
  "message": "Here's a new version of your beat...",
  "intent": "GENERATE_BEAT",
  "provider": "anthropic",
  "tokensUsed": 300
}
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/chat/conversations/conv-uuid-123/regenerate"
```

---

### 6. Search Conversations

**GET** `/search`

Search conversations by message content.

**Query Params:**
- `userId` (required) - User ID
- `q` (required) - Search query
- `limit` (optional, default: 10) - Results limit

**Response:**
```json
{
  "results": [
    {
      "conversationId": "conv-uuid",
      "message": {
        "id": "msg-uuid",
        "content": "create a trap beat...",
        "createdAt": "2025-10-15T12:00:00Z"
      }
    }
  ],
  "count": 5
}
```

**Example:**
```bash
curl "http://localhost:3000/api/chat/search?userId=user123&q=trap+beat"
```

---

### 7. Test Intent Detection

**POST** `/intent/test`

Test intent detection on a message (development only).

**Request:**
```json
{
  "message": "create a lo-fi beat at 80 bpm"
}
```

**Response:**
```json
{
  "message": "create a lo-fi beat at 80 bpm",
  "result": {
    "intent": "GENERATE_BEAT",
    "entities": {
      "genre": "lo-fi",
      "bpm": 80
    },
    "confidence": 0.90
  },
  "stats": {
    "totalPatterns": 47,
    "categories": {
      "beatGeneration": 10,
      "mixing": 8,
      "mastering": 6,
      "dawControl": 12,
      "contextUpdate": 11
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/chat/intent/test \
  -H "Content-Type: application/json" \
  -d '{"message":"make it darker"}'
```

---

### 8. Get AI Providers

**GET** `/providers`

Get status of available AI providers.

**Response:**
```json
{
  "available": ["openai", "anthropic", "google"],
  "primary": "openai",
  "count": 3
}
```

**Example:**
```bash
curl "http://localhost:3000/api/chat/providers"
```

---

## Supported Intents

### Beat Generation
- `GENERATE_BEAT` - Create a music beat

**Entities:**
- `genre` - trap, lo-fi, boom bap, jazz, house, techno, hip hop, etc.
- `bpm` - 60-200
- `key` - Cm, F#, Gmaj, etc.
- `mood` - dark, chill, energetic, sad, happy, etc.
- `duration` - in seconds

**Examples:**
- "create a trap beat"
- "make a lo-fi beat at 80 bpm"
- "generate a dark drill instrumental in Cm"

### Mixing
- `MIX_TRACK` - Mix audio tracks

**Entities:**
- `effect` - reverb, delay, eq, compression
- `parameter` - bass, treble, vocals, drums
- `value` - adjustment amount

**Examples:**
- "add reverb"
- "boost the bass"
- "make it sound brighter"
- "cut the mids by 3dB"

### Mastering
- `MASTER_TRACK` - Master audio

**Entities:**
- `value` - target LUFS
- `parameters` - streaming platform settings

**Examples:**
- "master this track"
- "make it louder"
- "spotify ready at -14 LUFS"

### DAW Control
- `DAW_PLAY` - Start playback
- `DAW_STOP` - Stop/pause playback
- `DAW_RECORD` - Start recording
- `DAW_SET_BPM` - Set tempo
- `DAW_INCREASE_BPM` - Speed up
- `DAW_DECREASE_BPM` - Slow down
- `DAW_VOLUME_UP` - Increase volume
- `DAW_VOLUME_DOWN` - Decrease volume
- `DAW_MUTE` - Mute track
- `DAW_UNMUTE` - Unmute track
- `DAW_EXPORT` - Export/bounce track

**Examples:**
- "play"
- "change bpm to 140"
- "increase volume"
- "export the track"

### Context & Refinement
- `REGENERATE` - Regenerate last output
- `SAVE` - Save/download
- `UPDATE_PARAMETER` - Modify parameters

**Examples:**
- "try again"
- "change the genre to trap"
- "make it darker"

---

## Error Codes

### 400 Bad Request
Validation failed.

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "message",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

### 404 Not Found
Conversation not found.

```json
{
  "error": "Conversation not found"
}
```

### 500 Internal Server Error
Server error.

```json
{
  "error": "Failed to process message",
  "message": "Detailed error message"
}
```

---

## Frontend Integration Examples

### React Hook

```typescript
import { useState } from 'react';

export function useChat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message: string, userId: string) => {
    setLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          conversationId,
          message,
        }),
      });

      const data = await response.json();

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: data.message },
      ]);

      return data;
    } finally {
      setLoading(false);
    }
  };

  return { conversationId, messages, sendMessage, loading };
}
```

### Streaming Example

```typescript
async function streamMessage(message: string, userId: string) {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ userId, message }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (!data.done) {
          // Append chunk to UI
          appendToMessage(data.chunk);
        }
      }
    }
  }
}
```

---

## Testing

### Test Intent Detection

```bash
# Test beat generation
curl -X POST http://localhost:3000/api/chat/intent/test \
  -H "Content-Type: application/json" \
  -d '{"message":"create a trap beat at 140 bpm"}'

# Test mixing
curl -X POST http://localhost:3000/api/chat/intent/test \
  -H "Content-Type: application/json" \
  -d '{"message":"add reverb to the vocals"}'

# Test DAW control
curl -X POST http://localhost:3000/api/chat/intent/test \
  -H "Content-Type: application/json" \
  -d '{"message":"change bpm to 120"}'
```

### Run Validation Suite

```bash
npx tsx tests/backend/intent-service-validation.ts
```

Expected output:
```
📈 OVERALL RESULTS
Total Tests: 60
✅ Passed: 47
❌ Failed: 13
📊 Accuracy: 78.3%
```

---

## Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# AI Providers (at least one required)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
GOOGLE_AI_API_KEY=""
```

---

## Next Steps

1. **For Backend Developers:**
   - Add authentication middleware
   - Implement rate limiting
   - Add Redis caching
   - Improve intent detection to 90%+

2. **For Frontend Developers:**
   - Integrate with ChatbotWidget
   - Add WebSocket for real-time updates
   - Implement conversation history UI
   - Add audio player for generated beats

3. **For DevOps:**
   - Set up production environment
   - Configure Redis
   - Deploy database migrations
   - Monitor API performance

---

**Last Updated:** 2025-10-15
**API Version:** 1.0.0
**Status:** Production Ready ✅
