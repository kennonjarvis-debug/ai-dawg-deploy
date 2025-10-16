# Integration Guide

Complete guide for integrating the Audio Visualization Components with other parts of the Freestyle Studio application.

## Table of Contents

1. [Quick Start Integration](#quick-start-integration)
2. [Integration with Agent 1 (UI Layout)](#integration-with-agent-1-ui-layout)
3. [Integration with Agent 2 (Pitch Detection)](#integration-with-agent-2-pitch-detection)
4. [Integration with Audio Recording System](#integration-with-audio-recording-system)
5. [State Management](#state-management)
6. [Event Handling](#event-handling)
7. [Complete Example](#complete-example)
8. [Best Practices](#best-practices)

## Quick Start Integration

### Step 1: Import Styles

In your main `App.tsx` or `main.tsx`:

```typescript
import './styles/visualizations.css';
```

### Step 2: Import Components

```typescript
import { VisualizationDashboard } from './components/Visualizations';
import type { PitchData, BeatData } from './components/Visualizations';
```

### Step 3: Set Up Audio Context

```typescript
import { useEffect, useState } from 'react';

function App() {
  const [audioContext] = useState(() => new AudioContext());
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;
    setAnalyser(analyserNode);
  }, [audioContext]);

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

## Integration with Agent 1 (UI Layout)

### Scenario: Embedding in Main Layout

Assuming Agent 1 has created a layout component like this:

```typescript
// Agent 1's Layout Component
function MainLayout({ children }) {
  return (
    <div className="app-container">
      <Header />
      <div className="main-content">
        <Sidebar />
        <div className="content-area">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Integration:

```typescript
import { MainLayout } from './components/Layout';
import { VisualizationDashboard } from './components/Visualizations';

function App() {
  // ... state management ...

  return (
    <MainLayout>
      <VisualizationDashboard
        audioBuffer={audioBuffer}
        pitchData={pitchData}
        beatData={beatData}
        analyser={analyser}
        isRecording={isRecording}
        isPlaying={isPlaying}
        recordingStartTime={recordingStartTime}
      />
    </MainLayout>
  );
}
```

### Responsive Container Sizing

```typescript
function ResponsiveVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return (
    <div ref={containerRef} className="viz-container">
      {/* Pass dimensions to individual components */}
      <PitchDisplay
        pitchData={pitchData}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
}
```

## Integration with Agent 2 (Pitch Detection)

### Scenario: Using Pitch Detection Data

Assuming Agent 2 provides a pitch detection service:

```typescript
// Agent 2's Pitch Detector
import { PitchDetector } from 'pitchy';

class PitchDetectionService {
  private detector: PitchDetector;
  private analyser: AnalyserNode;

  constructor(audioContext: AudioContext) {
    this.analyser = audioContext.createAnalyser();
    this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);
  }

  detectPitch(input: Float32Array): { frequency: number; clarity: number } {
    return this.detector.findPitch(input, this.analyser.context.sampleRate);
  }
}
```

### Integration:

```typescript
import { PitchDetectionService } from './services/PitchDetection';
import { PitchDisplay, PitchData } from './components/Visualizations';
import { frequencyToNote, frequencyToCents } from './components/Visualizations/utils';

function FreestyleRecorder() {
  const [pitchData, setPitchData] = useState<PitchData[]>([]);
  const [pitchService] = useState(() => new PitchDetectionService(audioContext));

  useEffect(() => {
    const interval = setInterval(() => {
      const dataArray = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(dataArray);

      const { frequency, clarity } = pitchService.detectPitch(dataArray);

      if (frequency > 0 && clarity > 0.8) {
        const newPitchData: PitchData = {
          frequency,
          note: frequencyToNote(frequency),
          cents: frequencyToCents(frequency),
          confidence: clarity,
          timestamp: Date.now()
        };

        setPitchData(prev => [...prev, newPitchData].slice(-500));
      }
    }, 100); // 10Hz update rate

    return () => clearInterval(interval);
  }, [pitchService, analyser]);

  return <PitchDisplay pitchData={pitchData} />;
}
```

### Real-time Processing with Web Workers

For better performance, use Web Workers:

```typescript
// pitchWorker.ts
self.onmessage = (e) => {
  const { audioData, sampleRate } = e.data;

  // Perform pitch detection
  const result = detectPitch(audioData, sampleRate);

  self.postMessage(result);
};

// Main component
function PitchVisualization() {
  const [pitchData, setPitchData] = useState<PitchData[]>([]);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('./pitchWorker.ts', import.meta.url));

    workerRef.current.onmessage = (e) => {
      const result = e.data;
      setPitchData(prev => [...prev, result].slice(-500));
    };

    return () => workerRef.current?.terminate();
  }, []);

  // Send audio data to worker
  const processAudio = (audioData: Float32Array) => {
    workerRef.current?.postMessage({
      audioData,
      sampleRate: audioContext.sampleRate
    });
  };

  return <PitchDisplay pitchData={pitchData} />;
}
```

## Integration with Audio Recording System

### Setting Up Recording Pipeline

```typescript
import { useState, useRef, useCallback } from 'react';
import { VisualizationDashboard } from './components/Visualizations';

function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const audioContextRef = useRef<AudioContext>();
  const mediaRecorderRef = useRef<MediaRecorder>();
  const analyserRef = useRef<AnalyserNode>();
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 48000 });
      }

      // Create analyser
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect microphone to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        // Convert to AudioBuffer
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
        setAudioBuffer(audioBuffer);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingStartTime(Date.now());

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  return (
    <div>
      <div className="controls">
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
      </div>

      <VisualizationDashboard
        audioBuffer={audioBuffer}
        pitchData={[]} // Connect to pitch detection
        beatData={{ bpm: 120, beatTimes: [], currentTime: 0 }}
        analyser={analyserRef.current || null}
        isRecording={isRecording}
        isPlaying={false}
        recordingStartTime={recordingStartTime}
      />
    </div>
  );
}
```

## State Management

### Using Zustand (Recommended)

```typescript
import create from 'zustand';
import type { PitchData, BeatData } from './components/Visualizations';

interface AudioState {
  // Audio context
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;

  // Recording state
  isRecording: boolean;
  recordingStartTime: number | null;

  // Playback state
  isPlaying: boolean;
  currentTime: number;

  // Audio data
  audioBuffer: AudioBuffer | null;
  backingTrackBuffer: AudioBuffer | null;

  // Analysis data
  pitchData: PitchData[];
  beatData: BeatData;

  // Actions
  initializeAudio: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  setAudioBuffer: (buffer: AudioBuffer) => void;
  addPitchData: (data: PitchData) => void;
  updateBeatData: (data: Partial<BeatData>) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  audioContext: null,
  analyser: null,
  isRecording: false,
  recordingStartTime: null,
  isPlaying: false,
  currentTime: 0,
  audioBuffer: null,
  backingTrackBuffer: null,
  pitchData: [],
  beatData: {
    bpm: 120,
    beatTimes: [],
    currentTime: 0,
    beatsPerMeasure: 4
  },

  initializeAudio: async () => {
    const audioContext = new AudioContext({ sampleRate: 48000 });
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;

    set({ audioContext, analyser });
  },

  startRecording: () => {
    set({
      isRecording: true,
      recordingStartTime: Date.now(),
      pitchData: [] // Clear previous data
    });
  },

  stopRecording: () => {
    set({ isRecording: false });
  },

  setAudioBuffer: (buffer) => {
    set({ audioBuffer: buffer });
  },

  addPitchData: (data) => {
    set(state => ({
      pitchData: [...state.pitchData, data].slice(-500) // Keep last 500
    }));
  },

  updateBeatData: (data) => {
    set(state => ({
      beatData: { ...state.beatData, ...data }
    }));
  }
}));

// Usage in component
function App() {
  const {
    audioBuffer,
    pitchData,
    beatData,
    analyser,
    isRecording,
    isPlaying,
    recordingStartTime
  } = useAudioStore();

  return (
    <VisualizationDashboard
      audioBuffer={audioBuffer}
      pitchData={pitchData}
      beatData={beatData}
      analyser={analyser}
      isRecording={isRecording}
      isPlaying={isPlaying}
      recordingStartTime={recordingStartTime}
    />
  );
}
```

## Event Handling

### Handling Seek Events

```typescript
function AudioPlayer() {
  const sourceRef = useRef<AudioBufferSourceNode>();

  const handleSeek = useCallback((time: number) => {
    // Stop current playback
    sourceRef.current?.stop();

    // Create new source at specific time
    if (audioBuffer && audioContext) {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0, time); // Start at specific time
      sourceRef.current = source;
    }
  }, [audioBuffer, audioContext]);

  return (
    <VisualizationDashboard
      {...props}
      onSeek={handleSeek}
    />
  );
}
```

### Custom Event Emitter

```typescript
class AudioEventEmitter extends EventTarget {
  emitPitchDetected(data: PitchData) {
    this.dispatchEvent(new CustomEvent('pitchDetected', { detail: data }));
  }

  emitBeatDetected(beatTime: number) {
    this.dispatchEvent(new CustomEvent('beatDetected', { detail: beatTime }));
  }

  onPitchDetected(callback: (data: PitchData) => void) {
    this.addEventListener('pitchDetected', (e: any) => callback(e.detail));
  }

  onBeatDetected(callback: (time: number) => void) {
    this.addEventListener('beatDetected', (e: any) => callback(e.detail));
  }
}

// Usage
const audioEvents = new AudioEventEmitter();

audioEvents.onPitchDetected((data) => {
  console.log('Pitch detected:', data);
  // Update visualization
});
```

## Complete Example

### Full-Featured Freestyle Studio

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { VisualizationDashboard } from './components/Visualizations';
import type { PitchData, BeatData } from './components/Visualizations';
import { frequencyToNote, frequencyToCents } from './components/Visualizations/utils';
import './styles/visualizations.css';

function FreestyleStudio() {
  // Audio state
  const [audioContext] = useState(() => new AudioContext({ sampleRate: 48000 }));
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [backingTrackBuffer, setBackingTrackBuffer] = useState<AudioBuffer | null>(null);

  // Analysis data
  const [pitchData, setPitchData] = useState<PitchData[]>([]);
  const [beatData, setBeatData] = useState<BeatData>({
    bpm: 120,
    beatTimes: [],
    currentTime: 0,
    beatsPerMeasure: 4
  });

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder>();
  const chunksRef = useRef<Blob[]>([]);
  const pitchDetectionRef = useRef<number>();

  // Initialize audio analyser
  useEffect(() => {
    const analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    analyserNode.smoothingTimeConstant = 0.8;
    setAnalyser(analyserNode);
  }, [audioContext]);

  // Pitch detection loop
  useEffect(() => {
    if (!analyser || !isRecording) return;

    const detectPitch = () => {
      const dataArray = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(dataArray);

      // Simple autocorrelation pitch detection
      const pitch = autoCorrelate(dataArray, audioContext.sampleRate);

      if (pitch > 0) {
        const newData: PitchData = {
          frequency: pitch,
          note: frequencyToNote(pitch),
          cents: frequencyToCents(pitch),
          confidence: 0.9,
          timestamp: Date.now()
        };

        setPitchData(prev => [...prev, newData].slice(-500));
      }

      pitchDetectionRef.current = requestAnimationFrame(detectPitch);
    };

    detectPitch();

    return () => {
      if (pitchDetectionRef.current) {
        cancelAnimationFrame(pitchDetectionRef.current);
      }
    };
  }, [analyser, isRecording, audioContext]);

  // Beat tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setBeatData(prev => ({
        ...prev,
        currentTime: prev.currentTime + 0.1
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      const source = audioContext.createMediaStreamSource(stream);
      if (analyser) {
        source.connect(analyser);
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        chunksRef.current = [];

        const arrayBuffer = await blob.arrayBuffer();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
        setAudioBuffer(buffer);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setPitchData([]);

    } catch (error) {
      console.error('Recording failed:', error);
      alert('Could not access microphone');
    }
  }, [audioContext, analyser]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  }, []);

  // Load backing track
  const loadBackingTrack = useCallback(async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    setBackingTrackBuffer(buffer);
  }, [audioContext]);

  // Handle seek
  const handleSeek = useCallback((time: number) => {
    console.log('Seek to:', time);
    // Implement playback seeking
  }, []);

  return (
    <div className="freestyle-studio">
      <header>
        <h1>Freestyle Studio</h1>
      </header>

      <div className="controls">
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => e.target.files?.[0] && loadBackingTrack(e.target.files[0])}
        />
      </div>

      <VisualizationDashboard
        audioBuffer={audioBuffer}
        backingTrackBuffer={backingTrackBuffer}
        pitchData={pitchData}
        beatData={beatData}
        analyser={analyser}
        isRecording={isRecording}
        isPlaying={isPlaying}
        recordingStartTime={recordingStartTime}
        onSeek={handleSeek}
        showVolumeMeter={true}
        defaultView="waveform"
      />
    </div>
  );
}

// Simple autocorrelation pitch detection
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let best_offset = -1;
  let best_correlation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.01) return -1;

  let lastCorrelation = 1;
  for (let offset = 1; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;

    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }

    correlation = 1 - correlation / MAX_SAMPLES;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      const foundGoodCorrelation = correlation > best_correlation;
      if (foundGoodCorrelation) {
        best_correlation = correlation;
        best_offset = offset;
      }
    }

    lastCorrelation = correlation;
  }

  if (best_correlation > 0.01) {
    return sampleRate / best_offset;
  }

  return -1;
}

export default FreestyleStudio;
```

## Best Practices

### 1. Performance Optimization

```typescript
// Use React.memo for expensive components
export const PitchDisplay = React.memo(({ pitchData, ...props }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.pitchData.length === nextProps.pitchData.length;
});

// Throttle updates
import { throttle } from './utils';

const throttledUpdate = useCallback(
  throttle((data) => {
    updateVisualization(data);
  }, 16), // ~60 FPS
  []
);
```

### 2. Error Handling

```typescript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    // Permission denied
  } else if (error.name === 'NotFoundError') {
    // No microphone found
  } else {
    // Other error
  }
}
```

### 3. Cleanup

```typescript
useEffect(() => {
  // Setup
  const interval = setInterval(() => { }, 100);

  // Cleanup
  return () => {
    clearInterval(interval);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, []);
```

### 4. Type Safety

```typescript
// Always use proper types
const pitchData: PitchData[] = [];
const beatData: BeatData = { ... };

// Validate props
interface Props {
  analyser: AnalyserNode | null;
}

function Component({ analyser }: Props) {
  if (!analyser) return null;
  // ...
}
```

This integration guide should help you seamlessly incorporate the visualization components into your Freestyle Studio application!
