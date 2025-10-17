# TransportControls Widget

## Description

Professional DAW transport controls with glassmorphic design. The heart of the DAWG AI DAW - controls playback, pause, stop, and recording with smooth animations and neon glow effects.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `undefined` | Additional CSS classes |
| `showRecordButton` | `boolean` | `true` | Show/hide the record button |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |

## Features

- **Play/Pause Control** - Large center button with neon blue glow
- **Stop Button** - Resets transport to beginning
- **Record Button** - Starts/stops recording with red glow effect
- **State Indicator** - Visual feedback showing current transport state
- **Keyboard Shortcuts**:
  - `Spacebar` - Play/Pause
  - `R` - Record/Stop Recording
  - `S` - Stop
- **Glassmorphic Design** - Floating bar with backdrop blur
- **Smooth Animations** - 60fps transitions and ripple effects
- **Tone.js Integration** - Direct control of audio transport

## Usage

```tsx
import { TransportControls } from '@/src/widgets/TransportControls';

function MyDAW() {
  return (
    <div>
      {/* Default size with all buttons */}
      <TransportControls />

      {/* Small size without record button */}
      <TransportControls size="sm" showRecordButton={false} />

      {/* Large size with custom styling */}
      <TransportControls size="lg" className="my-custom-class" />
    </div>
  );
}
```

## State Management

Uses Zustand store from `@/src/core/transport`:

```tsx
import { useTransport } from '@/src/core/transport';

function MyComponent() {
  const { state, isPlaying, play, pause, stop } = useTransport();

  // state: 'stopped' | 'playing' | 'paused' | 'recording'
  // isPlaying: boolean
  // play(), pause(), stop(), record() - async actions
}
```

## Integration

### With Audio Engine
The TransportControls widget directly controls Tone.js Transport:

```tsx
import { initializeTransport } from '@/src/core/transport';

// Initialize with BPM
initializeTransport(120);

// Now TransportControls will work
<TransportControls />
```

### With Other Widgets
TransportControls works standalone but can be combined with:

- **WaveformDisplay** - Sync playhead to transport position
- **TimelineRuler** - Display current time/position
- **MixerFader** - Control volume during playback
- **TrackCard** - Show recording state per track

## Test Criteria

- [x] Buttons trigger correct transport state changes
- [x] Visual feedback matches audio state (playing/paused/stopped/recording)
- [x] Keyboard shortcuts work (spacebar, R, S)
- [x] Smooth animations at 60fps
- [x] Works standalone without other widgets
- [x] Glassmorphic styling applied correctly
- [x] Neon glow effects on hover/active states
- [x] Ripple effect on button clicks
- [x] State indicator updates in real-time
- [x] Tone.js transport starts/stops correctly

## Performance

- **CPU usage**: < 2% (idle), < 3% (active)
- **Memory usage**: < 5MB
- **Frame rate**: 60fps animations
- **State updates**: < 16ms latency

## Keyboard Shortcuts Reference

| Key | Action | Description |
|-----|--------|-------------|
| `Space` | Play/Pause | Toggle playback |
| `R` | Record | Start/stop recording |
| `S` | Stop | Stop and reset to beginning |

## Styling

The widget uses CSS modules with design tokens from `/src/styles/glass-tokens.css`:

- **Glass effect**: `backdrop-filter: blur(20px)`
- **Neon blue**: `#00d4ff` (play button)
- **Record red**: `#ff2e4c` (record button)
- **Glow effects**: Box-shadow with color-matched blur
- **Smooth transitions**: `cubic-bezier(0.4, 0.0, 0.2, 1)`

## Known Limitations

- Keyboard shortcuts disabled when typing in input fields (intentional)
- Requires Tone.js audio context to be started (handled automatically on first interaction)
- Browser autoplay policies may require user gesture before audio starts
- State indicator hidden on mobile (<640px) for space optimization

## Future Enhancements

- [ ] Loop region controls
- [ ] Skip forward/backward buttons
- [ ] Metronome toggle
- [ ] BPM display and tap tempo
- [ ] MIDI controller support
- [ ] Customizable keyboard shortcuts
