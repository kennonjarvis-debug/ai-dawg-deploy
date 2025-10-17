# Audio Effects Integration Guide

**For Instance 1 (UI/Frontend)**

This guide explains how to integrate the audio effects system built by Instance 2 (Audio Engine).

---

## Overview

The audio effects system provides:
- ✅ **3-Band Parametric EQ** (Low, Mid, High)
- ✅ **Dynamics Compressor**
- ✅ **5 EQ Presets** (Flat, Vocal, Warmth, Presence, Radio)
- ⏳ **Reverb** (coming soon)
- ⏳ **Delay** (coming soon)

---

## Quick Start

### 1. Import the Hook

```typescript
import { useEffects } from '@/src/core/useEffects';
import { EQ_PRESETS } from '@/src/utils/audioEffects';
```

### 2. Use in Your Component

```typescript
const effects = useEffects({
  trackId: 'track-123',
  audioContext: audioContextRef.current,
  enabled: true,
});

// Update EQ parameters
effects.updateEQ({
  low: { frequency: 80, gain: 3, Q: 1.0, type: 'lowshelf' },
});

// Load preset
effects.loadEQPreset('vocal');

// Toggle effects
effects.toggleEQ(true);
effects.toggleCompressor(false);
```

### 3. Connect to Audio Chain

In your playback code, connect the effects chain:

```typescript
// During playback setup
const source = audioContext.createBufferSource();
const trackGain = audioContext.createGain();

// Connect: source -> effects chain -> track gain -> destination
source.connect(effects.inputNode);  // NOT IMPLEMENTED YET
// OR use:
effects.connectChain(source, trackGain);
trackGain.connect(audioContext.destination);
```

---

## API Reference

### useEffects Hook

```typescript
interface UseEffectsOptions {
  trackId: string;
  audioContext: AudioContext | null;
  enabled?: boolean;  // Default: true
}

interface UseEffectsReturn {
  // Effect instances
  eq: ParametricEQ | null;
  compressor: DynamicsCompressor | null;

  // EQ controls
  updateEQ: (params: Partial<EQParams>) => void;
  loadEQPreset: (presetName: 'flat' | 'vocal' | 'warmth' | 'presence' | 'radio') => void;
  toggleEQ: (enabled: boolean) => void;
  getEQParams: () => EQParams | null;

  // Compressor controls
  updateCompressor: (params: Partial<CompressorParams>) => void;
  toggleCompressor: (enabled: boolean) => void;
  getCompressorParams: () => CompressorParams | null;

  // Chain management
  connectChain: (source: AudioNode, destination: AudioNode) => void;
  disconnectChain: () => void;
  destroy: () => void;
}
```

### EQ Parameters

```typescript
interface EQParams {
  low: {
    frequency: number;    // Hz (default: 80)
    gain: number;         // dB (-12 to +12)
    Q: number;            // Quality (0.1 to 10)
    type: 'lowshelf';
  };
  mid: {
    frequency: number;    // Hz (default: 1000)
    gain: number;         // dB (-12 to +12)
    Q: number;            // Quality (0.1 to 10)
    type: 'peaking';
  };
  high: {
    frequency: number;    // Hz (default: 8000)
    gain: number;         // dB (-12 to +12)
    Q: number;            // Quality (0.1 to 10)
    type: 'highshelf';
  };
  enabled: boolean;
}
```

### Compressor Parameters

```typescript
interface CompressorParams {
  threshold: number;    // dB (-100 to 0, default: -24)
  ratio: number;        // 1 to 20 (default: 4)
  attack: number;       // seconds (0 to 1, default: 0.003)
  release: number;      // seconds (0 to 1, default: 0.25)
  knee: number;         // dB (0 to 40, default: 30)
  enabled: boolean;
}
```

---

## Example: Building an EQ Widget

```typescript
'use client';

import { useState } from 'react';
import { useEffects } from '@/src/core/useEffects';
import { EQ_PRESETS } from '@/src/utils/audioEffects';

interface EQWidgetProps {
  trackId: string;
  audioContext: AudioContext;
}

export function EQWidget({ trackId, audioContext }: EQWidgetProps) {
  const effects = useEffects({ trackId, audioContext });
  const [enabled, setEnabled] = useState(true);

  const handleLowGainChange = (gain: number) => {
    effects.updateEQ({
      low: { ...effects.getEQParams()?.low!, gain },
    });
  };

  const handlePresetChange = (preset: string) => {
    effects.loadEQPreset(preset as keyof typeof EQ_PRESETS);
  };

  return (
    <div className="eq-widget">
      <h3>EQ</h3>

      {/* Enable/Disable */}
      <button
        onClick={() => {
          const newState = !enabled;
          setEnabled(newState);
          effects.toggleEQ(newState);
        }}
      >
        {enabled ? 'Disable' : 'Enable'}
      </button>

      {/* Preset Selector */}
      <select onChange={(e) => handlePresetChange(e.target.value)}>
        <option value="flat">Flat</option>
        <option value="vocal">Vocal</option>
        <option value="warmth">Warmth</option>
        <option value="presence">Presence</option>
        <option value="radio">Radio</option>
      </select>

      {/* Low Band */}
      <div>
        <label>Low Gain: {effects.getEQParams()?.low.gain || 0} dB</label>
        <input
          type="range"
          min="-12"
          max="12"
          step="0.5"
          value={effects.getEQParams()?.low.gain || 0}
          onChange={(e) => handleLowGainChange(parseFloat(e.target.value))}
        />
      </div>

      {/* Mid Band */}
      {/* ... similar to Low Band ... */}

      {/* High Band */}
      {/* ... similar to Low Band ... */}
    </div>
  );
}
```

---

## Example: Building a Compressor Widget

```typescript
export function CompressorWidget({ trackId, audioContext }: WidgetProps) {
  const effects = useEffects({ trackId, audioContext });

  return (
    <div className="compressor-widget">
      <h3>Compressor</h3>

      <button onClick={() => effects.toggleCompressor(true)}>
        Enable
      </button>

      <div>
        <label>Threshold: {effects.getCompressorParams()?.threshold} dB</label>
        <input
          type="range"
          min="-100"
          max="0"
          value={effects.getCompressorParams()?.threshold || -24}
          onChange={(e) =>
            effects.updateCompressor({ threshold: parseFloat(e.target.value) })
          }
        />
      </div>

      <div>
        <label>Ratio: {effects.getCompressorParams()?.ratio}:1</label>
        <input
          type="range"
          min="1"
          max="20"
          value={effects.getCompressorParams()?.ratio || 4}
          onChange={(e) =>
            effects.updateCompressor({ ratio: parseFloat(e.target.value) })
          }
        />
      </div>

      {/* Add attack, release, knee controls similarly */}
    </div>
  );
}
```

---

## Integration with Existing Playback

The effects need to be inserted into the existing audio chain in `usePlayback.ts`.

### Current Chain (from usePlayback.ts):
```
AudioBufferSourceNode -> GainNode (volume) -> StereoPannerNode (pan) -> Destination
```

### New Chain with Effects:
```
AudioBufferSourceNode -> Effects Chain -> GainNode (volume) -> StereoPannerNode (pan) -> Destination
```

### Recommended Implementation:

In `src/core/usePlayback.ts`, modify the connection like this:

```typescript
// Create effects for track
const effects = useEffects({
  trackId: track.id,
  audioContext: audioContextRef.current,
});

// Connect: source -> effects -> gain -> pan -> destination
effects.connectChain(source, gainNode);
gainNode.connect(panNode);
panNode.connect(audioContextRef.current.destination);
```

---

## Available Presets

### Flat
- **Use:** Neutral starting point
- Low: 0 dB, Mid: 0 dB, High: 0 dB

### Vocal
- **Use:** Emphasize vocal clarity and presence
- Low: -2 dB, Mid: +3 dB (3kHz), High: +2 dB

### Warmth
- **Use:** Add body and richness
- Low: +3 dB, Mid: -1 dB, High: -2 dB

### Presence
- **Use:** Make vocals cut through the mix
- Low: -3 dB, Mid: +4 dB (2.5kHz), High: +3 dB

### Radio
- **Use:** Telephone/radio effect
- Low: -6 dB, Mid: +6 dB (2kHz), High: -4 dB

---

## TODO (Instance 1)

To complete effects integration, you'll need to:

1. ✅ Use `useEffects` hook in track playback
2. ⏳ Build EQ widget UI
3. ⏳ Build Compressor widget UI
4. ⏳ Add effects toggle buttons to TrackItem
5. ⏳ Store effects parameters in track store (for persistence)
6. ⏳ Add effects to save/load project data

---

## Performance Notes

- Effects are bypassed when `enabled: false` (no CPU overhead)
- Each track gets its own effects chain
- EQ uses 3 BiquadFilterNodes (minimal CPU usage)
- Compressor uses native DynamicsCompressorNode (hardware accelerated)
- Cleanup is automatic when component unmounts

---

## Next Features (Instance 2 Roadmap)

- ⏳ Reverb (ConvolverNode with impulse responses)
- ⏳ Delay effect
- ⏳ Real-time pitch detection
- ⏳ Vocal effects (pitch correction, doubling, de-esser)
- ⏳ Audio worklet processors for custom effects

---

**Questions?** Check SYNC.md messages or coordinate with Instance 2.
