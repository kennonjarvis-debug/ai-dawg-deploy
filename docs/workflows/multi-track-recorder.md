# Multi-Track Simultaneous Recording Workflow

## Overview

The Multi-Track Recorder enables recording up to 8 audio tracks simultaneously with individual level controls, real-time monitoring, and auto-save functionality. Perfect for recording bands, multi-mic setups, or creating layered productions.

## Features

- **Simultaneous Recording**: Record up to 8 tracks at once
- **Individual Controls**: Separate level, pan, mute, and solo for each track
- **Real-Time Monitoring**: Live audio feedback during recording
- **Auto-Save**: Automatic saving every 30 seconds to prevent data loss
- **Arm/Disarm Tracks**: Choose which tracks to record
- **Session Management**: Pause, resume, and stop recording
- **Recording Metrics**: Track latency, buffer health, and data throughput
- **Export Capabilities**: Export all tracks as WAV, MP3, or FLAC

## How It Works

### 1. Session Creation
When you start the multi-track recorder:
- Recording session is created with unique ID
- Audio buffers initialized for each track
- Metrics tracking begins
- Auto-save timer starts

### 2. Track Configuration
Each track has:
- **Armed Status**: Enable/disable recording on this track
- **Level Control**: 0-100% input gain
- **Pan Control**: Left-Right stereo positioning
- **Mute/Solo**: Monitor control during recording

### 3. Audio Streaming
During recording:
- WebSocket streams audio chunks from each track
- Buffers store incoming audio data
- Metrics track latency and throughput
- Auto-save periodically flushes to disk

### 4. Session Export
After recording:
- Raw audio converted to chosen format
- Individual track files generated
- Session metadata saved
- Metrics report created

## Usage

### Via UI (Advanced Features Panel)

1. **Open Multi-Track Recorder**
   - Click "Advanced Features"
   - Expand "Multi-Track Recorder" section

2. **Configure Tracks**
   - Default: 4 tracks (first 2 armed)
   - Click "+ Add Track" for more (max 8)
   - Set track names
   - Arm desired tracks (red circle button)

3. **Adjust Levels**
   - Use level sliders for input gain
   - Use pan sliders for stereo position
   - M = Mute, S = Solo

4. **Start Recording**
   - Click red "Record" button
   - Timer starts counting
   - Armed tracks show pulsing indicator

5. **During Recording**
   - Monitor levels in real-time
   - Click "Pause" to temporarily stop
   - Click "Resume" to continue
   - Auto-save happens every 30s

6. **Stop Recording**
   - Click "Stop" button
   - View recording metrics
   - Click "Export Session" for files

### Via API

#### Create Session
```typescript
const session = await fetch('/api/v1/ai/multitrack/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'my-project',
    userId: 'user-123',
    tracks: [
      { name: 'Vocals', armed: true },
      { name: 'Guitar', armed: true },
      { name: 'Bass', armed: true },
    ],
  }),
});

const { session } = await session.json();
const sessionId = session.sessionId;
```

#### Start Recording
```typescript
await fetch(`/api/v1/ai/multitrack/session/${sessionId}/start`, {
  method: 'POST',
});
```

#### Update Track
```typescript
await fetch(`/api/v1/ai/multitrack/session/${sessionId}/track/track_1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    level: 0.7,
    pan: -0.2, // Slightly left
    muted: false,
  }),
});
```

#### Stop Recording
```typescript
const result = await fetch(`/api/v1/ai/multitrack/session/${sessionId}/stop`, {
  method: 'POST',
});

const { metrics } = await result.json();
console.log('Recorded tracks:', metrics.recordedTracks);
console.log('Duration:', metrics.totalDuration);
```

#### Export Session
```typescript
const files = await fetch(`/api/v1/ai/multitrack/session/${sessionId}/export`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ format: 'wav' }),
});

const { files } = await files.json();
// files = { track_1: '/path/to/track1.wav', track_2: '/path/to/track2.wav' }
```

## API Reference

### POST /api/v1/ai/multitrack/session
Create a new recording session.

**Request:**
```json
{
  "projectId": "string",
  "userId": "string",
  "tracks": [
    {
      "name": "Track 1",
      "level": 0.8,
      "pan": 0,
      "armed": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "sessionId": "session_123",
    "projectId": "my-project",
    "userId": "user-123",
    "tracks": [...],
    "sampleRate": 48000,
    "bufferSize": 2048,
    "isRecording": false
  }
}
```

### POST /api/v1/ai/multitrack/session/:sessionId/start
Start recording on session.

### POST /api/v1/ai/multitrack/session/:sessionId/stop
Stop recording and get metrics.

**Response:**
```json
{
  "success": true,
  "metrics": {
    "sessionId": "session_123",
    "recordedTracks": 3,
    "totalDuration": 45000,
    "averageLatency": 12.5,
    "bufferUnderruns": 0,
    "dataReceived": 15728640
  }
}
```

### PUT /api/v1/ai/multitrack/session/:sessionId/track/:trackId
Update track configuration.

### GET /api/v1/ai/multitrack/session/:sessionId
Get current session state.

### POST /api/v1/ai/multitrack/session/:sessionId/export
Export session to audio files.

## Technical Details

### Backend Service

**File:** `/src/backend/services/multi-track-recorder-service.ts`

Key features:
- EventEmitter for real-time updates
- WebSocket audio streaming support
- Auto-save with configurable interval
- Buffer management for up to 8 tracks
- Metrics tracking for performance monitoring

### Frontend Component

**File:** `/src/ui/components/MultiTrackRecorderWidget.tsx`

Features:
- Real-time recording timer
- Individual track controls
- Visual level meters
- Recording state management
- Metrics display

### WebSocket Integration

Audio chunks are streamed via WebSocket:
```typescript
interface AudioChunk {
  trackId: string;
  data: Buffer;
  timestamp: number;
  sampleRate: number;
}
```

## Best Practices

1. **Pre-Recording Setup**
   - Test input levels before recording
   - Arm only tracks you need
   - Set appropriate buffer size for your system

2. **During Recording**
   - Monitor levels to avoid clipping
   - Use solo to check individual tracks
   - Keep an eye on latency metrics

3. **Track Management**
   - Use descriptive track names
   - Pan tracks for stereo separation
   - Mute tracks not being used

4. **System Performance**
   - Close unnecessary applications
   - Use wired connections (not Bluetooth)
   - Monitor CPU usage

## Recording Metrics Explained

- **Recorded Tracks**: Number of armed tracks that recorded data
- **Total Duration**: Length of recording in milliseconds
- **Average Latency**: Mean delay between audio input and processing
- **Buffer Underruns**: Number of times buffer was empty (should be 0)
- **Data Received**: Total audio data in bytes

## Auto-Save Behavior

- Saves every 30 seconds during recording
- Creates session directory in `/tmp/multitrack/`
- Stores raw audio and metadata
- No data loss if crash occurs
- Final save on stop

## Export Formats

- **WAV**: Uncompressed, highest quality (default)
- **MP3**: Compressed, smaller files
- **FLAC**: Lossless compression

## Troubleshooting

**High Latency**
- Reduce buffer size
- Close other applications
- Use direct audio interface connection

**Buffer Underruns**
- Increase buffer size
- Reduce number of armed tracks
- Upgrade system RAM

**Audio Dropouts**
- Check system resources
- Verify audio interface drivers
- Reduce sample rate

**Tracks Not Recording**
- Verify track is armed (red circle)
- Check input source is selected
- Test audio interface in system settings

## Integration with DAW

Recorded tracks can be:
- Automatically added to project
- Exported as stems for mixing
- Used in arrangement
- Sent to other workflows (effects, mastering, etc.)

## Future Enhancements

- Visual waveform during recording
- Input source selection per track
- Real-time effects processing
- Punch-in/punch-out recording
- Loop recording mode
- MIDI sync support
- Cloud storage integration
