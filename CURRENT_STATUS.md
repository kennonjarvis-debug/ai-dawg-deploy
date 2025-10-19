# DAWG AI - Current System Status
**Snapshot Time**: October 17, 2025 - 16:30 PT (UPDATED - METADATA & VOCAL COACH)

## ✅ Development Servers - ALL ONLINE

### Frontend (React/Vite)
```
URL: http://localhost:5173
Status: ✅ RUNNING
Build: Vite 5.4.20
Hot Reload: ENABLED
```

### AI Brain Server
```
URL: http://localhost:3100
Health: http://localhost:3100/health
Status: ✅ RUNNING
Features:
  - OpenAI Realtime API: ENABLED
  - Voice Control: 57 functions available
  - WebSocket: ws://localhost:3100
  - Audio Processing: READY
```

### Gateway Server
```
URL: http://localhost:3002
Health: http://localhost:3002/health
Status: ✅ RUNNING
Features:
  - Terminal Sessions: READY
  - REST API: ENABLED
  - WebSocket: READY
  - Static File Serving: CONFIGURED (for production)
```

---

## 📦 Recent Deployments

### Latest Commit: 39f1c2c
```
fix: Add static file serving to gateway server

CRITICAL FIX: Gateway server now serves React UI in production
- Added express.static() middleware
- Added SPA catch-all route
- Fixes production deployment issue

Status: DEPLOYED to Railway (building...)
```

### Previous Commits:
- `c6fc187` - Active development updates (AI brain, UI components)
- `8dc7db3` - OpenSSL 1.1 compat for Prisma
- `c95af5b` - Flexible start script for Railway

---

## 🎤 NEW FEATURE: Context-Aware AI Vocal Coach (Oct 17, 16:30 PT)

### **Feature Overview**
AI now collects metadata from uploaded tracks (vocals, beats, instruments) to understand the "vibe" and provides intelligent, context-aware vocal coaching. For example, if playing a Morgan Wallen-style beat, the AI coach gives Morgan Wallen-specific vocal tips.

### **What Was Built**

#### 1. **Rich Metadata Type System** (`src/api/types.ts:135-184`)
- **VocalCharacteristics**: Timbre (brightness, warmth, roughness), dynamic range, spectral balance, noise detection
- **RhythmCharacteristics**: BPM, key, time signature, tempo stability
- **StyleMetadata**: Genre (country, pop, R&B, hip-hop), subgenre (e.g., "morgan-wallen"), mood, energy
- All metadata is optional and stored in `Track.metadata` field

#### 2. **Metadata Analyzer Service** (`src/backend/services/MetadataAnalyzer.ts`)
- Uses existing VocalProcessor and BeatAnalyzer to extract audio characteristics
- **Genre inference**: Analyzes vocal timbre + BPM to detect genre (bright + warm = country, etc.)
- **Artist style detection**: Detects specific styles like "Morgan Wallen" (country + 80-130 BPM + warm vocals)
- **Auto track-type detection**: Determines if audio is vocal or instrument based on spectral characteristics

#### 3. **Backend API Endpoints** (`src/backend/routes/track-routes.ts`)
New REST endpoints at `/api/tracks`:
- `POST /api/tracks/:trackId/analyze` - Analyze track and extract metadata
- `GET /api/tracks/:trackId/metadata` - Retrieve track metadata
- `PUT /api/tracks/:trackId/metadata` - Update metadata manually
- `POST /api/tracks/:trackId/detect-style` - Detect artist style from metadata

#### 4. **Context-Aware Vocal Coach UI** (`src/ui/panels/VocalCoachPanel.tsx`)
The Vocal Coach panel now displays:
- **Project Context Banner**: Shows current beat info (e.g., "C Major 115 BPM (4/4)")
- **Style-Specific Guidance**: Genre-specific coaching tips appear automatically:
  - **Morgan Wallen**: "Mix chest voice with slight rasp", "Slight southern drawl on 'I' sounds"
  - **Country**: "Add warmth and twang to vowels", "Natural, subtle vibrato (4-6 Hz)"
  - **Pop**: "Bright, clear tone with controlled vibrato", "Tight tuning required"
  - **R&B**: "Emphasize runs and riffs", "Add warmth and breathiness"
  - **Hip-Hop**: "Lock in with the beat", "Slight auto-tune sound is authentic"
- **BPM-Specific Tips**: Slow tempo = focus on sustain, fast = maintain breath support

#### 5. **Real-Time Rhythm Analysis** (`src/ui/panels/VocalCoachPanel.tsx:139-214, 493-608`)
Now analyzes **both pitch AND rhythm** simultaneously during live singing:
- **Onset Detection**: Detects when singer starts phrases using RMS energy analysis
- **Timing Accuracy**: Compares singing to expected beat grid (0-100% accuracy)
- **Rushing/Dragging Detection**: Shows if singing ahead (rushing) or behind (dragging) beat with ms offset
- **Consistency Tracking**: Measures timing steadiness over time (0-100%)
- **Live Feedback UI**: Color-coded display:
  - 🟢 Green = On time (perfect timing!)
  - 🔵 Blue = Rushing (ahead of beat)
  - 🟠 Orange = Dragging (behind beat)

### **How to Use**

1. **Upload a Morgan Wallen-style beat** → System auto-detects:
   - Genre: Country, Subgenre: morgan-wallen
   - BPM: ~115, Key: C Major, Time Signature: 4/4

2. **Open Vocal Coach panel** (click "AI" → "Vocal Coach") → See context display:
   - "Coaching for Track: C Major 115 BPM (4/4)"
   - Morgan Wallen-specific vocal tips appear automatically

3. **Click "Start Real-Time Analysis"** → Get live feedback on:
   - **Pitch**: Note name, cents offset, stability, vibrato
   - **Rhythm**: Timing accuracy %, rushing/dragging, consistency %
   - All feedback is relative to the 115 BPM beat!

### **Files Created/Modified**
**Created:**
- `src/backend/services/MetadataAnalyzer.ts` (234 lines) - Core metadata extraction
- `src/backend/routes/track-routes.ts` (252 lines) - API endpoints

**Modified:**
- `src/api/types.ts` - Added 50 lines of metadata type definitions
- `src/ui/panels/VocalCoachPanel.tsx` - Added 200+ lines for context display + rhythm analysis
- `src/backend/server.ts` - Mounted track routes

### **Technical Details**
- **Onset Detection**: Uses RMS energy with 1.5x threshold for onset detection
- **Beat Grid Alignment**: Calculates offset from nearest beat based on project BPM
- **Timing Metrics**: Standard deviation of timing offsets for consistency
- **Genre Detection**: Heuristic-based on spectral centroid, warmth, and BPM ranges
- **Browser Compatibility**: AudioContext created on user gesture (autoplay policy compliant)

---

## 🎯 Critical Fixes Applied Today

### 1. AudioEngine Initialization Error (RUNTIME FIX - LATEST)
**Problem**: AudioEngine failed to initialize - `ReferenceError: AIMasteringEngine is not defined`
**Solution**: Added missing import for AIMasteringEngine class
**File**: `src/audio/AudioEngine.ts:14`
**Status**: Fixed, ready for testing
**Time**: 15:52 PT

### 2. Vite Proxy Configuration (API CONNECTION FIX - LATEST)
**Problem**: Frontend couldn't connect to backend API (ECONNREFUSED errors)
**Solution**: Updated Vite proxy target from port 3001 → 3100
**File**: `vite.config.ts:26`
**Status**: Fixed, Vite restarted with new config
**Time**: 15:52 PT

### 3. Gateway Server Static Files (PRODUCTION FIX)
**Problem**: Production site wasn't serving React UI
**Solution**: Added static file middleware + SPA routing
**File**: `src/gateway/server.ts:90-101`
**Status**: Deployed, building on Railway

### 4. AudioEngine Beat Detection (COMPILATION FIX)
**Problem**: 45 TypeScript errors, methods outside class
**Solution**: Moved all beat detection methods inside AudioEngine class
**File**: `src/audio/AudioEngine.ts:1432-1576`
**Status**: Fixed, compiling successfully

### 5. Menu Rebranding (UX UPDATE)
**Problem**: Features labeled "Auto" instead of "AI"
**Solution**: Updated all menu labels and tooltips
**Files**:
  - `src/ui/components/AIDawgMenu.tsx`
  - `src/ui/components/AIFeatureHub.tsx`
**Status**: Complete, visible in UI

### 6. MediaRecorder Browser Compatibility (BROWSER FIX)
**Problem**: Safari/Firefox didn't support MIME type
**Solution**: Added fallback chain for browser compatibility
**File**: `src/pages/LiveStudioPage.tsx:69-82`
**Status**: Complete, tested

---

## 🔌 API Endpoints Reference

### Quick Test Commands

#### Health Checks
```bash
curl http://localhost:5173                    # Frontend
curl http://localhost:3100/health | jq       # AI Brain
curl http://localhost:3002/health | jq       # Gateway
```

#### Authentication
```bash
# Register
curl -X POST http://localhost:3100/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","username":"testuser"}'

# Login
curl -X POST http://localhost:3100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -c cookies.txt

# Get current user
curl http://localhost:3100/api/v1/auth/me \
  -b cookies.txt
```

#### AI Features (requires auth)
```bash
# AI Pitch Correct
curl -X POST http://localhost:3100/api/v1/ai/pitchcorrect \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"audioFileId":"abc123","key":"C","amount":50}'

# Generate Beat
curl -X POST http://localhost:3100/api/v1/ai/dawg \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"prompt":"Create a beat like Metro Boomin","genre":"hip-hop","bpm":140,"style":"metro-boomin"}'
```

---

## 🎨 UI Component Locations

### Main Pages
- **Landing**: `src/pages/LandingPage.tsx`
- **Login**: `src/pages/LoginPage.tsx`
- **Projects**: `src/pages/ProjectListPage.tsx`
- **DAW**: `src/ui/DAWDashboard.tsx`
- **Live Studio**: `src/pages/LiveStudioPage.tsx`

### Key Components
- **Timeline**: `src/ui/components/Timeline.tsx`
- **Transport**: `src/ui/components/TransportBar.tsx`
- **AI Menu**: `src/ui/components/AIDawgMenu.tsx`
- **AI Chat**: `src/ui/components/AIChatWidget.tsx`
- **AI Hub**: `src/ui/components/AIFeatureHub.tsx`
- **Mixer**: `src/ui/components/MixerPanel.tsx`

### Modal Dialogs
- **AI Processing**: `src/ui/components/AIProcessingModal.tsx`
- **Project Settings**: `src/ui/components/ProjectSettingsModal.tsx`
- **Upsell**: `src/ui/components/UpsellModal.tsx`

---

## 🎵 Audio Engine Architecture

### Main Classes

#### AudioEngine (`src/audio/AudioEngine.ts`)
- **Purpose**: Core audio processing engine
- **Key Methods**:
  - `initialize()` - Setup audio context
  - `play()`, `pause()`, `stop()` - Playback control
  - `detectBPM(buffer)` - Beat detection
  - `analyzeBeat(buffer)` - Full beat analysis
  - `quantizeToGrid(buffer)` - Time alignment
  - `extractMIDI(buffer)` - MIDI extraction
  - `detectKey(buffer)` - Key detection

#### VocalProcessor (`src/audio/VocalProcessor.ts`)
- **Purpose**: Vocal analysis and processing
- **Key Methods**:
  - `analyzeVocal(buffer)` - Full vocal analysis
  - `recommendEffects(analysis, genre)` - AI effect chain
  - `detectPitch(buffer)` - Pitch detection
  - `detectFormants(buffer)` - Formant analysis

#### BeatAnalyzer (`src/audio/ai/BeatAnalyzer.ts`)
- **Purpose**: Advanced beat detection
- **Key Methods**:
  - `analyzeBeat(buffer)` - Detect BPM, beats, measures
  - `detectTimeSignature(beats)` - Time signature detection
  - `quantize(buffer, bpm, grid)` - Quantize audio
  - `extractMIDI(buffer)` - Convert audio to MIDI

#### AIMasteringEngine (`src/audio/ai/AIMasteringEngine.ts`)
- **Purpose**: AI-powered mastering
- **Stages**:
  1. Correction (EQ, comp, limit)
  2. Enhancement (exciter, widener, saturation)
  3. Finalization (limiting, dithering)

---

## 🗂️ State Management (Zustand)

### Stores

#### Timeline Store
**File**: `src/ui/stores/useTimelineStore.ts`
```typescript
// Key state
tracks: Track[]
selectedClipIds: string[]
zoom: number
scrollPosition: number

// Key actions
addTrack(name)
removeTrack(id)
addClip(trackId, clip)
selectClip(id)
updateClip(id, updates)
```

#### Transport Store
**File**: `src/ui/stores/useTransportStore.ts`
```typescript
// Key state
isPlaying: boolean
isRecording: boolean
currentTime: number
tempo: number
timeSignature: { numerator: number, denominator: number }

// Key actions
play()
pause()
stop()
setTempo(bpm)
setTime(seconds)
```

#### User Store
**File**: `src/ui/stores/useUserStore.ts`
```typescript
// Key state
user: User | null
entitlements: UserEntitlements | null
plan: 'FREE' | 'PRO' | 'STUDIO'

// Key actions
login(credentials)
logout()
fetchEntitlements()
```

---

## 🔊 Voice Control Commands

### Command Categories

#### Playback (8 commands)
- play, pause, stop, toggle_playback
- skip_forward, skip_backward
- goto_time, goto_marker

#### Recording (6 commands)
- start_recording, stop_recording, toggle_recording
- create_loop, punch_in, punch_out

#### Track Management (10 commands)
- create_track, delete_track
- mute_track, unmute_track
- solo_track, unsolo_track
- arm_track, rename_track
- set_track_color, duplicate_track

#### Mixing (10 commands)
- set_volume, set_pan
- add_reverb, add_delay
- add_eq, add_compressor
- add_gate, add_limiter
- bypass_effects, reset_mix

#### AI Features (12 commands)
- auto_tune, beat_detect, time_align
- generate_harmony, suggest_chords
- analyze_audio, generate_beat
- generate_melody, generate_bass
- stem_separate, vocal_enhance
- master_track

#### Project Management (11 commands)
- save_project, export_audio
- undo, redo, create_marker
- delete_marker, bounce_track
- freeze_track, import_audio
- create_send, create_bus

---

## 📁 Project Structure

```
ai-dawg-deploy/
├── src/
│   ├── audio/                   # Audio engine & processors
│   │   ├── AudioEngine.ts      # Main audio engine
│   │   ├── VocalProcessor.ts   # Vocal analysis
│   │   ├── MetronomeEngine.ts  # Metronome
│   │   ├── PlaybackEngine.ts   # Playback control
│   │   └── ai/                 # AI audio processors
│   │       ├── BeatAnalyzer.ts
│   │       ├── AIMasteringEngine.ts
│   │       ├── SmartMixAssistant.ts
│   │       └── AINoiseReduction.ts
│   ├── backend/                # Backend services
│   │   ├── ai-brain-server.ts  # AI Brain server
│   │   ├── server.ts           # Main backend server
│   │   └── routes/             # API routes
│   ├── gateway/                # Gateway service
│   │   └── server.ts           # Gateway server (fixed!)
│   ├── ui/                     # React components
│   │   ├── DAWDashboard.tsx    # Main DAW interface
│   │   ├── components/         # Reusable components
│   │   └── stores/             # Zustand state
│   ├── pages/                  # Route pages
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── ProjectListPage.tsx
│   └── api/                    # API client
│       ├── client.ts
│       └── websocket.ts
├── tests/                      # Test files
│   ├── e2e/                    # E2E tests
│   └── unit/                   # Unit tests
├── public/                     # Static assets
├── dist/                       # Build output
└── docs/                       # Documentation
```

---

## 🎬 Quick Start for Testing Agent

### 1. Verify Servers Running
```bash
curl http://localhost:5173              # Should return HTML
curl http://localhost:3100/health       # Should return {"status":"healthy"}
curl http://localhost:3002/health       # Should return {"status":"healthy"}
```

### 2. Open Browser to DAW
```
http://localhost:5173/
```

### 3. Test User Journey
1. Click "Get Started Free"
2. Register: test@test.com / password123
3. Create project: "Test Project 1"
4. Navigate to DAW interface
5. Test features

### 4. Test Voice Control
1. Open DAWG AI panel (click "AI" button in top menu)
2. Click microphone icon
3. Say: "create track drums"
4. Verify track created
5. Say: "set tempo to 140"
6. Verify tempo changed

### 5. Test AI Features
1. Record or upload audio clip
2. Select clip in timeline
3. Click "AI" menu
4. Select "AI Pitch Correct"
5. Verify processing completes
6. Play result

---

## 🔐 Environment Variables

### Required for Full Functionality
```bash
# OpenAI (for voice + generation)
OPENAI_API_KEY=sk-...

# Anthropic (for AI coaching)
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=dawg-ai-audio

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379
```

---

## 📊 Performance Benchmarks

### Target Metrics
- **Page Load**: < 2 seconds
- **Audio Latency**: < 50ms
- **Voice Response**: < 1 second
- **AI Processing**: < 30 seconds
- **Beat Detection**: < 5 seconds

### Current Status
- Frontend Load: ✅ 164ms (Vite startup)
- Health Checks: ✅ < 10ms
- WebSocket Latency: ✅ < 50ms

---

## 🚨 Important Notes for Testing

1. **Authentication Required**: Most features require login
2. **Plan Limits**: Free plan has severe limitations
3. **WebSocket Connection**: Required for live voice
4. **Browser Compatibility**: Chrome/Edge recommended (Safari has MediaRecorder issues)
5. **Mic Permissions**: Browser will prompt for microphone access

---

**SYSTEM STATUS**: ✅ All development servers online and FIXED
**LAST UPDATED**: October 17, 2025 @ 15:52 PT
**DEPLOYMENT**: Production fix deployed to Railway
**LATEST FIXES**: AudioEngine import + Vite proxy configuration
