# Adaptive Song Creation Journey - MVP Product Spec

**Version:** 1.0
**Last Updated:** 2025-10-03
**Status:** Phase 1 Complete, Phase 2 In Planning
**Owner:** Product Team

---

## 🎯 Vision

Transform DAWG AI from a traditional DAW into an intelligent, adaptive song creation companion that guides users through personalized vocal journeys, from beginner assessment to polished recordings.

---

## ✅ Phase 1: Core Journey (COMPLETE)

### Overview
A guided, adaptive experience for vocal recording and song creation with AI-powered coaching, skill tracking, and personalized feedback.

### Key Features Delivered

#### 1. **Onboarding Wizard** ✅
- Vocal assessment to profile user's voice
- Goal-setting wizard for personalized objectives
- Style preferences quiz for music taste profiling
- One-time setup flow with progress indicators

#### 2. **Journey Dashboard** ✅
- Progress overview with current stage visualization
- Quick actions (Continue Session, Practice, Review)
- Statistics (sessions completed, skills unlocked)
- Stage timeline showing user's journey path

#### 3. **Song Creation Tools** ✅
- **Lyric Workspace:** AI-assisted lyric writing with verse/chorus/bridge sections
- **Structure Builder:** Drag-and-drop song arrangement with templates
- Collaborative editing with AI suggestions
- Export functionality for completed lyrics/structures

#### 4. **Live Coaching** ✅
- Real-time vocal coaching with AI feedback
- Performance scoring (pitch accuracy, stability, consistency)
- Waveform annotations showing technique issues
- Grade display (A+ to F) with improvement tips

#### 5. **Progress Tracking** ✅
- Skill progress charts across multiple dimensions
- Session planning and scheduling
- User profile with journey stats
- Achievement tracking (via SkillProgressChart)

### Technical Architecture

**Frontend:**
- Next.js 15 with App Router
- React 18 with TypeScript
- Zustand for state management
- Web Audio API for audio processing
- CSS Modules with Pro Tools aesthetic

**Key Pages:**
- `/journey` - Main journey orchestration
- `/journey?setup=true` - Onboarding wizard
- Main DAW has "Start Journey" button

**Widget System:**
- 12 core widgets across 4 instances
- Self-contained components in `/src/widgets/`
- Shared audio hooks (`usePitchDetection`, `useVocalEffects`)

---

## 🚀 Phase 2: Enhanced Features (IN PLANNING)

### Priority 2 Widgets (Next 2 Weeks)

#### 1. **ReferenceTrackUploader** (Instance 1)
**Problem:** Users need to compare their vocals to professional references
**Solution:** Upload and manage reference tracks with metadata tagging

**Features:**
- Drag-and-drop file upload
- Waveform preview of references
- Genre/style/artist tagging
- Integration into Practice view

**Value:** Enables "voicematch" learning by comparison

---

#### 2. **VoicematchVisualizer** (Instance 2)
**Problem:** Users can't see how their vocals compare to references
**Solution:** Visual side-by-side comparison with pitch/timing overlay

**Features:**
- Dual waveform display (user vs reference)
- Color-coded pitch deviation indicators
- Similarity score calculation
- Synchronized playback

**Value:** Makes improvement areas visually obvious

---

#### 3. **AIFeedbackTimeline** (Instance 3)
**Problem:** Users lose track of progress across multiple sessions
**Solution:** Chronological timeline of AI feedback showing trends

**Features:**
- Session history with AI-generated summaries
- Progress arrows (up/down/stable) per skill
- Filter by skill area
- Highlight breakthrough moments

**Value:** Long-term motivation through visible progress

---

#### 4. **MilestoneTracker** (Instance 4)
**Problem:** Users need motivation and clear achievement goals
**Solution:** Gamified milestone system with badges and streaks

**Features:**
- Visual achievement badges
- Progress bars toward next milestone
- Unlock celebrations
- Consecutive practice day streaks

**Value:** Gamification drives engagement and retention

---

### Technical Enhancements

#### 5. **Real-time Audio Integration**
**Current State:** PerformanceScorer & WaveformAnnotations exist but lack live audio
**Enhancement:** Connect Web Audio API to enable live analysis

**Features:**
- Microphone capture in coaching sessions
- Real-time pitch detection and scoring
- Live AI annotations during recording
- Session saving with metadata

**Impact:** Transforms coaching from demo to functional tool

---

#### 6. **Journey Progress Persistence**
**Current State:** Data stored in localStorage only
**Enhancement:** Add cloud sync and export/import

**Features:**
- IndexedDB for offline persistence
- Cloud sync API with conflict resolution
- Export journey data to JSON
- Import from backup file

**Impact:** Data safety and cross-device experience

---

## 📊 Success Metrics

### Phase 1 (Achieved)
- ✅ 12/12 core widgets integrated
- ✅ Journey page accessible and functional
- ✅ Build compiling with no errors
- ✅ 3-step onboarding flow complete

### Phase 2 (Target)
- 4/4 Priority 2 widgets complete
- Real-time audio working in coaching sessions
- Data persistence with cloud sync
- User testing with 10+ beta testers
- <2s page load time
- 90%+ widget render performance

### Long-term (Phase 3+)
- 10K+ monthly active users
- 70%+ user retention after 30 days
- 50%+ conversion to paid tier
- 4.5+ star app store rating

---

## 🎨 User Experience

### User Personas

**1. Aspiring Singer (Beginner)**
- Wants to improve vocal technique
- Needs structured guidance and encouragement
- Values clear feedback and progress tracking

**2. Songwriter (Intermediate)**
- Focuses on lyric writing and song structure
- Wants AI assistance for creative blocks
- Values quick iteration and experimentation

**3. Home Producer (Advanced)**
- Records polished vocals for production
- Needs precise pitch/timing analysis
- Values professional-grade tools

### User Flows

**First-Time User:**
1. Arrives at main DAW, sees "Start Journey" button
2. Clicks button → Journey onboarding begins
3. Completes vocal assessment (3 min)
4. Sets goals (2 min)
5. Defines style preferences (2 min)
6. Lands on Journey Dashboard with personalized path
7. Starts first coaching session

**Returning User:**
1. Opens app → Journey Dashboard
2. Sees progress since last session
3. Clicks "Continue Session" → Picks up where left off
4. Works on lyrics/structure or does practice
5. Reviews progress and milestones

---

## 🔧 Technical Requirements

### Dependencies
- Next.js 15+
- React 18+
- TypeScript 5+
- Zustand (state management)
- Web Audio API
- Anthropic Claude API (for AI features)
- NextAuth (authentication)

### Browser Support
- Chrome 90+
- Safari 15+
- Firefox 90+
- Edge 90+

### Performance Targets
- Time to Interactive: <3s
- First Contentful Paint: <1.5s
- Widget render time: <100ms
- Audio latency: <50ms

---

## 🚧 Known Limitations & Future Work

### Current Limitations
- Audio coaching requires manual start (not automatic)
- No mobile app (web only)
- localStorage-only persistence (no cloud sync yet)
- Single-user experience (no collaboration)
- English language only

### Future Enhancements (Phase 3+)
- Mobile native apps (iOS/Android)
- Real-time collaboration
- Multi-language support
- Advanced AI coaching models
- Integration with Spotify/SoundCloud
- Social features (sharing, community feedback)

---

## 📚 Related Documents
- [Roadmap](/docs/roadmap/now-next-later.md)
- [Task Files](/tasks/)
- [API Specs](/specs/openapi/)
- [Architecture Decision Records](/docs/adr/)

---

*This spec is maintained by the Product team and updated by Alexis (Planner Agent) based on development progress.*
