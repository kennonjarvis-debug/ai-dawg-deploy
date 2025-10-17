# Example Widgets - Integration Reference

This directory contains **working example widgets** that demonstrate how to integrate Instance 2, 3, and 4's backend systems into UI components.

## 🎯 Purpose

**Instead of reading 400+ line integration guides**, copy these examples and modify them for your needs.

Each example is a **complete, runnable widget** showing real integration patterns.

## 📦 Available Examples

### 1. EffectsPanel.example.tsx
**Integrates:** Instance 2's Audio Effects (useEffects hook)

**Shows:**
- 3-band parametric EQ with presets
- Compressor controls
- Reverb controls
- Delay controls (BPM sync)
- Bypass/enable toggles
- Manual parameter adjustments

**Integration Guide:** `/AUDIO_EFFECTS_INTEGRATION.md`

**Copy and use for:**
- Track effects panel
- Master effects panel
- Insert effects widget

---

### 2. PitchMonitor.example.tsx
**Integrates:** Instance 2's Pitch Detection (usePitchDetection hook)

**Shows:**
- Real-time pitch display (note, frequency, cents)
- In-tune indicator
- Cents deviation meter (visual)
- Confidence meter
- Target note comparison
- Performance statistics
- Pitch history visualization

**Integration Guide:** `/PITCH_DETECTION_INTEGRATION.md`

**Copy and use for:**
- Vocal coaching panel
- Pitch monitoring widget
- Tuner tool
- Vocal analysis display

---

### 3. MusicGenerator.example.tsx
**Integrates:** Instance 3's Music Generation API + Instance 2's Melody Analysis

**Shows:**
- Text-to-music generation
- Melody-to-music generation (with melody recording)
- Style selection (genre, mood, instruments)
- Model selection
- Progress tracking
- Audio preview
- Import to track

**Integration Guide:** `/MUSIC_GENERATION_SETUP.md`

**Copy and use for:**
- Music generation panel
- AI composition tool
- Backing track generator

---

## 🚀 How to Use

### 1. Copy the example
```bash
cp src/widgets/_examples/EffectsPanel.example.tsx src/widgets/EffectsPanel/EffectsPanel.tsx
cp src/widgets/_examples/EffectsPanel.example.module.css src/widgets/EffectsPanel/EffectsPanel.module.css
```

### 2. Modify for your needs
- Change component name
- Adjust styling
- Add/remove features
- Connect to your app layout

### 3. Import and use
```typescript
import { EffectsPanel } from '@/src/widgets/EffectsPanel/EffectsPanel';

// In your component
<EffectsPanel trackId={selectedTrackId} audioContext={audioContext} />
```

## 📚 When to Read Full Integration Guides

**Use examples for:** Quick integration, understanding patterns, copy-paste starting points

**Read full guides for:** API reference, advanced features, troubleshooting, performance tuning

## 🎨 Styling

All examples use CSS modules with design tokens (CSS variables). Update the `:root` section to match your design system:

```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --accent-color: #3b82f6;
  /* etc. */
}
```

## 🧪 Testing

Each example is fully functional. You can:
1. Import it directly into your app
2. Test it in isolation
3. Use it as a reference while building your own

## ⚡ Performance Notes

**EffectsPanel:**
- Zero CPU overhead when effects disabled
- Updates only when parameters change
- Safe to use on multiple tracks simultaneously

**PitchMonitor:**
- Runs at 20fps (50ms update interval)
- ~2-3% CPU usage
- Stops automatically when unmounted

**MusicGenerator:**
- Generation happens server-side
- Progress simulation only (API doesn't provide real-time updates)
- Audio playback after generation completes

## 🔗 Dependencies

All examples require:
- React 18+
- Next.js 15+
- Web Audio API support (all modern browsers)

Specific dependencies per example:
- **EffectsPanel:** `/src/core/useEffects`, `/src/utils/audioEffects`
- **PitchMonitor:** `/src/core/usePitchDetection`, `/src/utils/pitchDetection`
- **MusicGenerator:** `/src/core/useMelodyAnalysis`, `/app/api/generate/music`

## 📖 Related Documentation

**Integration Guides:**
- `/AUDIO_EFFECTS_INTEGRATION.md` (359 lines) - Full EQ/compressor/reverb/delay API
- `/PITCH_DETECTION_INTEGRATION.md` (504 lines) - Full pitch detection API
- `/VOCAL_EFFECTS_INTEGRATION.md` (757 lines) - Auto-tune, doubler, de-esser
- `/MELODY_ANALYSIS_INTEGRATION.md` (452 lines) - Vocal → MIDI conversion
- `/MUSIC_GENERATION_SETUP.md` (459 lines) - Music generation API
- `/INSTANCE_1_INTEGRATION.md` (563 lines) - Complete instance 1 integration guide

**Setup Guides:**
- `/AUTHENTICATION_SETUP.md` - NextAuth.js setup
- `/S3_STORAGE_SETUP.md` - Audio file storage
- `/DATABASE_SETUP.md` - Database setup

## 💡 Tips

1. **Start with examples, not docs** - Copy and modify examples first, read docs when you need details
2. **Keep examples as reference** - Don't edit these files directly, copy them first
3. **Mix and match** - Combine multiple examples into one widget if needed
4. **Check prop types** - TypeScript will guide you on required props

## 🐛 Troubleshooting

**"Module not found" errors:**
- Make sure you've copied both `.tsx` and `.module.css` files
- Check import paths match your project structure

**Audio context errors:**
- Ensure `audioContext` is created after user interaction
- Check browser compatibility (Web Audio API)

**Hooks not working:**
- Verify you're using `'use client'` directive
- Check that hook dependencies are available (audioContext, mediaStream, etc.)

---

**Created by:** Instance 2 (Audio Engine)
**Date:** 2025-10-02
**Part of:** AI Environment Optimization (Phase 1)
