# Your Next Prompts (Copy-Paste Ready) 🚀

## Module 1: Recording System (Instance F)

### Setup
```bash
cd /Users/benkennon/dawg-ai
git worktree add ../dawg-worktrees/recording module/recording
cd ../dawg-worktrees/recording
./dashboard/update-progress.sh recording-system in-progress 0
# Open Claude Code here
```

---

### Prompt 4.1 - Recording Manager

**Use Composer (Cmd/Ctrl + I):**

```
Create a comprehensive recording manager that handles multi-track recording with the audio engine.

@Codebase Use AudioEngine from packages/audio-engine/ and backend API from apps/backend/

Requirements:
1. Arm/disarm tracks for recording
2. Start/stop recording synced with transport
3. Live monitoring with zero-latency
4. Multi-track simultaneous recording
5. Automatic file naming and storage
6. Recording history and takes management

File: apps/web/src/features/recording/recording-manager.ts

TypeScript Implementation:
```typescript
import { AudioEngine } from '@dawg-ai/audio-engine';
import { TrackAPI } from '@/api/track-api';

export class RecordingManager {
  private engine: AudioEngine;
  private activeRecordings = new Map<string, RecordingSession>();

  constructor() {
    this.engine = AudioEngine.getInstance();
  }

  /**
   * Arm track for recording
   */
  armTrack(trackId: string, inputDevice?: string): void {
    const track = this.engine.getTrack(trackId);
    if (!track) throw new Error(`Track ${trackId} not found`);

    track.arm(inputDevice);

    // Enable input monitoring (hear yourself with zero latency)
    track.setMonitoring(true);
  }

  /**
   * Disarm track
   */
  disarmTrack(trackId: string): void {
    const track = this.engine.getTrack(trackId);
    if (!track) return;

    track.disarm();
    track.setMonitoring(false);
  }

  /**
   * Start recording on all armed tracks
   * Called automatically when transport starts playing
   */
  async startRecording(): Promise<void> {
    const armedTracks = this.engine.getArmedTracks();

    for (const track of armedTracks) {
      const session: RecordingSession = {
        trackId: track.id,
        startTime: this.engine.getCurrentTime(),
        startBeat: this.engine.getCurrentBeat(),
        buffer: [],
        isActive: true
      };

      this.activeRecordings.set(track.id, session);

      // Start capturing audio
      track.onAudioData((audioData: Float32Array) => {
        if (session.isActive) {
          session.buffer.push(audioData);
        }
      });
    }
  }

  /**
   * Stop recording and save all active recordings
   */
  async stopRecording(): Promise<Recording[]> {
    const recordings: Recording[] = [];

    for (const [trackId, session] of this.activeRecordings) {
      session.isActive = false;

      // Combine all buffers into one AudioBuffer
      const audioBuffer = this.combineBuffers(session.buffer);

      // Generate unique filename
      const filename = this.generateFilename(trackId);

      // Save to backend
      const recording = await this.saveRecording({
        trackId,
        audioBuffer,
        startBeat: session.startBeat,
        filename
      });

      recordings.push(recording);
    }

    this.activeRecordings.clear();
    return recordings;
  }

  /**
   * Get live recording data for waveform display
   */
  getLiveRecordingData(trackId: string): Float32Array | null {
    const session = this.activeRecordings.get(trackId);
    if (!session || session.buffer.length === 0) return null;

    // Return last second of audio for live display
    const lastBuffers = session.buffer.slice(-100); // ~1 second at 48kHz
    return this.combineBuffers(lastBuffers);
  }

  private combineBuffers(buffers: Float32Array[]): AudioBuffer {
    // Implementation to merge Float32Array[] into AudioBuffer
  }

  private generateFilename(trackId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `recording-${trackId}-${timestamp}.wav`;
  }

  private async saveRecording(params: {
    trackId: string;
    audioBuffer: AudioBuffer;
    startBeat: number;
    filename: string;
  }): Promise<Recording> {
    // Convert AudioBuffer to WAV blob
    const wavBlob = this.audioBufferToWav(params.audioBuffer);

    // Upload to backend
    const formData = new FormData();
    formData.append('file', wavBlob, params.filename);
    formData.append('trackId', params.trackId);
    formData.append('startBeat', params.startBeat.toString());

    const response = await fetch('/api/recordings/upload', {
      method: 'POST',
      body: formData
    });

    return response.json();
  }

  private audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    // Implementation to convert AudioBuffer to WAV file format
  }
}

interface RecordingSession {
  trackId: string;
  startTime: number;
  startBeat: number;
  buffer: Float32Array[];
  isActive: boolean;
}

interface Recording {
  id: string;
  trackId: string;
  startBeat: number;
  durationBeat: number;
  filename: string;
  waveformData: WaveformData;
}
```

Integration with Transport:
```typescript
// In transport controls
function handlePlay() {
  engine.play();

  // Start recording if tracks are armed
  const armedTracks = engine.getArmedTracks();
  if (armedTracks.length > 0) {
    recordingManager.startRecording();
  }
}

function handleStop() {
  engine.stop();

  // Save all recordings
  const recordings = await recordingManager.stopRecording();

  // Add recordings to timeline
  recordings.forEach(rec => {
    timeline.addRecording(rec);
  });
}
```

Success Criteria:
- Zero latency monitoring (<5ms)
- No dropped samples during recording
- Simultaneous multi-track recording works perfectly
- Recordings automatically appear on timeline
- All recordings saved to backend
```

---

### Prompt 4.2 - Recording UI & Feedback

**Use Composer (Cmd/Ctrl + I):**

```
Create the recording UI components with real-time visual feedback.

@Codebase Use RecordingManager and Timeline components

Requirements:
1. Record button that changes color when recording
2. Live input level meters (pre-recording)
3. Recording countdown (1, 2, 3, 4...)
4. Live waveform display during recording
5. Take management (comp multiple takes)
6. Punch-in/punch-out controls

File: apps/web/src/features/recording/components/RecordingControls.svelte

Svelte 5 Component:
```svelte
<script lang="ts">
  import { AudioEngine } from '@dawg-ai/audio-engine';
  import { RecordingManager } from '../recording-manager';
  import { Button, Meter } from '@dawg-ai/design-system';

  let engine = AudioEngine.getInstance();
  let recordingManager = new RecordingManager();

  let isRecording = $state(false);
  let countdown = $state<number | null>(null);
  let inputLevels = $state<number[]>([]);

  // Count-in before recording starts
  async function startRecordingWithCountIn() {
    const bpm = engine.getBPM();
    const beatsPerBar = 4;

    // Visual countdown
    for (let i = beatsPerBar; i > 0; i--) {
      countdown = i;
      await new Promise(resolve => setTimeout(resolve, (60 / bpm) * 1000));
    }

    countdown = null;

    // Start recording
    await recordingManager.startRecording();
    isRecording = true;
  }

  async function stopRecording() {
    const recordings = await recordingManager.stopRecording();
    isRecording = false;

    // Show take selection dialog if multiple takes exist
    if (recordings.length > 0) {
      showTakeManager(recordings);
    }
  }

  // Update input levels at 60 FPS
  $effect(() => {
    const interval = setInterval(() => {
      const armedTracks = engine.getArmedTracks();
      inputLevels = armedTracks.map(track => track.getInputLevel());
    }, 16); // ~60 FPS

    return () => clearInterval(interval);
  });
</script>

<div class="recording-controls">
  <!-- Count-in display -->
  {#if countdown !== null}
    <div class="countdown">
      <span class="countdown-number">{countdown}</span>
    </div>
  {/if}

  <!-- Record button -->
  <Button
    variant={isRecording ? 'danger' : 'primary'}
    class={isRecording ? 'recording-active' : ''}
    onclick={isRecording ? stopRecording : startRecordingWithCountIn}
  >
    {isRecording ? '⏹ Stop' : '⏺ Record'}
  </Button>

  <!-- Input level meters for armed tracks -->
  <div class="input-meters">
    {#each inputLevels as level, i}
      <div class="meter-lane">
        <span>Track {i + 1}</span>
        <Meter value={level} mode="input" peakHold />
      </div>
    {/each}
  </div>

  <!-- Punch in/out controls -->
  <div class="punch-controls">
    <label>
      <input type="checkbox" bind:checked={punchInEnabled} />
      Punch In: <input type="number" bind:value={punchInBeat} /> beats
    </label>
    <label>
      <input type="checkbox" bind:checked={punchOutEnabled} />
      Punch Out: <input type="number" bind:value={punchOutBeat} /> beats
    </label>
  </div>
</div>

<style>
  .recording-controls {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #1a1a1a;
    border-radius: 8px;
  }

  .countdown {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 120px;
    font-weight: bold;
    color: #ff4444;
    text-shadow: 0 0 20px rgba(255, 68, 68, 0.8);
    animation: pulse 0.5s ease-in-out;
  }

  .recording-active {
    animation: recording-pulse 1s infinite;
  }

  @keyframes recording-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .input-meters {
    display: flex;
    gap: 0.5rem;
  }

  .meter-lane {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
</style>
```

Take Manager Component:
```svelte
<script lang="ts">
  interface Take {
    id: string;
    name: string;
    timestamp: Date;
    waveformData: WaveformData;
  }

  let takes = $state<Take[]>([]);
  let selectedTake = $state<string | null>(null);

  function selectTake(takeId: string) {
    selectedTake = takeId;
    // Keep this take, delete others
  }

  function compTakes() {
    // Open comping editor to choose best parts from each take
  }
</script>

<div class="take-manager">
  <h3>Select Best Take</h3>

  {#each takes as take}
    <div
      class="take-item"
      class:selected={selectedTake === take.id}
      onclick={() => selectTake(take.id)}
    >
      <span class="take-name">{take.name}</span>
      <span class="take-time">{take.timestamp.toLocaleTimeString()}</span>
      <!-- Mini waveform preview -->
      <canvas class="take-waveform" />
    </div>
  {/each}

  <div class="take-actions">
    <Button onclick={compTakes}>Comp Takes</Button>
    <Button onclick={keepAll}>Keep All</Button>
  </div>
</div>
```

Success Criteria:
- Countdown is perfectly synced to BPM
- Input meters update smoothly at 60 FPS
- Record button gives clear visual feedback
- Take management is intuitive
- Punch-in/out works accurately (sample-perfect)
```

---

## Module 2: Voice Interface (Instance H)

### Setup
```bash
cd /Users/benkennon/dawg-ai
git worktree add ../dawg-worktrees/voice-interface module/voice-interface
cd ../dawg-worktrees/voice-interface
./dashboard/update-progress.sh voice-interface in-progress 0
# Open Claude Code here
```

---

### Prompt 6.1 - Voice Command System

**Use Composer (Cmd/Ctrl + I):**

```
Create the AI voice interface that allows users to control DAWG AI with natural language.

@Codebase Reference TransportControls, Timeline, and backend API

Requirements:
1. Speech-to-text (Deepgram API)
2. Command interpretation (Claude API)
3. DAW action execution
4. Text-to-speech feedback (ElevenLabs)
5. Conversation history
6. Context-aware commands

Files:
- apps/web/src/features/voice/voice-command-system.ts
- apps/ai-services/src/services/deepgram-service.ts
- apps/ai-services/src/services/claude-service.ts

[Full implementation from CLAUDE_PROMPTS.md - Section 6.1]

Success Criteria:
- Voice commands execute within 1-2 seconds
- High transcription accuracy (>95%)
- Claude correctly interprets complex commands
- Actions execute without errors
- Context-aware (remembers previous commands)
```

---

### Prompt 6.2 - Voice Interface UI

**Use Composer (Cmd/Ctrl + I):**

```
Create the UI components for the voice interface with visual feedback.

@Codebase Use VoiceCommandSystem and design system components

Requirements:
1. Microphone button with recording indicator
2. Real-time transcription display
3. Conversation history
4. Voice activity indicator
5. Settings (language, voice feedback on/off)
6. Keyboard shortcut (hold space to talk)

File: apps/web/src/features/voice/components/VoiceInterface.svelte

[Full Svelte 5 component from CLAUDE_PROMPTS.md - Section 6.2]

Success Criteria:
- UI is responsive and intuitive
- Visual feedback is clear (listening state, voice level)
- Conversation history is easy to read
- Hold-to-talk feels natural
- Works on desktop and mobile
```

---

## TL;DR Commands

### Instance F (Recording)
```bash
cd /Users/benkennon/dawg-ai
git worktree add ../dawg-worktrees/recording module/recording
cd ../dawg-worktrees/recording
# Copy prompts 4.1 and 4.2 above
./dashboard/update-progress.sh recording-system in-progress 0
```

### Instance H (Voice)
```bash
cd /Users/benkennon/dawg-ai
git worktree add ../dawg-worktrees/voice-interface module/voice-interface
cd ../dawg-worktrees/voice-interface
# Copy prompts 6.1 and 6.2 above
./dashboard/update-progress.sh voice-interface in-progress 0
```

---

**Full prompts available in:** `CLAUDE_PROMPTS.md` (Sections 4.1, 4.2, 6.1, 6.2)

**Go build! 🚀**
