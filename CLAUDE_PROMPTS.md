# DAWG AI - Development Prompts for Claude Instances

**Last Updated**: 2025-10-14
**Phase**: Stages 3-10 Development
**Status**: Phase 1 Complete (Design System + Audio Engine + Backend API)

## How to Use These Prompts

1. Copy the entire prompt for the stage you're working on
2. Paste it into Claude Code, Cursor, or your preferred AI coding assistant
3. For Composer mode: Use Cmd/Ctrl + I
4. For Chat mode: Use Cmd/Ctrl + L
5. Make sure to use the @Codebase references when applicable

---

## Phase 1 Status (Complete ✅)

**Completed Modules**:
- ✅ Design System: 20 Svelte 5 components (4,621 lines)
- ✅ Audio Engine: 8 audio processing classes (2,459 lines)
- ✅ Backend API: 9 REST endpoints + WebSocket (1,633 lines)

**Integration**: See `examples/integration-demo.tsx` for full-stack patterns

**Production Readiness**: 75%

---

# Stage 3: Timeline & Multi-track Recording Interface

## 3.1 - Timeline Canvas Foundation

**Use Composer (Cmd/Ctrl + I):**

```
Create the timeline canvas component for DAWG AI's multi-track recording interface.

@Codebase Reference the design system components in packages/design-system/

Requirements:
1. Canvas-based timeline with sample-accurate rendering
2. Zoom levels: 1x to 128x (show samples at max zoom)
3. Time ruler with bars:beats:ticks and timecode
4. Snap to grid (1/4, 1/8, 1/16, 1/32 notes)
5. Horizontal scrolling and zooming
6. Playhead with smooth animation (60 FPS)

File: apps/web/src/features/timeline/components/Timeline.svelte

TypeScript Interface:
```typescript
interface TimelineConfig {
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  sampleRate: number;
  pixelsPerBeat: number;
  viewportStart: number; // beats
  viewportEnd: number;   // beats
}

interface TimelineState {
  zoom: number;           // 1-128x
  scrollX: number;        // pixels
  playheadPosition: number; // beats
  snapEnabled: boolean;
  snapValue: number;      // 0.25 = 1/4 note
}
```

Canvas Rendering:
- Draw grid lines for major beats (thick) and subdivisions (thin)
- Draw time ruler at top (bar numbers, beat markers)
- Draw playhead as vertical red line
- Optimize: only redraw visible region + 10% buffer

Integration with Audio Engine:
- Connect to AudioEngine.getInstance()
- Sync playhead with engine.getCurrentTime()
- Update at 60 FPS using requestAnimationFrame

Visual Design:
- Background: #1a1a1a
- Grid major lines: #333333
- Grid minor lines: #252525
- Playhead: #ff4444
- Time ruler: #2a2a2a background, white text

Success Criteria:
- Smooth scrolling and zooming with no lag
- Playhead syncs perfectly with audio engine
- Grid snapping works for all subdivisions
- Performance: 60 FPS with 100+ tracks
```

---

## 3.2 - Timeline Track Interactions

**Use Composer (Cmd/Ctrl + I):**

```
Add track lane rendering and interactions to the timeline component.

@Codebase Use Timeline.svelte from 3.1 and AudioEngine from packages/audio-engine/

Requirements:
1. Track lanes stacked vertically (each 80px high)
2. Track header (left): name, mute, solo, arm, volume
3. Click-to-arm recording
4. Drag to scroll vertically
5. Track selection and highlighting
6. Track reordering (drag and drop)

File: apps/web/src/features/timeline/components/TrackLane.svelte

TypeScript Interface:
```typescript
interface TrackLaneProps {
  track: {
    id: string;
    name: string;
    type: 'audio' | 'midi';
    color: string;
    muted: boolean;
    solo: boolean;
    armed: boolean;
    volume: number;
    recordings: Recording[];
  };
  height: number;
  timelineConfig: TimelineConfig;
  onArmToggle: (trackId: string) => void;
  onMuteToggle: (trackId: string) => void;
  onSoloToggle: (trackId: string) => void;
}

interface Recording {
  id: string;
  trackId: string;
  startBeat: number;
  durationBeat: number;
  waveformData?: Float32Array;
  midiNotes?: MIDINote[];
}
```

Track Header (Left Panel):
- Width: 200px, fixed position
- Name input (editable on double-click)
- Mute button (M) - yellow when active
- Solo button (S) - green when active
- Arm button (circle) - red when active
- Volume fader (vertical mini-fader)

Track Lane Canvas:
- Draw waveform for audio recordings
- Draw MIDI notes for MIDI recordings
- Recording blocks are draggable and resizable
- Highlight on hover
- Selection with click or drag-select

Visual Design:
- Track background: alternating #1e1e1e and #232323
- Selected track: #2a4a6a border
- Armed track: red glow on left edge
- Recording blocks: use track.color with 70% opacity

Integration:
- Sync armed state with AudioEngine track arming
- Mute/solo immediately affects audio engine
- Recording blocks sync with backend API

Success Criteria:
- All track controls work instantly (<50ms latency)
- Drag and drop reordering is smooth
- Can manage 50+ tracks without performance issues
```

---

## 3.3 - Waveform Rendering

**Use Composer (Cmd/Ctrl + I):**

```
Implement high-performance waveform rendering for audio recordings on the timeline.

@Codebase Reference AudioEngine and Timeline components

Requirements:
1. Generate waveform from audio buffer
2. Render peaks/RMS at multiple zoom levels
3. Color-coded by amplitude (louder = brighter)
4. Waveform caching for performance
5. Smooth updates during recording

Files:
- apps/web/src/features/timeline/utils/waveform-renderer.ts
- apps/web/src/features/timeline/components/WaveformView.svelte

TypeScript Implementation:
```typescript
export class WaveformRenderer {
  /**
   * Generate waveform data from audio buffer
   * Returns array of [min, max, rms] for each pixel
   */
  static generateWaveformData(
    audioBuffer: AudioBuffer,
    samplesPerPixel: number,
    channel: number = 0
  ): WaveformData {
    const channelData = audioBuffer.getChannelData(channel);
    const points: WaveformPoint[] = [];

    for (let i = 0; i < channelData.length; i += samplesPerPixel) {
      const slice = channelData.slice(i, i + samplesPerPixel);
      const min = Math.min(...slice);
      const max = Math.max(...slice);
      const rms = Math.sqrt(slice.reduce((sum, val) => sum + val * val, 0) / slice.length);

      points.push({ min, max, rms });
    }

    return { points, sampleRate: audioBuffer.sampleRate };
  }

  /**
   * Render waveform to canvas
   */
  static renderToCanvas(
    ctx: CanvasRenderingContext2D,
    waveformData: WaveformData,
    bounds: { x: number; y: number; width: number; height: number },
    color: string,
    style: 'bars' | 'filled' = 'filled'
  ): void {
    // Implementation here
  }
}

interface WaveformPoint {
  min: number;
  max: number;
  rms: number;
}

interface WaveformData {
  points: WaveformPoint[];
  sampleRate: number;
}
```

Rendering Optimizations:
1. Generate multiple LOD (level of detail) waveforms:
   - LOD 0: 1 pixel = 512 samples (zoomed out)
   - LOD 1: 1 pixel = 128 samples
   - LOD 2: 1 pixel = 32 samples
   - LOD 3: 1 pixel = 8 samples (zoomed in)

2. Cache waveform data in IndexedDB
3. Web Worker for waveform generation (don't block main thread)
4. Only render visible portion of waveform

Visual Styles:
- Filled style: solid waveform shape
- Bars style: vertical bars for each peak
- Color gradient by amplitude (quiet = dim, loud = bright)
- Clipping indicator (red) for samples > 0.95

Integration with Audio Engine:
```typescript
async function loadRecordingWaveform(recordingId: string) {
  // Load audio from backend
  const audioBuffer = await AudioEngine.loadAudioFile(recordingUrl);

  // Generate waveform data
  const waveformData = WaveformRenderer.generateWaveformData(
    audioBuffer,
    512 // samples per pixel at default zoom
  );

  // Cache for fast loading
  await cacheWaveform(recordingId, waveformData);

  return waveformData;
}
```

Success Criteria:
- Waveform generation completes in <200ms for 3-minute file
- Rendering maintains 60 FPS during zoom/scroll
- Waveforms accurately represent audio content
- LOD transitions are smooth and imperceptible
```

---

## 3.4 - Timeline Recording Integration

**Use Chat (Cmd/Ctrl + L):**

```
How do I integrate the timeline with the audio engine's recording functionality?

@Codebase Check AudioEngine recording methods and timeline state management

I need to:
1. Start recording when arm button is clicked and transport is playing
2. Show live recording waveform as it's being captured
3. Create recording block on timeline after recording stops
4. Save recording to backend API
5. Handle punch-in/punch-out recording

Current timeline state:
```typescript
const timeline = useTimelineStore();
const engine = AudioEngine.getInstance();

// When user clicks arm button
function handleArmTrack(trackId: string) {
  const track = tracks.find(t => t.id === trackId);
  track.armed = !track.armed;

  // How do I tell the audio engine this track is ready to record?
  // What happens when playback starts?
}

// How do I show the recording in real-time?
// How do I create the final recording block?
```

Please provide:
1. Complete recording flow implementation
2. Real-time waveform display during recording
3. Recording state management
4. Integration with backend for saving recordings
5. Error handling (disk full, buffer overflow, etc.)
```

---

# Stage 4: Recording System

## 4.1 - Recording Manager

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

## 4.2 - Recording UI & Feedback

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

# Stage 5: MIDI Editor (Piano Roll)

## 5.1 - Piano Roll Canvas

**Use Composer (Cmd/Ctrl + I):**

```
Create the piano roll MIDI editor component with full note editing capabilities.

@Codebase Reference MODULE_4_MIDI_EDITOR.md specification and AudioEngine MIDITrack

Requirements:
1. 88-key piano keyboard (left side, A0-C8)
2. Grid with beat subdivisions (1/4, 1/8, 1/16, 1/32)
3. Note creation: click to add, drag to set length
4. Note editing: drag to move, resize handles for length
5. Note selection: click or drag-select multiple
6. Velocity editing: bottom velocity lane
7. Quantization controls
8. Keyboard shortcuts

Files:
- apps/web/src/features/midi/components/PianoRoll.svelte
- apps/web/src/features/midi/stores/midi-store.ts
- apps/web/src/features/midi/utils/note-utils.ts

TypeScript Implementation:
```typescript
// stores/midi-store.ts
import { create } from 'zustand';

export interface MIDINote {
  id: string;
  pitch: number;        // 0-127 (MIDI note number)
  start: number;        // Beats from start
  duration: number;     // Beats
  velocity: number;     // 0-127
  selected: boolean;
}

interface MIDIEditorState {
  notes: MIDINote[];
  selectedNotes: Set<string>;
  clipboard: MIDINote[];

  // View state
  zoom: number;           // Pixels per beat
  scrollX: number;        // Horizontal scroll (beats)
  scrollY: number;        // Vertical scroll (keys)
  snapEnabled: boolean;
  snapValue: number;      // 0.25 = 1/4 note, 0.125 = 1/8 note

  // Playback
  isPlaying: boolean;
  playheadPosition: number; // beats

  // Actions
  addNote: (note: Omit<MIDINote, 'id' | 'selected'>) => void;
  updateNote: (id: string, updates: Partial<MIDINote>) => void;
  deleteNote: (id: string) => void;
  deleteSelectedNotes: () => void;

  selectNote: (id: string, addToSelection?: boolean) => void;
  selectNotes: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;

  moveSelectedNotes: (deltaBeats: number, deltaPitch: number) => void;
  transposeSelectedNotes: (semitones: number) => void;
  quantizeSelectedNotes: () => void;

  copySelectedNotes: () => void;
  pasteNotes: (atBeat: number) => void;
  duplicateSelectedNotes: () => void;

  // Undo/redo
  history: MIDINote[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

export const useMidiStore = create<MIDIEditorState>((set, get) => ({
  notes: [],
  selectedNotes: new Set(),
  clipboard: [],

  zoom: 40, // 40 pixels per beat
  scrollX: 0,
  scrollY: 60, // Start at middle C
  snapEnabled: true,
  snapValue: 0.25,

  isPlaying: false,
  playheadPosition: 0,

  history: [[]],
  historyIndex: 0,

  addNote: (noteData) => {
    const note: MIDINote = {
      ...noteData,
      id: crypto.randomUUID(),
      selected: false
    };

    set((state) => ({
      notes: [...state.notes, note]
    }));

    get().pushHistory();
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
    }));

    get().pushHistory();
  },

  deleteNote: (id) => {
    set((state) => ({
      notes: state.notes.filter(n => n.id !== id),
      selectedNotes: new Set([...state.selectedNotes].filter(nid => nid !== id))
    }));

    get().pushHistory();
  },

  deleteSelectedNotes: () => {
    const { selectedNotes } = get();
    set((state) => ({
      notes: state.notes.filter(n => !selectedNotes.has(n.id)),
      selectedNotes: new Set()
    }));

    get().pushHistory();
  },

  selectNote: (id, addToSelection = false) => {
    set((state) => {
      const newSelected = addToSelection
        ? new Set([...state.selectedNotes, id])
        : new Set([id]);

      return {
        selectedNotes: newSelected,
        notes: state.notes.map(n => ({
          ...n,
          selected: newSelected.has(n.id)
        }))
      };
    });
  },

  clearSelection: () => {
    set((state) => ({
      selectedNotes: new Set(),
      notes: state.notes.map(n => ({ ...n, selected: false }))
    }));
  },

  selectAll: () => {
    set((state) => ({
      selectedNotes: new Set(state.notes.map(n => n.id)),
      notes: state.notes.map(n => ({ ...n, selected: true }))
    }));
  },

  moveSelectedNotes: (deltaBeats, deltaPitch) => {
    const { selectedNotes } = get();

    set((state) => ({
      notes: state.notes.map(n => {
        if (!selectedNotes.has(n.id)) return n;

        return {
          ...n,
          start: Math.max(0, n.start + deltaBeats),
          pitch: Math.max(0, Math.min(127, n.pitch + deltaPitch))
        };
      })
    }));

    get().pushHistory();
  },

  quantizeSelectedNotes: () => {
    const { selectedNotes, snapValue } = get();

    set((state) => ({
      notes: state.notes.map(n => {
        if (!selectedNotes.has(n.id)) return n;

        const quantizedStart = Math.round(n.start / snapValue) * snapValue;
        return { ...n, start: quantizedStart };
      })
    }));

    get().pushHistory();
  },

  copySelectedNotes: () => {
    const { notes, selectedNotes } = get();
    const clipboard = notes.filter(n => selectedNotes.has(n.id));
    set({ clipboard });
  },

  pasteNotes: (atBeat) => {
    const { clipboard } = get();
    if (clipboard.length === 0) return;

    // Find earliest note in clipboard
    const earliestStart = Math.min(...clipboard.map(n => n.start));
    const offset = atBeat - earliestStart;

    // Create new notes with offset
    const newNotes = clipboard.map(n => ({
      ...n,
      id: crypto.randomUUID(),
      start: n.start + offset,
      selected: false
    }));

    set((state) => ({
      notes: [...state.notes, ...newNotes]
    }));

    get().pushHistory();
  },

  duplicateSelectedNotes: () => {
    get().copySelectedNotes();
    const { notes, selectedNotes } = get();

    // Find latest note end
    const latestEnd = Math.max(
      ...notes
        .filter(n => selectedNotes.has(n.id))
        .map(n => n.start + n.duration)
    );

    get().pasteNotes(latestEnd);
  },

  pushHistory: () => {
    set((state) => ({
      history: [
        ...state.history.slice(0, state.historyIndex + 1),
        state.notes
      ],
      historyIndex: state.historyIndex + 1
    }));
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex === 0) return;

    set({
      notes: history[historyIndex - 1],
      historyIndex: historyIndex - 1
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    set({
      notes: history[historyIndex + 1],
      historyIndex: historyIndex + 1
    });
  }
}));
```

Svelte 5 Piano Roll Component:
```svelte
<script lang="ts">
  import { useMidiStore } from '../stores/midi-store';
  import { AudioEngine } from '@dawg-ai/audio-engine';

  const midiStore = useMidiStore();
  let canvasRef: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  const PIANO_KEY_WIDTH = 60;
  const PIANO_KEY_HEIGHT = 12;
  const KEYS = 88; // A0 to C8

  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentTool: 'select' | 'pencil' | 'eraser' = 'select';

  $effect(() => {
    if (!canvasRef) return;
    ctx = canvasRef.getContext('2d')!;

    // Render loop at 60 FPS
    let animationId: number;
    function render() {
      drawPianoRoll();
      animationId = requestAnimationFrame(render);
    }
    render();

    return () => cancelAnimationFrame(animationId);
  });

  function drawPianoRoll() {
    const { width, height } = canvasRef;
    const { notes, zoom, scrollX, scrollY, playheadPosition } = midiStore.getState();

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height, zoom, scrollX, scrollY);

    // Draw notes
    notes.forEach(note => {
      drawNote(ctx, note, zoom, scrollX, scrollY);
    });

    // Draw playhead
    const playheadX = (playheadPosition - scrollX) * zoom;
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(playheadX, 0, 2, height);
  }

  function drawGrid(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    zoom: number,
    scrollX: number,
    scrollY: number
  ) {
    // Draw horizontal lines (piano keys)
    for (let key = 0; key < KEYS; key++) {
      const y = (KEYS - key - scrollY) * PIANO_KEY_HEIGHT;
      if (y < 0 || y > height) continue;

      // Highlight C notes
      const noteInOctave = (key + 9) % 12; // A0 = key 0
      const isC = noteInOctave === 3;

      ctx.strokeStyle = isC ? '#333333' : '#252525';
      ctx.lineWidth = isC ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw vertical lines (beats)
    const { snapValue } = midiStore.getState();
    for (let beat = 0; beat < 1000; beat += snapValue) {
      const x = (beat - scrollX) * zoom;
      if (x < 0 || x > width) continue;

      const isMajorBeat = beat % 1 === 0;
      ctx.strokeStyle = isMajorBeat ? '#333333' : '#252525';
      ctx.lineWidth = isMajorBeat ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  function drawNote(
    ctx: CanvasRenderingContext2D,
    note: MIDINote,
    zoom: number,
    scrollX: number,
    scrollY: number
  ) {
    const x = (note.start - scrollX) * zoom;
    const y = (KEYS - note.pitch - scrollY) * PIANO_KEY_HEIGHT;
    const width = note.duration * zoom;
    const height = PIANO_KEY_HEIGHT - 2;

    // Skip if off-screen
    if (x + width < 0 || x > canvasRef.width) return;
    if (y + height < 0 || y > canvasRef.height) return;

    // Color based on velocity
    const alpha = 0.5 + (note.velocity / 127) * 0.5;
    ctx.fillStyle = note.selected
      ? `rgba(100, 150, 255, ${alpha})`
      : `rgba(100, 255, 150, ${alpha})`;

    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = note.selected ? '#6496ff' : '#333';
    ctx.lineWidth = note.selected ? 2 : 1;
    ctx.strokeRect(x, y, width, height);
  }

  // Mouse handlers
  function handleMouseDown(e: MouseEvent) {
    const rect = canvasRef.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { zoom, scrollX, scrollY, snapEnabled, snapValue } = midiStore.getState();

    // Convert to musical coordinates
    let beat = (x / zoom) + scrollX;
    if (snapEnabled) {
      beat = Math.round(beat / snapValue) * snapValue;
    }

    const pitch = KEYS - Math.floor(y / PIANO_KEY_HEIGHT) - scrollY;

    if (currentTool === 'pencil') {
      // Add note
      midiStore.getState().addNote({
        pitch,
        start: beat,
        duration: snapValue,
        velocity: 100
      });
    } else if (currentTool === 'select') {
      // Select note or start drag-select
      const clickedNote = findNoteAtPosition(x, y);
      if (clickedNote) {
        midiStore.getState().selectNote(clickedNote.id, e.shiftKey);
      } else {
        midiStore.getState().clearSelection();
        isDragging = true;
        dragStartX = x;
        dragStartY = y;
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    const cmd = e.metaKey || e.ctrlKey;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      midiStore.getState().deleteSelectedNotes();
    } else if (cmd && e.key === 'a') {
      e.preventDefault();
      midiStore.getState().selectAll();
    } else if (cmd && e.key === 'c') {
      midiStore.getState().copySelectedNotes();
    } else if (cmd && e.key === 'v') {
      const { playheadPosition } = midiStore.getState();
      midiStore.getState().pasteNotes(playheadPosition);
    } else if (cmd && e.key === 'd') {
      e.preventDefault();
      midiStore.getState().duplicateSelectedNotes();
    } else if (cmd && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        midiStore.getState().redo();
      } else {
        midiStore.getState().undo();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="piano-roll-container">
  <!-- Toolbar -->
  <div class="toolbar">
    <button
      class:active={currentTool === 'select'}
      onclick={() => currentTool = 'select'}
    >
      Select
    </button>
    <button
      class:active={currentTool === 'pencil'}
      onclick={() => currentTool = 'pencil'}
    >
      Pencil
    </button>

    <select bind:value={midiStore.snapValue}>
      <option value={0.25}>1/4</option>
      <option value={0.125}>1/8</option>
      <option value={0.0625}>1/16</option>
      <option value={0.03125}>1/32</option>
    </select>

    <label>
      <input type="checkbox" bind:checked={midiStore.snapEnabled} />
      Snap
    </label>
  </div>

  <!-- Main canvas -->
  <canvas
    bind:this={canvasRef}
    width={1200}
    height={800}
    onmousedown={handleMouseDown}
  />
</div>
```

Success Criteria:
- Piano roll renders at 60 FPS
- All note operations work smoothly
- Keyboard shortcuts are responsive
- Undo/redo never loses data
- Can handle 1000+ notes without lag
```

---

## 5.2 - MIDI Playback Integration

**Use Chat (Cmd/Ctrl + L):**

```
How do I connect the piano roll MIDI editor to the audio engine for playback?

@Codebase Check MIDITrack class in packages/audio-engine/ and piano roll store

I need to:
1. Send MIDI notes from piano roll to audio engine
2. Hear notes when clicking on piano keyboard
3. Play back all notes when transport starts
4. Show playhead moving in sync with audio
5. Support different synth sounds

Current setup:
```typescript
// In piano roll component
const midiStore = useMidiStore();
const engine = AudioEngine.getInstance();

// How do I sync notes to the audio engine?
$effect(() => {
  const { notes } = midiStore.getState();
  // What do I do with these notes?
});

// How do I make the piano keyboard playable?
function handlePianoKeyClick(pitch: number) {
  // Play a note immediately
}
```

Please provide:
1. Complete integration between MIDI store and audio engine
2. Real-time playback implementation
3. Playhead sync logic
4. Synth/instrument selection
5. MIDI recording from piano roll
```

---

# Stage 6: AI Voice Interface

## 6.1 - Voice Command System

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

TypeScript Implementation:
```typescript
// voice-command-system.ts
import { AudioEngine } from '@dawg-ai/audio-engine';
import { DeepgramService } from '@ai-services/deepgram-service';
import { ClaudeService } from '@ai-services/claude-service';

export class VoiceCommandSystem {
  private deepgram: DeepgramService;
  private claude: ClaudeService;
  private engine: AudioEngine;
  private isListening = false;
  private conversationHistory: Message[] = [];

  constructor() {
    this.deepgram = new DeepgramService();
    this.claude = new ClaudeService();
    this.engine = AudioEngine.getInstance();
  }

  /**
   * Start listening for voice commands
   */
  async startListening(): Promise<void> {
    this.isListening = true;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    this.deepgram.transcribe(stream, {
      onTranscript: async (text: string) => {
        console.log('Heard:', text);
        await this.processCommand(text);
      },
      onError: (error: Error) => {
        console.error('Transcription error:', error);
      }
    });
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    this.isListening = false;
    this.deepgram.stop();
  }

  /**
   * Process voice command with Claude
   */
  private async processCommand(text: string): Promise<void> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: text
    });

    // Get DAW context
    const context = this.getDawContext();

    // Ask Claude to interpret command
    const response = await this.claude.sendMessage({
      messages: this.conversationHistory,
      system: this.getSystemPrompt(context)
    });

    // Parse response for actions
    const actions = this.parseActions(response.content);

    // Execute actions
    for (const action of actions) {
      await this.executeAction(action);
    }

    // Add assistant message to history
    this.conversationHistory.push({
      role: 'assistant',
      content: response.content
    });

    // Speak response (optional)
    // await this.speak(response.content);
  }

  /**
   * Get current DAW state for context
   */
  private getDawContext(): DawContext {
    return {
      isPlaying: this.engine.isPlaying(),
      currentTime: this.engine.getCurrentTime(),
      bpm: this.engine.getBPM(),
      tracks: this.engine.getAllTracks().map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        muted: t.isMuted(),
        solo: t.isSolo(),
        volume: t.getVolume()
      })),
      selectedTracks: this.engine.getSelectedTracks().map(t => t.id)
    };
  }

  /**
   * System prompt for Claude
   */
  private getSystemPrompt(context: DawContext): string {
    return `You are an AI assistant for DAWG AI, a digital audio workstation.

Current DAW State:
- Playing: ${context.isPlaying}
- BPM: ${context.bpm}
- Current Time: ${context.currentTime} seconds
- Tracks: ${context.tracks.length}

Available Actions:
- transport.play() - Start playback
- transport.pause() - Pause playback
- transport.stop() - Stop playback
- transport.record() - Start recording
- transport.setBPM(bpm: number) - Change tempo
- track.create(type: 'audio' | 'midi', name: string) - Create track
- track.delete(trackId: string) - Delete track
- track.setVolume(trackId: string, volume: number) - Set track volume (-60 to 12 dB)
- track.mute(trackId: string) - Mute track
- track.unmute(trackId: string) - Unmute track
- track.solo(trackId: string) - Solo track

When the user gives a command:
1. Interpret their intent
2. Return the appropriate action(s) as JSON
3. Provide a brief confirmation message

Example:
User: "Play the song"
Response:
{
  "actions": [{ "type": "transport.play" }],
  "message": "Starting playback"
}

User: "Create a new vocal track and set it to -6 dB"
Response:
{
  "actions": [
    { "type": "track.create", "params": { "type": "audio", "name": "Vocals" } },
    { "type": "track.setVolume", "params": { "trackId": "$CREATED_TRACK_ID", "volume": -6 } }
  ],
  "message": "Created vocal track at -6 dB"
}

Current tracks:
${context.tracks.map(t => `- ${t.name} (${t.type}): ${t.muted ? 'Muted' : 'Active'}, ${t.volume} dB`).join('\n')}

Be conversational but concise. Always return valid JSON with actions and message.`;
  }

  /**
   * Parse Claude response for actions
   */
  private parseActions(response: string): DawAction[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.actions || [];
    } catch (error) {
      console.error('Failed to parse actions:', error);
      return [];
    }
  }

  /**
   * Execute DAW action
   */
  private async executeAction(action: DawAction): Promise<void> {
    switch (action.type) {
      case 'transport.play':
        await this.engine.play();
        break;

      case 'transport.pause':
        this.engine.pause();
        break;

      case 'transport.stop':
        this.engine.stop();
        break;

      case 'transport.record':
        // Start recording on armed tracks
        break;

      case 'transport.setBPM':
        this.engine.setBPM(action.params.bpm);
        break;

      case 'track.create':
        const newTrack = await this.engine.addTrack({
          type: action.params.type,
          name: action.params.name
        });
        // Save to backend
        await TrackAPI.createTrack(newTrack);
        break;

      case 'track.delete':
        await this.engine.removeTrack(action.params.trackId);
        await TrackAPI.deleteTrack(action.params.trackId);
        break;

      case 'track.setVolume':
        const track = this.engine.getTrack(action.params.trackId);
        track.setVolume(action.params.volume);
        await TrackAPI.updateTrack(action.params.trackId, {
          volume: action.params.volume
        });
        break;

      case 'track.mute':
        this.engine.getTrack(action.params.trackId).setMuted(true);
        break;

      case 'track.unmute':
        this.engine.getTrack(action.params.trackId).setMuted(false);
        break;

      case 'track.solo':
        this.engine.getTrack(action.params.trackId).setSolo(true);
        break;

      default:
        console.warn('Unknown action type:', action.type);
    }
  }
}

interface DawContext {
  isPlaying: boolean;
  currentTime: number;
  bpm: number;
  tracks: Array<{
    id: string;
    name: string;
    type: string;
    muted: boolean;
    solo: boolean;
    volume: number;
  }>;
  selectedTracks: string[];
}

interface DawAction {
  type: string;
  params?: Record<string, any>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}
```

Deepgram Service:
```typescript
// apps/ai-services/src/services/deepgram-service.ts
export class DeepgramService {
  private apiKey: string;
  private ws: WebSocket | null = null;

  constructor() {
    this.apiKey = process.env.DEEPGRAM_API_KEY!;
  }

  async transcribe(
    stream: MediaStream,
    callbacks: {
      onTranscript: (text: string) => void;
      onError: (error: Error) => void;
    }
  ): Promise<void> {
    // Connect to Deepgram streaming API
    this.ws = new WebSocket(
      `wss://api.deepgram.com/v1/listen?punctuate=true&interim_results=false`,
      ['token', this.apiKey]
    );

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const transcript = data.channel?.alternatives[0]?.transcript;

      if (transcript) {
        callbacks.onTranscript(transcript);
      }
    };

    this.ws.onerror = (error) => {
      callbacks.onError(new Error('Deepgram connection error'));
    };

    // Send audio data to Deepgram
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const audioData = e.inputBuffer.getChannelData(0);
        // Convert Float32Array to Int16Array
        const int16Data = this.float32ToInt16(audioData);
        this.ws.send(int16Data);
      }
    };

    source.connect(processor);
    processor.connect(audioContext.destination);
  }

  stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private float32ToInt16(buffer: Float32Array): Int16Array {
    const int16 = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }
}
```

Success Criteria:
- Voice commands execute within 1-2 seconds
- High transcription accuracy (>95%)
- Claude correctly interprets complex commands
- Actions execute without errors
- Context-aware (remembers previous commands)
```

---

## 6.2 - Voice Interface UI

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

Svelte 5 Component:
```svelte
<script lang="ts">
  import { VoiceCommandSystem } from '../voice-command-system';
  import { Button, Card } from '@dawg-ai/design-system';

  let voiceSystem = new VoiceCommandSystem();
  let isListening = $state(false);
  let currentTranscript = $state('');
  let conversationHistory = $state<Message[]>([]);
  let voiceLevel = $state(0);

  async function toggleListening() {
    if (isListening) {
      voiceSystem.stopListening();
      isListening = false;
    } else {
      await voiceSystem.startListening();
      isListening = true;
    }
  }

  // Hold space to talk
  function handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !isListening && !e.repeat) {
      e.preventDefault();
      toggleListening();
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space' && isListening) {
      e.preventDefault();
      toggleListening();
    }
  }

  // Voice level indicator (0-100)
  $effect(() => {
    if (!isListening) {
      voiceLevel = 0;
      return;
    }

    const interval = setInterval(() => {
      // Get microphone input level
      voiceLevel = Math.random() * 100; // Replace with actual level
    }, 50);

    return () => clearInterval(interval);
  });
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} />

<div class="voice-interface">
  <!-- Microphone Button -->
  <div class="mic-container">
    <button
      class="mic-button"
      class:listening={isListening}
      onclick={toggleListening}
    >
      <svg width="32" height="32" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"
        />
        <path
          fill="currentColor"
          d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"
        />
      </svg>

      {#if isListening}
        <span class="listening-indicator">Listening...</span>
      {:else}
        <span class="hint">Hold Space to Talk</span>
      {/if}
    </button>

    <!-- Voice level indicator -->
    {#if isListening}
      <div class="voice-level-bar">
        <div
          class="voice-level-fill"
          style="width: {voiceLevel}%"
        />
      </div>
    {/if}
  </div>

  <!-- Current transcript -->
  {#if currentTranscript}
    <Card class="current-transcript">
      <p>{currentTranscript}</p>
    </Card>
  {/if}

  <!-- Conversation history -->
  <div class="conversation-history">
    {#each conversationHistory as message}
      <div class="message" class:user={message.role === 'user'}>
        <div class="message-role">
          {message.role === 'user' ? '🎤 You' : '🤖 DAWG AI'}
        </div>
        <div class="message-content">
          {message.content}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .voice-interface {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    max-width: 600px;
  }

  .mic-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .mic-button {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
  }

  .mic-button:hover {
    transform: scale(1.05);
  }

  .mic-button.listening {
    animation: pulse 1.5s infinite;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7);
    }
    50% {
      box-shadow: 0 0 0 20px rgba(255, 107, 107, 0);
    }
  }

  .listening-indicator {
    font-size: 12px;
    font-weight: 600;
  }

  .hint {
    font-size: 10px;
    opacity: 0.8;
  }

  .voice-level-bar {
    width: 200px;
    height: 4px;
    background: #333;
    border-radius: 2px;
    overflow: hidden;
  }

  .voice-level-fill {
    height: 100%;
    background: linear-gradient(90deg, #4ade80 0%, #22c55e 100%);
    transition: width 0.05s ease;
  }

  .current-transcript {
    padding: 1rem;
    background: #2a2a2a;
    border-left: 4px solid #667eea;
    font-size: 18px;
  }

  .conversation-history {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .message {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: #252525;
    border-radius: 8px;
  }

  .message.user {
    background: #2a4a6a;
    margin-left: 2rem;
  }

  .message-role {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.8;
  }

  .message-content {
    font-size: 14px;
    line-height: 1.5;
  }
</style>
```

Success Criteria:
- UI is responsive and intuitive
- Visual feedback is clear (listening state, voice level)
- Conversation history is easy to read
- Hold-to-talk feels natural
- Works on desktop and mobile
```

---

# Additional Stages (7-10)

## Stage 7: Effects Processor
- Implement EQ, compression, reverb, delay
- Effects chain management
- Real-time DSP with Web Audio API

## Stage 8: AI Beat Generator
- Generate drum patterns from text prompts
- AI-powered rhythm variations
- Integration with MIDI editor

## Stage 9: AI Vocal Coach
- Real-time pitch detection
- Vocal exercises and feedback
- Progress tracking

## Stage 10: Cloud Storage & Collaboration
- S3 integration for audio files
- Project backup/restore
- Real-time collaboration features

---

**End of Prompts**

For each stage, copy the relevant prompt(s) and paste them into your Claude Code instance. Make sure to reference the @Codebase when the prompt indicates it.

Happy coding!
