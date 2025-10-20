# Auto-Routing Engine

## Overview

The AutoRoutingEngine provides intelligent, one-click audio routing for vocal mixing workflows. It automatically:

- Detects vocal tracks in your project
- Creates professional processing chains (EQ → Compression → Reverb → Master)
- Sets up send/return chains for effects
- Optimizes gain staging across the chain
- Supports parallel compression routing

## Quick Start

### Basic Usage

```typescript
import { RoutingEngine } from './RoutingEngine';
import { AutoRoutingEngine } from './AutoRoutingEngine';
import { AIMixEngine } from '../ai/AIMixEngine';

// Initialize routing engine
const routingEngine = new RoutingEngine(pluginHost, audioContext);

// Create AI mix engine
const aiMixEngine = new AIMixEngine(routingEngine);

// Perform automatic vocal mix
const result = await aiMixEngine.quickMixVocals(projectId, 'pop');

if (result.success) {
  console.log('Mix created!', result.summary);
  console.log('Processed tracks:', result.report.vocalTracksProcessed);
  console.log('Effects applied:', result.report.effectsApplied);
}
```

### Advanced Configuration

```typescript
import { VocalChainConfig } from '../../types/routing';

const config: VocalChainConfig = {
  vocalTracks: ['track-1', 'track-2'],
  leadVocalId: 'track-1',
  backingVocalIds: ['track-2'],
  genre: 'hip-hop',
  style: 'polished',
  useParallelCompression: true,
  useReverbSend: true,
  useDelaySend: true,
  useDeEsser: true,
};

const autoRouter = new AutoRoutingEngine(routingEngine);
const result = await autoRouter.autoCreateVocalChain(config);

console.log('Routing created:', result.summary);
console.log('Operations:', result.operations);
```

## Features

### 1. Auto-Detect Vocal Tracks

The engine automatically identifies vocal tracks based on:
- Track naming conventions (vocal, vox, voice, lead, harmony)
- In future: Spectral analysis using AI

```typescript
const vocalTracks = await autoRouter.detectVocalTracks();
console.log('Found vocal tracks:', vocalTracks);
```

### 2. Create Mix Bus

Automatically creates and routes tracks to a vocal mix bus:

```typescript
const bus = autoRouter.createMixBus('Vocal Mix Bus', vocalTrackIds);
// All vocal tracks now routed to this bus
```

### 3. Processing Chain

Creates a complete signal chain for each vocal track:

**Signal Flow:**
```
Input → High-Pass Filter → EQ → De-esser → Compressor → Sends → Vocal Mix Bus → Master
```

**Effects Included:**
- High-pass filter (80-100 Hz)
- Multi-band EQ with genre-specific curves
- De-esser (optional)
- Compressor with optimal settings
- Reverb send (post-fader)
- Delay send (post-fader)
- Parallel compression send (pre-fader)

### 4. Genre Presets

Built-in presets for different genres:

- **Pop**: Modern, polished, air and presence
- **Hip-Hop/Rap**: Punchy, articulate, aggressive compression
- **R&B/Soul**: Smooth, lush, spacious
- **Rock**: Aggressive, present, cutting through

### 5. Gain Staging

Automatically optimizes levels across the chain:

```typescript
await autoRouter.optimizeGainStaging(vocalTrackIds);
```

Target levels:
- Input gain: Adjusted to reach -18 dB RMS
- Headroom: -6 dB before clipping
- Lead vocal: 0 dB (unity)
- Backing vocals: -6 dB

## UI Integration

The AutoRoutingEngine is integrated into the Advanced Features Panel:

```typescript
// In AdvancedFeaturesPanel.tsx
const handleAIMixVocals = async (genre?: string) => {
  const response = await apiClient.request('POST', '/ai/mix-vocals', {
    projectId,
    genre: genre || 'pop',
    autoDetectVocals: true,
  });

  // Show success notification
  toast.success(`✓ ${response.routing.summary}`);
};
```

### User Experience

1. User clicks "AI Mix Vocals" button
2. System shows progress:
   - Detecting vocals (10%)
   - Analyzing vocals (25%)
   - Configuring chain (40%)
   - Creating routing (60%)
   - Applying processing (80%)
   - Balancing levels (90%)
   - Complete (100%)
3. Visual feedback shows:
   - Number of tracks processed
   - Buses created
   - Effects applied
   - Routing chain diagram

## API Endpoints (Backend)

### POST /ai/mix-vocals

**Request:**
```json
{
  "projectId": "project-123",
  "genre": "pop",
  "style": "polished",
  "autoDetectVocals": true,
  "useParallelCompression": true,
  "useReverbSend": true,
  "useDelaySend": true,
  "useDeEsser": true
}
```

**Response:**
```json
{
  "success": true,
  "routing": {
    "summary": "Created vocal chain: Lead Vocal → EQ → Comp → De-esser → Vocal Mix Bus → Master",
    "details": {
      "vocalTracksDetected": 2,
      "leadVocalId": "track-1",
      "backingVocalIds": ["track-2"],
      "busesCreated": ["Vocal Mix Bus", "Vocal Reverb", "Vocal Delay"],
      "sendsCreated": 4,
      "insertsCreated": 8
    }
  },
  "report": {
    "vocalTracksProcessed": 2,
    "effectsApplied": ["EQ", "Compression", "De-esser", "Reverb", "Delay"],
    "busesCreated": ["Vocal Mix Bus", "Vocal Reverb", "Vocal Delay"],
    "totalProcessingTime": 2500,
    "recommendations": [
      "Consider adding saturation for warmth",
      "Try doubling the lead vocal for thickness"
    ]
  }
}
```

## Type Definitions

See `src/types/routing.ts` for complete type definitions:

- `RoutingChain`: Complete routing configuration for a track
- `AudioBus`: Bus configuration (mix, group, aux, send-return)
- `AudioSend`: Send/return routing
- `AudioInsert`: Insert effect configuration
- `VocalChainConfig`: Vocal processing chain configuration
- `AutoRoutingResult`: Result of auto-routing operation

## Examples

### Example 1: Quick Vocal Mix

```typescript
// One-click vocal mix with auto-detection
const result = await aiMixEngine.quickMixVocals(projectId, 'pop');
```

### Example 2: Custom Genre Settings

```typescript
const result = await aiMixEngine.mixVocals({
  projectId: 'project-123',
  genre: 'hip-hop',
  style: 'aggressive',
  autoDetectVocals: true,
  useParallelCompression: true,
  useReverbSend: true,
  useDelaySend: true,
  useDeEsser: true,
});
```

### Example 3: Manual Track Selection

```typescript
const result = await aiMixEngine.mixVocals({
  projectId: 'project-123',
  genre: 'rnb',
  autoDetectVocals: false,
  trackIds: ['track-1', 'track-2', 'track-3'],
  useParallelCompression: true,
});
```

### Example 4: Progress Tracking

```typescript
aiMixEngine.setProgressCallback((progress) => {
  console.log(`${progress.step}: ${progress.progress}%`);
  console.log(progress.details);
});

const result = await aiMixEngine.quickMixVocals(projectId);
```

## Architecture

```
AdvancedFeaturesPanel.tsx (UI)
    ↓
AIMixEngine.ts (High-level mixing logic)
    ↓
AutoRoutingEngine.ts (Routing automation)
    ↓
RoutingEngine.ts (Low-level routing operations)
    ↓
Audio Web API / Tone.js
```

## Future Enhancements

1. **AI-Powered Detection**: Use spectral analysis to detect vocals
2. **Stem Separation Integration**: Auto-detect vocals from mixed audio
3. **Real-time Visualization**: Show routing graph in UI
4. **Undo/Redo**: Full history management
5. **Templates**: Save and recall custom routing templates
6. **Automation**: Record and playback routing changes
7. **Collaboration**: Share routing configurations

## License

Part of AI DAWG - Professional AI Music Production Platform
