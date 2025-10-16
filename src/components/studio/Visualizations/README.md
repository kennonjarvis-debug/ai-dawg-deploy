# Audio Visualization Components

A comprehensive suite of real-time audio visualization components for the Freestyle Studio application, built with React, TypeScript, and the Web Audio API.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Performance](#performance)
- [Browser Compatibility](#browser-compatibility)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

This visualization system provides professional-grade audio visualizations including:

- **Waveform Display** - Interactive waveform visualization using WaveSurfer.js
- **Pitch Display** - Real-time pitch tracking with note detection and cents deviation
- **Rhythm Grid** - Beat-aligned grid with measure markers and timing feedback
- **Volume Meter** - Professional VU meter with peak detection and clip warnings
- **Spectrogram** - Frequency spectrum over time with multiple color schemes
- **Recording Indicator** - Status display with timer and file size estimation

All components are optimized for 60 FPS performance and support both light and dark themes.

## Components

### VisualizationDashboard

The main component that combines all visualizations into a unified interface with tabs.

```typescript
import { VisualizationDashboard } from './components/Visualizations';

<VisualizationDashboard
  audioBuffer={audioBuffer}
  pitchData={pitchData}
  beatData={beatData}
  analyser={analyserNode}
  isRecording={false}
  isPlaying={true}
  recordingStartTime={null}
  onSeek={(time) => console.log('Seek to:', time)}
/>
```

### Individual Components

Each visualization is also available as a standalone component:

```typescript
import {
  WaveformDisplay,
  PitchDisplay,
  RhythmGrid,
  VolumeMeter,
  Spectrogram,
  RecordingIndicator
} from './components/Visualizations';
```

## Installation

The required dependencies are already included in `package.json`:

- `wavesurfer.js` - For waveform rendering
- `react` - UI framework
- `typescript` - Type safety

To import the styles, add to your main App component:

```typescript
import './styles/visualizations.css';
```

## Quick Start

### 1. Basic Usage

```typescript
import React, { useState, useEffect } from 'react';
import { VisualizationDashboard } from './components/Visualizations';
import './styles/visualizations.css';

function App() {
  const [audioContext] = useState(() => new AudioContext());
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    setAnalyser(analyserNode);
  }, [audioContext]);

  return (
    <VisualizationDashboard
      audioBuffer={audioBuffer}
      pitchData={[]}
      beatData={{ bpm: 120, beatTimes: [], currentTime: 0 }}
      analyser={analyser}
      isRecording={false}
      isPlaying={false}
      recordingStartTime={null}
    />
  );
}
```

### 2. With Microphone Input

```typescript
const setupMicrophone = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);
};
```

### 3. With Audio File

```typescript
const loadAudioFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  setAudioBuffer(audioBuffer);
};
```

## API Reference

### VisualizationDashboard Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `audioBuffer` | `AudioBuffer \| null` | Yes | Audio buffer to visualize |
| `backingTrackBuffer` | `AudioBuffer \| null` | No | Separate backing track buffer |
| `pitchData` | `PitchData[]` | Yes | Array of pitch detection results |
| `beatData` | `BeatData` | Yes | Beat/tempo information |
| `analyser` | `AnalyserNode \| null` | Yes | Web Audio API analyser node |
| `isRecording` | `boolean` | Yes | Recording state |
| `isPlaying` | `boolean` | Yes | Playback state |
| `recordingStartTime` | `number \| null` | Yes | Recording start timestamp |
| `onSeek` | `(time: number) => void` | No | Seek callback |
| `showVolumeMeter` | `boolean` | No | Show volume meter (default: true) |
| `defaultView` | `'waveform' \| 'pitch' \| 'rhythm' \| 'spectrum'` | No | Initial view |

### PitchData Interface

```typescript
interface PitchData {
  frequency: number;    // Hz
  note: string;         // e.g., "A4"
  cents: number;        // Deviation from perfect pitch (-50 to +50)
  confidence: number;   // 0.0 to 1.0
  timestamp: number;    // ms
}
```

### BeatData Interface

```typescript
interface BeatData {
  bpm: number;              // Beats per minute
  beatTimes: number[];      // Array of beat timestamps
  currentTime: number;      // Current time in seconds
  beatsPerMeasure?: number; // Default: 4
}
```

### WaveformDisplay Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `audioBuffer` | `AudioBuffer \| null` | - | Audio to display |
| `isPlaying` | `boolean` | - | Playback state |
| `onSeek` | `(time: number) => void` | - | Seek callback |
| `color` | `string` | `'#4a9eff'` | Waveform color |
| `height` | `number` | `128` | Height in pixels |
| `showControls` | `boolean` | `true` | Show zoom controls |

### PitchDisplay Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pitchData` | `PitchData[]` | - | Pitch history |
| `targetNote` | `string` | `'A4'` | Target note |
| `width` | `number` | `800` | Width in pixels |
| `height` | `number` | `200` | Height in pixels |
| `showHistory` | `boolean` | `true` | Show pitch history graph |

### RhythmGrid Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `beatData` | `BeatData` | - | Beat information |
| `width` | `number` | `800` | Width in pixels |
| `height` | `number` | `100` | Height in pixels |
| `beatsVisible` | `number` | `8` | Number of beats to show |

### VolumeMeter Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `analyser` | `AnalyserNode \| null` | - | Audio analyser |
| `width` | `number` | `30` | Width in pixels |
| `height` | `number` | `200` | Height in pixels |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Meter orientation |
| `showPeak` | `boolean` | `true` | Show peak indicator |
| `showClipWarning` | `boolean` | `true` | Show clip warning |

### Spectrogram Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `analyser` | `AnalyserNode \| null` | - | Audio analyser |
| `width` | `number` | `800` | Width in pixels |
| `height` | `number` | `256` | Height in pixels |
| `colorScheme` | `'hot' \| 'cool' \| 'rainbow' \| 'grayscale'` | `'hot'` | Color mapping |
| `minFrequency` | `number` | `0` | Minimum frequency (Hz) |
| `maxFrequency` | `number` | `8000` | Maximum frequency (Hz) |

### RecordingIndicator Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isRecording` | `boolean` | - | Recording state |
| `startTime` | `number \| null` | - | Start timestamp |
| `sampleRate` | `number` | `48000` | Sample rate (Hz) |
| `channels` | `number` | `2` | Number of channels |
| `bitDepth` | `number` | `16` | Bit depth |

## Performance

### Optimization Techniques

1. **RequestAnimationFrame** - All animations use RAF for smooth 60 FPS
2. **Canvas Rendering** - Direct canvas manipulation for minimal overhead
3. **Data Throttling** - Pitch data limited to last 500 points
4. **Efficient Updates** - Only redraw on data changes
5. **Memory Management** - Cleanup on component unmount

### Performance Metrics

| Component | Target FPS | CPU Usage | Memory |
|-----------|-----------|-----------|---------|
| Waveform | 60 | Low | ~5MB |
| Pitch Display | 60 | Low | ~2MB |
| Rhythm Grid | 60 | Very Low | ~1MB |
| Volume Meter | 60 | Very Low | ~1MB |
| Spectrogram | 60 | Medium | ~10MB |

### Performance Tips

```typescript
// Limit pitch data history
setPitchData(prev => prev.slice(-500));

// Use appropriate FFT sizes
analyser.fftSize = 2048; // Good balance

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, []);
```

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 89+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14.1+ | Full support |
| Edge | 89+ | Full support |
| Opera | 75+ | Full support |

### Required APIs

- Web Audio API
- Canvas API
- MediaDevices API (for microphone)
- RequestAnimationFrame

### Feature Detection

```typescript
const checkSupport = () => {
  const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
  const hasCanvas = !!document.createElement('canvas').getContext;
  const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return hasWebAudio && hasCanvas && hasMediaDevices;
};
```

## Examples

### Example 1: Standalone Pitch Display

```typescript
import { PitchDisplay, PitchData } from './components/Visualizations';

function PitchMonitor() {
  const [pitchData, setPitchData] = useState<PitchData[]>([]);

  // Update pitch data from your pitch detection algorithm
  useEffect(() => {
    const interval = setInterval(() => {
      const newData: PitchData = {
        frequency: 440,
        note: 'A4',
        cents: 0,
        confidence: 0.95,
        timestamp: Date.now()
      };
      setPitchData(prev => [...prev, newData].slice(-500));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return <PitchDisplay pitchData={pitchData} />;
}
```

### Example 2: Custom Waveform Colors

```typescript
<WaveformDisplay
  audioBuffer={audioBuffer}
  isPlaying={isPlaying}
  color="#ff0000"  // Red waveform
  height={150}
  showControls={true}
/>
```

### Example 3: Horizontal Volume Meter

```typescript
<VolumeMeter
  analyser={analyser}
  width={200}
  height={30}
  orientation="horizontal"
  showPeak={true}
  showClipWarning={true}
/>
```

### Example 4: Multiple Waveforms

```typescript
<div>
  <WaveformDisplay
    audioBuffer={backingTrack}
    isPlaying={isPlaying}
    color="#4a9eff"
    height={100}
  />
  <WaveformDisplay
    audioBuffer={vocals}
    isPlaying={isPlaying}
    color="#ff4444"
    height={100}
  />
</div>
```

## Troubleshooting

### Issue: Visualizations not updating

**Solution:** Ensure the analyser node is properly connected to an audio source:

```typescript
const source = audioContext.createMediaStreamSource(stream);
source.connect(analyser);
// Don't forget to connect analyser to destination if you want audio output
analyser.connect(audioContext.destination);
```

### Issue: Poor performance / low FPS

**Solutions:**
- Reduce FFT size: `analyser.fftSize = 1024`
- Limit pitch data history: `pitchData.slice(-200)`
- Use smaller canvas sizes
- Disable unused visualizations

### Issue: Waveform not displaying

**Solutions:**
- Ensure audioBuffer is properly decoded
- Check that WaveSurfer.js is installed
- Verify container element has non-zero dimensions

### Issue: Microphone access denied

**Solution:** Check browser permissions and use HTTPS:

```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  console.error('Microphone access denied:', error);
  // Provide fallback UI
}
```

### Issue: Canvas rendering issues on mobile

**Solutions:**
- Use smaller canvas dimensions on mobile
- Implement responsive sizing
- Consider using lower frame rates on mobile

```typescript
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const targetFPS = isMobile ? 30 : 60;
```

## Integration with Other Agents

### Integration with Agent 2 (Pitch Detection)

```typescript
import { PitchDetector } from '../PitchDetection';
import { PitchDisplay } from './Visualizations';

const pitchDetector = new PitchDetector();
const pitchData = pitchDetector.getPitchHistory();

<PitchDisplay pitchData={pitchData} />
```

### Integration with Agent 1 (UI Layout)

```typescript
import { MainLayout } from '../Layout';
import { VisualizationDashboard } from './Visualizations';

<MainLayout>
  <VisualizationDashboard {...props} />
</MainLayout>
```

## Advanced Usage

### Custom Color Schemes

```typescript
// Define custom CSS variables
:root {
  --viz-accent: #ff00ff;
  --viz-success: #00ffff;
  --viz-danger: #ffff00;
}
```

### Dark/Light Theme Toggle

```typescript
const [theme, setTheme] = useState<'dark' | 'light'>('dark');

<div className={`visualization-dashboard ${theme === 'light' ? 'light-theme' : ''}`}>
  <VisualizationDashboard {...props} />
</div>
```

### Accessibility Features

- High contrast mode support
- Reduced motion support
- Keyboard navigation
- Screen reader friendly

## License

Part of the Freestyle Studio project.

## Contributing

For questions or contributions, please see the main project README.
