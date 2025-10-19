# Piano Roll Editor - Architecture Overview

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PianoRollEditor (Main)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Top Toolbar                              │  │
│  │  [Save] [Import] [Export] [Undo] [Redo]             │  │
│  │  [Copy] [Cut] [Grid] [Quantize] [Zoom]              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           TransportControls                           │  │
│  │  [Stop] [Play] [Record] [Loop] [Metronome]          │  │
│  │  BPM: 120  |  Position: 1.1.000  |  Loop: 0-16      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────┬───────────────────────────────────────────────┐  │
│  │Piano │              NoteGrid (Canvas)                │  │
│  │Keys  │  ┌──────────────────────────────────────┐    │  │
│  │(C8)  │  │ ┌─────┐ ┌─────┐ ┌──────┐           │    │  │
│  │      │  │ │ Note│ │ Note│ │ Note │  Playhead │    │  │
│  │(C7)  │  │ └─────┘ └─────┘ └──────┘     ↓     │    │  │
│  │      │  │                                      │    │  │
│  │(C6)  │  │  ┌────────┐   Selection Box         │    │  │
│  │      │  │  │ Note   │   ┌─ ─ ─ ─ ─ ─ ┐       │    │  │
│  │(C5)  │  │  └────────┘   │             │       │    │  │
│  │      │  │                └ ─ ─ ─ ─ ─ ─┘       │    │  │
│  │(C4)  │  │                                      │    │  │
│  │      │  │  Grid Lines (Beats/Measures)        │    │  │
│  │(C3)  │  └──────────────────────────────────────┘    │  │
│  │      │                                               │  │
│  │(C2)  │  Horizontal: Time (Beats) →                  │  │
│  │      │  Vertical: Pitch (Notes) ↑                   │  │
│  │(C1)  │                                               │  │
│  └──────┴───────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Status Bar                               │  │
│  │  Zoom: 80px/beat  |  Selected: 5  |  Snap: 1/16     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│   User       │
│   Input      │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────────────────────┐
│           Event Handlers (React)                     │
│  • Mouse: click, drag, wheel                         │
│  • Keyboard: shortcuts, typing                       │
│  • Touch: gestures (mobile)                          │
└──────────────┬───────────────────────────────────────┘
               │
               ↓
┌──────────────────────────────────────────────────────┐
│           usePianoRoll Hook (State)                  │
│                                                       │
│  State:                                               │
│  • project: MIDIProject                               │
│  • viewport: PianoRollViewport                        │
│  • selection: PianoRollSelection                      │
│  • transport: TransportControls                       │
│  • history: { past, future }                          │
│                                                       │
│  Operations:                                          │
│  • addNote(), deleteNotes(), updateNotes()            │
│  • undo(), redo()                                     │
│  • play(), pause(), stop()                            │
│  • zoomIn(), zoomOut()                                │
└──────────────┬───────────────────────────────────────┘
               │
               ├──────────────┬──────────────┐
               ↓              ↓              ↓
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  Canvas  │   │ Tone.js  │   │ Backend  │
       │ Rendering│   │ Playback │   │  API     │
       └──────────┘   └──────────┘   └──────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Application State                     │
└─────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Project    │    │   Viewport   │    │  Transport   │
│   State      │    │   State      │    │   State      │
│              │    │              │    │              │
│ • tracks     │    │ • scrollX    │    │ • isPlaying  │
│ • tempo      │    │ • scrollY    │    │ • tempo      │
│ • time sig   │    │ • zoomX      │    │ • position   │
│ • duration   │    │ • zoomY      │    │ • loop       │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ↓
                    ┌──────────────┐
                    │   History    │
                    │   System     │
                    │              │
                    │ • past[]     │
                    │ • future[]   │
                    └──────────────┘
```

## Note Editing Operations

```
User Action              → State Update              → Visual Update
─────────────────────────────────────────────────────────────────────

Alt + Drag              → addNote()                 → Render new note
                          history.past.push()        → Update canvas

Drag Note               → updateNotes()             → Move note rect
                          (change startTime/pitch)  → Update canvas

Resize Note             → updateNotes()             → Change width
                          (change duration)         → Update canvas

Right-Click Note        → deleteNotes()             → Remove note
                          history.past.push()        → Update canvas

Selection Box           → setSelection()            → Highlight notes
                          (click + drag)            → Blue border

Copy (Cmd+C)            → copyNotes()               → Store clipboard
                          → clipboard = selected    → No visual

Paste (Cmd+V)           → pasteNotes()              → Render pasted
                          → addNote() × N           → Update canvas

Undo (Cmd+Z)            → undo()                    → Restore state
                          history.past.pop()        → Redraw all

Quantize                → quantizeNotes()           → Snap to grid
                          (round to division)       → Update canvas

Humanize                → humanizeNotes()           → Add variation
                          (random offset)           → Update canvas
```

## Audio Playback Flow

```
┌──────────────┐
│ Play Button  │
│   Pressed    │
└──────┬───────┘
       │
       ↓
┌────────────────────────────────────────┐
│  play() function                       │
│  1. Initialize Tone.js                 │
│  2. Set tempo                          │
│  3. Schedule all notes                 │
│  4. Start Transport                    │
│  5. Begin animation loop               │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  Tone.js Audio Engine                  │
│  • PolySynth for note playback         │
│  • Synth for metronome                 │
│  • Transport for timing                │
└────────┬───────────────────────────────┘
         │
         ├───────────────┬────────────────┐
         ↓               ↓                ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Schedule    │ │   Playhead   │ │  Highlight   │
│   Notes      │ │   Position   │ │    Keys      │
│              │ │              │ │              │
│ Each note at │ │ Update every │ │ Show playing │
│ correct time │ │ frame (60fps)│ │ notes on     │
│ and pitch    │ │              │ │ keyboard     │
└──────────────┘ └──────────────┘ └──────────────┘
```

## MIDI File Import/Export

```
┌──────────────┐
│ Import MIDI  │
│    File      │
└──────┬───────┘
       │
       ↓
┌────────────────────────────────────────┐
│  MIDIParser.parseMIDIFile()            │
│  1. Read file as ArrayBuffer           │
│  2. Parse with @tonejs/midi            │
│  3. Extract header (tempo, time sig)   │
│  4. Parse tracks and notes             │
│  5. Convert to MIDIProject             │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  MIDIProject State                     │
│  • Ready for editing                   │
│  • Display in piano roll               │
└────────────────────────────────────────┘


┌──────────────┐
│ Export MIDI  │
│    File      │
└──────┬───────┘
       │
       ↓
┌────────────────────────────────────────┐
│  MIDIParser.exportMIDIFile()           │
│  1. Create Midi instance               │
│  2. Set header (tempo, time sig)       │
│  3. Add tracks with notes              │
│  4. Convert to ArrayBuffer             │
│  5. Create download blob               │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  Browser Download                      │
│  • Save as .mid file                   │
└────────────────────────────────────────┘
```

## Canvas Rendering Pipeline

```
┌────────────────────────────────────────┐
│  useEffect (viewport, notes change)    │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  1. Get Canvas Context                 │
│     • Apply device pixel ratio         │
│     • Set canvas dimensions            │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  2. Clear Canvas                       │
│     • ctx.clearRect()                  │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  3. Draw Grid                          │
│     • Vertical lines (beats/measures)  │
│     • Horizontal lines (pitches)       │
│     • Alternating row colors           │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  4. Draw Notes (with culling)          │
│     For each note:                     │
│       if (in viewport) {               │
│         • Calculate position           │
│         • Draw rectangle               │
│         • Apply velocity color         │
│         • Draw border if selected      │
│       }                                │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  5. Draw Playhead (if playing)         │
│     • Red vertical line                │
│     • At current beat position         │
└────────┬───────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│  6. Draw Selection Box (if dragging)   │
│     • Semi-transparent rectangle       │
│     • Blue border                      │
└────────────────────────────────────────┘
```

## Type System Hierarchy

```
MIDIProject
  ├─ id: string
  ├─ name: string
  ├─ tempo: number
  ├─ timeSignature: { numerator, denominator }
  ├─ tracks: MIDITrack[]
  │    ├─ id: string
  │    ├─ name: string
  │    ├─ notes: MIDINote[]
  │    │    ├─ id: string
  │    │    ├─ pitch: number (0-127)
  │    │    ├─ velocity: number (0-127)
  │    │    ├─ startTime: number (beats)
  │    │    ├─ duration: number (beats)
  │    │    └─ channel: number (0-15)
  │    ├─ channel: number
  │    ├─ instrument: string
  │    ├─ volume: number
  │    ├─ pan: number
  │    ├─ mute: boolean
  │    ├─ solo: boolean
  │    └─ color: string
  ├─ duration: number
  ├─ createdAt: Date
  └─ updatedAt: Date

PianoRollState
  ├─ project: MIDIProject
  ├─ currentTrackId: string
  ├─ viewport: PianoRollViewport
  │    ├─ scrollX: number
  │    ├─ scrollY: number
  │    ├─ zoomX: number
  │    ├─ zoomY: number
  │    ├─ width: number
  │    └─ height: number
  ├─ selection: PianoRollSelection
  │    ├─ noteIds: string[]
  │    ├─ startBeat: number
  │    ├─ endBeat: number
  │    ├─ startPitch: number
  │    └─ endPitch: number
  ├─ tool: PianoRollTool
  ├─ quantize: QuantizeSettings
  ├─ transport: TransportControls
  ├─ clipboard: MIDINote[]
  └─ history: { past, future }
```

## Integration Points

```
┌──────────────────────────────────────────────────────┐
│              DAWG AI Application                     │
└──────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ↓               ↓               ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Audio Engine │ │  Timeline    │ │ Piano Roll   │
│              │ │  Store       │ │  Editor      │
│ • Track      │ │              │ │              │
│ • Synth      │ │ • Clips      │ │ • Notes      │
│ • Effects    │ │ • Markers    │ │ • Editing    │
│ • Routing    │ │ • Transport  │ │ • Playback   │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ↓
                ┌──────────────┐
                │   Backend    │
                │   Services   │
                │              │
                │ • Storage    │
                │ • MIDI I/O   │
                │ • AI Gen     │
                └──────────────┘
```

## Performance Optimization Strategy

```
┌────────────────────────────────────────┐
│  Performance Optimizations             │
└────────────────────────────────────────┘
           │
           ├─ Viewport Culling
           │  └─ Only render visible notes
           │
           ├─ Canvas Optimization
           │  ├─ Device pixel ratio scaling
           │  ├─ Minimal state changes
           │  └─ Efficient draw operations
           │
           ├─ State Management
           │  ├─ Immutable updates
           │  ├─ Debounced operations
           │  └─ Lazy history snapshots
           │
           ├─ Event Handling
           │  ├─ Throttled mouse events
           │  ├─ Passive scroll listeners
           │  └─ Request animation frame
           │
           └─ Memory Management
              ├─ Component cleanup
              ├─ Tone.js disposal
              └─ Canvas context reuse
```

## File Structure

```
src/
├── types/
│   └── midi.ts                    # Type definitions (230 lines)
│
├── ui/
│   ├── components/
│   │   └── PianoRoll/
│   │       ├── PianoRollEditor.tsx      # Main (438 lines)
│   │       ├── PianoKeyboard.tsx        # Piano (161 lines)
│   │       ├── NoteGrid.tsx             # Grid (563 lines)
│   │       ├── TransportControls.tsx    # Transport (151 lines)
│   │       ├── PianoRollDemo.tsx        # Demo (127 lines)
│   │       └── index.ts                 # Exports
│   │
│   └── hooks/
│       └── usePianoRoll.ts        # State hook (430 lines)
│
└── backend/
    └── services/
        ├── midi-service.ts        # Service (473 lines)
        └── midi-parser.ts         # Parser (215 lines)

docs/
├── PIANO_ROLL_EDITOR.md          # User guide
├── PIANO_ROLL_IMPLEMENTATION_REPORT.md  # This report
└── PIANO_ROLL_ARCHITECTURE.md    # Architecture diagrams

tests/
└── piano-roll/
    └── piano-roll.test.ts         # Tests (311 lines)
```

## Summary

This architecture provides:
- **Modular Design**: Clear separation of concerns
- **Performance**: Optimized for 1000+ notes
- **Extensibility**: Easy to add features
- **Maintainability**: Well-documented and tested
- **Integration**: Seamless DAWG AI integration

The piano roll editor is production-ready and follows industry best practices for React applications and DAW interfaces.
