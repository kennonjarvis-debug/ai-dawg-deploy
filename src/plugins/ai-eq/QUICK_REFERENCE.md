# DAWG AI EQ Plugins - Quick Reference

## Plugin IDs

```typescript
'dawg-ai-vintage-eq'   // AI Vintage EQ
'dawg-ai-surgical-eq'  // AI Surgical EQ
'dawg-ai-mastering-eq' // AI Mastering EQ
'dawg-ai-auto-eq'      // AI Auto EQ
```

## Quick Import

```typescript
import {
  DAWG_AI_EQ_PLUGINS,
  aiEQEngine
} from '@/plugins/ai-eq';
```

## When to Use Each Plugin

| Plugin | Best For | Key Feature |
|--------|----------|-------------|
| **Vintage EQ** | Vocals, drums, adding character | Analog warmth, harmonics |
| **Surgical EQ** | Problem fixing, precision work | AI problem detection |
| **Mastering EQ** | Final mix, streaming prep | Tonal balance, reference matching |
| **Auto EQ** | Quick fixes, learning, any source | Fully automatic, one-click |

## Common Use Cases

### Vocal Processing
```typescript
// Option 1: Vintage warmth
await controller.loadPlugin('dawg-ai-vintage-eq', 'vocal', 0);
await controller.applyPreset(instanceId, 'warm-vocal');

// Option 2: Fix problems
await controller.loadPlugin('dawg-ai-surgical-eq', 'vocal', 0);
await controller.applyPreset(instanceId, 'vocal-cleanup');

// Option 3: Auto
await controller.loadPlugin('dawg-ai-auto-eq', 'vocal', 0);
await controller.applyPreset(instanceId, 'auto-vocal');
```

### Drum Processing
```typescript
// Vintage punch
await controller.loadPlugin('dawg-ai-vintage-eq', 'drums', 0);
await controller.applyPreset(instanceId, 'punchy-drums');

// Or auto
await controller.loadPlugin('dawg-ai-auto-eq', 'drums', 0);
await controller.applyPreset(instanceId, 'auto-drums');
```

### Mix Bus
```typescript
// SSL bus
await controller.loadPlugin('dawg-ai-vintage-eq', 'mix-bus', 0);
await controller.applyPreset(instanceId, 'ssl-bus');

// Or auto balance
await controller.loadPlugin('dawg-ai-auto-eq', 'mix-bus', 0);
await controller.applyPreset(instanceId, 'auto-mix-bus');
```

### Mastering
```typescript
// Neutral mastering
await controller.loadPlugin('dawg-ai-mastering-eq', 'master', 0);
await controller.applyPreset(instanceId, 'neutral-mastering');

// Spotify optimization
await controller.applyPreset(instanceId, 'spotify-optimized');

// Reference matching
await controller.applyPreset(instanceId, 'reference-match');
```

## AI Analysis

```typescript
import { aiEQEngine } from '@/plugins/ai-eq';

const audioBuffer = getAudioBuffer();

// Quick problem check
const problems = aiEQEngine.detectProblems(audioBuffer);
if (problems.length > 0) {
  console.log('Found issues:', problems);
}

// Quick balance check
const balance = aiEQEngine.analyzeTonalBalance(audioBuffer);
console.log('Bass:', balance.bass, 'Mids:', balance.mids, 'Highs:', balance.air);

// Quick auto EQ
const curve = aiEQEngine.generateAutoEQCurve(audioBuffer, 'clarity');
console.log('Suggested EQ curve:', curve);

// What is this?
const source = aiEQEngine.detectSourceType(audioBuffer);
console.log(`Detected: ${source.type} (${source.confidence}% sure)`);
```

## All Presets at a Glance

### AI Vintage EQ
- `warm-vocal` - Neve warmth
- `punchy-drums` - API punch
- `ssl-bus` - SSL bus
- `pultec-low-end` - Pultec bass

### AI Surgical EQ
- `remove-resonance` - Kill resonances
- `de-mud` - Clean 200-500Hz
- `de-harsh` - Tame 2-5kHz
- `vocal-cleanup` - Fix all vocal issues
- `mastering-linear` - Linear phase

### AI Mastering EQ
- `neutral-mastering` - Transparent
- `warm-mastering` - Warm master
- `bright-modern` - Bright master
- `spotify-optimized` - -14 LUFS
- `apple-music` - -16 LUFS
- `reference-match` - Match reference
- `mid-side-width` - Stereo width

### AI Auto EQ
- `auto-vocal` - Auto vocal fix
- `auto-drums` - Auto drum fix
- `auto-bass` - Auto bass fix
- `auto-mix-bus` - Auto bus balance
- `gentle-correction` - Subtle fixes
- `aggressive-fix` - Strong fixes
- `learn-my-style` - Learning mode

## Key Parameters

### All Plugins
- `output_gain` - Output level (0-1, default 0.5 = 0dB)
- `mix` - Dry/wet mix (0-1, default 1.0 = 100%)

### AI Controls
- `ai_mode` / `auto_mode` - Enable AI (0 or 1)
- `ai_intensity` / `ai_strength` - How strong (0-1)

### Common EQ Controls
- Frequency: Logarithmic, 0-1 maps to 20Hz-20kHz
- Gain: 0-1, where 0.5 = 0dB (neutral)
- Q: 0-1, higher = narrower

## Problem Types Detected

| Type | Frequency Range | What It Sounds Like |
|------|----------------|---------------------|
| Mud | 200-500 Hz | Unclear, thick, muddy |
| Boxiness | 400-800 Hz | Honky, confined, boxy |
| Harshness | 2-5 kHz | Aggressive, fatiguing |
| Sibilance | 5-8 kHz | Harsh "s" sounds |
| Resonance | Any | Ringing, narrow peaks |

## Tonal Balance Bands

| Band | Frequency Range | Description |
|------|----------------|-------------|
| Sub Bass | 20-60 Hz | Deep rumble |
| Bass | 60-250 Hz | Low-end punch |
| Low Mids | 250-500 Hz | Warmth/mud |
| Mids | 500-2000 Hz | Body/clarity |
| High Mids | 2000-4000 Hz | Presence |
| Presence | 4000-6000 Hz | Clarity/harshness |
| Brilliance | 6000-10000 Hz | Sparkle |
| Air | 10000-20000 Hz | Openness |

## Source Types

Auto-detected by AI Auto EQ:
- `vocal` - Singing, speaking
- `drums` - Drum kit
- `bass` - Bass guitar, synth bass
- `guitar` - Electric/acoustic guitar
- `keys` - Keyboard, piano
- `strings` - Violins, etc.
- `brass` - Trumpet, sax, etc.
- `mix` - Full mix
- `unknown` - Can't determine

## EQ Goals

For AI Auto EQ `eq_goal` parameter:
- `clarity` - Clear, present, intelligible
- `warmth` - Warm, full, rich
- `brightness` - Bright, sparkly, airy
- `punch` - Punchy, powerful, impactful
- `balance` - Balanced, neutral, even

## Plugin Metadata

All plugins share:
```typescript
{
  manufacturer: 'DAWG AI',
  category: 'AI EQ',
  isAI: true,
  format: 'VST3',
  numInputs: 2,
  numOutputs: 2
}
```

## File Locations

```
/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/src/plugins/ai-eq/
├── AIVintageEQ.ts       # Vintage analog EQ
├── AISurgicalEQ.ts      # Surgical precision EQ
├── AIMasteringEQ.ts     # Professional mastering EQ
├── AIAutoEQ.ts          # Intelligent auto EQ
├── AIEQEngine.ts        # Core analysis engine
├── index.ts             # Main exports
├── README.md            # Full documentation
└── QUICK_REFERENCE.md   # This file
```

## Quick Decision Tree

```
Need to add character/warmth?
  → AI Vintage EQ

Need to fix specific problems?
  → AI Surgical EQ

Need to master or match reference?
  → AI Mastering EQ

Not sure / want it automatic?
  → AI Auto EQ

Need analysis only?
  → Use aiEQEngine directly
```

## Performance Tips

1. **Surgical EQ**: Use linear phase only when needed (adds latency)
2. **Mastering EQ**: Higher oversampling = better quality but more CPU
3. **Auto EQ**: Lower analysis resolution for live use
4. **All**: Disable AI features if not needed to save CPU

## Common Workflows

### Vocal Chain
1. AI Surgical EQ (de-mud, de-harsh)
2. Compressor
3. AI Vintage EQ (warmth, character)
4. De-esser

### Drum Buss
1. AI Vintage EQ (punchy-drums preset)
2. Compressor
3. Saturation

### Master Chain
1. AI Mastering EQ (neutral-mastering)
2. Compressor (gentle)
3. Limiter
4. AI Mastering EQ (streaming-optimized)

### Quick Mix
1. AI Auto EQ on every track
2. Balance levels
3. AI Auto EQ on mix bus
4. Done!

---

**Need more details?** See `README.md` in this directory.
