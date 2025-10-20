# Voice Control Quick Start Guide

## ✅ Configuration Complete

Your OpenAI API key has been verified and all voice control features are ready to use!

**API Key Status:**
- ✅ Found in `.env` file
- ✅ GPT-4 access confirmed
- ✅ Whisper access confirmed
- ✅ Text-to-Speech available
- ✅ Frontend access configured (`VITE_OPENAI_API_KEY`)

---

## 🚀 Quick Integration (3 Steps)

### Step 1: Import the Hook

```tsx
import { useVoiceControl } from './hooks/useVoiceControl';
```

### Step 2: Use in Your Component

```tsx
function MyDAWComponent() {
  const {
    isListening,
    toggleListening,
    currentTranscript,
    lastCommand,
    error,
  } = useVoiceControl({
    mode: 'hybrid',        // Use both Web Speech and AI
    enableTTS: true,       // Voice feedback
    enableConfirmation: true, // Confirm destructive actions
  });

  return (
    <div>
      {/* Microphone Button */}
      <button onClick={toggleListening}>
        {isListening ? '🔴 Listening...' : '🎙️ Voice Control'}
      </button>

      {/* Live Transcript */}
      {currentTranscript && (
        <p>You said: {currentTranscript}</p>
      )}

      {/* Last Command Executed */}
      {lastCommand && (
        <p>Executed: {lastCommand.action}</p>
      )}

      {/* Error Display */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

### Step 3: Try Voice Commands

**Transport Control:**
- "play" / "start playback"
- "pause" / "stop"
- "record" / "start recording"
- "jump to 30 seconds"

**Track Management:**
- "add track" / "create new track"
- "delete track 2"
- "mute track vocals"
- "solo drums"

**Session Control:**
- "set BPM to 140"
- "enable metronome"
- "zoom in" / "zoom out"

**Natural Language (AI Mode):**
- "Can you add a vocals track and arm it for recording?"
- "Set the tempo to 128 and enable the click track"
- "Mute everything except the drums"

---

## 🎯 Voice Memo Feature

Record musical ideas instantly with AI analysis:

```tsx
import VoiceMemo from './ui/components/VoiceMemo';

function MyApp() {
  return <VoiceMemo />;
}
```

**Features:**
- 🎤 Quick voice recording
- 📝 Auto-transcription (Whisper)
- 🎵 AI detects: music, lyrics, rhythm, mood
- 🔄 Convert to: audio clips, lyrics sheet, or MIDI
- 🏷️ Tag and search your ideas

---

## 🛠️ Configuration Options

### Voice Control Modes

```tsx
useVoiceControl({
  mode: 'basic',    // Fast, offline Web Speech API
  mode: 'ai',       // Whisper + GPT-4 (best accuracy)
  mode: 'hybrid',   // Start with basic, upgrade to AI if needed ⭐ RECOMMENDED
})
```

### Advanced Settings

```tsx
useVoiceControl({
  mode: 'hybrid',
  enableTTS: true,              // Voice feedback
  enableConfirmation: true,     // Confirm destructive actions
  autoStopTimeout: 3000,        // Stop listening after 3s of silence
  confidenceThreshold: 0.7,     // Minimum confidence for AI commands
  language: 'en-US',            // Speech recognition language
  onCommandExecuted: (cmd) => { // Command callback
    console.log('Executed:', cmd);
  },
})
```

---

## 📊 Performance

| Operation | Time | Cost |
|-----------|------|------|
| Basic commands (Web Speech) | <100ms | Free |
| Whisper transcription | 1-3s | $0.006/min |
| GPT-4 analysis | 0.5-2s | $0.01-0.03 |
| Full AI flow | 3-5s | $0.02-0.04 |

**Optimization Tips:**
- Use `mode: 'hybrid'` to start with fast Web Speech
- Only upgrade to AI for complex/ambiguous commands
- Enable local caching for repeated commands
- Use `confidenceThreshold` to filter out low-quality transcripts

---

## 🧪 Testing

### Run Voice Control Tests

```bash
npm run test:integration
```

Tests include:
- ✅ Voice command parsing and execution
- ✅ Transport integration (play, pause, record)
- ✅ Track management (add, delete, mute, solo)
- ✅ Live waveform visualization
- ✅ Clip creation after recording
- ✅ Store synchronization
- ✅ Error handling and recovery

---

## 🔍 Troubleshooting

### "Microphone not accessible"

**Solution:**
1. Check browser permissions (click lock icon in address bar)
2. Ensure HTTPS or localhost (required for Web Speech API)
3. Check system microphone permissions

### "OpenAI API error"

**Solution:**
1. Verify API key: `npx tsx scripts/verify-openai-key.ts`
2. Check `.env` has `VITE_OPENAI_API_KEY` set
3. Restart dev server after changing `.env`

### "Commands not executing"

**Solution:**
1. Check console for errors
2. Verify stores are initialized (useTransportStore, useTimelineStore)
3. Try saying exact commands: "play", "pause", "add track"
4. Switch to AI mode for natural language: `mode: 'ai'`

### "Low transcription accuracy"

**Solution:**
1. Upgrade to AI mode: `mode: 'ai'` (uses Whisper instead of Web Speech)
2. Speak clearly near microphone
3. Reduce background noise
4. Use push-to-talk instead of continuous listening

---

## 🎨 UI Integration Examples

### Example 1: Transport Bar with Voice

```tsx
function TransportBar() {
  const { isPlaying, play, pause } = useTransportStore();
  const { toggleListening, isListening } = useVoiceControl({ mode: 'basic' });

  return (
    <div className="transport-bar">
      <button onClick={play}>▶️ Play</button>
      <button onClick={pause}>⏸️ Pause</button>

      {/* Voice Control Button */}
      <button
        onClick={toggleListening}
        className={isListening ? 'recording' : ''}
      >
        🎙️ {isListening ? 'Listening' : 'Voice'}
      </button>
    </div>
  );
}
```

### Example 2: Voice Feedback UI

```tsx
function VoiceControlUI() {
  const {
    isListening,
    toggleListening,
    currentTranscript,
    lastCommand,
    error,
  } = useVoiceControl({ mode: 'hybrid', enableTTS: true });

  return (
    <div className="voice-control">
      {/* Microphone Button */}
      <button onClick={toggleListening}>
        {isListening ? (
          <span className="pulse">🔴 Listening</span>
        ) : (
          '🎙️ Start Voice Control'
        )}
      </button>

      {/* Live Transcript Bubble */}
      {currentTranscript && (
        <div className="transcript-bubble">
          <span className="wave-animation">🌊</span>
          "{currentTranscript}"
        </div>
      )}

      {/* Command Confirmation */}
      {lastCommand && (
        <div className="command-executed">
          ✅ Executed: {lastCommand.action}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => toggleListening()}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Voice Memo Panel

```tsx
import VoiceMemo from './ui/components/VoiceMemo';

function SidePanel() {
  return (
    <div className="side-panel">
      <h2>Quick Ideas</h2>

      {/* Voice Memo Component */}
      <VoiceMemo />

      {/* Other panels... */}
    </div>
  );
}
```

---

## 📖 Full Documentation

For complete API reference, examples, and advanced features, see:

**[PHASE_5_VOICE_CONTROL_COMPLETE.md](./PHASE_5_VOICE_CONTROL_COMPLETE.md)**

---

## 🚀 Ready to Deploy?

Your voice control system is configured and tested! Next steps:

1. ✅ API key configured and verified
2. ✅ Voice control components created
3. ✅ Integration tests passing
4. ✅ Documentation complete

**Deployment Checklist:**
- [ ] Test voice control in staging environment
- [ ] Verify HTTPS (required for Web Speech API)
- [ ] Set up error monitoring for voice commands
- [ ] Configure rate limiting for OpenAI API calls
- [ ] Add analytics tracking for voice usage
- [ ] User onboarding for voice features

---

**Need Help?**

- 📖 Documentation: `PHASE_5_VOICE_CONTROL_COMPLETE.md`
- 🧪 Run tests: `npm run test:integration`
- 🔑 Verify API: `npx tsx scripts/verify-openai-key.ts`
- 🐛 Report issues: Check console logs and error messages

---

✨ **Happy Voice Controlling!** 🎤🎵
