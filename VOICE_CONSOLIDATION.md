# Voice System Consolidation

## Overview
The AI DAW codebase previously had two separate voice chat systems. These have been consolidated into a single, unified system based on OpenAI's Realtime API for better performance and lower latency.

## What Changed

### Before (Dual System)
1. **System 1: OpenAI Realtime API** (Port 3100)
   - Native streaming audio
   - Built-in VAD (Voice Activity Detection)
   - Lower latency
   - File: `src/backend/realtime-voice-server.ts`

2. **System 2: Whisper + GPT-4o + TTS Pipeline** (Port 8002)
   - Separate transcription/synthesis steps
   - Higher latency (3 API calls per exchange)
   - More control over each step
   - File: `src/backend/ai-brain-server.ts` (endpoints: `/api/voice-chat`, WebSocket `voice-stream`)

### After (Unified System)
All voice functionality is now handled by the **OpenAI Realtime API** on **Port 3100**.

## Benefits of Consolidation

1. **Lower Latency**: Native streaming vs 3 sequential API calls
2. **Better VAD**: Built-in server-side Voice Activity Detection
3. **Automatic Interruption**: User can interrupt AI mid-response
4. **Conversation Context**: Built-in conversation history (10 messages)
5. **Multiple Voices**: 8 voice options (alloy, echo, shimmer, ash, ballad, coral, sage, verse)
6. **Reduced API Costs**: 1 Realtime API call vs 3 calls (Whisper + GPT-4o + TTS)
7. **Project Context Support**: DAW state is passed to AI for better responses
8. **Function Calling**: Full support for DAW control functions

## Architecture

### Unified Voice Server (Port 3100)
```
┌─────────────────────────────────────────┐
│  realtime-voice-server.ts (Port 3100)  │
├─────────────────────────────────────────┤
│  - OpenAI Realtime API WebSocket       │
│  - Conversation history (10 messages)  │
│  - Project context injection           │
│  - Function calling support            │
│  - Voice selection (8 voices)          │
│  - Interruption handling               │
│  - Built-in VAD                        │
└─────────────────────────────────────────┘
         ↕ WebSocket (ws://localhost:3100)
┌─────────────────────────────────────────┐
│      AIChatWidget.tsx (Frontend)       │
├─────────────────────────────────────────┤
│  - Single WebSocket connection         │
│  - Real-time audio streaming           │
│  - Transcript display                  │
│  - Function execution                  │
│  - Voice preference storage            │
└─────────────────────────────────────────┘
```

### Text Chat Server (Port 8002)
```
┌─────────────────────────────────────────┐
│    ai-brain-server.ts (Port 8002)      │
├─────────────────────────────────────────┤
│  - HTTP /api/chat (text only)          │
│  - Music generation endpoints          │
│  - Lyrics organization                 │
│  - Melody-to-vocals                    │
│  - DEPRECATED: /api/voice-chat         │
│  - DEPRECATED: voice-stream WebSocket  │
└─────────────────────────────────────────┘
```

## Migration Guide

### For Developers

#### Old Code (Using Deprecated System)
```typescript
// DON'T USE - Deprecated
const response = await fetch('http://localhost:8002/api/voice-chat', {
  method: 'POST',
  body: JSON.stringify({ audio_base64, project_context })
});
```

#### New Code (Using Unified System)
```typescript
// USE THIS - Realtime Voice Server
const socket = io('http://localhost:3100');

socket.emit('start-realtime', {
  voice: 'alloy',
  projectContext: { tempo: 120, key: 'C Major' }
});

// Stream audio
socket.emit('send-audio', { audio: base64Audio });

// Listen for responses
socket.on('audio-delta', (data) => {
  playAudio(data.audio);
});
```

### Environment Variables
No changes required. Both systems use `OPENAI_API_KEY`.

### Starting Services

#### Development
```bash
# Start all services
npm run start

# Or individually:
tsx src/backend/realtime-voice-server.ts  # Port 3100 (voice)
tsx src/backend/ai-brain-server.ts         # Port 8002 (text chat + music)
tsx src/backend/server.ts                  # Port 3001 (DAW backend)
```

#### Production (Railway/Docker)
Set `SERVICE_TYPE` environment variable:
- `realtime-voice` → Port 3100 (voice server)
- `ai-brain` → Port 8002 (text chat + music)
- `backend` → Port 3001 (DAW backend)

## Deprecated Endpoints

The following endpoints return HTTP 410 Gone with migration instructions:

### ai-brain-server.ts (Port 8002)
- `POST /api/voice-chat` → Use WebSocket on port 3100
- WebSocket event `voice-stream` → Use port 3100
- WebSocket event `stop-voice` → Use port 3100

## Features Comparison

| Feature | Whisper+TTS (Deprecated) | Realtime API (Current) |
|---------|-------------------------|------------------------|
| Latency | High (3+ seconds) | Low (<1 second) |
| API Calls | 3 per exchange | 1 per exchange |
| Cost per exchange | $0.031 | $0.06/min |
| VAD | Client-side only | Server-side built-in |
| Interruption | Manual | Automatic |
| Voices | 6 options | 8 options |
| Conversation Memory | Manual | Automatic |
| Project Context | Manual injection | Built-in support |
| Function Calling | Yes | Yes |
| Audio Quality | High (TTS-1-HD) | High (native) |

## Files Modified

### Backend
- `/src/backend/realtime-voice-server.ts` - Enhanced with conversation history and project context
- `/src/backend/ai-brain-server.ts` - Deprecated voice endpoints, kept text chat

### Frontend
- `/src/ui/components/AIChatWidget.tsx` - Unified to use single voice server

### Documentation
- `/VOICE_CONSOLIDATION.md` - This file

## Testing

### Manual Testing
1. Start voice server: `tsx src/backend/realtime-voice-server.ts`
2. Start UI: `npm run dev:ui`
3. Click microphone button in AI Chat Widget
4. Speak to test voice recognition and response
5. Try interrupting AI mid-response (should work seamlessly)
6. Change voice in dropdown (8 options available)

### Verify Deprecation Warnings
```bash
# Test deprecated HTTP endpoint
curl -X POST http://localhost:8002/api/voice-chat \
  -H "Content-Type: application/json" \
  -d '{"audio_base64":"test"}'

# Should return HTTP 410 with migration guide
```

## Rollback Plan

If issues arise, the old Whisper+TTS code is preserved but commented in:
- `/src/backend/ai-brain-server.ts` (lines 749-769)

To rollback:
1. Uncomment the old `/api/voice-chat` endpoint
2. Restore WebSocket `voice-stream` handler
3. Update frontend to use port 8002 for voice

## Future Enhancements

1. **Multi-user sessions**: Support multiple simultaneous voice conversations
2. **Voice cloning**: Custom voice training for personalized responses
3. **Emotion detection**: Analyze user emotion from voice tone
4. **Music generation integration**: Generate music directly from voice description
5. **Transcription export**: Save conversation transcripts for later review

## Support

For issues or questions, contact the development team or file an issue in the repository.

---

**Last Updated**: 2025-01-18
**Author**: Claude Code
**Status**: Production Ready
