# AI Routing Integration Test Guide

## Overview

The AI chat is now fully connected to the DAW's Logic Pro X-style routing system. You can use **text or voice** commands to control all mixing and routing functions.

## What's Been Implemented

### ✅ Completed Integration

1. **Logic Pro X-style Routing Functions**
   - Create aux tracks (mono/stereo)
   - Create audio tracks (mono/stereo)
   - Create sends (pre-fader/post-fader)
   - Control send levels
   - Route track outputs
   - Adjust track volume, pan, mute, solo
   - Get track list for AI inspection

2. **AI System Prompt Updated**
   - AI now understands Logic Pro X mixer workflows
   - Knows how to set up professional routing (reverb buses, delay sends, parallel compression)
   - Can intelligently create complete mixes

3. **Text Chat Function Execution**
   - Fixed: Text chat now executes AI function calls (was previously broken)
   - AI can call routing functions via text commands
   - Function results are shown to user with toast notifications

4. **Voice Chat Function Execution**
   - OpenAI Realtime API integration already supports function calling
   - All routing functions available via voice commands

## How to Test

### Prerequisites

Ensure all services are running:
```bash
# Backend server (port 3001)
npm run dev:server

# AI brain server (port 8002) - handles text chat /api/chat
npx tsx src/backend/ai-brain-server.ts

# Realtime voice server (port 3100) - handles live voice
npx tsx src/backend/realtime-voice-server.ts

# UI (port 5173)
npm run dev:ui
```

**Important**: Both AI servers must be running:
- `ai-brain-server.ts` on port 8002 for text chat
- `realtime-voice-server.ts` on port 3100 for live voice

### Test URL
Open: http://localhost:5173

### Test Commands

#### 1. Basic Track Creation

**Text Command:** "Create a stereo aux track called Reverb"

**Expected Result:**
- Toast notification: "Created stereo aux track: Reverb"
- New aux track appears in track list
- AI responds: "I've created a stereo aux track called 'Reverb' for you."

**Voice Command:** Say: "Create a mono aux track called Delay"

---

#### 2. Professional Reverb Setup

**Text Command:** "Set up a reverb bus for my vocals"

**Expected Result:**
- AI creates a stereo aux track called "Reverb" (if not exists)
- AI finds vocal tracks in project
- AI creates post-fader sends from vocals → Reverb at ~25% level
- Toast notifications for each action
- AI explains what it did

**Voice Command:** Say: "Add reverb to the vocal track"

---

#### 3. Delay Send

**Text Command:** "Add a delay send to track 1 at 30%"

**Expected Result:**
- AI creates "Delay" aux track (if not exists)
- AI creates send from track 1 → Delay aux
- Send level set to 30% (0.3)
- Toast notification
- AI confirms the action

**Voice Command:** Say: "Route the guitar to a delay bus at fifteen percent"

---

#### 4. Parallel Compression

**Text Command:** "Set up parallel compression for the drums"

**Expected Result:**
- AI creates stereo aux track called "Parallel Comp" or "Drum Bus"
- AI finds drum tracks
- AI creates post-fader sends at 50-60% level
- Toast notifications
- AI explains the parallel compression setup

---

#### 5. Mixer Controls

**Text Commands:**
- "Set track 1 volume to 80%"
- "Pan track 2 30% to the left"
- "Mute track 3"
- "Solo the vocal track"

**Expected Results:**
- Track parameters updated in UI
- Toast notifications
- AI confirms each action

---

#### 6. Complete Mix Setup

**Text Command:** "Create a professional mix setup with reverb, delay, and compression"

**Expected Result:**
- AI creates multiple aux tracks:
  - "Reverb" (stereo)
  - "Delay" (stereo)
  - "Parallel Comp" (stereo)
- AI routes existing tracks intelligently
- AI sets appropriate send levels
- Multiple toast notifications
- AI explains the complete routing

**Voice Command:** Say: "Set up a complete vocal chain with reverb and delay"

---

#### 7. Inspect Project

**Text Command:** "Show me all the tracks in this project"

**Expected Result:**
- AI calls `getTracks()` function
- AI receives track data (names, types, channels, sends, routing)
- AI responds with formatted track list
- Shows routing information for each track

**Voice Command:** Say: "What tracks do I have?"

---

#### 8. Headphone Mix (Pre-fader Sends)

**Text Command:** "Create a headphone mix with pre-fader sends"

**Expected Result:**
- AI creates "Headphone Mix" aux track
- AI creates PRE-FADER sends from all tracks
- Pre-fader means performer hears independent mix
- Toast notifications
- AI explains pre-fader vs post-fader

---

### Debugging

#### Check Console Logs

**Browser Console (F12):**
```
AI requested function call: { name: 'createAuxTrack', arguments: { name: 'Reverb', channels: 'stereo' } }
```

**Backend Console (AI Brain Server):**
```
Chat request: { message: 'Create a reverb bus', project_context: {...} }
Function called: { name: 'createAuxTrack', arguments: {...} }
```

#### Check Network Tab

**Expected Request:**
```
POST http://localhost:3100/api/chat
{
  "message": "Create a stereo aux track called Reverb",
  "project_context": { ... }
}
```

**Expected Response:**
```json
{
  "response": "I've created a stereo aux track called 'Reverb' for you.",
  "function_call": {
    "name": "createAuxTrack",
    "arguments": {
      "name": "Reverb",
      "channels": "stereo"
    }
  },
  "timestamp": "2025-10-18T..."
}
```

## Architecture Flow

### Text Chat Flow
```
User types message
  ↓
AIChatWidget.sendMessage()
  ↓
HTTP POST to /api/chat (ai-brain-server.ts port 3100)
  ↓
OpenAI GPT-4 with function calling
  ↓
Response with function_call
  ↓
AIChatWidget.executeFunction()
  ↓
Call appropriate prop function (e.g., onCreateAuxTrack)
  ↓
DAWDashboard handler executes
  ↓
useTimelineStore updates state
  ↓
UI updates + toast notification
```

### Voice Chat Flow
```
User speaks
  ↓
Audio captured → WebSocket
  ↓
Sent to realtime-voice-server.ts (port 3100)
  ↓
OpenAI Realtime API processes
  ↓
Function call event
  ↓
Client executes via Socket.IO function handlers
  ↓
DAWDashboard handler executes
  ↓
Result sent back to OpenAI
  ↓
AI speaks response
```

## Files Modified

1. **src/ui/components/AIChatWidget.tsx**
   - Added `executeFunction()` helper (lines 597-747)
   - Updated `sendMessage()` to process function calls (lines 749-807)
   - Added all routing function props to interface and component

2. **src/backend/ai-brain-server.ts**
   - Updated SYSTEM_PROMPT with Logic Pro X knowledge (lines 36-119)
   - Added 11 routing function definitions to DAW_FUNCTIONS (lines 331-463)

3. **src/ui/DAWDashboard.tsx**
   - Added 11 routing handler functions (around line 948)
   - Pass all handlers to AIChatWidget component (lines 1723-1734)

4. **src/backend/realtime-voice-server.ts**
   - Added 11 function tools for OpenAI Realtime API (lines 903-1041)

5. **src/stores/timelineStore.ts**
   - Already had routing support (Send interface, track routing state)

## Known Limitations

1. **Track Name Matching**: AI needs to match track names from user commands. If tracks don't have descriptive names, AI may struggle.

   **Solution**: Use `getTracks` first, or create tracks with the same command.

2. **Multi-step Workflows**: Complex workflows (like "create complete mix") require multiple function calls. AI handles this well but it takes a few seconds.

3. **Error Handling**: If a function call fails (e.g., track not found), user sees a toast error but AI may not know about the failure in current architecture.

## Next Steps

### Manual Testing Checklist
- [ ] Test creating stereo aux track
- [ ] Test creating mono aux track
- [ ] Test creating audio tracks
- [ ] Test creating sends (post-fader)
- [ ] Test creating sends (pre-fader)
- [ ] Test volume control
- [ ] Test pan control
- [ ] Test mute/solo
- [ ] Test complex workflow (reverb setup)
- [ ] Test getTracks inspection
- [ ] Test voice commands
- [ ] Test multiple chained operations

### Automated Testing
- [ ] Run Playwright tests (once test selectors are added to UI)
- [ ] Test error handling scenarios
- [ ] Test with empty project
- [ ] Test with existing tracks

### Deployment
- [ ] Build production UI
- [ ] Build production backend
- [ ] Deploy to Railway/Render
- [ ] Verify environment variables (OPENAI_API_KEY)
- [ ] Test in production environment

## Success Criteria

✅ **The integration is successful if:**

1. User can type "Create a stereo aux track called Reverb" and see:
   - Toast notification
   - New track in timeline
   - AI confirmation message

2. User can say "Set up reverb for my vocals" and AI:
   - Creates aux track
   - Routes vocals to reverb
   - Sets appropriate send levels
   - Explains what it did

3. User can say "Create a complete professional mix" and AI:
   - Creates multiple aux tracks
   - Sets up intelligent routing
   - Uses Logic Pro X best practices
   - Provides clear feedback

## Support

If you encounter issues:

1. **Check Console**: Browser F12 console shows function call logs
2. **Check Backend**: Backend logs show OpenAI API calls
3. **Check Toast Notifications**: Should show success/error for each action
4. **Verify Props**: Ensure all routing props are passed to AIChatWidget
5. **Check OPENAI_API_KEY**: Verify API key is set in .env

## Example Session

```
User: "Hi, I want to set up a professional vocal chain"
AI: "I'll help you set up a professional vocal chain! First, let me create the necessary aux tracks."

[AI creates "Reverb" and "Delay" aux tracks]

User: "Great! Now route my vocal track to them"
AI: "I've created post-fader sends from your vocal track to the Reverb bus at 25% and the Delay bus at 15%. This will give your vocals a nice spacious sound. Would you like me to adjust the send levels?"

User: "Make the reverb a bit stronger"
AI: "I've increased the reverb send to 35%. How does that sound?"
```

---

**Last Updated**: 2025-10-18
**Status**: ✅ Ready for Testing
