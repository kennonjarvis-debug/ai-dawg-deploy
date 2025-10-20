# Voice Freestyle Commander Integration Guide

Complete integration guide for voice-controlled freestyle recording in DAWG AI.

## Table of Contents

1. [Overview](#overview)
2. [GPT-4 Intent Detection Prompt](#gpt-4-intent-detection-prompt)
3. [Integration with FreestyleOrchestrator](#integration-with-freestyleorchestrator)
4. [Voice Response Templates](#voice-response-templates)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)

---

## Overview

The Voice Freestyle Commander extends the base `VoiceTestCommander` to provide natural language voice control for music production freestyle workflows.

**Pipeline:**
```
User Voice → Whisper → Text → GPT-4 Intent Detection → FreestyleOrchestrator → TTS Response
```

**Supported Commands:**
- **Recording**: "record me freestyle", "capture this melody", "let me hum something"
- **Beat Creation**: "create a trap beat", "make a hip-hop beat at 90 BPM"
- **Control**: "stop recording", "playback", "that's it"
- **Editing**: "fix the lyrics", "show me the melody", "enhance lyrics"

---

## GPT-4 Intent Detection Prompt

The system uses GPT-4 to detect user intent from natural language commands.

### System Prompt

```
You are a voice command interpreter for a music production DAW's freestyle mode.

Your job is to detect the user's intent and extract musical parameters from their natural language command.

INTENTS:

1. START_FREESTYLE_RECORDING
   - User wants to record vocals, melody, or freestyle idea
   - Extract: beatStyle (trap, hip-hop, boom-bap, pop, lo-fi, etc.), targetBPM, targetKey, mood
   - Examples: "record me freestyle", "capture this melody", "let me hum something"

2. CREATE_BEAT
   - User wants to create a backing track first before recording
   - Extract: beatStyle, targetBPM, targetKey, mood
   - Examples: "create a trap beat", "make a hip-hop beat at 90 BPM", "give me a dark boom-bap beat"

3. LOAD_BEAT
   - User wants to load an existing beat from library
   - Extract: beatStyle, genre
   - Examples: "load a beat", "give me a beat from library"

4. STOP_RECORDING
   - User wants to stop the current recording session
   - No parameters needed
   - Examples: "stop recording", "that's it", "done", "finish"

5. PLAYBACK_RECORDING
   - User wants to hear their recording
   - Examples: "playback", "play it back", "let me hear it"

6. FIX_LYRICS / ENHANCE_LYRICS
   - User wants AI to enhance transcribed lyrics
   - Extract: theme, mood, genre for context
   - Examples: "fix the lyrics", "make the lyrics better", "enhance lyrics"

7. SHOW_MELODY / OPEN_PIANO_ROLL
   - User wants to see extracted MIDI notes in piano roll
   - Examples: "show me the melody", "see the notes", "view melody"

PARAMETER EXTRACTION:

- beatStyle: Extract genre/style keywords (trap, hip-hop, boom-bap, pop, lo-fi, rock, jazz, etc.)
- targetBPM: Extract tempo if mentioned (60-180 typical range)
  - "slow" = 70-90, "medium" = 90-120, "fast" = 120-150, "very fast" = 150-180
- targetKey: Extract musical key if mentioned (C, Am, F#m, etc.)
- mood: Extract mood descriptors (energetic, chill, dark, happy, sad, aggressive, mellow)
- recordingMode: vocal, melody, or idea (default: vocal)
- genre: For lyrical context
- theme: Lyrical theme if mentioned

RESPONSE FORMAT:

Return JSON with this exact structure:
{
  "action": "START_FREESTYLE_RECORDING",
  "parameters": {
    "beatStyle": "trap",
    "targetBPM": 140,
    "targetKey": "Am",
    "mood": "dark"
  },
  "confidence": 0.95
}
```

### Example Intent Detection

**Input:** "record me freestyle with a trap beat"

**GPT-4 Response:**
```json
{
  "action": "START_FREESTYLE_RECORDING",
  "parameters": {
    "beatStyle": "trap",
    "targetBPM": 140,
    "mood": "energetic"
  },
  "confidence": 0.95
}
```

**Input:** "create a chill lo-fi beat at 80 BPM in C major"

**GPT-4 Response:**
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

**Input:** "stop recording"

**GPT-4 Response:**
```json
{
  "action": "STOP_RECORDING",
  "parameters": {},
  "confidence": 1.0
}
```

---

## Integration with FreestyleOrchestrator

The Voice Freestyle Commander integrates with a `FreestyleOrchestrator` service that manages the complete freestyle workflow.

### Example Integration

```typescript
import { voiceFreestyleCommander, FreestyleIntent } from './voice-freestyle-commands';
import { FreestyleOrchestrator } from './freestyle-orchestrator';

// Initialize orchestrator
const orchestrator = new FreestyleOrchestrator();

async function handleFreestyleVoiceCommand(
  audioBuffer: Buffer,
  userId: string,
  projectId: string
) {
  // Process voice command
  const result = await voiceFreestyleCommander.processFreestyleVoiceCommand(
    audioBuffer,
    userId,
    undefined, // sessionId (auto-generated)
    projectId
  );

  if (!result.success) {
    console.error('Command failed:', result.error);
    return result;
  }

  // Handle specific actions with orchestrator
  const session = result.session;
  if (!session) return result;

  switch (result.session?.recordingActive) {
    case true:
      // Recording started - begin audio capture
      await orchestrator.startRecording({
        sessionId: session.sessionId,
        userId: session.userId,
        projectId: session.projectId,
        beatUrl: session.beatUrl,
        beatBPM: session.beatBPM,
        beatKey: session.beatKey,
      });
      break;

    case false:
      // Recording stopped - process audio
      const recordingBuffer = voiceFreestyleCommander.getRecordingBuffer(session.sessionId);
      if (recordingBuffer) {
        await orchestrator.processRecording({
          sessionId: session.sessionId,
          audioBuffer: recordingBuffer,
        });
      }
      break;
  }

  return result;
}
```

### FreestyleOrchestrator Interface (Expected)

```typescript
interface FreestyleOrchestrator {
  /**
   * Start a new freestyle recording session
   */
  startRecording(config: {
    sessionId: string;
    userId: string;
    projectId: string;
    beatUrl?: string;
    beatBPM?: number;
    beatKey?: string;
  }): Promise<void>;

  /**
   * Stop recording and process audio
   */
  processRecording(config: {
    sessionId: string;
    audioBuffer: Buffer;
  }): Promise<{
    transcription?: string;
    melody?: MelodyData;
    lyrics?: string;
  }>;

  /**
   * Enhance lyrics with AI
   */
  enhanceLyrics(config: {
    sessionId: string;
    lyrics: string;
    mood?: string;
    theme?: string;
  }): Promise<string>;

  /**
   * Extract melody and convert to MIDI
   */
  extractMelody(config: {
    sessionId: string;
    audioBuffer: Buffer;
  }): Promise<MelodyData>;
}
```

---

## Voice Response Templates

The system provides natural, context-aware voice responses for each command type.

### Recording Responses

```typescript
// Starting recording WITH auto-created beat
"Got it! Creating trap beat at 140 BPM... Recording in 3... 2... 1... Go!"

// Starting recording WITHOUT beat
"Ready to record your freestyle. Recording in 3... 2... 1... Go!"

// Loading existing beat
"Loading hip-hop beat from library... Get ready!"
```

### Beat Creation Responses

```typescript
// Creating beat
"Creating trap beat at 140 BPM in A minor... This will take about 15 seconds."

// Beat ready
"Your trap beat is ready! Say 'record me' to start freestyling."
```

### Recording Control Responses

```typescript
// Stopping recording
"Nice! Processing your freestyle... Extracting melody and lyrics..."

// With duration
"Got it! Recorded 45 seconds. Processing now..."
```

### Playback Responses

```typescript
// Basic playback
"Playing back your recording..."

// With melody info
"Playing back your recording. I detected 24 notes in your melody."
```

### Lyrics Processing Responses

```typescript
// Analyzing
"Analyzing your lyrics... Running AI enhancement..."

// Complete
"Enhanced 8 lines of lyrics. Ready to generate vocals."
```

### Melody Extraction Responses

```typescript
// Processing
"Extracting melody from your recording... This will take a moment."

// Complete
"Opening piano roll with your melody. 24 notes extracted in A minor."
```

### Error Responses

```typescript
// No active recording
"I don't have an active recording. Say 'record me freestyle' to start."

// Already recording
"Recording is already in progress. Say 'stop recording' when you're done."

// Beat generation failed
"I had trouble creating the beat. Let's try recording without a beat first."

// General error
"Something went wrong: [error message]. Let's try again."
```

---

## Usage Examples

### Example 1: Simple Freestyle Recording

**User says:** "record me freestyle"

**System:**
1. Transcribes: "record me freestyle"
2. Detects intent: `START_FREESTYLE_RECORDING`
3. Responds: "Ready to record your freestyle. Recording in 3... 2... 1... Go!"
4. Starts audio recording

**User records for 30 seconds**

**User says:** "stop recording"

**System:**
1. Transcribes: "stop recording"
2. Detects intent: `STOP_RECORDING`
3. Responds: "Got it! Recorded 30 seconds. Processing now..."
4. Processes audio, extracts melody and lyrics

### Example 2: Recording with Auto-Beat Creation

**User says:** "record me freestyle with a trap beat"

**System:**
1. Transcribes: "record me freestyle with a trap beat"
2. Detects intent:
   ```json
   {
     "action": "START_FREESTYLE_RECORDING",
     "parameters": {
       "beatStyle": "trap",
       "targetBPM": 140
     }
   }
   ```
3. Responds: "Creating trap beat at 140 BPM... This will take about 15 seconds."
4. Generates beat using MusicGen
5. Responds: "Got it! Creating trap beat... Recording in 3... 2... 1... Go!"
6. Starts recording with beat playing

### Example 3: Create Beat First, Then Record

**User says:** "create a chill lo-fi beat at 80 BPM"

**System:**
1. Detects: `CREATE_BEAT` with `beatStyle: "lo-fi"`, `targetBPM: 80`
2. Responds: "Creating lo-fi beat at 80 BPM in A minor... This will take about 15 seconds."
3. Generates beat
4. Responds: "Your lo-fi beat is ready! Say 'record me' to start freestyling."

**User says:** "record me"

**System:**
1. Detects: `START_FREESTYLE_RECORDING`
2. Uses previously created beat
3. Responds: "Recording in 3... 2... 1... Go!"

### Example 4: Post-Recording Editing

**User records a freestyle, then says:** "show me the melody"

**System:**
1. Detects: `SHOW_MELODY`
2. Responds: "Extracting melody from your recording... This will take a moment."
3. Extracts MIDI notes from recording
4. Responds: "Opening piano roll with your melody. 24 notes extracted in A minor."
5. Opens piano roll editor with extracted MIDI

**User says:** "fix the lyrics"

**System:**
1. Detects: `FIX_LYRICS`
2. Responds: "Analyzing your lyrics... Running AI enhancement..."
3. Enhances lyrics with GPT-4
4. Responds: "Enhanced 8 lines of lyrics. Ready to generate vocals."

---

## API Reference

### Main Entry Point

```typescript
async processFreestyleVoiceCommand(
  audioBuffer: Buffer,
  userId: string,
  sessionId?: string,
  projectId?: string
): Promise<FreestyleCommandResult>
```

**Parameters:**
- `audioBuffer`: Raw audio from microphone
- `userId`: User ID for session management
- `sessionId` (optional): Session ID to resume existing session
- `projectId` (optional): Project ID for context

**Returns:** `FreestyleCommandResult`
```typescript
interface FreestyleCommandResult {
  success: boolean;
  message: string;
  speechResponse: string;
  session?: FreestyleSession;
  recording?: RecordingResult;
  beat?: MusicGenResponse;
  vocals?: MelodyToVocalsResponse;
  error?: string;
}
```

### Intent Detection

```typescript
async detectFreestyleIntent(voiceCommand: string): Promise<FreestyleIntent>
```

**Parameters:**
- `voiceCommand`: Transcribed text from voice

**Returns:** `FreestyleIntent`
```typescript
interface FreestyleIntent {
  action: FreestyleAction;
  parameters: {
    beatStyle?: string;
    recordingMode?: string;
    targetKey?: string;
    targetBPM?: number;
    mood?: string;
    genre?: string;
    theme?: string;
  };
  confidence: number;
  rawCommand: string;
}
```

### Beat Creation

```typescript
async createBeatFromVoice(
  beatStyle: string,
  targetBPM?: number,
  targetKey?: string,
  userId?: string
): Promise<MusicGenResponse>
```

**Parameters:**
- `beatStyle`: Genre/style (trap, hip-hop, lo-fi, etc.)
- `targetBPM` (optional): Tempo in BPM (defaults based on style)
- `targetKey` (optional): Musical key (default: Am)
- `userId` (optional): For metadata tracking

**Returns:** `MusicGenResponse` (from MusicGen service)

### Session Management

```typescript
getFreestyleSession(sessionId: string): FreestyleSession | undefined
```

```typescript
storeRecordingBuffer(sessionId: string, buffer: Buffer): void
```

```typescript
getRecordingBuffer(sessionId: string): Buffer | undefined
```

```typescript
clearSession(sessionId: string): void
```

### Events

The commander emits events for monitoring:

```typescript
// Transcription complete
voiceFreestyleCommander.on('freestyle-transcription', (data) => {
  console.log('Transcribed:', data.text);
});

// Intent detected
voiceFreestyleCommander.on('freestyle-intent-detected', (data) => {
  console.log('Intent:', data.intent);
});

// Command complete
voiceFreestyleCommander.on('freestyle-command-complete', (data) => {
  console.log('Result:', data.result);
});
```

---

## Default BPM by Style

| Style | Default BPM |
|-------|-------------|
| Trap | 140 |
| Hip-Hop | 90 |
| Boom-Bap | 90 |
| Lo-Fi | 80 |
| Pop | 120 |
| Rock | 120 |
| Jazz | 120 |
| Electronic | 128 |
| House | 128 |
| Techno | 130 |
| DnB | 174 |
| Dubstep | 140 |

---

## Testing

### Unit Test Example

```typescript
import { voiceFreestyleCommander } from './voice-freestyle-commands';

describe('Voice Freestyle Commander', () => {
  it('should detect START_FREESTYLE_RECORDING intent', async () => {
    const intent = await voiceFreestyleCommander.detectFreestyleIntent(
      'record me freestyle with a trap beat'
    );

    expect(intent.action).toBe('START_FREESTYLE_RECORDING');
    expect(intent.parameters.beatStyle).toBe('trap');
    expect(intent.confidence).toBeGreaterThan(0.8);
  });

  it('should create beat from voice parameters', async () => {
    const result = await voiceFreestyleCommander.createBeatFromVoice(
      'trap',
      140,
      'Am',
      'test-user'
    );

    expect(result.success).toBe(true);
    expect(result.audio_url).toBeDefined();
  });
});
```

---

## Security & Rate Limiting

Voice freestyle commands inherit rate limiting from the base `VoiceTestCommander`:
- **10 commands per minute** per user
- **Admin verification** for destructive operations
- **Audit logging** of all voice commands

---

## Cost Considerations

**Whisper API:** ~$0.006 per minute of audio
**GPT-4 Intent Detection:** ~$0.01 per command
**MusicGen (via Replicate):** ~$0.10 per beat generation (30s)
**TTS Response:** ~$0.015 per 1000 characters

**Total cost per freestyle session (typical):**
- Voice command recognition: $0.02
- Beat generation: $0.10
- TTS responses (3-4): $0.03
- **Total: ~$0.15 per session**

Caching reduces costs significantly for repeated beat styles.

---

## Next Steps

1. Implement `FreestyleOrchestrator` service
2. Add melody extraction using `basic-pitch` or `crepe`
3. Integrate with project timeline for MIDI insertion
4. Add real-time recording feedback
5. Implement collaborative freestyle sessions
6. Add voice mixing commands ("add reverb", "increase volume")

---

**Questions?** See the main codebase at `/src/backend/services/voice-freestyle-commands.ts`
