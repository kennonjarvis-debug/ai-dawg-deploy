# DAWG AI Development Prompts

Complete development guide for **DAWG AI** - an AI-powered digital audio workstation.

---

## Architecture Overview

DAWG consists of two main components working together:

1. **DAWG-CORE** (JUCE/C++) - Audio engine, plugin hosting, REST API
2. **DAWG-AI** (Python/FastAPI) - AI features, analysis, generation

```
┌─────────────────────────┐
│     DAWG-CORE (C++)     │
│   - Audio I/O           │
│   - Plugin hosting      │
│   - MIDI sequencing     │
│   - REST API :8080      │
└────────────┬────────────┘
             │
             │ REST API
             │
┌────────────┴────────────┐
│    DAWG-AI (Python)     │
│   - Audio analysis      │
│   - MIDI generation     │
│   - Mixing AI           │
│   - FastAPI :9000       │
└─────────────────────────┘
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Build core audio engine and AI infrastructure

#### 1.1 Core Audio Engine
📄 **Prompt:** `DAWG_PHASE1_CORE.md`
- **Instance:** DAWG-CORE
- **Tech Stack:** JUCE 7.x, C++17, CMake
- **Deliverables:**
  - Multi-track audio recording/playback
  - VST3/AU plugin hosting
  - MIDI sequencing
  - REST API server (localhost:8080)
  - Project save/load system

#### 1.2 AI Engine
📄 **Prompt:** `DAWG_PHASE1_AI.md`
- **Instance:** DAWG-AI
- **Tech Stack:** Python 3.10+, FastAPI, Magenta, librosa
- **Deliverables:**
  - Audio analysis (tempo, key, beat detection)
  - AI MIDI generation (drums, bass, melody)
  - Mixing suggestions
  - FastAPI server (localhost:9000)
  - DAWG-CORE integration

---

### Phase 2: Integration & UI (Week 3-4)

📄 **Prompt:** `DAWG_PHASE2_INTEGRATION.md`
- **Instance:** DAWG-FULL
- **Deliverables:**
  - Modern JUCE UI with AI controls
  - Real-time AI suggestions (WebSocket)
  - Voice command integration (Jarvis)
  - Project templates
  - Export/sharing functionality
  - Enhanced status reporting

---

## Quick Start Guide

### Option 1: Sequential Development (Recommended)

Build components one at a time:

1. **Start with DAWG-CORE:**
   ```bash
   # Use prompt: DAWG_PHASE1_CORE.md
   # This creates the audio engine and REST API
   ```

2. **Then build DAWG-AI:**
   ```bash
   # Use prompt: DAWG_PHASE1_AI.md
   # Requires DAWG-CORE to be running
   ```

3. **Finally, Phase 2 Integration:**
   ```bash
   # Use prompt: DAWG_PHASE2_INTEGRATION.md
   # Enhances both components with UI and advanced features
   ```

### Option 2: Parallel Development (Advanced)

Use multiple Claude Code instances simultaneously:

```bash
# Terminal 1: DAWG-CORE instance
claude-code --prompt /path/to/DAWG_PHASE1_CORE.md

# Terminal 2: DAWG-AI instance
claude-code --prompt /path/to/DAWG_PHASE1_AI.md

# Terminal 3: Integration after both Phase 1s complete
claude-code --prompt /path/to/DAWG_PHASE2_INTEGRATION.md
```

---

## File Structure

After completing all phases, you'll have:

```
~/Development/
├── DAWG/                      # JUCE Application (DAWG-CORE)
│   ├── CMakeLists.txt
│   ├── Source/
│   │   ├── Main.cpp
│   │   ├── MainComponent.cpp
│   │   ├── AudioEngine.cpp
│   │   ├── PluginHost.cpp
│   │   ├── MIDIEngine.cpp
│   │   ├── ProjectManager.cpp
│   │   ├── APIServer.cpp
│   │   └── UI/               # Phase 2
│   │       ├── TrackView.cpp
│   │       ├── AIControlPanel.cpp
│   │       └── ModernLookAndFeel.cpp
│   └── Build/
│
├── DAWG_AI/                   # Python AI Engine (DAWG-AI)
│   ├── main.py
│   ├── requirements.txt
│   ├── api/
│   │   └── routes.py
│   ├── ai/
│   │   ├── audio_analysis.py
│   │   ├── midi_generation.py
│   │   ├── mixing_ai.py
│   │   └── realtime_analysis.py  # Phase 2
│   ├── integration/
│   │   └── dawg_client.py
│   └── utils/
│       └── status_updater.py
│
└── status/                    # Status files
    ├── DAWG-CORE_status.json
    └── DAWG-AI_status.json
```

---

## API Endpoints

### DAWG-CORE (localhost:8080)

```
GET  /api/v1/health            # Health check
POST /api/v1/transport/play    # Start playback
POST /api/v1/transport/stop    # Stop playback
GET  /api/v1/project/status    # Get project info
POST /api/v1/project/analyze   # Analyze project (forwards to AI)
POST /api/v1/generate/midi     # Generate MIDI (forwards to AI)
```

### DAWG-AI (localhost:9000)

```
GET  /health                              # Health check
POST /api/v1/analyze/audio                # Analyze audio file
POST /api/v1/analyze/project              # Analyze DAWG project
POST /api/v1/generate/midi                # Generate MIDI (drums/melody/bass)
POST /api/v1/generate/bassline            # Generate bassline
POST /api/v1/generate/melody              # Generate melody
POST /api/v1/mixing/suggest               # Get mix suggestions
POST /api/v1/mixing/auto_level            # Auto-balance levels
```

---

## Integration Points

### DAWG-CORE ↔ DAWG-AI
- **Protocol:** REST API over HTTP
- **Core → AI:** Project analysis, MIDI generation requests
- **AI → Core:** Send generated MIDI, mixing parameters

### DAWG ↔ Jarvis
- **Protocol:** File-based command system
- **Location:** `~/Development/jarvis_commands/dawg_command.json`
- **Voice Commands:** Play, Stop, Generate bassline, Add track, etc.

### Real-time Updates (Phase 2)
- **Protocol:** WebSocket
- **Port:** 8081 (Core), 8082 (AI)
- **Purpose:** Live suggestions, status updates, AI feedback

---

## Testing

### Test DAWG-CORE
```bash
# Health check
curl http://localhost:8080/api/v1/health

# Play/stop
curl -X POST http://localhost:8080/api/v1/transport/play
curl -X POST http://localhost:8080/api/v1/transport/stop

# Project status
curl http://localhost:8080/api/v1/project/status
```

### Test DAWG-AI
```bash
# Health check
curl http://localhost:9000/health

# Generate drums
curl -X POST "http://localhost:9000/api/v1/generate/midi?style=drums&tempo=120&bars=4"

# Generate bassline
curl -X POST "http://localhost:9000/api/v1/generate/bassline?key=C&scale=major"

# Mixing suggestions
curl -X POST http://localhost:9000/api/v1/mixing/suggest
```

### Test Integration
```bash
# 1. Start DAWG-CORE
cd ~/Development/DAWG/Build
./DAWG

# 2. Start DAWG-AI
cd ~/Development/DAWG_AI
source venv/bin/activate
python main.py

# 3. Test that AI can reach Core
python -c "
from integration.dawg_client import DAWGClient
client = DAWGClient()
print('Core is', 'UP' if client.health_check() else 'DOWN')
"
```

---

## Status Monitoring

Both components write status files every 5 minutes:

- **DAWG-CORE:** `~/Development/status/DAWG-CORE_status.json`
- **DAWG-AI:** `~/Development/status/DAWG-AI_status.json`

Monitor status:
```bash
# Watch CORE status
watch -n 5 cat ~/Development/status/DAWG-CORE_status.json

# Watch AI status
watch -n 5 cat ~/Development/status/DAWG-AI_status.json
```

---

## Troubleshooting

### Port Conflicts
```bash
# Check what's using ports
lsof -i :8080  # DAWG-CORE
lsof -i :9000  # DAWG-AI

# Kill if needed
kill -9 <PID>
```

### DAWG-AI Can't Connect to DAWG-CORE
1. Ensure DAWG-CORE is running: `curl http://localhost:8080/api/v1/health`
2. Check firewall settings
3. Verify REST API is enabled in DAWG-CORE

### Python Dependencies
```bash
cd ~/Development/DAWG_AI
pip install -r requirements.txt

# If Magenta fails
pip install --upgrade tensorflow
pip install magenta --no-deps
```

### JUCE Build Issues
```bash
cd ~/Development/DAWG
rm -rf Build
mkdir Build
cd Build
cmake ..
cmake --build . --verbose
```

---

## Voice Commands (Jarvis Integration)

Supported commands when integrated with Jarvis:

- **Transport:** "Play", "Stop", "Record"
- **Tracks:** "Add track", "Mute track 1"
- **AI Generation:**
  - "Generate drums"
  - "Generate bassline in C major"
  - "Generate melody in D minor"
- **Mixing:** "Get mixing suggestions", "Auto balance levels"
- **Project:** "New project", "Export project"

---

## Performance Tips

1. **Audio Buffer Size:** Adjust in DAWG-CORE for lower latency
2. **AI Model Loading:** Magenta models load on first request (may be slow)
3. **Concurrent Requests:** FastAPI handles multiple AI requests in parallel
4. **WebSocket Updates:** Adjust update frequency in Phase 2 (default: 2s)

---

## Next Steps After Phase 2

### Phase 3: Advanced AI Features
- Audio-to-MIDI transcription
- Style transfer ("make it sound like...")
- Stem separation
- Mastering AI
- Custom model training

### Phase 4: Collaboration & Cloud
- Multi-user projects
- Cloud backup
- Version control for audio projects
- Real-time collaboration

### Phase 5: Mobile
- iOS/Android companion apps
- Remote control via mobile
- Cloud sync

---

## Dependencies Summary

### DAWG-CORE (C++)
- JUCE 7.x
- CMake 3.15+
- C++17 compiler
- Xcode (macOS) or Visual Studio (Windows)

### DAWG-AI (Python)
- Python 3.10+
- FastAPI
- Magenta (TensorFlow)
- librosa
- pretty_midi
- numpy, scipy

---

## Contributing

When extending DAWG:
1. Follow the phase structure
2. Update status files
3. Maintain API compatibility
4. Document new endpoints
5. Update this README

---

## License

[Your License Here]

---

## Resources

- **JUCE Documentation:** https://juce.com/learn/documentation
- **Magenta:** https://magenta.tensorflow.org/
- **FastAPI:** https://fastapi.tiangolo.com/
- **librosa:** https://librosa.org/

---

**Ready to build DAWG AI!** Start with Phase 1 prompts and work through systematically.
