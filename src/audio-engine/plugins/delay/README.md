# DAWG AI Delay Plugins

A comprehensive suite of AI-powered delay plugins for the DAWG DAWG AI. All plugins are manufactured by **DAWG AI** and categorized as **AI Delay**.

## Overview

This collection includes four professional-grade delay plugins, each with unique AI-powered features designed to enhance music production workflows.

## Plugin Suite

### 1. AI Tape Delay (`dawg-ai-tape-delay`)

Vintage tape echo emulation with AI-powered wow and flutter modeling.

**Key Features:**
- Authentic tape delay emulation
- AI-powered wow and flutter modeling
- Adaptive tape age simulation
- Intelligent saturation and filtering
- Dynamic head wear modeling
- Tempo sync with smart quantization
- Stereo width control
- Tape hiss generation

**Parameters:**
- `delayTime`: 0-2000ms
- `feedback`: 0-100%
- `mix`: 0-100%
- `tapeAge`: 0-100% (affects wow/flutter characteristics)
- `wowAmount`: 0-100% (slow pitch variation)
- `flutterAmount`: 0-100% (fast pitch variation)
- `tapeHiss`: 0-100%
- `saturation`: 0-100%
- `filterCutoff`: 200-8000Hz
- `filterResonance`: 0-100%
- `headWear`: 0-100% (high-frequency loss)
- `stereoWidth`: 0-100%
- `tempoSync`: Boolean
- `tempoMultiplier`: Tempo division (1/4, 1/8, 1/16, etc.)

**AI Features:**
- Adaptive wow/flutter based on tape age
- Intelligent saturation modeling
- Dynamic frequency response based on tape condition

**Use Cases:**
- Vintage vocal treatments
- Classic rock guitar delays
- Dub and reggae production
- Retro electronic music

---

### 2. AI Digital Delay (`dawg-ai-digital-delay`)

Clean digital delay with intelligent feedback control and adaptive filtering.

**Key Features:**
- Pristine digital delay algorithm
- AI-powered smart feedback control
- Adaptive filtering to prevent frequency buildup
- Intelligent resonance management
- Stereo offset control
- Modulation with depth control
- Tempo sync with smart quantization
- Diffusion for smoother repeats
- Character control from pristine to colored

**Parameters:**
- `delayTime`: 0-5000ms
- `feedback`: 0-100%
- `mix`: 0-100%
- `lowCut`: 20-500Hz
- `highCut`: 1000-20000Hz
- `modulation`: 0-100%
- `modulationRate`: 0.1-10Hz
- `character`: 0-100% (pristine to colored)
- `filterResonance`: 0-100%
- `stereoOffset`: -100 to +100ms
- `diffusion`: 0-100%
- `tempoSync`: Boolean
- `tempoMultiplier`: Tempo division
- `smartFeedback`: Boolean (AI feedback control)
- `adaptiveFiltering`: Boolean (AI filter adaptation)

**AI Features:**
- Smart feedback control prevents runaway feedback
- Adaptive filtering detects and prevents frequency buildup
- Intelligent resonance management
- Automatic level balancing

**Use Cases:**
- Modern vocal production
- Clean instrumental delays
- EDM and electronic music
- Pop and contemporary mixing

---

### 3. AI Ping-Pong Delay (`dawg-ai-ping-pong-delay`)

Stereo ping-pong delay with AI-powered stereo width optimization.

**Key Features:**
- Rhythmic ping-pong stereo delay
- AI-powered stereo width optimization
- Adaptive panning based on audio content
- Intelligent crossfeed control
- Pan spread adjustment
- Modulation with rate control
- Tempo sync with smart quantization
- Adaptive filtering
- Smart feedback management

**Parameters:**
- `delayTime`: 0-2000ms
- `feedback`: 0-100%
- `mix`: 0-100%
- `pingPongAmount`: 0-100% (0=mono, 100=full ping-pong)
- `stereoWidth`: 0-200% (AI optimized)
- `lowCut`: 20-500Hz
- `highCut`: 1000-20000Hz
- `modulation`: 0-100%
- `modulationRate`: 0.1-5Hz
- `panSpread`: 0-100% (width of ping-pong spread)
- `crossfeedAmount`: 0-100% (L->R and R->L mixing)
- `tempoSync`: Boolean
- `tempoMultiplier`: Tempo division
- `smartStereo`: Boolean (AI stereo optimization)
- `adaptivePanning`: Boolean (AI panning adaptation)

**AI Features:**
- Stereo content analysis
- Optimal stereo width calculation prevents phase issues
- Adaptive panning complements existing stereo field
- Intelligent crossfeed management

**Use Cases:**
- Wide stereo vocal effects
- Creative guitar treatments
- Synth and keyboard processing
- Ambient and atmospheric production

---

### 4. AI Ducking Delay (`dawg-ai-ducking-delay`)

Smart delay that automatically ducks when vocals or main content is present.

**Key Features:**
- AI-powered vocal detection
- Intelligent ducking based on vocal presence
- Adaptive attack and release times
- Sidechain input support
- Frequency-aware ducking
- Smart threshold adjustment
- Adaptive release based on content
- Tempo sync with smart quantization
- Modulation with rate control

**Parameters:**
- `delayTime`: 0-2000ms
- `feedback`: 0-100%
- `mix`: 0-100%
- `duckAmount`: 0-100% (how much to duck)
- `duckThreshold`: -60 to 0 dB
- `attackTime`: 1-100ms
- `releaseTime`: 10-1000ms
- `lowCut`: 20-500Hz
- `highCut`: 1000-20000Hz
- `modulation`: 0-100%
- `modulationRate`: 0.1-5Hz
- `sidechain`: Boolean
- `smartDucking`: Boolean (AI ducking control)
- `vocalDetection`: Boolean (AI vocal detection)
- `adaptiveRelease`: Boolean (AI release adaptation)
- `tempoSync`: Boolean
- `tempoMultiplier`: Tempo division

**AI Features:**
- Vocal frequency detection and analysis
- Smart threshold adjustment based on vocal probability
- Adaptive release time based on content density
- Silence detection for faster recovery
- Frequency-aware ducking

**Use Cases:**
- Vocal production (keeps delay clear of main vocal)
- Podcast and broadcast production
- Dense mixes requiring clarity
- Automatic sidechain effects

---

## Installation

Import the plugins into your project:

```typescript
import {
  AITapeDelay,
  AIDigitalDelay,
  AIPingPongDelay,
  AIDuckingDelay,
  createDelayPlugin,
  getAllDelayPluginInfo
} from '@/audio-engine/plugins/delay';
```

## Usage

### Creating Plugin Instances

```typescript
// Using factory function
const tapeDelay = createDelayPlugin('dawg-ai-tape-delay', audioContext);

// Or direct instantiation
const digitalDelay = new AIDigitalDelay(audioContext);
```

### Setting Parameters

```typescript
tapeDelay.setParameter('delayTime', 375);
tapeDelay.setParameter('feedback', 40);
tapeDelay.setParameter('mix', 30);
tapeDelay.setParameter('tapeAge', 60);
```

### Processing Audio

```typescript
const inputBuffer = [leftChannel, rightChannel];
const outputBuffer = [new Float32Array(bufferSize), new Float32Array(bufferSize)];

tapeDelay.process(inputBuffer, outputBuffer);
```

### Getting Plugin Info

```typescript
const metadata = tapeDelay.getMetadata();
console.log(metadata.name); // "AI Tape Delay"
console.log(metadata.manufacturer); // "DAWG AI"
console.log(metadata.category); // "AI Delay"
console.log(metadata.isAI); // true
```

### Using Presets

```typescript
import { TAPE_DELAY_PRESETS } from '@/audio-engine/plugins/delay';

const vintageSlap = TAPE_DELAY_PRESETS.find(p => p.id === 'tape-vintage-slap');
Object.entries(vintageSlap.parameters).forEach(([param, value]) => {
  tapeDelay.setParameter(param, value);
});
```

## Presets

Each plugin comes with factory presets:

### Tape Delay Presets
- **Vintage Slap**: Classic short tape slap echo for vocals
- **Rockabilly Echo**: Sun Studios style tape echo
- **Dub Delay**: Classic dub reggae tape delay

### Digital Delay Presets
- **Vocal Delay**: Clean digital delay for vocals
- **Eighth Note Delay**: Tempo-synced 1/8 note delay
- **Dotted Eighth**: The Edge style dotted eighth delay

### Ping-Pong Delay Presets
- **Wide Stereo**: Maximum width ping-pong delay
- **Vocal Ping-Pong**: Subtle ping-pong for vocals
- **Rhythmic Bounce**: Tempo-synced rhythmic ping-pong

### Ducking Delay Presets
- **Vocal Clarity**: Delay that stays out of the way of vocals
- **Broadcast Voice**: Heavy ducking for clear spoken word
- **Subtle Duck**: Light ducking for transparent delay

## Tempo Sync

All plugins support tempo synchronization:

```typescript
plugin.setParameter('tempoSync', true);
plugin.setParameter('tempoMultiplier', 0.25); // 1/4 note

// Available multipliers:
// 0.0625 = 1/16T (triplet)
// 0.125  = 1/16
// 0.1875 = 1/8T (triplet)
// 0.25   = 1/8
// 0.375  = 1/4T (triplet)
// 0.5    = 1/4
// 0.75   = 1/2T (triplet)
// 1.0    = 1/2
// 1.5    = 3/4
// 2.0    = Whole note
```

## Utility Functions

```typescript
import {
  delayTimeToTempoSync,
  tempoSyncToDelayTime,
  dbToLinear,
  linearToDb
} from '@/audio-engine/plugins/delay';

// Convert delay time to tempo multiplier
const multiplier = delayTimeToTempoSync(375, 120); // 375ms at 120 BPM

// Convert tempo multiplier to delay time
const delayTime = tempoSyncToDelayTime(0.25, 120); // 1/4 note at 120 BPM

// dB to linear conversion
const gain = dbToLinear(-6); // 0.5

// Linear to dB conversion
const db = linearToDb(0.5); // -6.02
```

## Plugin Registry

Get information about all available delay plugins:

```typescript
import { getAllDelayPluginInfo } from '@/audio-engine/plugins/delay';

const plugins = getAllDelayPluginInfo();
// Returns array of plugin metadata
```

## Technical Details

### Audio Processing
- All plugins use 32-bit floating-point processing
- Support for stereo (2-channel) audio
- Buffer-based processing for real-time performance
- Optimized for low-latency operation

### AI Features
- Real-time analysis and adaptation
- No external dependencies for AI processing
- Lightweight algorithms for CPU efficiency
- Deterministic behavior for consistent results

### Performance
- Efficient circular buffer implementation
- Minimal memory allocation during processing
- SIMD-friendly algorithms where applicable
- Suitable for real-time audio production

## License

Copyright (c) 2025 DAWG AI. All rights reserved.

## Support

For issues, feature requests, or questions, please contact DAWG AI support.
