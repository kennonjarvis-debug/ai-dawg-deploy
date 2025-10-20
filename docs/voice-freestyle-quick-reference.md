# Voice Freestyle Commander - Quick Reference

## File Locations

- **Main Service**: `/src/backend/services/voice-freestyle-commands.ts` (874 lines)
- **Integration Guide**: `/docs/voice-freestyle-integration.md`
- **Examples**: `/examples/voice-freestyle-example.ts`
- **Tests**: `/tests/backend/voice-freestyle-commands.test.ts`

---

## Quick Start

```typescript
import { voiceFreestyleCommander } from './src/backend/services/voice-freestyle-commands';

// Process voice command
const result = await voiceFreestyleCommander.processFreestyleVoiceCommand(
  audioBuffer,    // Raw audio from mic
  'user-123',     // User ID
  undefined,      // Session ID (auto-generated)
  'project-456'   // Project ID
);

console.log(result.speechResponse); // TTS response
```

---

## Supported Commands

### Recording Commands
- "record me freestyle"
- "start recording freestyle"
- "record my idea"
- "capture this melody"
- "let me hum something"
- "freestyle session"
- "record vocals"

### Beat Creation Commands
- "create a beat"
- "make a trap beat"
- "give me a hip-hop beat"
- "create instrumental"
- "create a lo-fi beat at 80 BPM"

### Control Commands
- "stop recording"
- "that's it"
- "done recording"
- "playback"
- "play it back"

### Editing Commands
- "fix the lyrics"
- "show me the melody"
- "open piano roll"
- "enhance the lyrics"

---

## Intent Detection Examples

### Example 1: Simple Recording
**Input:** "record me freestyle"

**GPT-4 Output:**
```json
{
  "action": "START_FREESTYLE_RECORDING",
  "parameters": {},
  "confidence": 0.95
}
```

**Response:** "Ready to record your freestyle. Recording in 3... 2... 1... Go!"

---

### Example 2: Recording with Beat
**Input:** "record me freestyle with a trap beat"

**GPT-4 Output:**
```json
{
  "action": "START_FREESTYLE_RECORDING",
  "parameters": {
    "beatStyle": "trap",
    "targetBPM": 140
  },
  "confidence": 0.95
}
```

**Response:** "Got it! Creating trap beat at 140 BPM... Recording in 3... 2... 1... Go!"

---

### Example 3: Complex Beat Creation
**Input:** "create a chill lo-fi beat at 80 BPM in C major"

**GPT-4 Output:**
```json
{
  "action": "CREATE_BEAT",
  "parameters": {
    "beatStyle": "lo-fi",
    "targetBPM": 80,
    "targetKey": "C",
    "mood": "chill"
  },
  "confidence": 0.98
}
```

**Response:** "Creating lo-fi beat at 80 BPM in C major... This will take about 15 seconds."

---

## Default BPM by Style

| Style | BPM |
|-------|-----|
| Trap | 140 |
| Hip-Hop | 90 |
| Boom-Bap | 90 |
| Lo-Fi | 80 |
| Pop | 120 |
| Rock | 120 |
| DnB | 174 |
| Dubstep | 140 |

---

## API Reference

### Process Voice Command
```typescript
async processFreestyleVoiceCommand(
  audioBuffer: Buffer,
  userId: string,
  sessionId?: string,
  projectId?: string
): Promise<FreestyleCommandResult>
```

### Detect Intent
```typescript
async detectFreestyleIntent(
  voiceCommand: string
): Promise<FreestyleIntent>
```

### Create Beat
```typescript
async createBeatFromVoice(
  beatStyle: string,
  targetBPM?: number,
  targetKey?: string,
  userId?: string
): Promise<MusicGenResponse>
```

### Handle Command
```typescript
async handleFreestyleCommand(
  intent: FreestyleIntent,
  sessionId: string,
  userId: string,
  projectId?: string
): Promise<FreestyleCommandResult>
```

---

## Response Types

### FreestyleCommandResult
```typescript
{
  success: boolean;
  message: string;
  speechResponse: string;  // For TTS
  session?: FreestyleSession;
  recording?: RecordingResult;
  beat?: MusicGenResponse;
  error?: string;
}
```

### FreestyleIntent
```typescript
{
  action: FreestyleAction;
  parameters: {
    beatStyle?: string;
    targetBPM?: number;
    targetKey?: string;
    mood?: string;
  };
  confidence: number;
}
```

---

## GPT-4 Intent Detection Prompt (Simplified)

```
You are a voice command interpreter for a music production DAW's freestyle mode.

User said: "${voiceCommand}"

Detect the intent and extract parameters:

INTENTS:
- START_FREESTYLE_RECORDING: Record vocals/melody
- CREATE_BEAT: Create backing track
- STOP_RECORDING: Stop current recording
- PLAYBACK_RECORDING: Hear recording
- FIX_LYRICS: Enhance transcribed lyrics
- SHOW_MELODY: View MIDI in piano roll

Return JSON:
{
  "action": "START_FREESTYLE_RECORDING",
  "parameters": {
    "beatStyle": "trap",
    "targetBPM": 140
  },
  "confidence": 0.95
}
```

---

## Integration Pattern

```typescript
import { voiceFreestyleCommander } from './voice-freestyle-commands';
import { FreestyleOrchestrator } from './freestyle-orchestrator';

const orchestrator = new FreestyleOrchestrator();

// Process voice command
const result = await voiceFreestyleCommander.processFreestyleVoiceCommand(
  audioBuffer,
  userId,
  sessionId,
  projectId
);

// Handle with orchestrator
if (result.session?.recordingActive) {
  await orchestrator.startRecording({
    sessionId: result.session.sessionId,
    userId,
    beatUrl: result.session.beatUrl,
  });
}
```

---

## Voice Response Examples

| Scenario | Response |
|----------|----------|
| Start with beat | "Got it! Creating trap beat... Recording in 3... 2... 1... Go!" |
| Start without beat | "Ready to record your freestyle. Recording in 3... 2... 1... Go!" |
| Stop recording | "Nice! Processing your freestyle... Extracting melody and lyrics..." |
| Show melody | "Opening piano roll with your melody. 24 notes extracted in A minor." |
| Enhance lyrics | "Enhanced 8 lines of lyrics. Ready to generate vocals." |
| No recording | "I don't have an active recording. Say 'record me freestyle' to start." |

---

## Testing

Run tests:
```bash
npm test tests/backend/voice-freestyle-commands.test.ts
```

Run examples:
```bash
npm run examples:voice-freestyle
```

---

## Cost Per Session (Typical)

- **Whisper (voice to text)**: ~$0.02
- **GPT-4 (intent detection)**: ~$0.01
- **MusicGen (beat creation)**: ~$0.10
- **TTS (responses)**: ~$0.03

**Total: ~$0.15 per freestyle session**

---

## Events

Listen for events:

```typescript
voiceFreestyleCommander.on('freestyle-transcription', (data) => {
  console.log('Transcribed:', data.text);
});

voiceFreestyleCommander.on('freestyle-intent-detected', (data) => {
  console.log('Intent:', data.intent);
});

voiceFreestyleCommander.on('freestyle-command-complete', (data) => {
  console.log('Result:', data.result);
});
```

---

## Error Handling

Common errors and responses:

```typescript
// No active recording
ERROR_NO_RECORDING: "I don't have an active recording. Say 'record me freestyle' to start."

// Already recording
ERROR_ALREADY_RECORDING: "Recording is already in progress. Say 'stop recording' when you're done."

// Beat generation failed
ERROR_BEAT_GENERATION: "I had trouble creating the beat. Let's try recording without a beat first."

// General error
ERROR_GENERAL: "Something went wrong: [error]. Let's try again."
```

---

## Next Steps

1. Implement `FreestyleOrchestrator` service
2. Add real melody extraction (basic-pitch/crepe)
3. Integrate with project timeline
4. Add real-time recording feedback
5. Implement collaborative sessions

---

**Documentation**: See full integration guide at `/docs/voice-freestyle-integration.md`

**Examples**: See working examples at `/examples/voice-freestyle-example.ts`

**Tests**: See test suite at `/tests/backend/voice-freestyle-commands.test.ts`
