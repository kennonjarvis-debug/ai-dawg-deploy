# Beatbox-to-Drums Workflow

## Overview

The Beatbox-to-Drums workflow uses AI to analyze beatbox recordings and convert them into MIDI drum patterns. It automatically detects kicks, snares, hi-hats, and cymbals, then generates professional drum tracks using your choice of drum samples.

## Features

- **AI-Powered Detection**: Analyzes beatbox audio using OpenAI Whisper for accurate drum pattern recognition
- **Automatic Tempo Detection**: Calculates BPM from beatbox timing
- **Multiple Drum Kits**: Choose from acoustic, electronic, 808, trap, or rock drum samples
- **Quantization**: Optionally snap patterns to grid for perfect timing
- **Pattern Enhancement**: AI can add missing hi-hats and improve groove
- **MIDI Export**: Download generated patterns as MIDI files
- **Audio Preview**: Hear the result before adding to your project

## How It Works

### 1. Audio Analysis
The service analyzes your beatbox recording using:
- OpenAI Whisper for phonetic transcription
- Pattern recognition to map sounds to drum types
- Timing analysis for tempo detection

### 2. Drum Type Detection
Beatbox sounds are mapped to drum types:
- "boom" / "boots" → Kick drum
- "psh" / "ka" → Snare
- "ts" / "kss" → Hi-hat
- "crash" → Crash cymbal

### 3. MIDI Conversion
Detected patterns are converted to:
- General MIDI drum map (note numbers)
- Velocity levels (based on confidence)
- Proper timing (quantized if enabled)

### 4. Audio Generation
MIDI patterns are rendered using:
- Selected drum kit samples
- Enhanced patterns (if enabled)
- Professional mixing

## Usage

### Via UI (Advanced Features Panel)

1. **Open Advanced Features**
   - Click "Advanced Features" button in DAW
   - Expand "Beatbox-to-Drums" section

2. **Upload Recording**
   - Click "Choose File"
   - Select your beatbox audio (.wav, .mp3, etc.)

3. **Configure Options**
   - **Drum Kit**: Choose acoustic, electronic, 808, trap, or rock
   - **Quantize to Grid**: Enable for perfectly timed patterns
   - **Enhance Pattern**: Let AI add missing hi-hats and improve groove

4. **Convert**
   - Click "Convert to Drums"
   - Wait for processing (typically 5-15 seconds)

5. **Review Results**
   - View detected tempo and pattern count
   - See which drum samples were used
   - Preview the audio
   - Download MIDI file

### Via API

```typescript
// Upload beatbox audio
const formData = new FormData();
formData.append('audio', beatboxFile);
formData.append('drumKit', 'acoustic');
formData.append('quantize', 'true');
formData.append('enhancePattern', 'true');

const response = await fetch('/api/v1/ai/beatbox-to-drums', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log('Tempo:', result.analysis.tempo);
console.log('Patterns:', result.analysis.detectedPatterns.length);
console.log('MIDI:', result.midiData); // Base64 encoded
console.log('Audio URL:', result.audioUrl);
```

## API Reference

### POST /api/v1/ai/beatbox-to-drums

Convert beatbox audio to drum patterns.

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `audio` (file): Beatbox recording
  - `drumKit` (string): 'acoustic' | 'electronic' | '808' | 'trap' | 'rock'
  - `quantize` (boolean): Enable grid quantization
  - `enhancePattern` (boolean): Enable pattern enhancement

**Response:**
```json
{
  "success": true,
  "analysis": {
    "detectedPatterns": [
      {
        "timestamp": 0.0,
        "drumType": "kick",
        "velocity": 110,
        "confidence": 0.9
      }
    ],
    "tempo": 120,
    "timeSignature": "4/4",
    "duration": 4.5,
    "confidence": 0.85
  },
  "midiData": "base64_encoded_midi",
  "audioUrl": "/api/v1/audio/beatbox-drums/12345.wav",
  "drumSamples": ["acoustic/kick.wav", "acoustic/snare.wav"],
  "processingTime": 5432
}
```

## Technical Details

### Backend Service

**File:** `/src/backend/services/beatbox-to-drums-service.ts`

Key methods:
- `analyzeBeatbox()`: Analyzes audio and extracts patterns
- `convertToMIDI()`: Converts patterns to MIDI format
- `generateAudio()`: Renders audio from MIDI
- `processBeatbox()`: Full pipeline from audio to drums

### Frontend Component

**File:** `/src/ui/components/BeatboxToDrumsWidget.tsx`

Features:
- File upload interface
- Drum kit selection
- Toggle options for quantize/enhance
- Results display with metrics
- Preview and download buttons

## Best Practices

1. **Recording Quality**
   - Use clear, isolated beatbox recordings
   - Avoid background noise
   - Maintain consistent volume

2. **Drum Selection**
   - Match drum kit to genre (trap kit for trap beats, etc.)
   - Acoustic works well for most styles
   - 808 is great for hip-hop and trap

3. **Quantization**
   - Enable for precise, grid-locked patterns
   - Disable to preserve human feel

4. **Enhancement**
   - Enable for basic patterns that need fill
   - Disable for complex patterns to preserve original

## Examples

### Example 1: Simple Hip-Hop Pattern
```
Beatbox: "boots-kss-psh-kss"
Result: Kick-HiHat-Snare-HiHat at 90 BPM
```

### Example 2: Trap Pattern with Rolls
```
Beatbox: "boom-tsss-ts-ts-ts-psh"
Result: 808 Kick + Hi-Hat Roll + Snare at 140 BPM
```

## Troubleshooting

**Low Confidence Score**
- Re-record with clearer sounds
- Reduce background noise
- Try different drum kit

**Wrong Tempo Detection**
- Maintain consistent timing in recording
- Try shorter recordings (4-8 bars)

**Missing Drum Hits**
- Speak sounds more distinctly
- Increase recording volume
- Enable "Enhance Pattern" option

## Integration with DAW

Generated drum patterns can be:
- Added as new MIDI track
- Exported as audio track
- Used as reference for live drumming
- Combined with other AI-generated beats

## Future Enhancements

- Real-time beatbox recording
- Custom drum sample upload
- Pattern variation generation
- Multi-layer drum synthesis
- Groove template matching
