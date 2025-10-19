# DAWG AI EQ Plugins

Comprehensive suite of AI-powered EQ plugins for the DAWG DAWG AI.

## Overview

The DAWG AI EQ suite consists of four specialized EQ plugins, each designed for different mixing and mastering scenarios:

1. **AI Vintage EQ** - Classic analog-style EQ with harmonic enhancement
2. **AI Surgical EQ** - Precise digital EQ with problem frequency detection
3. **AI Mastering EQ** - Professional mastering EQ with tonal balance analysis
4. **AI Auto EQ** - Intelligent EQ that automatically adjusts based on source material

All plugins are manufactured by **DAWG AI** and categorized as **AI EQ** plugins.

## Plugin Details

### 1. AI Vintage EQ

**File**: `AIVintageEQ.ts`

**Features**:
- Vintage analog-style EQ modeling (Neve/API/SSL/Pultec)
- AI-powered harmonic enhancement and saturation
- Automatic warmth and character adjustment
- Musical frequency band selection (5 bands + HPF)
- Smart gain staging
- Even/odd harmonic control

**Parameters**:
- **AI Mode**: Enable/disable AI processing
- **AI Intensity**: Control strength of AI adjustments
- **Model Type**: Choose between Neve, API, SSL, or Pultec emulation
- **5 EQ Bands**: Low Shelf, Low-Mid Bell, Mid Bell, High-Mid Bell, High Shelf
- **High-Pass Filter**: Adjustable frequency and slope
- **Harmonic Enhancement**: Drive, Mix, Even/Odd harmonic balance
- **Auto Features**: Auto Warmth, Auto Character, Vintage Emulation

**Presets**:
- `warm-vocal` - Neve-style warm vocal EQ
- `punchy-drums` - API-style drum punch
- `ssl-bus` - SSL bus compression and EQ
- `pultec-low-end` - Pultec-style low-end enhancement

**Use Cases**:
- Vocal processing with vintage character
- Drum buss for analog warmth
- Adding color and harmonics to any source
- Mix bus processing

---

### 2. AI Surgical EQ

**File**: `AISurgicalEQ.ts`

**Features**:
- Surgical precision with up to 8 parametric bands
- AI-powered problem frequency detection
- Real-time spectrum analysis with problem highlighting
- Dynamic EQ mode for adaptive frequency control
- Linear phase option for mastering
- Smart Q auto-adjustment based on gain

**Parameters**:
- **AI Detection**: Enable/disable AI problem detection
- **AI Sensitivity**: Control detection sensitivity
- **Auto Correct**: Automatically fix detected problems
- **Dynamic EQ**: Enable dynamic (threshold-based) EQ
- **8 Parametric Bands**: Fully configurable (type, freq, gain, Q)
- **Problem Detection**: Resonances, Muddiness, Harshness, Boxiness, Sibilance
- **Smart Features**: Auto Q, Match Loudness, Show Problems
- **Processing**: Linear Phase, Oversampling (1x-4x)

**Presets**:
- `remove-resonance` - AI-detected resonance removal
- `de-mud` - Remove muddiness from 200-500Hz
- `de-harsh` - Tame harshness in 2-5kHz
- `vocal-cleanup` - Comprehensive vocal problem cleanup
- `mastering-linear` - Linear phase for mastering

**Use Cases**:
- Removing problem frequencies and resonances
- Surgical corrective EQ for any source
- Cleaning up vocals, guitars, drums
- Mastering with linear phase
- Dynamic EQ for adaptive control

---

### 3. AI Mastering EQ

**File**: `AIMasteringEQ.ts`

**Features**:
- Professional mastering-grade linear phase EQ
- AI-powered tonal balance analysis and matching
- Reference track comparison and matching
- Streaming service optimization (Spotify, Apple Music, etc.)
- Mid/Side processing for stereo control
- Advanced metering and visualization

**Parameters**:
- **AI Tonal Balance**: Automatic tonal balance analysis
- **Target Profile**: Neutral/Warm/Bright/Dark/Custom
- **Reference Match**: Match tonal balance to reference track
- **Streaming Optimization**: Optimize for Spotify/Apple/YouTube/Tidal
- **Loudness Target**: Target LUFS for streaming services
- **6 Mastering Bands**: Low Shelf, Low-Mid, Mid, High-Mid, Presence, High Shelf
- **Mid/Side Processing**: Independent M/S control, stereo width
- **Processing**: Linear/Minimum/Mixed phase, latency control, 1x-8x oversampling
- **Analysis**: Show spectrum, target curve, difference

**Presets**:
- `neutral-mastering` - Transparent mastering with balance analysis
- `warm-mastering` - Warm, musical mastering
- `bright-modern` - Modern, bright mastering
- `spotify-optimized` - Optimized for Spotify (-14 LUFS)
- `apple-music` - Optimized for Apple Music (-16 LUFS)
- `reference-match` - Match tonal balance to reference
- `mid-side-width` - Enhanced stereo width with M/S

**Use Cases**:
- Final mastering EQ
- Tonal balance correction
- Reference track matching
- Streaming optimization
- Stereo enhancement with M/S
- Professional mastering workflow

---

### 4. AI Auto EQ

**File**: `AIAutoEQ.ts`

**Features**:
- Fully automatic EQ based on real-time audio analysis
- Source type detection (vocals, drums, bass, guitars, keys, etc.)
- Genre-aware EQ curves
- One-click automatic mixing
- Learn mode to adapt to user preferences
- Smart preset suggestions

**Parameters**:
- **Auto Mode**: Enable fully automatic EQ
- **AI Strength**: Control strength of AI adjustments
- **Adaptation Speed**: How quickly AI adapts to changes
- **Learn Mode**: Learns from user's manual adjustments
- **Source Detection**: Auto-detect source type or manual override
- **Genre Detection**: Auto-detect musical genre
- **EQ Goal**: Clarity/Warmth/Brightness/Punch/Balance/Custom
- **Target Curve**: Flat/Musical/Modern/Vintage
- **Problem Solving**: Auto-fix mud, harshness, resonance, boxiness, enhance air
- **Dynamic Adaptation**: Continuous real-time adjustment
- **User Bias**: Manual low/mid/high bias controls
- **Processing**: Analysis resolution, quality, latency mode

**Presets**:
- `auto-vocal` - Automatic vocal optimization
- `auto-drums` - Automatic drum kit optimization
- `auto-bass` - Automatic bass optimization
- `auto-mix-bus` - Automatic mix bus balancing
- `gentle-correction` - Subtle automatic corrections
- `aggressive-fix` - Strong automatic problem correction
- `learn-my-style` - Learns from manual adjustments

**Use Cases**:
- Quick automatic EQ for any source
- Starting point for manual adjustments
- Learning mixing preferences
- Automatic problem solving
- Fast workflow for live mixing
- Educational tool to understand EQ

---

## AI EQ Engine

**File**: `AIEQEngine.ts`

The core analysis and processing engine that powers all AI EQ plugins.

**Capabilities**:
- Real-time spectral analysis (FFT-based)
- Problem frequency detection (resonances, mud, harshness, boxiness, sibilance)
- Tonal balance analysis (8-band: sub-bass to air)
- Automatic EQ curve generation based on goals
- Source type detection (vocal, drums, bass, guitar, etc.)
- Reference track matching
- Genre classification

**Key Methods**:
```typescript
// Analyze frequency spectrum
analyzeSpectrum(audioBuffer: Float32Array[]): FrequencyBand[]

// Detect problem frequencies
detectProblems(audioBuffer: Float32Array[]): ProblemFrequency[]

// Analyze tonal balance
analyzeTonalBalance(audioBuffer: Float32Array[]): TonalBalance

// Generate auto EQ curve
generateAutoEQCurve(audioBuffer, goal): EQCurvePoint[]

// Detect source type
detectSourceType(audioBuffer: Float32Array[]): SourceCharacteristics

// Match reference track
matchReference(source, reference): EQCurvePoint[]
```

## Integration

### Basic Usage

```typescript
import {
  AI_VINTAGE_EQ_PLUGIN,
  AI_SURGICAL_EQ_PLUGIN,
  AI_MASTERING_EQ_PLUGIN,
  AI_AUTO_EQ_PLUGIN,
  DAWG_AI_EQ_PLUGINS,
  aiEQEngine
} from '@/plugins/ai-eq';

// Load a plugin
const vintageEQ = AI_VINTAGE_EQ_PLUGIN;
console.log(vintageEQ.name); // "AI Vintage EQ"
console.log(vintageEQ.manufacturer); // "DAWG AI"
console.log(vintageEQ.category); // "AI EQ"

// Get all AI EQ plugins
DAWG_AI_EQ_PLUGINS.forEach(plugin => {
  console.log(`${plugin.name} by ${plugin.manufacturer}`);
});

// Use the AI EQ Engine
const audioBuffer = [new Float32Array(48000), new Float32Array(48000)];
const problems = aiEQEngine.detectProblems(audioBuffer);
const balance = aiEQEngine.analyzeTonalBalance(audioBuffer);
const autoEQ = aiEQEngine.generateAutoEQCurve(audioBuffer, 'clarity');
```

### With Plugin Controller

```typescript
import { PluginController } from '@/plugins/client/PluginController';

const controller = new PluginController('ws://localhost:9001');
await controller.connect();

// Load AI Vintage EQ
const instance = await controller.loadPlugin(
  'dawg-ai-vintage-eq',
  'track-1',
  0
);

// Set parameters
await controller.setParameter(instance.instanceId, 'ai_mode', 1.0);
await controller.setParameter(instance.instanceId, 'model_type', 0.0); // Neve
await controller.setParameter(instance.instanceId, 'harmonic_drive', 0.4);

// Load preset
await controller.applyPreset(instance.instanceId, 'warm-vocal');
```

### AI Analysis Integration

```typescript
import { aiEQEngine } from '@/plugins/ai-eq';

// Analyze audio
const audioBuffer = getAudioBuffer(); // Your audio buffer
const analysis = {
  spectrum: aiEQEngine.analyzeSpectrum(audioBuffer),
  problems: aiEQEngine.detectProblems(audioBuffer),
  balance: aiEQEngine.analyzeTonalBalance(audioBuffer),
  source: aiEQEngine.detectSourceType(audioBuffer)
};

console.log(`Detected source: ${analysis.source.type}`);
console.log(`Confidence: ${analysis.source.confidence * 100}%`);
console.log(`Found ${analysis.problems.length} problems`);

// Generate automatic corrections
const autoEQ = aiEQEngine.generateAutoEQCurve(audioBuffer, 'clarity');
autoEQ.forEach(point => {
  console.log(`${point.frequency}Hz: ${point.gain}dB (Q: ${point.q})`);
});
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│         DAWG AI EQ Plugin Suite                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  │
│  │  Vintage  │  │ Surgical  │  │ Mastering │  │
│  │    EQ     │  │    EQ     │  │    EQ     │  │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  │
│        │              │              │         │
│        │       ┌──────┴──────┐       │         │
│        │       │   Auto EQ   │       │         │
│        │       └──────┬──────┘       │         │
│        │              │              │         │
│        └──────────┬───┴──────────────┘         │
│                   │                            │
│            ┌──────▼──────┐                     │
│            │  AI EQ      │                     │
│            │  Engine     │                     │
│            └─────────────┘                     │
│                                                │
│  - Spectral Analysis                          │
│  - Problem Detection                          │
│  - Tonal Balance                              │
│  - Source Detection                           │
│  - Auto Curve Generation                      │
│                                                │
└─────────────────────────────────────────────────┘
```

## File Structure

```
src/plugins/ai-eq/
├── AIVintageEQ.ts       # Vintage analog-style EQ
├── AISurgicalEQ.ts      # Surgical precision EQ
├── AIMasteringEQ.ts     # Professional mastering EQ
├── AIAutoEQ.ts          # Intelligent auto EQ
├── AIEQEngine.ts        # Core analysis engine
├── index.ts             # Exports
└── README.md            # This file
```

## TypeScript Types

All plugins are fully typed with TypeScript:

```typescript
// Plugin info
interface AIVintageEQPlugin extends PluginInfo {
  id: 'dawg-ai-vintage-eq';
  manufacturer: 'DAWG AI';
  category: 'AI EQ';
  isAI: true;
}

// Parameters
interface AIVintageEQParameters {
  aiMode: PluginParameter;
  lowFreq: PluginParameter;
  // ... etc
}

// Analysis results
interface ProblemFrequency {
  frequency: number;
  type: 'resonance' | 'mud' | 'harshness' | 'boxiness' | 'sibilance';
  severity: 'mild' | 'moderate' | 'severe';
  suggestedGain: number;
  suggestedQ: number;
  description: string;
}
```

## Key Features Summary

### AI Vintage EQ
- 4 analog models (Neve/API/SSL/Pultec)
- Harmonic enhancement (even/odd)
- 5 musical EQ bands
- Auto warmth and character

### AI Surgical EQ
- 8 parametric bands
- AI problem detection
- Dynamic EQ mode
- Linear phase option
- Real-time analysis

### AI Mastering EQ
- Tonal balance analysis
- Reference matching
- Streaming optimization
- Mid/Side processing
- Professional metering

### AI Auto EQ
- Source type detection
- Genre awareness
- One-click optimization
- Learning mode
- Real-time adaptation

## Performance

- **FFT Size**: 8192 samples (high resolution)
- **Sample Rates**: 44.1kHz - 192kHz supported
- **Latency**:
  - Minimum phase: < 5ms
  - Linear phase: 10-50ms (depends on settings)
- **CPU Usage**: Optimized for real-time processing
- **Precision**: 64-bit floating point processing

## Future Enhancements

- GPU-accelerated FFT processing
- Machine learning model integration
- User preference learning database
- Cloud-based reference library
- Collaborative EQ matching
- Advanced visualization (3D spectrum, waterfall)

## License

Part of the DAWG DAWG AI project.
Manufacturer: DAWG AI
Category: AI EQ

---

**Generated for DAWG DAWG AI**
