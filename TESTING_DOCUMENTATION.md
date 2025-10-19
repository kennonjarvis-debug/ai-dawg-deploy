# DAWG AI - Complete Testing Documentation

**Last Updated**: October 17, 2025
**Version**: Production Deployment (Commit: 39f1c2c)

## 🚀 Quick Access URLs

### Development Environment (LOCAL)
- **Landing Page**: http://localhost:5173/
- **Login**: http://localhost:5173/login
- **Register**: http://localhost:5173/register
- **Projects Dashboard**: http://localhost:5173/app
- **DAW Interface**: http://localhost:5173/project/demo-project-2
- **Live Studio**: http://localhost:5173/live-studio
- **Features Page**: http://localhost:5173/features
- **Pricing**: http://localhost:5173/pricing

### Backend Servers (LOCAL)
- **AI Brain Server**: http://localhost:3100/health
- **Gateway Server**: http://localhost:3002/health
- **Frontend (Vite)**: http://localhost:5173

### Production
- **Live Site**: https://dawg-ai.com

---

## 🏗️ Architecture Overview

### Frontend Stack
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State Management**: Zustand
- **Build Tool**: Vite 5.4.20
- **Styling**: Tailwind CSS + Custom CSS

### Backend Services

#### 1. AI Brain Server (Port 3100)
**Purpose**: Handles all AI-powered features
- OpenAI Realtime API integration (Live voice chat)
- Audio processing (pitch correction, vocal comp, time align)
- Beat generation and analysis
- Music generation
- AI mastering and mixing

**Key Features**:
- 57 voice-controlled functions
- Real-time audio streaming
- WebSocket support for live voice
- Claude integration for AI coaching

#### 2. Gateway Server (Port 3002)
**Purpose**: Terminal service and session management
- SSH session management
- Command firewall
- REST API for terminal operations
- WebSocket server for real-time communication

#### 3. Audio Engine
**Location**: `src/audio/AudioEngine.ts`
**Capabilities**:
- Real-time audio playback
- Track routing and mixing
- Effects processing
- Beat detection and analysis
- MIDI support
- Plugin hosting

---

## 🎵 Core Features

### 1. AI-Powered Production Tools

#### Auto Features (Recently Rebranded to "AI")
- **AI Comp**: Automatically comp best vocal takes
  - Endpoint: `/api/v1/ai/autocomp`
  - Selection: Requires 2+ clips selected

- **AI Time Align**: Align audio to grid with natural feel
  - Endpoint: `/api/v1/ai/timealign`
  - Selection: Requires 1+ clips selected

- **AI Pitch Correct**: Natural pitch correction
  - Endpoint: `/api/v1/ai/pitchcorrect`
  - Selection: Requires 1+ clips selected

- **AI Mix**: Studio-quality mixing
  - Endpoint: `/api/v1/ai/mix`
  - Selection: Requires 1+ tracks selected

- **AI Master**: Radio-ready mastering
  - Endpoint: `/api/v1/ai/mastering/process`
  - Selection: Requires master track

#### Generation Features (NEW)
- **AI Beat Generation**: Generate beats in producer styles
  - Styles: Metro Boomin, 808 Mafia, Timbaland, Pharrell, Southside, Pierre Bourne
  - Endpoint: `/api/v1/ai/dawg`
  - Parameters: genre, bpm, style, mood

- **AI Instrument Generation**: Create instrument tracks
  - Types: Piano, Guitar, Bass, Strings, Synth
  - Endpoint: `/api/v1/ai/dawg`

- **AI Full Song Composition**: Complete song generation
  - Endpoint: `/api/v1/ai/dawg`
  - Parameters: genre, mood, tempo, duration, style

### 2. Live Voice Control (OpenAI Realtime API)

**Connection**: WebSocket to AI Brain Server (ws://localhost:3100)

**57 Available Voice Commands**:

#### Playback Control
- `play()` - Start playback
- `pause()` - Pause playback
- `stop()` - Stop playback
- `toggle_playback()` - Toggle play/pause
- `skip_forward(seconds)` - Skip forward
- `skip_backward(seconds)` - Skip backward
- `goto_time(seconds)` - Jump to specific time
- `goto_marker(name)` - Jump to marker

#### Recording
- `start_recording()` - Start recording
- `stop_recording()` - Stop recording
- `toggle_recording()` - Toggle recording
- `create_loop()` - Create loop region
- `punch_in()` - Start punch-in recording
- `punch_out()` - Stop punch-in recording

#### Track Management
- `create_track(name, type)` - Create new track
- `delete_track(track_id)` - Delete track
- `mute_track(track_id)` - Mute track
- `unmute_track(track_id)` - Unmute track
- `solo_track(track_id)` - Solo track
- `unsolo_track(track_id)` - Unsolo track
- `arm_track(track_id)` - Arm track for recording
- `rename_track(track_id, name)` - Rename track

#### Mixing
- `set_volume(track_id, db)` - Set volume
- `set_pan(track_id, value)` - Set pan
- `add_reverb(track_id, amount)` - Add reverb
- `add_delay(track_id, time, feedback)` - Add delay
- `add_eq(track_id, freq, gain, q)` - Add EQ
- `add_compressor(track_id, threshold, ratio)` - Add compression

#### AI Features
- `auto_tune(track_id, key, amount)` - Apply auto-tune
- `beat_detect(track_id)` - Detect BPM
- `time_align(track_id)` - Align to grid
- `generate_harmony(track_id)` - Generate harmony
- `suggest_chords(key, mood)` - Suggest chord progression

#### Project Management
- `save_project()` - Save project
- `export_audio(format)` - Export audio
- `undo()` - Undo last action
- `redo()` - Redo last action

### 3. Vocal Processing

**VocalProcessor** (`src/audio/VocalProcessor.ts`)

**Analysis Capabilities**:
- Pitch detection
- Timbre analysis
- Dynamic range calculation
- Noise floor estimation
- Sibilance detection
- Room tone detection
- Clipping detection

**Effect Recommendations by Genre**:
- Country: Plate reverb, moderate compression
- Pop: Auto-tune, tight compression, bright EQ
- Rock: Saturation, moderate compression
- R&B: Smooth compression, warm reverb
- Hip-Hop: Fast auto-tune, heavy compression
- Indie: Natural sound, minimal processing
- Folk: Room reverb, light compression
- Jazz: Minimal compression, natural dynamics

### 4. Beat Analysis & Generation

**BeatAnalyzer** (`src/audio/ai/BeatAnalyzer.ts`)

**Capabilities**:
- BPM detection (60-200 BPM)
- Time signature detection
- Beat grid alignment
- Downbeat detection
- Tempo stability analysis
- Swing detection
- Quantization to grid
- MIDI extraction

### 5. AI Mastering Engine

**AIMasteringEngine** (`src/audio/ai/AIMasteringEngine.ts`)

**Processing Pipeline**:
1. **Correction Stage**: EQ, compression, limiting
2. **Enhancement Stage**: Exciter, widener, saturation
3. **Finalization Stage**: Final limiting, dithering

**Targets**:
- Loudness: -14 LUFS (streaming), -9 LUFS (radio)
- Dynamic range: 8-12 dB
- Peak level: -0.1 dBFS

---

## 🔐 Authentication

### Test Credentials
Create test accounts at: http://localhost:5173/register

### Session Management
- JWT-based authentication
- Tokens stored in httpOnly cookies
- Refresh token rotation
- Session TTL: 1 hour

### API Authentication
All API requests require JWT token in cookie or Authorization header:
```
Authorization: Bearer <token>
```

---

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Audio Processing
- `POST /api/v1/ai/autocomp` - Auto-comp vocals
- `POST /api/v1/ai/timealign` - Time align to grid
- `POST /api/v1/ai/pitchcorrect` - Pitch correction
- `POST /api/v1/ai/mix` - Smart mixing
- `POST /api/v1/ai/mastering/process` - AI mastering
- `POST /api/v1/ai/dawg` - Full AI production

### Generation
- `POST /api/v1/generate/beat` - Generate beat
- `POST /api/v1/generate/chords` - Generate chords
- `POST /api/v1/generate/melody` - Generate melody
- `POST /api/v1/generate/stems` - Stem separation

---

## 🧪 Testing Scenarios

### Scenario 1: New User Journey
1. Visit http://localhost:5173/
2. Click "Get Started Free"
3. Register new account
4. Verify redirect to /app (projects dashboard)
5. Create new project
6. Verify redirect to /project/:id (DAW interface)

### Scenario 2: Recording & Processing
1. Login to DAW
2. Create audio track (voice command or UI)
3. Arm track for recording
4. Record audio clip
5. Stop recording
6. Select recorded clip
7. Apply AI Pitch Correct
8. Apply AI Time Align
9. Apply AI Comp (if multiple takes)
10. Export final audio

### Scenario 3: Beat Generation
1. Login to DAW
2. Open AI menu
3. Select "Generate Beat"
4. Choose producer style (e.g., "Metro Boomin")
5. Set BPM (default: 120)
6. Set genre (default: "hip-hop")
7. Generate beat
8. Verify new track created with audio

### Scenario 4: Live Voice Control
1. Login to DAW
2. Open DAWG AI panel
3. Click microphone icon to start live voice
4. Say: "create track drums"
5. Verify track created
6. Say: "set tempo to 140"
7. Verify tempo changed
8. Say: "generate beat like Metro Boomin"
9. Verify beat generated

### Scenario 5: Full Song Production
1. Login to DAW
2. Open DAWG AI panel
3. Click "Full Song Composition"
4. Enter prompt: "Create a chill lo-fi hip hop beat"
5. Set parameters: genre=hip-hop, tempo=90, duration=120
6. Generate
7. Verify multiple tracks created (drums, bass, melody, etc.)

---

## 🐛 Known Issues & Recent Fixes

### ✅ FIXED (Oct 17, 2025)
1. **Gateway Server Static Files**: Added express.static() to serve React UI
2. **AudioEngine Beat Detection**: Moved methods inside class (fixed 45 TS errors)
3. **Menu Rebranding**: Changed "Auto" → "AI" across all features
4. **MediaRecorder MIME Type**: Added browser-compatible fallback chain

### ⚠️ Known Issues
1. **TypeScript Warnings**: Many unused variable warnings (non-blocking)
2. **Cookie Parser Types**: Missing @types/cookie-parser (install suggested)
3. **SSH2 Types**: Missing types for ssh2 module (non-blocking)

---

## 📊 Feature Access by Plan

### FREE Plan
- Basic DAW functionality
- 3 projects max
- Export limitations
- No AI features

### PRO Plan
- 10 projects
- AI Comp (5/day)
- AI Pitch (5/day)
- AI Time Align (5/day)
- Basic mixing tools

### STUDIO Plan (Unlimited)
- Unlimited projects
- All AI features unlimited
- AI Beat Generation
- AI Instrument Generation
- AI Full Song Composition
- Priority support

---

## 🔧 Development Commands

```bash
# Start all dev servers
npm run dev:ui         # Frontend (port 5173)
npx tsx src/backend/ai-brain-server.ts  # AI Brain (port 3100)
npx tsx src/gateway/server.ts           # Gateway (port 3002)

# Build
npm run build:ui       # Build React app

# Test
npm run test          # Run all tests
npm run test:e2e      # E2E tests
npm run test:fast     # Fast unit tests

# Deploy
railway up            # Deploy to Railway
```

---

## 📝 Testing Checklist

### UI Testing
- [ ] Landing page loads correctly
- [ ] Navigation works (Features, Pricing, Login)
- [ ] Registration flow completes
- [ ] Login flow works
- [ ] Projects dashboard shows projects
- [ ] DAW interface loads
- [ ] Timeline renders
- [ ] Transport controls work
- [ ] Track creation works
- [ ] Audio playback works

### AI Features Testing
- [ ] AI Comp processes multiple clips
- [ ] AI Time Align works
- [ ] AI Pitch Correct applies
- [ ] AI Mix generates mix
- [ ] AI Master processes track
- [ ] Beat Generation creates track
- [ ] Instrument Generation works
- [ ] Full Song Composition creates multiple tracks

### Voice Control Testing
- [ ] Mic button activates voice chat
- [ ] Voice commands recognized
- [ ] DAW responds to commands
- [ ] Live transcription works
- [ ] AI responses play back

### Performance Testing
- [ ] Page load time < 2s
- [ ] Audio latency < 50ms
- [ ] Voice response time < 1s
- [ ] Generation time reasonable (< 30s)

---

## 🔍 Debugging Tips

### Frontend Issues
```bash
# Check Vite dev server
curl http://localhost:5173

# Check browser console for errors
# Open DevTools → Console
```

### Backend Issues
```bash
# Check AI Brain server
curl http://localhost:3100/health

# Check Gateway server
curl http://localhost:3002/health

# Check logs
tail -f logs/ai-brain.log
```

### WebSocket Issues
```bash
# Test WebSocket connection
wscat -c ws://localhost:3100

# Check browser Network tab → WS filter
```

---

## 📞 Support & Resources

- **GitHub Repo**: https://github.com/kennonjarvis-debug/ai-dawg-deploy
- **Railway Project**: dazzling-happiness
- **Production URL**: https://dawg-ai.com
- **Docs**: This file + ARCHITECTURE.md

---

## 🚨 Critical Information for Automated Testing

### Rate Limits
- OpenAI API: Check OPENAI_API_KEY env var
- Railway: Check deployment limits

### Environment Variables Required
```bash
# Required for AI features
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Required for auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Required for database
DATABASE_URL=postgresql://...

# Optional but recommended
REDIS_URL=redis://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Data Persistence
- Projects stored in PostgreSQL
- Audio files stored in S3 (or local /uploads in dev)
- Session data in Redis (or in-memory in dev)

### Cleanup After Testing
```bash
# Clear test data
npm run db:reset

# Clear uploaded files
rm -rf uploads/test-*

# Clear Redis cache
redis-cli FLUSHDB
```

---

**END OF DOCUMENTATION**
**Generated**: October 17, 2025 15:35 PT
**For**: Automated Testing & Feature Recording
