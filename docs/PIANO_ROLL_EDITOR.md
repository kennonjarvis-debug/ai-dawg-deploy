# DAWG AI Piano Roll Editor

## Overview

The DAWG AI Piano Roll Editor is a comprehensive visual MIDI editor built with React, Canvas, and Tone.js. It provides professional-grade note editing capabilities with an intuitive interface inspired by industry-standard DAWs like Ableton Live, FL Studio, and Logic Pro.

## Features

### Visual Piano Roll
- **Horizontal Timeline**: Displays beats and measures with clear grid lines
- **Vertical Piano Keyboard**: Shows notes C1-C8 with black/white key differentiation
- **Grid System**: Configurable grid with snap-to-grid functionality
- **Note Display**: Color-coded rectangles based on velocity
- **Zoom Controls**: Independent horizontal (time) and vertical (pitch) zoom
- **Smooth Scrolling**: Two-axis scrolling for navigation

### Note Editing
- **Click to Add**: Alt/Cmd + drag to create new notes
- **Drag to Move**: Move notes in pitch and time
- **Resize Notes**: Drag handles to adjust duration
- **Delete Notes**: Right-click or Delete key
- **Multi-Select**: Click + drag selection box, Shift-click to add to selection
- **Copy/Paste**: Full clipboard support (Cmd+C, Cmd+V)
- **Undo/Redo**: Complete history system (Cmd+Z, Cmd+Shift+Z)

### Playback System
- **Real-time Playback**: Using Tone.js for accurate timing
- **Play/Pause Control**: Spacebar for quick control
- **Visual Playhead**: Red line showing current position
- **Loop Region**: Define start/end points for looping
- **Metronome**: Optional click track with downbeat emphasis
- **Tempo Control**: BPM slider and input (40-300 BPM)

### Quantization
- **Snap to Grid**: 1/1, 1/2, 1/4, 1/8, 1/16, 1/32 note divisions
- **Quantize Selected**: Apply quantization to selected notes
- **Humanize**: Add random timing and velocity variations
- **Strength Control**: Adjustable quantization strength (0-100%)
- **Swing**: Add groove with swing timing

### MIDI Features
- **Velocity Editing**: Color-coded visualization (5 velocity ranges)
- **Multiple Tracks**: Support for unlimited MIDI tracks
- **Instrument Selection**: Choose from 13 General MIDI instruments
- **MIDI Import**: Parse .mid files using @tonejs/midi
- **MIDI Export**: Export projects as standard MIDI files
- **Channel Support**: Full 16-channel MIDI support

### UI Controls
- **Tool Palette**: Select, draw, erase, cut tools
- **Transport Controls**: Play, pause, stop, record buttons
- **Track Controls**: Mute, solo, volume, pan per track
- **Piano Keyboard**: Visual feedback during playback
- **Status Bar**: Display zoom level, selection count, snap settings

## File Structure

```
src/
├── types/
│   └── midi.ts                          # MIDI type definitions
├── ui/
│   ├── components/
│   │   └── PianoRoll/
│   │       ├── PianoRollEditor.tsx      # Main editor component
│   │       ├── PianoKeyboard.tsx        # Piano keyboard display
│   │       ├── NoteGrid.tsx             # Interactive note grid
│   │       ├── TransportControls.tsx    # Playback controls
│   │       ├── PianoRollDemo.tsx        # Demo page
│   │       └── index.ts                 # Component exports
│   └── hooks/
│       └── usePianoRoll.ts              # State management hook
└── backend/
    └── services/
        ├── midi-service.ts              # MIDI operations service
        └── midi-parser.ts               # MIDI file parsing (@tonejs/midi)
```

## Technology Stack

### Frontend
- **React 19**: Component framework
- **TypeScript**: Type safety
- **Canvas API**: High-performance rendering
- **Tone.js**: Web Audio API wrapper for playback
- **@tonejs/midi**: MIDI file parsing/export
- **Lucide React**: Icon library

### Backend
- **MIDI Service**: Node.js service for MIDI operations
- **File Storage**: Support for MIDI file upload/download
- **Database**: Store MIDI projects (notes, tempo, time signature)

## Usage

### Basic Usage

```tsx
import { PianoRollEditor } from './ui/components/PianoRoll';
import { MIDIProject } from './types/midi';

function MyComponent() {
  const [project, setProject] = useState<MIDIProject>({
    id: 'my-project',
    name: 'My Song',
    tempo: 120,
    timeSignature: { numerator: 4, denominator: 4 },
    tracks: [
      {
        id: 'track-1',
        name: 'Piano',
        notes: [],
        channel: 0,
        instrument: 'piano',
        volume: 0.8,
        pan: 0,
        mute: false,
        solo: false,
        color: '#3b82f6',
      },
    ],
    duration: 32,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return (
    <PianoRollEditor
      project={project}
      onSave={(updatedProject) => setProject(updatedProject)}
      onExport={(project) => console.log('Export', project)}
      onImport={(file) => console.log('Import', file)}
    />
  );
}
```

### Demo Page

```tsx
import { PianoRollDemo } from './ui/components/PianoRoll/PianoRollDemo';

function App() {
  return <PianoRollDemo />;
}
```

### Custom Hook Usage

```tsx
import { usePianoRoll } from './ui/hooks/usePianoRoll';

function MyEditor() {
  const {
    project,
    getCurrentNotes,
    addNote,
    deleteNotes,
    updateNotes,
    play,
    pause,
    undo,
    redo,
  } = usePianoRoll({
    initialProject: myProject,
    autoSave: true,
    onSave: (project) => saveToBackend(project),
  });

  // Use hook methods...
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Space** | Play/Pause |
| **Cmd+Z** | Undo |
| **Cmd+Shift+Z** | Redo |
| **Cmd+Y** | Redo (alternative) |
| **Cmd+C** | Copy selected notes |
| **Cmd+V** | Paste notes |
| **Cmd+A** | Select all notes |
| **Delete/Backspace** | Delete selected notes |
| **Cmd++** | Zoom in |
| **Cmd+-** | Zoom out |
| **Alt+Drag** | Draw new note |
| **Shift+Click** | Add to selection |

## Mouse Controls

| Action | Description |
|--------|-------------|
| **Click + Drag** | Select notes (selection box) |
| **Alt + Drag** | Draw new note |
| **Drag Note** | Move note in time and pitch |
| **Drag Note Edge** | Resize note duration |
| **Right-Click Note** | Delete note |
| **Scroll Wheel** | Pan vertically |
| **Shift + Wheel** | Pan horizontally |
| **Cmd + Wheel** | Zoom vertically |
| **Cmd + Shift + Wheel** | Zoom horizontally |

## Performance Considerations

### Optimization Strategies

1. **Canvas Rendering**: Uses Canvas API for efficient rendering of 1000+ notes
2. **Viewport Culling**: Only renders notes visible in the viewport
3. **Lazy Updates**: Debounced state updates during drag operations
4. **Web Workers**: Consider moving MIDI parsing to web workers for large files
5. **Virtual Scrolling**: Efficient handling of large note counts

### Recommended Limits

- **Max Notes per Track**: 10,000 (performance tested)
- **Max Tracks**: 128 (MIDI standard)
- **Zoom Range**: 20-200 pixels per beat (horizontal), 8-40 pixels per note (vertical)
- **MIDI File Size**: 10MB max for import

## MIDI Data Storage

### Database Schema (Example)

```typescript
interface MIDIProjectDB {
  id: string;
  user_id: string;
  name: string;
  tempo: number;
  time_signature_numerator: number;
  time_signature_denominator: number;
  duration: number;
  created_at: Date;
  updated_at: Date;
}

interface MIDITrackDB {
  id: string;
  project_id: string;
  name: string;
  channel: number;
  instrument: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  color: string;
  order: number;
}

interface MIDINoteDB {
  id: string;
  track_id: string;
  pitch: number;
  velocity: number;
  start_time: number;
  duration: number;
  channel: number;
}
```

### Storage Options

1. **PostgreSQL**: Relational database with JSON support
2. **MongoDB**: Document store for flexible schema
3. **IndexedDB**: Browser-based storage for offline work
4. **File System**: Store as .mid files with metadata

## Integration with DAWG AI

### 1. Add to DAW Dashboard

```tsx
// src/ui/DAWDashboard.tsx
import { PianoRollEditor } from './components/PianoRoll';

function DAWDashboard() {
  const [showPianoRoll, setShowPianoRoll] = useState(false);

  return (
    <div>
      {/* Existing DAW UI */}

      <button onClick={() => setShowPianoRoll(true)}>
        Open Piano Roll
      </button>

      {showPianoRoll && (
        <Modal onClose={() => setShowPianoRoll(false)}>
          <PianoRollEditor project={currentProject} />
        </Modal>
      )}
    </div>
  );
}
```

### 2. Connect to Audio Engine

```tsx
// Integration with existing AudioEngine
import { AudioEngine } from '../audio-engine/core/AudioEngine';

function IntegratedEditor() {
  const audioEngine = useAudioEngine();

  const handlePlayback = async (project: MIDIProject) => {
    // Convert MIDI notes to audio engine events
    project.tracks.forEach(track => {
      track.notes.forEach(note => {
        audioEngine.scheduleNote(
          note.pitch,
          note.velocity,
          note.startTime,
          note.duration
        );
      });
    });
  };

  return <PianoRollEditor onPlay={handlePlayback} />;
}
```

### 3. AI Integration

```tsx
// AI-powered MIDI generation
import { generateMelody } from '../backend/ai/melody-generator';

async function aiGenerateNotes(prompt: string): Promise<MIDINote[]> {
  const melody = await generateMelody(prompt);
  return melody.notes;
}

// Use in editor
function AIEnhancedEditor() {
  const { addNote } = usePianoRoll();

  const handleAIGenerate = async () => {
    const notes = await aiGenerateNotes('uplifting piano melody');
    notes.forEach(note => addNote(note));
  };

  return (
    <div>
      <button onClick={handleAIGenerate}>Generate with AI</button>
      <PianoRollEditor />
    </div>
  );
}
```

## API Reference

### PianoRollEditor Props

```typescript
interface PianoRollEditorProps {
  project?: MIDIProject;           // Initial project (optional)
  onSave?: (project: MIDIProject) => void;   // Save callback
  onExport?: (project: MIDIProject) => void; // Export callback
  onImport?: (file: File) => void;           // Import callback
  className?: string;                         // CSS class
}
```

### usePianoRoll Hook

```typescript
interface UsePianoRollOptions {
  initialProject?: MIDIProject;
  autoSave?: boolean;
  onSave?: (project: MIDIProject) => void;
}

const {
  // State
  project: MIDIProject | null;
  currentTrackId: string | null;
  viewport: PianoRollViewport;
  selection: PianoRollSelection;
  tool: PianoRollTool;
  quantize: QuantizeSettings;
  transport: TransportControls;

  // Getters
  getCurrentTrack: () => MIDITrack | null;
  getCurrentNotes: () => MIDINote[];

  // Note Operations
  addNote: (note: Omit<MIDINote, 'id'>) => void;
  deleteNotes: (noteIds: string[]) => void;
  updateNotes: (notes: MIDINote[]) => void;
  copyNotes: () => void;
  pasteNotes: () => void;

  // Edit Operations
  undo: () => void;
  redo: () => void;
  quantizeNotes: () => void;
  humanizeNotes: (amount?: number) => void;

  // Playback
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;

  // View
  zoomIn: (axis?: 'x' | 'y' | 'both') => void;
  zoomOut: (axis?: 'x' | 'y' | 'both') => void;
} = usePianoRoll(options);
```

## Future Enhancements

### Planned Features
- [ ] Multi-track editing in single view
- [ ] Velocity editor lane
- [ ] Controller (CC) editing
- [ ] Automation curves
- [ ] Step sequencer mode
- [ ] MIDI recording from hardware
- [ ] Chord detection and harmonization
- [ ] Scale highlighting
- [ ] Note preview on hover
- [ ] Drum editor mode
- [ ] Piano roll skins/themes
- [ ] Export to audio (WAV, MP3)
- [ ] VST instrument support
- [ ] MIDI learn for controllers
- [ ] Pattern/clip system

### AI Features
- [ ] AI melody generation
- [ ] Chord progression suggestions
- [ ] Bass line generation
- [ ] Drum pattern creation
- [ ] Harmonization assistant
- [ ] Genre-aware quantization
- [ ] Smart velocity adjustment

## Troubleshooting

### Common Issues

1. **Audio Not Playing**
   - Ensure browser supports Web Audio API
   - Check browser console for Tone.js errors
   - Verify AudioContext is started (click play button)

2. **Notes Not Rendering**
   - Check viewport scroll position
   - Verify note data is valid (pitch 0-127)
   - Check canvas dimensions

3. **Performance Issues**
   - Reduce number of notes
   - Increase note height to reduce rendering
   - Check browser GPU acceleration

4. **MIDI Import Fails**
   - Verify .mid file format
   - Check file size (max 10MB)
   - Try exporting from source DAW as format 1

## License

MIT License - Part of DAWG AI Platform

## Support

For issues or questions:
- GitHub Issues: https://github.com/dawg-ai/piano-roll
- Documentation: https://docs.dawg.ai/piano-roll
- Discord: https://discord.gg/dawg-ai
