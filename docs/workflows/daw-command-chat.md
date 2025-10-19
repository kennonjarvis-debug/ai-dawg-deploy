# Talk-to-AI DAW Control Workflow

## Overview

The Talk-to-AI DAW Control workflow enables natural language control of your DAW using GPT-4 powered conversation. Simply type or speak commands like "Create a new track called Vocals" or "Add reverb to track 2" and the AI will understand and execute them.

## Features

- **Natural Language Understanding**: Powered by GPT-4 for accurate intent detection
- **Conversational Interface**: Chat-style interaction with command history
- **Multi-Intent Support**: Handles track creation, BPM changes, effects, mixing, and more
- **Context Awareness**: Understands current project state
- **Quick Commands**: Pre-built suggestions for common tasks
- **Command History**: Track and review past commands
- **Voice Input**: (Coming soon) Hands-free DAW control

## How It Works

### 1. Intent Detection
When you send a command:
- GPT-4 analyzes the natural language
- Extracts intent (create_track, set_bpm, add_effect, etc.)
- Identifies parameters (track name, BPM value, effect type)
- Returns structured command with confidence score

### 2. Command Execution
The system executes detected commands:
- Validates parameters against current state
- Calls appropriate DAW API
- Returns result or error message
- Updates conversation history

### 3. Context Management
The AI maintains context:
- Remembers recent commands
- Understands references ("that track", "louder")
- Learns user preferences over time
- Provides relevant suggestions

## Supported Commands

### Track Management

**Create Track**
- "Create a new track called Vocals"
- "Add an audio track named Guitar"
- "Make a new MIDI track"

**Delete Track**
- "Delete track 3"
- "Remove the Vocals track"

### Tempo Control

**Set BPM**
- "Set BPM to 120"
- "Change the tempo to 140"
- "Make it faster" (increases by 10)

### Effects & Processing

**Add Effects**
- "Add reverb to track 2"
- "Put compression on the vocals"
- "Add delay to the guitar track"

### Music Generation

**Generate Beats**
- "Generate a hip-hop beat"
- "Create a trap beat in C minor"
- "Make a lo-fi beat at 85 BPM"

### Recording

**Start/Stop Recording**
- "Start recording on track 1"
- "Record 4 bars on the vocals track"
- "Stop recording"

### Mixing

**Adjust Levels**
- "Mix the vocals louder"
- "Turn down track 2"
- "Make the bass quieter"

**Pan Control**
- "Pan the guitar left"
- "Center the vocals"

### Playback

**Transport Control**
- "Play"
- "Stop"
- "Pause playback"

## Usage

### Via UI (Advanced Features Panel)

1. **Open DAW Command Chat**
   - Click "Advanced Features"
   - Expand "Talk-to-AI DAW Control" section

2. **Type a Command**
   - Click in the chat input
   - Type your command naturally
   - Press Enter or click Send

3. **Review Response**
   - AI confirms action taken
   - Shows result details
   - Displays in conversation

4. **Use Quick Commands** (for first-time users)
   - Click any suggested command
   - It fills the input
   - Edit or send as-is

5. **Clear History**
   - Click trash icon to reset conversation
   - Starts fresh context

### Via API

```typescript
// Send command
const response = await fetch('/api/v1/ai/daw-command', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'Create a new track called Vocals',
    userId: 'user-123',
    projectId: 'project-456',
    currentState: {
      tracks: [],
      bpm: 120,
      isPlaying: false,
      isRecording: false,
      currentTime: 0,
    },
  }),
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   action: 'create_track',
//   result: { trackId: 'track_789', name: 'Vocals' },
//   message: 'Created audio track "Vocals"'
// }
```

## API Reference

### POST /api/v1/ai/daw-command

Process a natural language DAW command.

**Request:**
```json
{
  "command": "Set BPM to 120",
  "userId": "user-123",
  "projectId": "project-456",
  "currentState": {
    "tracks": [
      {
        "id": "track-1",
        "name": "Vocals",
        "volume": 0.8,
        "pan": 0,
        "effects": []
      }
    ],
    "bpm": 100,
    "isPlaying": false,
    "isRecording": false,
    "currentTime": 0
  }
}
```

**Response:**
```json
{
  "success": true,
  "action": "set_bpm",
  "result": {
    "bpm": 120
  },
  "message": "Set BPM to 120"
}
```

### GET /api/v1/ai/daw-command/:userId/history

Get conversation history for user.

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "role": "user",
      "content": "Create a track"
    },
    {
      "role": "assistant",
      "content": "Created audio track \"Track 1\""
    }
  ]
}
```

### DELETE /api/v1/ai/daw-command/:userId/history

Clear conversation history.

## Command Examples

### Example 1: Creating a Beat
```
User: Generate a trap beat in C minor
AI: Generating trap beat in Cm... This may take a moment.
Result: { genre: 'trap', key: 'Cm', jobId: 'gen_123' }
```

### Example 2: Mixing Workflow
```
User: Create three tracks: Vocals, Beat, and Bass
AI: Created 3 tracks successfully
User: Add reverb to the vocals
AI: Added reverb to Vocals
User: Mix the vocals louder
AI: Adjusted Vocals volume up by 3dB
User: Pan the beat slightly right
AI: Panned Beat to the right
```

### Example 3: Recording Session
```
User: Set BPM to 140
AI: Set BPM to 140
User: Record 8 bars on track 1
AI: Recording 8 bars on track 1
User: Stop recording
AI: Stopping playback
```

## Technical Details

### Backend Service

**File:** `/src/backend/services/daw-command-service.ts`

Key features:
- GPT-4o for intent detection
- Conversation history management
- Command parameter extraction
- DAW state awareness
- Error handling and validation

### Frontend Component

**File:** `/src/ui/components/DAWCommandChatWidget.tsx`

Features:
- Chat bubble interface
- Message history display
- Quick command suggestions
- Real-time typing indicator
- Voice input button (UI ready)

### Intent Classification

The system recognizes these intents:
- `create_track`: Create new audio/MIDI track
- `set_bpm`: Change project tempo
- `add_effect`: Add effect to track
- `generate_beat`: Generate music
- `record`: Start/stop recording
- `mix`: Adjust levels and pan
- `play`: Control playback
- `stop`: Stop playback

### GPT-4 Prompt Engineering

The system prompt includes:
- Current DAW state (BPM, tracks, etc.)
- Available commands and examples
- JSON response format
- Parameter extraction rules

## Best Practices

1. **Be Specific**
   - Good: "Create a track called Lead Vocals"
   - Bad: "Make a track"

2. **Use Track References**
   - By number: "Add reverb to track 2"
   - By name: "Mix the vocals louder"

3. **Include Context**
   - "Generate a hip-hop beat in C minor at 90 BPM"
   - More context = better results

4. **Check Results**
   - Review AI response
   - Verify action was correct
   - Undo if needed (via DAW)

5. **Build Conversations**
   - AI remembers recent commands
   - "Add reverb to that track"
   - "Make it louder"

## Advanced Features

### Conversation Context

The AI maintains context across commands:
```
User: Create a track called Drums
AI: Created track "Drums"
User: Add compression to it
AI: Added compression to Drums
User: Make it louder
AI: Adjusted Drums volume up by 3dB
```

### Ambiguity Resolution

When ambiguous, AI asks for clarification:
```
User: Add reverb
AI: Which track should I add reverb to?
User: The vocals
AI: Added reverb to Vocals
```

### Parameter Inference

AI infers missing parameters:
```
User: Generate a beat
AI: Generating trap beat in C... (uses defaults)
```

## Troubleshooting

**AI Doesn't Understand**
- Rephrase command more clearly
- Use specific terms (track numbers, exact names)
- Try quick command suggestions

**Wrong Action Executed**
- Check current DAW state
- Provide more context in command
- Use explicit track references

**Slow Response**
- GPT-4 API may be slow during peak times
- Typical response: 1-3 seconds
- Check internet connection

**Context Lost**
- History is per-user session
- Clear history if confused
- Restart with fresh context

## Integration with DAW

Commands integrate directly with:
- Track manager (create/delete tracks)
- Transport (play/stop/record)
- Mixer (levels, pan)
- Effect chains
- Music generation engine
- Project settings

## Security & Privacy

- Commands are scoped to user's project
- No persistent audio data sent to GPT-4
- Only command text and DAW state shared
- Conversation history stored locally
- Clear history removes all data

## Cost Considerations

- Uses GPT-4o API ($0.002 per request)
- Average command costs ~$0.01
- Budget alerts available
- Included in subscription plans

## Future Enhancements

- Voice input with speech-to-text
- Multi-step workflow automation
- Macro recording ("Save this as...")
- Visual command suggestions
- Keyboard shortcuts for commands
- AI-suggested next steps
- Smart preset recommendations
- Collaborative command sharing

## Example Workflows

### Workflow 1: Quick Beat Creation
```
1. "Set BPM to 120"
2. "Generate a trap beat in Cm"
3. "Create a track called Vocals"
4. "Start recording on vocals"
```

### Workflow 2: Mixing Session
```
1. "Mix the kick louder"
2. "Add compression to the snare"
3. "Pan the hi-hats slightly right"
4. "Add reverb to all the drums"
```

### Workflow 3: Effects Processing
```
1. "Add reverb to track 1"
2. "Add delay to track 2"
3. "Add compression to the vocals"
4. "Mix everything 3dB quieter"
```

## Command Cheat Sheet

| Command Type | Example |
|-------------|---------|
| Create Track | "Create a track called {name}" |
| Set BPM | "Set BPM to {number}" |
| Add Effect | "Add {effect} to track {number}" |
| Generate | "Generate a {genre} beat in {key}" |
| Record | "Record {bars} bars on track {number}" |
| Mix | "Mix {track} {louder/quieter}" |
| Play | "Play" / "Stop" |

---

**Pro Tip:** The more you use the chat, the better it gets at understanding your workflow and preferences!
