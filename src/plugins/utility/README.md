# DAWG AI - Utility Plugins

Comprehensive suite of AI-powered utility effects for professional audio production.

## Overview

These plugins provide essential audio processing utilities enhanced with AI-powered features for intelligent, adaptive processing. Each plugin includes both traditional controls and AI-assisted optimization capabilities.

## Plugins

### 1. AI Stereo Doubler
**File:** `AIStereoDoubler.ts`
**Category:** AI Utility
**Manufacturer:** DAWG AI

**Description:**
Intelligent voice/instrument doubling with AI variation and adaptive stereo width control.

**Key Features:**
- AI-powered micro-timing variation for natural doubling
- Intelligent pitch shifting for chorus-like width
- Adaptive stereo field positioning
- Smart formant preservation
- Auto-detection of optimal doubling parameters
- Separate control over brightness and warmth

**Parameters:**
- **Mix** (0-100%): Wet/dry blend
- **AI Variation** (0-100%): Amount of AI-generated variation
- **Separation** (0-100%): Stereo separation width
- **Detune** (-50 to +50 cents): Pitch variation amount
- **Delay** (0-50ms): Timing offset between voices
- **Brightness** (-12 to +12dB): High frequency adjustment
- **Warmth** (-12 to +12dB): Low frequency adjustment

**Use Cases:**
- Vocal doubling and thickening
- Guitar widening
- Instrument enhancement
- Stereo width creation from mono sources

---

### 2. AI Stereo Imager
**File:** `AIStereoImager.ts`
**Category:** AI Utility
**Manufacturer:** DAWG AI

**Description:**
Stereo width enhancement with AI mono compatibility check and frequency-dependent processing.

**Key Features:**
- AI-powered mono compatibility analysis
- Intelligent phase issue detection and correction
- Frequency-dependent stereo processing (Low/Mid/High)
- Mid/Side processing with AI optimization
- Smart bass mono-ing below configurable frequency
- Real-time mono compatibility reporting

**Parameters:**
- **Width** (0-200%): Master stereo width control
- **Low Width** (0-100%): Low frequency stereo width
- **Mid Width** (0-200%): Mid frequency stereo width
- **High Width** (0-200%): High frequency stereo width
- **Bass Mono Freq** (0-200Hz): Frequency below which signal is mono
- **Correlation** (-1 to +1): Target stereo correlation

**AI Analysis:**
- Overall mono compatibility score (0-100)
- Phase issue detection
- Frequency band compatibility scores
- Automatic recommendations for improvement

**Use Cases:**
- Mastering stereo width enhancement
- Mix bus stereo imaging
- Mono compatibility optimization
- Creative stereo effects

---

### 3. AI De-Esser
**File:** Previously created, now properly categorized
**Category:** AI Vocal (moved from other category)
**Manufacturer:** DAWG AI

**Description:**
Intelligent AI-powered sibilance control with adaptive frequency tracking.

**Key Features:**
- AI-powered frequency tracking
- Adaptive threshold adjustment
- Smart reduction amount
- Minimal impact on non-sibilant content

**Use Cases:**
- Vocal processing
- Dialog cleanup
- Podcast production
- Broadcast audio

---

### 4. AI Limiter
**File:** `AILimiter.ts`
**Category:** AI Limiter
**Manufacturer:** DAWG AI

**Description:**
Intelligent limiting with AI loudness optimization for all major streaming platforms.

**Key Features:**
- AI-powered true-peak limiting (ITU-R BS.1770)
- Intelligent lookahead processing
- Adaptive release time based on content
- Auto-optimization for streaming platforms (Spotify, Apple Music, YouTube)
- Smart transient preservation
- Inter-sample peak detection
- Comprehensive loudness analysis (LUFS, dynamic range, true-peak)

**Parameters:**
- **Ceiling** (-20 to 0dB): Output ceiling level
- **Threshold** (-20 to 0dB): Limiting threshold
- **Target LUFS** (-23 to -6 LUFS): Target loudness level
- **Attack** (0.01-10ms): Attack time
- **Release** (1-1000ms): Release time
- **Lookahead** (0-10ms): Lookahead time
- **Stereo Link** (0-100%): Channel linking amount

**Streaming Platform Presets:**
- **Spotify:** -14 LUFS, -1.0 dBTP
- **Apple Music:** -16 LUFS, -1.0 dBTP
- **YouTube:** -13 LUFS, -1.0 dBTP
- **Mastering:** -9 LUFS, -0.3 dBTP

**AI Analysis:**
- Integrated LUFS measurement
- True-peak detection
- Dynamic range analysis
- Platform compliance checking
- Automatic optimization recommendations

**Use Cases:**
- Mastering
- Mix bus limiting
- Streaming platform optimization
- Loudness normalization

---

### 5. AI Saturation
**File:** `AISaturation.ts`
**Category:** AI Utility
**Manufacturer:** DAWG AI

**Description:**
Harmonic saturation with AI-powered analog modeling of classic hardware (tube, tape, transformer, console).

**Key Features:**
- AI-powered analog hardware emulation
- Intelligent harmonic generation (even/odd harmonics)
- Adaptive saturation based on input level
- Smart tone shaping with AI optimization
- Multi-stage saturation with AI blend control
- Auto-detection of optimal saturation type for content

**Parameters:**
- **Drive** (0-100%): Saturation amount
- **Mix** (0-100%): Wet/dry blend
- **Type:** Tube / Tape / Transformer / Console / Custom
- **Even Harmonics** (0-100%): Even harmonic content
- **Odd Harmonics** (0-100%): Odd harmonic content
- **Warmth** (-12 to +12dB): Low frequency adjustment
- **Brightness** (-12 to +12dB): High frequency adjustment
- **Bias** (-100 to +100%): Asymmetry amount

**Saturation Types:**

1. **Tube:** Warm vacuum tube saturation
   - Even harmonics dominant
   - Smooth, musical saturation
   - Best for: Vocals, guitars, bass, mix bus

2. **Tape:** Analog tape saturation
   - Balanced even/odd harmonics
   - Natural compression
   - Best for: Drums, bass, mix bus, mastering

3. **Transformer:** Iron core transformer
   - Balanced harmonics with punch
   - Transient enhancement
   - Best for: Drums, percussion, transients

4. **Console:** Mixing console saturation
   - Odd harmonics dominant
   - Subtle enhancement
   - Best for: Mix bus, mastering, subtle processing

5. **Custom:** User-defined characteristics

**AI Analysis:**
- Content type detection (vocal/drums/bass/guitar/mix)
- Dynamic range analysis
- Spectral balance analysis
- Transient content detection
- Automatic saturation type recommendation
- Optimal drive amount suggestion

**Use Cases:**
- Adding analog warmth
- Harmonic enhancement
- Mix bus processing
- Mastering
- Creative effects

---

### 6. AI Modulation
**File:** `AIModulation.ts`
**Category:** AI Utility
**Manufacturer:** DAWG AI

**Description:**
Multi-effect modulation (chorus/flanger/phaser/vibrato) with AI depth control and tempo synchronization.

**Key Features:**
- AI-powered chorus, flanger, phaser, and vibrato effects
- Intelligent depth and rate control
- Adaptive modulation based on tempo and content
- Smart feedback control to prevent harshness
- Multi-voice chorus with AI voice positioning
- Auto-sync to project tempo
- Stereo phase offset control

**Parameters:**
- **Type:** Chorus / Flanger / Phaser / Vibrato
- **Mix** (0-100%): Wet/dry blend
- **Rate** (0.01-10Hz): Modulation rate (or tempo divisions if synced)
- **Depth** (0-100%): Modulation depth
- **Feedback** (-100 to +100%): Feedback amount
- **Voices** (1-8): Number of voices (chorus mode)
- **Shimmer** (0-100%): High frequency modulation
- **Stereo Phase** (0-180°): Left/right phase offset

**Effect Presets:**

1. **Lush Vocal Chorus**
   - 4 voices, wide separation
   - Perfect for vocals and leads

2. **Subtle Doubling**
   - 2 voices, gentle modulation
   - Great for adding thickness

3. **Classic Flanger**
   - Jet-plane sweep effect
   - Ideal for guitars and synths

4. **Gentle Phaser**
   - Smooth musical phasing
   - Perfect for guitars and keys

5. **Vibrato**
   - Pitch vibrato effect
   - Classic guitar/vocal effect

**AI Analysis:**
- Tempo detection for sync
- Spectral content analysis
- Dynamic range analysis
- Automatic effect type recommendation
- Optimal depth/rate suggestion

**Use Cases:**
- Vocal enhancement
- Guitar effects
- Synth widening
- Creative stereo effects
- Retro/vintage sounds

---

## Integration

All plugins are integrated into the ChannelStripPanel and can be loaded into any insert slot. They appear in the plugin browser with the "DAWG AI" manufacturer tag and "AI Utility" or "AI Vocal" category.

### Plugin Browser

Plugins can be filtered by:
- Category (All / AI Vocal / AI Utility / AI Limiter, etc.)
- Search (by name, description, or manufacturer)
- AI plugins are visually distinguished with purple/blue gradient backgrounds

### Parameter Control

All plugins provide:
- Real-time parameter adjustment
- Visual feedback
- Parameter automation support
- Preset saving/loading (future)
- AI-powered optimization suggestions

## AI Features

### Common AI Capabilities

1. **Adaptive Processing**
   - Analyzes input content in real-time
   - Adjusts processing based on characteristics
   - Prevents over-processing

2. **Smart Suggestions**
   - Recommends optimal settings
   - Detects potential issues
   - Provides actionable feedback

3. **Auto-Optimization**
   - One-click optimization based on content analysis
   - Platform-specific optimization (for limiter)
   - Genre-aware processing (for saturation)

4. **Content Analysis**
   - Spectral analysis
   - Dynamic range measurement
   - Transient detection
   - Tempo detection
   - Phase correlation

## Technical Implementation

### Audio Processing

All plugins use Web Audio API with:
- Low-latency processing
- High-quality algorithms
- Efficient CPU usage
- Proper cleanup and disposal

### Architecture

```
src/plugins/utility/
├── AIStereoDoubler.ts    # Stereo doubling effect
├── AIStereoImager.ts     # Stereo imaging effect
├── AILimiter.ts          # Intelligent limiter
├── AISaturation.ts       # Harmonic saturation
├── AIModulation.ts       # Modulation effects
├── index.ts              # Exports
└── README.md             # This file
```

### Type Safety

All plugins include:
- Full TypeScript type definitions
- Parameter interfaces
- Validation and bounds checking
- Error handling

## Future Enhancements

1. **Preset System**
   - Save/load user presets
   - Share presets with community
   - Genre-specific preset packs

2. **Advanced AI**
   - Machine learning-based optimization
   - Content-aware processing
   - Adaptive learning from user adjustments

3. **Metering**
   - Visual feedback displays
   - Spectrum analyzers
   - Correlation meters
   - LUFS metering

4. **Automation**
   - Parameter automation
   - AI-driven automation curves
   - Tempo-synced modulation

## License

Copyright (c) 2024 DAWG AI
All rights reserved.
