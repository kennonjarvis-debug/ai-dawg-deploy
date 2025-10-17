# DAWG AI Roadmap - Now/Next/Later

**Last Updated:** 2025-10-03T03:35:00Z
**Managed by:** Alexis (Planner Agent)

---

## 🎯 Now (Current Sprint - Week of Oct 3, 2025)

### ✅ COMPLETED - Priority 1: Adaptive Journey MVP
All 12 core widgets integrated and functional:

**Instance 1 - Song Building:**
- ✅ JourneyDashboard - Central hub with progress tracking
- ✅ LyricWorkspace - AI-assisted lyric writing
- ✅ SongStructureBuilder - Drag-and-drop song arrangement

**Instance 2 - Audio & Performance:**
- ✅ LiveCoachingPanel - Real-time vocal coaching
- ✅ PerformanceScorer - Live performance grading
- ✅ WaveformAnnotations - AI feedback on recordings

**Instance 3 - AI Personalization:**
- ✅ VocalAssessment - Voice profiling & assessment
- ✅ GoalSettingWizard - Personalized goal creation
- ✅ StylePreferencesQuiz - Musical taste profiling

**Instance 4 - Data & Planning:**
- ✅ SessionPlanner - Practice schedule management
- ✅ UserProfileCard - User profile & stats
- ✅ SkillProgressChart - Skill tracking visualization

**Journey Page:** `/app/journey/page.tsx`
- ✅ 3-step onboarding wizard
- ✅ 5 main views (Dashboard/Lyrics/Structure/Schedule/Progress)
- ✅ Live coaching overlay
- ✅ Navigation from main DAW

**Build Status:** ✅ Compiling, HTTP 200 on /journey

---

## 🚀 Next (Priority 1-B & 2 - Next 1 Week) **[REFINED]**

### Priority 1-B: Critical UX (Start Immediately)
1. **ExerciseLibrary Integration** (Instance 3) - 0.75 days ⭐
   - Task: `T-01JCKMA2V8HQSB7K4N9PX3M1R6`
   - Vocal warm-up exercises before recording (vocal health!)

### Core Widgets (Est: 5 days)
2. **ReferenceTrackUploader** (Instance 1) - 1.5 days
   - Task: `T-01JCKM6A7TQRS4M8N9PX2V5W1Y`
   - Upload and manage reference tracks for comparison

3. **VoicematchVisualizer** (Instance 2) - 2 days
   - Task: `T-01JCKM6H9ZVWX3K7N2QY8P4M1S`
   - Visual comparison of user vocals vs reference

4. **MilestoneTracker** (Instance 4) - 1.5 days
   - Task: `T-01JCKM6V8KQWP2N7M5SX9R4T1Z`
   - Achievement badges and streak tracking

### Widget Integrations (Est: 2.25 days) **[EXISTING WIDGETS]**
5. **AIFeedbackTimeline Integration** (Instance 3) - 0.5 days ✅
   - Task: `T-01JCKM6P3RXSB9M4T8ZN1K6V2Q`
   - Integrate existing timeline widget into Progress view

6. **VocalEffectsPanel Integration** (Instance 2) - 1 day ✅
   - Task: `T-01JCKMA9K3ZMQX7N4P8R5V2W1T`
   - Real-time vocal effects in coaching sessions

### Technical Enhancements (Est: 4 days)
7. **Real-time Audio Integration** (Instance 2) - 2 days
   - Task: `T-01JCKM7B2PMZK8V4N3WX6Q9R1T`
   - Connect live audio to PerformanceScorer & WaveformAnnotations

8. **Journey Progress Persistence** (Instance 4) - 2 days
   - Task: `T-01JCKM7J9WSQZ4K8P2MV7N1X3R`
   - IndexedDB + cloud sync for data persistence

**Total Estimate:** 11.25 days sequential, **~4 days with parallelization** 🚀

---

## 🔮 Later (Phase 2 - Month 2+)

### Optional Enhancement Widgets
- **CollaborationHub** (Instance 1)
  - Multi-user song creation with real-time sync
  - Comment threads on specific sections

- **GenreStyleTransfer** (Instance 2)
  - AI-powered style transformation
  - Genre-specific vocal effects

- **PracticeReminder** (Instance 4)
  - Smart notifications based on progress
  - Adaptive scheduling recommendations

### Platform Features
- **Mobile App** (React Native)
  - iOS/Android native apps
  - Offline-first architecture

- **Social Features**
  - Share songs publicly
  - Community feedback & ratings
  - Leaderboards & competitions

- **Advanced AI**
  - ML-based vocal coaching
  - Custom voice models
  - Automated mixing suggestions

### Infrastructure
- **Scalability**
  - Move to microservices architecture
  - Kubernetes deployment
  - CDN for audio assets

- **Monetization**
  - Freemium tier structure
  - Pro features (advanced AI, unlimited storage)
  - Partnership integrations (Spotify, SoundCloud)

---

## 📊 Metrics & Success Criteria

### Current Sprint Goals
- ✅ 12/12 Priority 1 widgets complete
- 🎯 6/6 Priority 2 tasks ready for assignment
- 🎯 Build health: 100% compilation success

### Next Sprint Goals
- 4/4 Priority 2 widgets complete
- 2/2 Technical enhancements complete
- User testing feedback collected
- Performance benchmarks established

### Phase 2 Goals
- 10K+ active users
- <100ms average latency
- 99.9% uptime SLA
- Mobile app beta launch

---

## 🔗 Related Documentation
- [Tasks Directory](/tasks/) - All task YAML files
- [Product Specs](/docs/product/) - Product requirements
- [API Specs](/specs/openapi/) - REST API definitions
- [Event Bus](/\_bus/) - Agent coordination events

---

*This roadmap is dynamically updated by Alexis based on task completion and new product intents.*
