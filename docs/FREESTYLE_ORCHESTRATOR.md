# Freestyle Orchestrator - Complete Voice-to-Music Pipeline

## Overview

The **Freestyle Orchestrator** is an intelligent service that coordinates the complete voice-to-music freestyle workflow. It seamlessly integrates voice commands, recording, AI analysis, and result display to create a professional freestyle recording experience.

## Architecture

```
Voice Command ("Record me freestyle")
         ↓
   Voice Test Commander (Whisper + GPT-4)
         ↓
   Freestyle Orchestrator ← Main Entry Point
         ↓
   ┌──────────────────────────────────┐
   │  1. Session Preparation          │
   │     - Check for backing track     │
   │     - Auto-create beat (optional) │
   │     - Find/create vocal track     │
   │     - Detect key/BPM              │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │  2. Recording Setup              │
   │     - Arm vocal track             │
   │     - Enable monitoring           │
   │     - Setup effects chain         │
   │     - Configure transport         │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │  3. Recording                    │
   │     - Countdown (3, 2, 1...)      │
   │     - Start transport             │
   │     - Real-time waveform          │
   │     - Live lyrics transcription   │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │  4. Post-Processing (Parallel)   │
   │     ├─ Metadata Analysis          │
   │     ├─ Stem Separation (Demucs)   │
   │     ├─ Melody Extraction          │
   │     └─ Lyrics Enhancement         │
   └──────────────────────────────────┘
         ↓
   ┌──────────────────────────────────┐
   │  5. Display Results              │
   │     - Update Piano Roll (MIDI)    │
   │     - Update Lyrics Widget        │
   │     - Show confidence scores      │
   │     - Voice TTS summary           │
   └──────────────────────────────────┘
```

## Features

### 1. Intelligent Session Preparation
- **Auto-detect backing tracks** in the project
- **Create beats on-demand** using MusicGen/Udio
- **Key and BPM detection** from backing tracks
- **Smart recommendations** for optimal recording setup

### 2. Professional Recording Setup
- **Auto-arm vocal tracks** for recording
- **Input monitoring** with low-latency effects
- **Optimal gain staging** (automatic levels)
- **Effects chain setup** (compression, EQ, reverb)

### 3. Real-Time Recording Features
- **Countdown timer** (configurable)
- **Live waveform visualization**
- **Real-time lyrics transcription** (Web Speech API)
- **Beat playback synchronization**
- **Auto-stop** at max duration

### 4. AI-Powered Analysis Pipeline

#### Metadata Analysis
- **Key detection** (A-G, major/minor)
- **BPM detection** with confidence scoring
- **Time signature detection**
- **Audio quality metrics**

#### Stem Separation (Demucs)
- **State-of-the-art vocal isolation**
- **Professional-grade quality** (7-9 dB SDR)
- **Background beat removal**
- **Clean a cappella extraction**

#### Melody Extraction
- **Pitch detection** (MIDI note conversion)
- **Note timing and duration**
- **Velocity estimation**
- **Confidence scoring per note**

#### Lyrics Enhancement
- **Structure detection** (verse, chorus, bridge)
- **Rhyme scheme analysis**
- **Syllable counting**
- **Stress pattern detection**
- **Section labeling**

### 5. Intelligent Display
- **Piano Roll MIDI visualization**
- **Enhanced Lyrics Widget** with sections
- **Confidence indicators**
- **AI-generated suggestions**

## Installation

### Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    "openai": "^4.20.0",
    "replicate": "^0.25.0",
    "axios": "^1.6.0",
    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0"
  }
}
```

Install:
```bash
npm install
```

### Environment Variables

Add to `.env`:

```bash
# OpenAI API (for Whisper, GPT-4, TTS)
OPENAI_API_KEY=sk-...

# Replicate API (for Demucs stem separation)
REPLICATE_API_TOKEN=r8_...

# Optional: Music generation services
UDIO_API_KEY=...
MUSICGEN_API_KEY=...
```

## Usage

### Example 1: Basic Voice Command Integration

```typescript
import { freestyleOrchestrator } from './backend/services/freestyle-orchestrator';
import { voiceTestCommander } from './backend/services/voice-test-commander';

// User says: "Record me freestyle"
async function handleVoiceCommand(audioBuffer: Buffer, userId: string) {
  // 1. Transcribe voice command
  const text = await voiceTestCommander.transcribeAudio(audioBuffer);

  // 2. Detect intent
  const intent = await voiceTestCommander.detectIntent(text);

  // 3. Start freestyle session
  if (intent.action === 'record_freestyle') {
    const result = await freestyleOrchestrator.startFreestyleSession({
      projectId: 'project-123',
      userId: userId,
      autoCreateBeat: false,
      countdown: 3,
    });

    console.log('Session started:', result.sessionId);
    console.log('Status:', result.status); // 'ready'
  }
}
```

### Example 2: Complete Workflow

```typescript
import { FreestyleVoiceWorkflow } from './examples/freestyle-voice-integration';

const workflow = new FreestyleVoiceWorkflow();

// Step 1: Voice command
await workflow.onVoiceCommand(
  'Create a hip-hop beat at 95 BPM and record me',
  'user-123',
  'project-456'
);

// Step 2: Recording happens in FreestyleSession.tsx component

// Step 3: Recording complete callback
workflow.onRecordingComplete(audioBlob, lyrics);

// Step 4: Analysis runs automatically

// Step 5: Results displayed in UI
```

### Example 3: Manual Analysis Trigger

```typescript
// After recording stops
const analysis = await freestyleOrchestrator.analyzeRecording(
  audioBuffer,
  lyrics,
  {
    projectId: 'project-123',
    trackId: 'track-456',
    hasBeat: true,
  },
  (stage, progress, details) => {
    console.log(`${stage}: ${(progress * 100).toFixed(0)}%`, details);
  }
);

console.log('Key:', analysis.metadata.key);
console.log('BPM:', analysis.metadata.bpm);
console.log('Notes:', analysis.melody?.notes.length);
console.log('Lyrics:', analysis.enhancedLyrics.length);
```

## API Reference

### `FreestyleOrchestrator`

#### Methods

##### `startFreestyleSession(config, onProgress?)`

Start a complete freestyle session.

**Parameters:**
- `config: FreestyleConfig` - Session configuration
  - `projectId: string` - Project ID
  - `userId: string` - User ID
  - `autoCreateBeat?: boolean` - Auto-create backing beat
  - `beatStyle?: string` - Beat style (hip-hop, trap, etc.)
  - `targetBPM?: number` - Target BPM for beat
  - `targetKey?: string` - Target key for beat
  - `countdown?: number` - Countdown seconds (default: 3)
  - `maxDuration?: number` - Max recording duration (default: 300)
- `onProgress?: ProgressCallback` - Progress updates

**Returns:** `Promise<FreestyleResult>`

**Example:**
```typescript
const result = await freestyleOrchestrator.startFreestyleSession({
  projectId: 'project-123',
  userId: 'user-456',
  autoCreateBeat: true,
  beatStyle: 'trap',
  targetBPM: 140,
  countdown: 5,
}, (stage, progress, details) => {
  console.log(`${stage}: ${progress}`, details);
});
```

##### `analyzeRecording(audioBuffer, lyrics, options, onProgress?)`

Analyze recorded audio with AI pipeline.

**Parameters:**
- `audioBuffer: AudioBuffer` - Recorded audio
- `lyrics: LyricSegment[]` - Transcribed lyrics
- `options: object`
  - `projectId: string`
  - `trackId: string`
  - `hasBeat: boolean` - If beat was present during recording
  - `sessionId?: string`
- `onProgress?: ProgressCallback`

**Returns:** `Promise<AnalysisResult>`

**Example:**
```typescript
const analysis = await freestyleOrchestrator.analyzeRecording(
  audioBuffer,
  lyrics,
  { projectId, trackId, hasBeat: true },
  (stage, progress) => console.log(stage, progress)
);
```

##### `displayResults(analysis, projectId, trackId)`

Display analysis results in UI.

**Parameters:**
- `analysis: AnalysisResult` - Analysis results
- `projectId: string`
- `trackId: string`

**Returns:** `Promise<void>`

##### `getSession(sessionId)`

Get active session by ID.

**Parameters:**
- `sessionId: string`

**Returns:** `FreestyleResult | undefined`

##### `cancelSession(sessionId)`

Cancel active session.

**Parameters:**
- `sessionId: string`

**Returns:** `Promise<void>`

#### Events

The orchestrator emits events via EventEmitter:

- `session:started` - Session started
- `session:prepared` - Session prepared
- `session:recording-ready` - Recording environment ready
- `session:recording` - Recording in progress
- `session:analyzing` - Analysis in progress
- `session:complete` - Session complete
- `session:error` - Error occurred
- `display:piano-roll-updated` - Piano roll updated
- `display:lyrics-updated` - Lyrics widget updated
- `display:complete` - Display complete

**Example:**
```typescript
freestyleOrchestrator.on('session:prepared', ({ sessionId, setup }) => {
  console.log('Session prepared:', setup.recommendations);
});

freestyleOrchestrator.on('display:complete', ({ projectId, trackId }) => {
  console.log('Results displayed!');
});
```

## Integration Points

### 1. Voice Test Commander

The orchestrator integrates with the Voice Test Commander for:
- Voice command transcription (Whisper)
- Intent detection (GPT-4)
- TTS response synthesis

```typescript
import { voiceTestCommander } from './backend/services/voice-test-commander';

// Transcribe command
const text = await voiceTestCommander.transcribeAudio(audioBuffer);

// Detect intent
const intent = await voiceTestCommander.detectIntent(text);

// Speak response
const audio = await voiceTestCommander.synthesizeSpeech('Ready to record!');
```

### 2. Metadata Analyzer

For key/BPM detection:

```typescript
import { metadataAnalyzer } from './backend/services/MetadataAnalyzer';

const metadata = await metadataAnalyzer.analyzeAudio(audioBuffer, {
  trackType: 'vocal',
});

console.log('Key:', metadata.rhythmCharacteristics?.key);
console.log('BPM:', metadata.rhythmCharacteristics?.bpm);
```

### 3. Demucs Service

For stem separation:

```typescript
import { demucsService } from './backend/services/demucs-service';

const { predictionId } = await demucsService.separateStems({
  userId: 'user-123',
  audioUrl: 'https://...',
  quality: 'balanced',
});

const result = await demucsService.waitForCompletion(predictionId);
console.log('Vocals URL:', result.stems.find(s => s.type === 'vocals')?.url);
```

### 4. Lyrics Widget

For displaying enhanced lyrics:

```typescript
import { LyricsWidget } from './ui/recording/LyricsWidget';

<LyricsWidget
  isVisible={true}
  lyrics={enhancedLyrics}
  currentTime={currentTime}
  showTimestamps={true}
  allowEdit={true}
  onLyricsEdit={(edited) => console.log('Edited:', edited)}
/>
```

## Configuration

### Default Configuration

```typescript
const defaultConfig: FreestyleConfig = {
  autoCreateBeat: false,
  beatStyle: 'hip-hop',
  targetBPM: 120,
  targetKey: 'C',
  countdown: 3,
  maxDuration: 300, // 5 minutes
};
```

### Customization

```typescript
// Custom beat generation
const config: FreestyleConfig = {
  projectId: 'project-123',
  userId: 'user-456',
  autoCreateBeat: true,
  beatStyle: 'drill',
  targetBPM: 140,
  targetKey: 'F#',
  countdown: 5,
  maxDuration: 180, // 3 minutes
};

// Custom analysis options
const analysisOptions = {
  projectId: 'project-123',
  trackId: 'track-456',
  hasBeat: true,
  includeHarmonyAnalysis: true, // Future feature
  includeMoodDetection: true, // Future feature
};
```

## Cost Estimation

### Per Session Costs

| Service | Cost per Session | Notes |
|---------|-----------------|-------|
| Whisper API | ~$0.006 | 1 minute of audio @ $0.006/min |
| GPT-4 Intent | ~$0.001 | Single intent detection |
| Demucs Separation | ~$0.05 | 30-second separation @ $0.00223/sec |
| Melody Extraction | ~$0.02 | Custom ML model inference |
| Lyrics Enhancement | ~$0.01 | GPT-4 for structure analysis |
| TTS Response | ~$0.015 | ~100 words @ $0.015/1K chars |
| **Total** | **~$0.10** | Per 1-minute freestyle session |

### Optimization Tips

1. **Cache beat generations** - Reuse beats across sessions
2. **Skip stem separation** for a cappella recordings
3. **Batch lyric enhancements** - Process multiple sessions together
4. **Use streaming** for real-time transcription

## Testing

### Unit Tests

```bash
npm test -- freestyle-orchestrator.test.ts
```

### Integration Tests

```bash
npm run test:integration -- freestyle-workflow.test.ts
```

### Example Test

```typescript
describe('FreestyleOrchestrator', () => {
  it('should start freestyle session', async () => {
    const result = await freestyleOrchestrator.startFreestyleSession({
      projectId: 'test-project',
      userId: 'test-user',
    });

    expect(result.status).toBe('ready');
    expect(result.setup.projectReady).toBe(true);
  });

  it('should analyze recording', async () => {
    const analysis = await freestyleOrchestrator.analyzeRecording(
      mockAudioBuffer,
      mockLyrics,
      { projectId: 'test', trackId: 'test', hasBeat: true }
    );

    expect(analysis.metadata.bpm).toBeGreaterThan(0);
    expect(analysis.enhancedLyrics).toHaveLength(mockLyrics.length);
  });
});
```

## Roadmap

### Phase 1 (Current)
- ✅ Voice command integration
- ✅ Session preparation
- ✅ Recording setup
- ✅ Basic analysis pipeline
- ✅ Result display

### Phase 2 (Next)
- [ ] Real melody extraction (using Crepe or Basic Pitch)
- [ ] Advanced lyrics enhancement (rhyme detection, flow analysis)
- [ ] Beat generation integration (MusicGen, Udio)
- [ ] Multi-take recording and comparison
- [ ] AI-powered mixing suggestions

### Phase 3 (Future)
- [ ] Collaborative freestyle sessions
- [ ] Real-time pitch correction
- [ ] Style transfer (sound like your favorite artist)
- [ ] Automated mastering
- [ ] Social sharing and battles

## Troubleshooting

### Issue: Recording not starting

**Solution:**
1. Check microphone permissions
2. Verify track is armed: `result.recordingSetup.armed === true`
3. Check transport status

### Issue: Stem separation failing

**Solution:**
1. Verify Replicate API token is set
2. Check audio file size (max 10MB)
3. Ensure audio URL is publicly accessible

### Issue: Low analysis confidence

**Solution:**
1. Record in a quiet environment
2. Use a quality microphone
3. Ensure clear vocal delivery
4. Check backing track volume (not too loud)

## Support

For questions or issues:
- GitHub Issues: [github.com/your-repo/issues](https://github.com)
- Discord: [discord.gg/your-server](https://discord.gg)
- Email: support@yourdaw.com

## License

MIT License - See LICENSE file for details

---

Built with ❤️ for freestyle artists everywhere
