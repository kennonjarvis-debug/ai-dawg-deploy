# Voice Interruption & Echo Cancellation Fix Plan

**Date:** 2025-10-18
**Issues:**
1. Cannot interrupt AI (like Advanced Voice)
2. AI might hear its own voice (echo/feedback)
3. Voice is working but flow isn't conversational enough

---

## Current State Analysis

### What's Working ✅:
- OpenAI Realtime API connection successful
- Voice recognition (Whisper transcription)
- AI responses generating
- Voice change function works
- VAD detecting speech start/stop

### Critical Issues ❌:

#### 1. No Interruption Support
**Problem:** User cannot interrupt AI mid-response
**Current Behavior:**
```
User speaks → User stops → AI responds → AI finishes → User can speak again
```

**Desired Behavior (like Advanced Voice):**
```
User speaks → AI responds → User interrupts → AI stops immediately → User speaks
```

**Root Cause:**
- No `response.cancel` being sent when user starts speaking during AI response
- No detection of "user speaking while AI is talking"

#### 2. Echo/Feedback Loop
**Problem:** AI might hear its own voice through the microphone
**Symptoms:**
- AI responding to itself
- Unintended triggering of VAD
- User logs show: "and he's speaking back to me"

**Root Causes:**
- No echo cancellation on client side
- No audio output monitoring to prevent feedback
- Speaker output being picked up by microphone

#### 3. VAD Settings Not Optimal for Conversation
**Current Settings:**
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,          // Medium sensitivity
  prefix_padding_ms: 300,  // Capture before speech
  silence_duration_ms: 400 // Wait 400ms of silence
}
```

**Issues:**
- `silence_duration_ms: 400` too long for natural conversation
- No detection of overlapping speech (user + AI)

---

## Solution 1: Enable Interruption

### Server-Side Changes

Add interruption detection when user speaks during AI response:

```typescript
// Track if AI is currently responding
let isAIResponding = false;
let currentResponseId: string | null = null;

// When AI starts responding
case 'response.created':
  isAIResponding = true;
  currentResponseId = event.response.id;
  break;

// When AI finishes responding
case 'response.done':
  isAIResponding = false;
  currentResponseId = null;
  break;

// When user starts speaking
case 'input_audio_buffer.speech_started':
  console.log('🗣️  User started speaking');
  socket.emit('speech-started');

  // ✨ NEW: Cancel AI response if user interrupts
  if (isAIResponding && currentResponseId) {
    console.log('⚡ User interrupted AI - canceling response');
    openaiWs?.send(JSON.stringify({
      type: 'response.cancel'
    }));
    isAIResponding = false;
    currentResponseId = null;
    socket.emit('ai-interrupted');
  }
  break;
```

### Client-Side Changes

Stop playing AI audio when interrupted:

```typescript
// In AIChatWidget.tsx
voiceSocketRef.current.on('ai-interrupted', () => {
  console.log('⚡ AI was interrupted by user');
  // Stop any currently playing audio
  if (audioContextRef.current) {
    audioContextRef.current.close();
    audioContextRef.current = new AudioContext({ sampleRate: 24000 });
  }
  // Visual feedback
  setIsAISpeaking(false);
});
```

---

## Solution 2: Echo Cancellation

### Option A: Client-Side Echo Cancellation (Recommended)

Use Web Audio API's echo cancellation:

```typescript
// In AIChatWidget.tsx - when starting microphone
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,           // ✨ Enable
    noiseSuppression: true,           // ✨ Enable
    autoGainControl: true,            // ✨ Enable
    sampleRate: 24000
  }
});
```

### Option B: Mute Microphone During AI Response

```typescript
let audioTrack: MediaStreamTrack | null = null;

// When AI starts speaking
voiceSocketRef.current.on('speech-started', () => {
  if (audioTrack) {
    audioTrack.enabled = false; // Mute mic
    console.log('🔇 Microphone muted during AI speech');
  }
});

// When AI finishes speaking
voiceSocketRef.current.on('speech-stopped', () => {
  if (audioTrack) {
    audioTrack.enabled = true; // Unmute mic
    console.log('🎤 Microphone unmuted');
  }
});
```

**Note:** Option B prevents interruption, so use Option A + smart detection instead.

### Option C: Audio Output Monitoring (Advanced)

Detect when speaker audio might trigger VAD:

```typescript
// Monitor audio output level
const analyser = audioContextRef.current.createAnalyser();
audioSourceNode.connect(analyser);

const checkOutputLevel = () => {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

  if (average > 50) {
    // AI is speaking loudly, increase VAD threshold temporarily
    console.log('🔊 AI speaking, adjusting VAD sensitivity');
  }
};
```

---

## Solution 3: Optimize VAD Settings

### Reduce Silence Duration

For more conversational flow:

```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,          // Keep balanced
  prefix_padding_ms: 300,  // Keep buffer
  silence_duration_ms: 200 // ✨ Reduce from 400ms to 200ms
}
```

**Effect:** AI responds faster when user pauses

### Add Threshold Adjustment

Dynamic threshold based on environment:

```typescript
// Higher threshold when AI is speaking
const dynamicThreshold = isAIResponding ? 0.7 : 0.5;

// Update session
openaiWs?.send(JSON.stringify({
  type: 'session.update',
  session: {
    turn_detection: {
      threshold: dynamicThreshold,
      silence_duration_ms: 200
    }
  }
}));
```

---

## Solution 4: Visual Feedback

Add visual indicators for better UX:

```typescript
// State for visual feedback
const [isAISpeaking, setIsAISpeaking] = useState(false);
const [isUserSpeaking, setIsUserSpeaking] = useState(false);

// Listen to events
voiceSocketRef.current.on('response.audio.delta', () => {
  setIsAISpeaking(true);
});

voiceSocketRef.current.on('response.audio.done', () => {
  setIsAISpeaking(false);
});

voiceSocketRef.current.on('speech-started', () => {
  setIsUserSpeaking(true);
});

voiceSocketRef.current.on('speech-stopped', () => {
  setIsUserSpeaking(false);
});
```

UI indicators:

```tsx
{isAISpeaking && (
  <div className="absolute top-2 right-2 flex items-center gap-2 bg-purple-500/20 px-3 py-1 rounded-full">
    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
    <span className="text-xs text-purple-300">AI speaking...</span>
  </div>
)}

{isUserSpeaking && (
  <div className="absolute top-2 left-2 flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full">
    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
    <span className="text-xs text-blue-300">Listening...</span>
  </div>
)}
```

---

## Implementation Priority

### Phase 1: Critical Fixes (Do First)
1. ✅ Enable echo cancellation in getUserMedia
2. ✅ Add interruption detection (response.cancel)
3. ✅ Stop audio playback when interrupted
4. ✅ Reduce silence_duration_ms to 200ms

### Phase 2: Enhancements
5. Add visual feedback (speaking indicators)
6. Add dynamic VAD threshold adjustment
7. Add audio output monitoring

### Phase 3: Advanced
8. Implement smart muting strategy
9. Add voice activity visualization
10. Implement conversation flow analytics

---

## Code Changes Required

### File: `src/backend/realtime-voice-server.ts`

**Lines 66-71:** Update VAD settings
```typescript
turn_detection: {
  type: 'server_vad',
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 200  // Changed from 400
}
```

**After line 1126:** Add interruption detection
```typescript
// Track AI response state
let isAIResponding = false;
let currentResponseId: string | null = null;

// ... existing code ...

case 'response.created':
  isAIResponding = true;
  currentResponseId = event.response.id;
  socket.emit('response-started');
  break;

case 'response.done':
  isAIResponding = false;
  currentResponseId = null;
  socket.emit('response-done');
  break;

case 'input_audio_buffer.speech_started':
  console.log('🗣️  User started speaking');
  socket.emit('speech-started');

  if (isAIResponding && currentResponseId) {
    console.log('⚡ User interrupted - canceling AI response');
    openaiWs?.send(JSON.stringify({
      type: 'response.cancel'
    }));
    isAIResponding = false;
    currentResponseId = null;
    socket.emit('ai-interrupted');
  }
  break;
```

### File: `src/ui/components/AIChatWidget.tsx`

**Around line 940-950:** Update getUserMedia call
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,      // Enable
    noiseSuppression: true,      // Enable
    autoGainControl: true,       // Enable
    channelCount: 1,
    sampleRate: 24000
  }
});
```

**Around line 580-590:** Add interruption handler
```typescript
voiceSocketRef.current.on('ai-interrupted', () => {
  console.log('⚡ AI interrupted by user');

  // Stop audio playback
  if (audioContextRef.current) {
    audioContextRef.current.suspend(); // Pause instead of close
  }

  // Clear audio queue
  audioQueueRef.current = [];

  setIsAISpeaking(false);
});
```

**Add state for visual feedback:**
```typescript
const [isAISpeaking, setIsAISpeaking] = useState(false);
const [isUserSpeaking, setIsUserSpeaking] = useState(false);

// Update based on events
voiceSocketRef.current.on('response-started', () => setIsAISpeaking(true));
voiceSocketRef.current.on('response-done', () => setIsAISpeaking(false));
voiceSocketRef.current.on('speech-started', () => setIsUserSpeaking(true));
voiceSocketRef.current.on('speech-stopped', () => setIsUserSpeaking(false));
```

---

## Testing Plan

### Test 1: Interruption
1. Start voice conversation
2. Let AI start responding
3. Interrupt mid-sentence by speaking
4. **Expected:** AI stops immediately, your voice is heard

### Test 2: Echo Cancellation
1. Turn up speakers volume
2. Start voice conversation
3. Let AI speak
4. **Expected:** AI doesn't respond to its own voice

### Test 3: Conversational Flow
1. Have natural back-and-forth conversation
2. Speak with normal pauses
3. **Expected:** AI responds quickly without awkward delays

### Test 4: Visual Feedback
1. Watch for speaking indicators
2. **Expected:** See "AI speaking..." when AI talks, "Listening..." when you speak

---

## Success Criteria

✅ User can interrupt AI mid-response
✅ AI doesn't hear its own voice
✅ Response latency < 500ms for short phrases
✅ No awkward pauses in conversation
✅ Visual feedback shows conversation state
✅ No feedback loops or echo

---

## Rollback Plan

If issues occur:
1. Revert VAD settings to original (`silence_duration_ms: 400`)
2. Remove interruption detection
3. Keep echo cancellation (it's always beneficial)

---

## Additional Improvements (Future)

1. **Conversation Context:** Track conversation history for better interruption handling
2. **Adaptive VAD:** Learn user's speaking patterns
3. **Background Noise Suppression:** Advanced noise filtering
4. **Multi-Person Detection:** Handle multiple speakers
5. **Emotion Detection:** Adapt to user's tone
6. **Language Detection:** Auto-detect language and adjust

---

**Status:** Ready to implement
**Estimated Time:** 2-3 hours
**Risk Level:** Low (can rollback easily)
**Testing Time:** 30 minutes
