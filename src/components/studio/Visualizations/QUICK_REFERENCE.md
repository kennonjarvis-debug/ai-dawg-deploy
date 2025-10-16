# Quick Reference Card - Audio Visualizations

## One-Line Setup

```typescript
import { VisualizationDashboard } from './components/Visualizations';
import './styles/visualizations.css';
```

## Essential Imports

```typescript
import type { PitchData, BeatData } from './components/Visualizations';
import { frequencyToNote, frequencyToCents } from './components/Visualizations/utils';
```

## Minimal Working Example

```typescript
function App() {
  const [audioContext] = useState(() => new AudioContext());
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    const node = audioContext.createAnalyser();
    node.fftSize = 2048;
    setAnalyser(node);
  }, []);

  return (
    <VisualizationDashboard
      audioBuffer={null}
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

## Component Cheat Sheet

### WaveformDisplay
```typescript
<WaveformDisplay
  audioBuffer={buffer}
  isPlaying={true}
  color="#4a9eff"
  height={128}
/>
```

### PitchDisplay
```typescript
<PitchDisplay
  pitchData={[{ frequency: 440, note: 'A4', cents: 0, confidence: 0.9, timestamp: Date.now() }]}
  width={800}
  height={200}
/>
```

### RhythmGrid
```typescript
<RhythmGrid
  beatData={{ bpm: 120, beatTimes: [], currentTime: 0 }}
  width={800}
  height={100}
/>
```

### VolumeMeter
```typescript
<VolumeMeter
  analyser={analyserNode}
  width={30}
  height={200}
  orientation="vertical"
/>
```

### Spectrogram
```typescript
<Spectrogram
  analyser={analyserNode}
  width={800}
  height={256}
  colorScheme="hot"
/>
```

### RecordingIndicator
```typescript
<RecordingIndicator
  isRecording={true}
  startTime={Date.now()}
  sampleRate={48000}
/>
```

## Common Patterns

### Start Recording
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const source = audioContext.createMediaStreamSource(stream);
source.connect(analyser);
setIsRecording(true);
setRecordingStartTime(Date.now());
```

### Add Pitch Data
```typescript
const newData: PitchData = {
  frequency: 440,
  note: frequencyToNote(440),
  cents: frequencyToCents(440),
  confidence: 0.9,
  timestamp: Date.now()
};
setPitchData(prev => [...prev, newData].slice(-500));
```

### Handle Seek
```typescript
const handleSeek = (time: number) => {
  source.stop();
  const newSource = audioContext.createBufferSource();
  newSource.buffer = audioBuffer;
  newSource.start(0, time);
};
```

## Utility Functions

```typescript
// Convert frequency to note
frequencyToNote(440) // "A4"

// Calculate cents deviation
frequencyToCents(442) // ~8 cents sharp

// Format time
formatTime(125.7) // "2:05.7"

// Calculate RMS
calculateRMS(dataArray) // 0.0 to 1.0

// Convert to dB
rmsToDb(0.5) // -6.02 dB
```

## Performance Tips

```typescript
// Limit data history
setPitchData(prev => prev.slice(-500));

// Use optimal FFT size
analyser.fftSize = 2048;

// Throttle updates
const throttledUpdate = throttle(update, 16); // ~60 FPS

// Clean up animations
useEffect(() => {
  return () => cancelAnimationFrame(animationId);
}, []);
```

## Styling Classes

```css
.visualization-dashboard        /* Main container */
.viz-tabs                      /* Tab navigation */
.viz-tab.active                /* Active tab */
.recording-indicator.active    /* Recording state */
.pitch-canvas                  /* Pitch display canvas */
.rhythm-canvas                 /* Rhythm grid canvas */
.volume-meter                  /* Volume meter */
.spectrogram-canvas            /* Spectrogram */
```

## Common Issues & Fixes

### No microphone access
```typescript
try {
  await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    alert('Please grant microphone permission');
  }
}
```

### Waveform not showing
```typescript
// Ensure container has dimensions
<div style={{ width: '800px', height: '128px' }}>
  <WaveformDisplay {...props} />
</div>
```

### Low FPS
```typescript
// Reduce FFT size
analyser.fftSize = 1024;

// Limit data points
pitchData.slice(-200)

// Use throttling
throttle(updateFn, 50) // 20 FPS
```

## TypeScript Types

```typescript
interface PitchData {
  frequency: number;    // Hz
  note: string;         // "A4"
  cents: number;        // -50 to +50
  confidence: number;   // 0.0 to 1.0
  timestamp: number;    // ms
}

interface BeatData {
  bpm: number;
  beatTimes: number[];
  currentTime: number;
  beatsPerMeasure?: number;
}
```

## Default Values

| Component | Width | Height | Color | Orientation |
|-----------|-------|--------|-------|-------------|
| WaveformDisplay | - | 128 | #4a9eff | - |
| PitchDisplay | 800 | 200 | - | - |
| RhythmGrid | 800 | 100 | - | - |
| VolumeMeter | 30 | 200 | - | vertical |
| Spectrogram | 800 | 256 | hot | - |

## Color Codes

```typescript
// Status colors
'#00ff00' // Green - Good/On-pitch
'#ffff00' // Yellow - Warning/Close
'#ff8800' // Orange - Caution
'#ff4444' // Red - Danger/Off-pitch

// UI colors
'#4a9eff' // Accent blue
'#1a1a1a' // Background dark
'#2a2a2a' // Background light
```

## Browser Support

- Chrome 89+ ✓
- Firefox 88+ ✓
- Safari 14.1+ ✓
- Edge 89+ ✓
- Mobile: Limited

## Key Files

```
src/components/Visualizations/
├── index.ts              # Exports
├── types.ts              # TypeScript types
├── utils.ts              # Helper functions
├── VisualizationDashboard.tsx
└── [individual components]

src/styles/
└── visualizations.css    # Styles

Documentation:
├── README.md             # Full docs
├── TESTING.md            # Testing guide
├── INTEGRATION.md        # Integration guide
└── QUICK_REFERENCE.md    # This file
```

## Need Help?

1. Check `README.md` for detailed API docs
2. See `INTEGRATION.md` for complete examples
3. Review `TESTING.md` for troubleshooting
4. Examine `VisualizationExample.tsx` for working code
