# DAWG AI - Development Roadmap

## Overview
This roadmap breaks down the development of DAWG AI into discrete stages, from basic DAW functionality to the full AI-powered adaptive journey system.

**Current Status:** Stage 1 Complete ✅ | Stage 2 In Progress 🔄 | Stage 4 Backend Complete ✅

---

## ✅ Stage 1: Core DAW Functionality (COMPLETE)

### Summary
Build the foundation of a functional Digital Audio Workstation with multi-track recording, playback, and basic editing capabilities.

### Completed Features
- ✅ Widget-based modular architecture (`/src/widgets/`)
- ✅ TransportControls widget (play/pause, BPM, keyboard shortcuts)
- ✅ TrackManagement (add/delete/rename, solo/mute, volume, pan)
- ✅ WaveformDisplay (zoom, WaveSurfer.js, playhead sync)
- ✅ Audio recording with MediaRecorder (WebM/Opus)
- ✅ Multi-track playback with Web Audio API
- ✅ Per-track device selection (Pro Tools style)
- ✅ Export to WAV (16-bit PCM)
- ✅ Microphone access control (record arm gating)
- ✅ Manual testing guide (80+ tests)

### Technical Stack
- Next.js 15, TypeScript, Zustand
- Web Audio API, Tone.js, WaveSurfer.js
- CSS Modules, Minimal dark design system

### Files Created
- 9 new files, 6 modified files
- ~2,000 lines of code

---

## 🔄 Stage 2: File Upload & Import (IN PROGRESS)

### Goal
Allow users to upload existing audio files and import them into tracks for editing and mixing.

### Features to Build

#### 2.1 File Upload Widget
**Location:** `/src/widgets/FileUpload/`
**Features:**
- Drag & drop file area
- File picker dialog
- Multi-file upload support
- File validation (type, size)
- Upload progress indicator
- Visual feedback (loading states)

**Estimated Time:** 2-3 hours

#### 2.2 Audio File Decoding
**Location:** `/src/utils/audioImport.ts`
**Features:**
- WebAudio `decodeAudioData()` integration
- Support formats: WAV, MP3, OGG, FLAC
- Error handling for corrupt files
- Sample rate conversion if needed
- Stereo/mono handling

**Estimated Time:** 2-3 hours

#### 2.3 Waveform Generation
**Features:**
- Generate waveform data from uploaded audio
- Store waveformData in Recording object
- Display in WaveformDisplay widget
- Optimization for long files

**Estimated Time:** 1-2 hours

#### 2.4 Track Integration
**Features:**
- Create new track from uploaded file
- Add to existing track as new take
- Auto-name tracks from filename
- Maintain multiple takes per track

**Estimated Time:** 1 hour

### Technical Challenges
- Large file handling (>50MB)
- Browser memory limits
- Format compatibility across browsers
- Real-time progress updates

### Success Criteria
- ✅ Upload .wav, .mp3, .ogg files via drag & drop
- ✅ Files decode to AudioBuffer successfully
- ✅ Waveform displays uploaded audio
- ✅ Can play back uploaded files
- ✅ Export maintains quality

---

## Stage 3: Effects & Processing

### Goal
Add real-time audio effects and processing capabilities using Web Audio API nodes.

### Features to Build

#### 3.1 EQ Widget
- 3-band parametric EQ (low, mid, high)
- Frequency/gain/Q controls
- Visual frequency response curve
- Per-track and master EQ

**Estimated Time:** 4-6 hours

#### 3.2 Dynamics Processing
- Compressor (threshold, ratio, attack, release)
- Limiter for master output
- Visual gain reduction meter

**Estimated Time:** 3-4 hours

#### 3.3 Reverb & Delay
- Convolution reverb (impulse responses)
- Simple delay effect
- Wet/dry mix controls

**Estimated Time:** 3-4 hours

#### 3.4 Effects Chain Widget
- Drag & drop effects ordering
- Enable/disable per effect
- Effect presets (vocal, guitar, drums)
- A/B comparison

**Estimated Time:** 4-5 hours

### Technical Stack
- Web Audio API (BiquadFilterNode, DynamicsCompressorNode, ConvolverNode)
- Effect parameter automation
- Real-time processing with low latency

### Success Criteria
- ✅ Apply EQ to individual tracks
- ✅ Compression works without artifacts
- ✅ Reverb sounds natural
- ✅ No audio dropouts during processing
- ✅ Preset system saves/loads settings

---

## Stage 4: AI Chat Interface (Backend ✅ Complete | Frontend ⏳ Pending)

### Goal
Integrate Claude AI as a conversational vocal coach and production assistant.

### Features to Build

#### 4.1 Chat Widget ⏳ PENDING
**Location:** `/src/widgets/ChatPanel/`
- Fixed sidebar (right side, collapsible)
- Message history display
- Text input with send button
- Voice input button (future)
- Typing indicators

**Estimated Time:** 3-4 hours
**Status:** Waiting for Instance 1

#### 4.2 Backend API ✅ COMPLETE
**Location:** `/app/api/chat/route.ts`
- ✅ POST endpoint for chat messages
- ✅ Claude API integration (Anthropic SDK)
- ✅ Streaming responses (Server-Sent Events)
- ✅ Non-streaming mode for compatibility
- ✅ Conversation history support
- ✅ Project context integration
- ✅ Error handling (401, 429, 500)

**Completed By:** Instance 2, 2025-10-02
**Documentation:** See `/API.md`

#### 4.3 System Prompt Engineering ✅ COMPLETE
- ✅ Vocal coach persona (country music specialist)
- ✅ Production guidance capabilities
- ✅ Context awareness (track count, current track, duration)
- ✅ Safety guidelines (vocal health, no harmful techniques)
- ✅ Structured response format

**Completed By:** Instance 2, 2025-10-02

#### 4.4 AI Actions Integration ⏳ PENDING
- AI can trigger DAW actions
- "Start recording" command
- "Apply reverb to track 1" command
- Function calling pattern

**Estimated Time:** 5-6 hours
**Status:** Requires ChatPanel widget first (Instance 1)

### Technical Stack
- ✅ Anthropic Claude API (Sonnet 4.5)
- ✅ Server-sent events for streaming
- ⏳ React Query for chat state (frontend)
- ⏳ Markdown rendering for AI responses (frontend)

### Success Criteria
- ⏳ Chat interface is accessible and responsive (frontend pending)
- ✅ AI responds in vocal coach persona (backend ready)
- ⏳ Conversation history persists in session (frontend pending)
- ⏳ AI can trigger recording/playback (future enhancement)
- ✅ Responses stream in real-time (backend ready)

---

## Stage 5: Vocal Coaching with Pitch Analysis

### Goal
Real-time pitch detection and visual feedback to help users improve vocal performance.

### Features to Build

#### 5.1 Pitch Detection
**Location:** `/src/utils/pitchDetection.ts`
- Real-time pitch tracking (Pitchy.js or autocorrelation)
- Note detection (C, D, E, etc.)
- Cents deviation from target pitch
- Confidence scoring

**Estimated Time:** 6-8 hours

#### 5.2 Visual Pitch Display
**Location:** `/src/widgets/PitchMonitor/`
- Piano roll visualization
- Target note vs sung note
- Color-coded accuracy (green = in tune)
- Real-time during recording

**Estimated Time:** 4-5 hours

#### 5.3 AI Pitch Feedback
- Post-recording analysis
- "You were sharp on the chorus"
- Pitch correction suggestions
- Technique improvement tips

**Estimated Time:** 3-4 hours

#### 5.4 Reference Track Feature
- Load reference track
- Display reference melody
- Compare user's pitch to reference
- Karaoke-style scrolling

**Estimated Time:** 3-4 hours

### Technical Stack
- Pitchy.js or custom pitch detection
- Canvas for visualization
- AudioWorklet for low-latency analysis

### Success Criteria
- ✅ Pitch detected with <20ms latency
- ✅ Accuracy within ±10 cents
- ✅ Visual feedback updates 30+ fps
- ✅ AI provides actionable feedback
- ✅ Reference track comparison works

---

## Stage 6: Persistence & Project Management

### Goal
Save and load projects, user authentication, cloud storage for audio files.

### Features to Build

#### 6.1 Database Setup
**Technology:** PostgreSQL + Prisma
**Schema:**
- Users table
- Projects table
- Tracks table
- Recordings table (with S3 URLs)

**Estimated Time:** 4-5 hours

#### 6.2 Authentication
**Technology:** NextAuth.js or Clerk
- Email/password signup
- OAuth (Google, GitHub)
- Session management
- Protected routes

**Estimated Time:** 4-5 hours

#### 6.3 Save/Load Projects
**Features:**
- Serialize project state to JSON
- Save to database
- Load project on app start
- Auto-save every 30 seconds

**Estimated Time:** 5-6 hours

#### 6.4 Cloud Audio Storage
**Technology:** AWS S3 or Cloudflare R2
- Upload recordings to S3
- Store URLs in database
- Download on project load
- Cleanup for deleted projects

**Estimated Time:** 6-8 hours

### Technical Stack
- PostgreSQL, Prisma ORM
- NextAuth.js or Clerk
- AWS S3 SDK
- Server actions for mutations

### Success Criteria
- ✅ Users can sign up and log in
- ✅ Projects save/load successfully
- ✅ Audio files persist across sessions
- ✅ Auto-save prevents data loss
- ✅ Storage quotas enforced

---

## Stage 7: Generative Backing Tracks

### Goal
AI-generated instrumental backing tracks to sing over.

### Features to Build

#### 7.1 Music Generation API
**Technology:** Suno API or MusicGen
- Genre selection (country, pop, rock)
- Tempo/key input
- Instrumental only (no vocals)
- 30-60 second clips

**Estimated Time:** 6-8 hours

#### 7.2 AI Prompt Engineering
- Convert user description to API prompt
- "Upbeat country track, 120 BPM, key of G"
- Style transfer from reference

**Estimated Time:** 3-4 hours

#### 7.3 Generation Queue
- Background processing
- Progress indicators
- Multiple generations
- Preview before adding to project

**Estimated Time:** 4-5 hours

### Technical Stack
- Suno API or MusicGen model
- Server-side generation
- Queue system (Redis or database)

### Success Criteria
- ✅ Generate backing track from text description
- ✅ Matches requested tempo and key
- ✅ Quality suitable for vocal recording
- ✅ Generation completes in <2 minutes

---

## Stage 8: Voice Cloning & Harmonies

### Goal
Clone user's voice and generate harmonies automatically.

### Features to Build

#### 8.1 Voice Profile Creation
**Technology:** ElevenLabs or Kits.AI
- Record voice samples (1-2 minutes)
- Train voice model
- Store voice ID per user

**Estimated Time:** 6-8 hours

#### 8.2 Harmony Generation
- Detect melody from lead vocal
- Generate harmony lines (3rd, 5th above/below)
- Render with cloned voice
- Add to project as new tracks

**Estimated Time:** 8-10 hours

#### 8.3 AI Harmony Suggestions
- Claude analyzes song structure
- Suggests where to add harmonies
- Auto-generates harmonies on request

**Estimated Time:** 4-5 hours

### Technical Stack
- ElevenLabs API or Kits.AI
- Pitch shifting algorithms
- MIDI generation from audio

### Success Criteria
- ✅ Voice profile captures user's tone
- ✅ Harmonies sound natural
- ✅ Timing matches lead vocal
- ✅ Multiple harmony parts supported

---

## Stage 9: Adaptive Journey System (Core)

### Goal
Implement the core adaptive journey system that guides users through song creation.

### Features to Build

#### 9.1 Journey Templates
- Song structure wizard (intro, verse, chorus, bridge)
- Genre-specific templates
- Step-by-step guidance
- Visual progress tracker

**Estimated Time:** 8-10 hours

#### 9.2 Adaptive Difficulty
- Detect user skill level from recordings
- Adjust complexity of tasks
- Easier melodies for beginners
- Advanced techniques for experienced users

**Estimated Time:** 10-12 hours

#### 9.3 Real-time Feedback
- AI listens during recording
- "Try breathing here"
- "Great vibrato!"
- Immediate coaching tips

**Estimated Time:** 8-10 hours

#### 9.4 Progress Analytics
- Track completion percentage
- Vocal improvement metrics
- Compare recordings over time
- Achievements and milestones

**Estimated Time:** 6-8 hours

### Technical Stack
- Journey state machine
- Real-time AI processing
- Analytics dashboard
- Achievement system

### Success Criteria
- ✅ Journey guides user start to finish
- ✅ Difficulty adapts based on performance
- ✅ Feedback is helpful and timely
- ✅ Users complete songs successfully

---

## Stage 10-13: Advanced Features

### Stage 10: Vocal Effects & Auto-Tune
- Pitch correction (auto-tune)
- Vocal doubling
- De-esser, de-breather
- Vocal presets

### Stage 11: Collaboration Features
- Real-time co-editing
- Comments on tracks
- Version control
- Share projects (public/private)

### Stage 12: Mobile App
- iOS/Android apps (React Native)
- Simplified recording interface
- Cloud sync with web app
- Mobile-optimized journey

### Stage 13: Advanced AI Features
- Full song composition
- Lyric generation
- Mastering automation
- AI mixing assistant

---

## Frontend vs Backend Task Split

### Frontend Tasks (Instance 1)
**Priority High:**
- ✅ Stage 1: All core widgets
- 🔄 Stage 2: File upload widget
- Stage 3: Effects widgets (EQ, compressor, reverb UI)
- Stage 4: Chat panel UI
- Stage 5: Pitch monitor widget

**Priority Medium:**
- Stage 9: Journey UI, progress tracker
- Stage 10: Vocal effects UI
- Stage 11: Collaboration UI

### Backend Tasks (Instance 2)
**Priority High:**
- Stage 4: `/api/chat` endpoint, Claude integration
- Stage 6: Database setup, auth, S3 storage
- Stage 7: Music generation API
- Stage 8: Voice cloning API

**Priority Medium:**
- Stage 5: Pitch analysis processing
- Stage 9: Journey state management
- Stage 11: Collaboration server
- Stage 12: Mobile backend

### Shared Tasks (Coordinate)
- Stage 2: Audio file processing (frontend decode, backend storage)
- Stage 5: Pitch detection (frontend display, backend analysis)
- Stage 9: Journey system (frontend UI, backend logic)

---

## Timeline Estimates

### Aggressive (Full-time, 40hrs/week)
- **Stage 2:** 1 week
- **Stage 3:** 2 weeks
- **Stage 4:** 1.5 weeks
- **Stage 5:** 2 weeks
- **Stage 6:** 2 weeks
- **Stage 7-8:** 3 weeks
- **Stage 9:** 3 weeks
- **Total:** ~14-16 weeks (3-4 months)

### Realistic (Part-time, 20hrs/week)
- **Stage 2:** 2 weeks
- **Stage 3:** 3-4 weeks
- **Stage 4:** 2-3 weeks
- **Stage 5:** 3-4 weeks
- **Stage 6:** 3-4 weeks
- **Stage 7-8:** 6-8 weeks
- **Stage 9:** 6-8 weeks
- **Total:** ~26-34 weeks (6-8 months)

### Conservative (Hobby pace, 10hrs/week)
- **Total:** 12-16 months

---

## Risk Factors

### Technical Risks
- **Browser audio limitations** → Mitigation: Test early, fallbacks
- **AI API costs** → Mitigation: Rate limiting, caching
- **Real-time latency** → Mitigation: AudioWorklet, optimize
- **Mobile audio capture** → Mitigation: Native modules if needed

### Business Risks
- **User adoption** → Mitigation: Beta program, feedback loops
- **AI accuracy** → Mitigation: Human review, iterative training
- **Competition** → Mitigation: Unique journey system differentiator
- **Monetization** → Mitigation: Freemium model planning

---

## Success Metrics

### Stage 1 (Complete)
- ✅ Can record and play back audio
- ✅ Multi-track mixing works
- ✅ Export produces valid files

### Stage 2 (Current)
- Upload success rate >95%
- Support 90% of common audio formats
- <5 second processing for typical files

### Stage 4 (AI Integration)
- AI response time <2 seconds
- User satisfaction >4/5 on feedback quality
- 80% of actions triggered successfully

### Stage 9 (Journey System)
- 70% of users complete first song
- Average session time >20 minutes
- Skill improvement measurable

---

**Last Updated:** 2025-10-02
**Next Review:** After Stage 2 completion
