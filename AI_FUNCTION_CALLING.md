# AI Function Calling - Implementation Guide

**Status:** ✅ Complete (Stage 4.4)
**Date:** 2025-10-02
**Instance:** 3 (AI Conductor)

---

## Overview

DAWG AI now supports **AI function calling** - Claude can directly control DAW actions through natural language commands. Users can say "Set BPM to 140" or "Start recording on Vocals 1" and Claude will execute the action using tools.

## Architecture

### 1. Tool Definitions (`/lib/ai/tools.ts`)

Defines 13 DAW control tools for Claude API:

| Tool | Action | Parameters |
|------|--------|------------|
| `start_recording` | Start recording on armed track | `trackId?: string` |
| `stop_recording` | Stop recording | - |
| `start_playback` | Play all tracks | - |
| `stop_playback` | Stop playback | - |
| `set_bpm` | Set tempo | `bpm: number` |
| `adjust_volume` | Set track volume | `trackId?: string`, `volume: number` |
| `adjust_pan` | Set track panning | `trackId?: string`, `pan: number` |
| `toggle_mute` | Mute/unmute track | `trackId?: string` |
| `toggle_solo` | Solo/unsolo track | `trackId?: string` |
| `arm_track` | Arm for recording | `trackId?: string` |
| `create_track` | Create new track | `name?: string` |
| `rename_track` | Rename track | `trackId?: string`, `name: string` |
| `delete_track` | Delete track | `trackId?: string` |

### 2. Action Handlers (`/lib/ai/actions.ts`)

Client-side execution engine:

```typescript
import { executeAction } from '@/lib/ai/actions';

const result = await executeAction('set_bpm', { bpm: 140 });
// { success: true, message: "Tempo set to 140 BPM", data: { bpm: 140 } }
```

**Features:**
- Interacts with Zustand stores (`useTrackStore`, `useTransport`)
- Validates parameters (e.g., BPM 20-300, volume 0-100)
- Returns structured results with success/error messages
- Handles edge cases (no active track, track not found, etc.)

### 3. API Integration (`/app/api/chat/route.ts`)

Updated chat endpoint to support tools:

**Request:**
```typescript
{
  messages: [...],
  enableTools: true,  // Enable function calling
  projectContext: {
    tracks: [
      {
        id: "track-1",
        name: "Vocals 1",
        type: "audio",
        recordArm: true,
        solo: false,
        mute: false
      }
    ]
  }
}
```

**Streaming Response:**
```
data: {"type":"tool_use","id":"toolu_123","name":"set_bpm"}
data: {"type":"tool_input","partial_json":"{\"bpm\":140}"}
data: {"text":"I've set the tempo to 140 BPM."}
data: [DONE]
```

**Non-Streaming Response:**
```json
{
  "message": "I've set the tempo to 140 BPM.",
  "toolUses": [
    {
      "id": "toolu_123",
      "name": "set_bpm",
      "input": { "bpm": 140 }
    }
  ]
}
```

## Frontend Integration (Instance 1)

### Step 1: Import Action Handler

```typescript
import { executeAction } from '@/lib/ai/actions';
```

### Step 2: Update API Request

```typescript
// In ChatPanel widget
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages,
    stream: true,
    enableTools: true,  // Enable function calling
    projectContext: {
      trackCount: tracks.length,
      currentTrack: activeTrack?.name,
      tracks: tracks.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        recordArm: t.recordArm,
        solo: t.solo,
        mute: t.mute,
      }))
    }
  })
});
```

### Step 3: Handle Tool Use Events

```typescript
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let currentTool: { id: string; name: string; input: string } | null = null;

while (true) {
  const { done, value } = await reader!.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);

        if (parsed.type === 'tool_use') {
          // Tool called
          currentTool = {
            id: parsed.id,
            name: parsed.name,
            input: ''
          };
        } else if (parsed.type === 'tool_input') {
          // Accumulate tool input
          if (currentTool) {
            currentTool.input += parsed.partial_json;
          }
        } else if (parsed.text) {
          // Check if we just finished a tool call
          if (currentTool && currentTool.input) {
            const toolInput = JSON.parse(currentTool.input);
            const result = await executeAction(currentTool.name, toolInput);

            if (result.success) {
              console.log('✅ Action executed:', result.message);
              // Show success indicator in UI
            } else {
              console.error('❌ Action failed:', result.message);
              // Show error message in UI
            }

            currentTool = null;
          }

          // Display AI's text response
          appendMessage(parsed.text);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
}
```

### Step 4: UI Enhancements (Optional)

**Action Indicators:**
```typescript
// Show when AI is executing an action
if (parsed.type === 'tool_use') {
  setIsExecutingAction(true);
  setCurrentAction(parsed.name);
}

// Hide after completion
if (result.success) {
  setIsExecutingAction(false);
  showNotification(`✓ ${result.message}`);
}
```

**Action History:**
```typescript
// Track executed actions
const [actionHistory, setActionHistory] = useState<ActionResult[]>([]);

if (result.success) {
  setActionHistory(prev => [...prev, result]);
}
```

## Testing

### Manual Testing

1. **Set BPM:**
   - Say: "Set the BPM to 140"
   - Claude calls `set_bpm` with `{ bpm: 140 }`

2. **Start Recording:**
   - Say: "Start recording"
   - Claude calls `start_recording` on active track

3. **Multiple Actions:**
   - Say: "Set BPM to 100, mute Harmony, and pan Vocals to the left"
   - Claude calls: `set_bpm`, `toggle_mute`, `adjust_pan`

### Automated Testing

```bash
./test-function-calling.sh
```

**Note:** Requires `ANTHROPIC_API_KEY` in `.env.local`

## How It Works

1. **User sends message:** "Set the BPM to 140"

2. **API receives request:**
   - Includes `enableTools: true`
   - Passes project context with track details

3. **Claude analyzes request:**
   - Recognizes intent to change tempo
   - Decides to use `set_bpm` tool
   - Generates tool call: `{ name: "set_bpm", input: { bpm: 140 } }`

4. **API streams response:**
   - Sends tool use event: `{"type":"tool_use","name":"set_bpm"}`
   - Sends tool input: `{"type":"tool_input","partial_json":"{\"bpm\":140}"}`
   - Sends confirmation: `{"text":"I've set the tempo to 140 BPM."}`

5. **Frontend executes action:**
   - Detects tool use event
   - Calls `executeAction('set_bpm', { bpm: 140 })`
   - Updates Zustand store via `useTransport.setBPM(140)`
   - Shows success message to user

6. **User sees result:**
   - AI says: "I've set the tempo to 140 BPM."
   - BPM updates in transport controls
   - ✓ Action indicator shows success

## Edge Cases Handled

1. **No active track:**
   - Tools requiring a track fail gracefully
   - AI receives error and explains to user

2. **Invalid parameters:**
   - BPM must be 20-300
   - Volume must be 0-100
   - Pan must be -50 to +50

3. **Multiple tracks with same name:**
   - Uses track ID for precision
   - Falls back to active track if ID not provided

4. **Track not armed:**
   - `start_recording` auto-arms track before recording

## Future Enhancements

**Stage 9.3 - Real-time AI Feedback:**
- Add tools for pitch analysis
- Tools for effect suggestions based on audio

**Stage 13 - Advanced AI:**
- `generate_backing_track` tool
- `create_harmony` tool
- `apply_mastering` tool

## Files Changed

- ✅ `/lib/ai/tools.ts` - Tool definitions (NEW)
- ✅ `/lib/ai/actions.ts` - Action handlers (NEW)
- ✅ `/app/api/chat/route.ts` - Added tool support
- ✅ `/API.md` - Updated documentation
- ✅ `/test-function-calling.sh` - Test suite (NEW)

## Integration Checklist for Instance 1

- [ ] Import `executeAction` in ChatPanel widget
- [ ] Pass `enableTools: true` in API request
- [ ] Include full track context in `projectContext`
- [ ] Handle `tool_use` events in streaming response
- [ ] Execute actions with `executeAction()`
- [ ] Show success/error messages to user
- [ ] (Optional) Add loading indicators during action execution
- [ ] (Optional) Display action history in UI

---

**Questions?** See `API.md` for full documentation or ask Instance 3 (AI Conductor).
