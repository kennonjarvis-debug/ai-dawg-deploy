# UI Redesign - Task Breakdown

**Planner:** Alexis
**Created:** 2025-10-03
**Redesign Spec:** `/docs/design/UI_REDESIGN_SPEC.md`

---

## 📋 Overview

Transform DAWG AI into an **Adaptive Workspace** with 4 context-aware modes:
- 🎤 **RECORD** - Vocal-first recording experience
- ✂️ **EDIT** - Arrangement and editing tools
- 🎚️ **MIX** - Mixing and effects
- 📚 **LEARN** - Journey/coaching integration

**Inspired by:** Ableton Live (dual-view), Logic Pro (AI assistants), modern mobile UX

---

## 🎯 Phase 1: Foundation (Week 1)

**Goal:** Mode switching infrastructure

### Tasks Created (4 tasks, 5 days)

#### 1. Mode Context & State Management
**Task:** `T-01JCKMF2Q9VXZN8K4P7M3R5W1T`
**Owner:** Instance 1
**Estimate:** 1 day
**Deliverables:**
- ModeContext with React Context API
- Mode types: Record, Edit, Mix, Learn
- useModeContext() hook
- localStorage persistence

#### 2. Responsive Grid Layout System
**Task:** `T-01JCKMF9X7PSQB4K2N8M6V1R9T`
**Owner:** Instance 1
**Estimate:** 1.5 days
**Depends on:** T-01JCKMF2Q9VXZN8K4P7M3R5W1T
**Deliverables:**
- 12-column CSS Grid system
- Responsive breakpoints (768px, 1024px, 1440px)
- Mode-specific grid templates
- GridContainer, GridArea, GridPanel components

#### 3. Mode Switcher UI Component
**Task:** `T-01JCKMFHK2ZMVX9P4N7R3W5T1Q`
**Owner:** Instance 1
**Estimate:** 1 day
**Depends on:** T-01JCKMF2Q9VXZN8K4P7M3R5W1T
**Deliverables:**
- Tab-style mode switcher
- Keyboard shortcuts (R/E/M/L)
- Icons (Mic, Edit3, Sliders, BookOpen)
- Active state indicators
- <300ms transition animations

#### 4. Workspace Orchestrator & Routing
**Task:** `T-01JCKMFP8QVWZR3N7K5M9X2T1P`
**Owner:** Instance 1
**Estimate:** 1.5 days
**Depends on:** All above
**Deliverables:**
- /app/workspace route
- WorkspacePage component
- Mode-based layout rendering
- URL param mode sync
- Redirect from / to /workspace

**Phase 1 Total:** ~5 days (can parallelize some tasks to 3-4 days)

---

## 🚀 Phase 2: Mode Layouts (Week 2-3)

**Goal:** Build actual layouts for each mode

### Planned Tasks (4 tasks, ~8 days)

#### 1. Record Mode Layout ✅ Created
**Task:** `T-01JCKMFVX4NMQP8K7R2Z5W9T1V`
**Owner:** Instance 2
**Estimate:** 2 days
**Widgets:**
- WaveformDisplay (60% height, enlarged)
- PerformanceScorer (bottom panel)
- WaveformAnnotations (overlay)
- LiveCoachingPanel (sidebar)
- LyricWorkspace (drawer)
- TransportControls (footer)

#### 2. Edit Mode Layout ⏳ To Create
**Owner:** Instance 1
**Estimate:** 2 days
**Widgets:**
- TrackList (left sidebar, 30%)
- WaveformDisplay/PianoRoll/LyricWorkspace (switchable main area)
- SongStructureBuilder (tab option)
- AutoCompingTool (take selection)
- AIFeedbackTimeline (bottom drawer)

#### 3. Mix Mode Layout ⏳ To Create
**Owner:** Instance 2
**Estimate:** 2 days
**Widgets:**
- WaveformDisplay (compact, 40%)
- EQControls (30%)
- VocalEffectsPanel (30%)
- HarmonyGenerator (optional)
- VocalStatsPanel (analysis)
- MusicGenerator (backing)

#### 4. Learn Mode Layout ⏳ To Create
**Owner:** Instance 3
**Estimate:** 2 days
**Widgets:**
- JourneyDashboard (sidebar, 25%)
- ExerciseLibrary (main area)
- LiveCoachingPanel (main area)
- SkillProgressChart (sidebar)
- SessionPlanner (calendar)
- AIFeedbackTimeline (bottom)

**Phase 2 Total:** ~8 days sequential, ~4 days parallel

---

## 🎨 Phase 3: Polish & Enhancements (Week 4)

### Planned Tasks (~6 tasks, 6-8 days)

1. **Command Palette** (Cmd+K quick actions)
2. **Keyboard Shortcuts System** (Space, R, E, M, L, etc)
3. **Smart AI Suggestions** (contextual tips per mode)
4. **Panel Animations** (smooth transitions, drawers)
5. **Mobile Responsive** (down to 768px)
6. **Accessibility Audit** (WCAG AA compliance)

---

## 📊 Total Effort Estimate

### Sequential Execution
- Phase 1: 5 days
- Phase 2: 8 days
- Phase 3: 7 days
- **Total: 20 days (~4 weeks)**

### Parallel Execution (4 instances)
- Phase 1: 3-4 days (Instance 1 focused)
- Phase 2: 4-5 days (2x Instance 1, 2x Instance 2 parallel)
- Phase 3: 4 days (distributed)
- **Total: ~12 days (~2.5 weeks)**

---

## 🔗 Dependencies

```
Phase 1 Foundation:
  ModeContext (1d)
    ├→ Grid System (1.5d)
    ├→ Mode Switcher (1d)
    └→ Workspace Orchestrator (1.5d)

Phase 2 Layouts (parallel):
  Record Layout (2d) → depends on Real-time Audio task
  Edit Layout (2d)   → depends on Workspace Orchestrator
  Mix Layout (2d)    → depends on Workspace Orchestrator
  Learn Layout (2d)  → depends on Workspace Orchestrator

Phase 3 Polish (parallel):
  All tasks can run in parallel
```

---

## 🎯 Widget Utilization

### Available Widgets: 46
### Widgets Used in Redesign: 38

**Record Mode (8 widgets):**
- WaveformDisplay, PerformanceScorer, WaveformAnnotations
- LiveCoachingPanel, VocalEffectsPanel, LyricWorkspace
- TransportControls, ExerciseLibrary

**Edit Mode (9 widgets):**
- TrackList, WaveformDisplay, PianoRoll
- LyricWorkspace, SongStructureBuilder, AutoCompingTool
- AIFeedbackTimeline, FileUpload, MusicGenerator

**Mix Mode (10 widgets):**
- WaveformDisplay, EQControls, VocalEffectsPanel
- EffectsPanel, HarmonyGenerator, VocalStatsPanel
- MusicGenerator, CompactPitchMonitor, CompactEQControls
- Export tools (new)

**Learn Mode (11 widgets):**
- JourneyDashboard, ExerciseLibrary, LiveCoachingPanel
- VocalAssessment, GoalSettingWizard, StylePreferencesQuiz
- SessionPlanner, SkillProgressChart, UserProfileCard
- AIFeedbackTimeline, MilestoneTracker

**Global Widgets (13):**
- AuthHeader, ProjectSelector, QuickActions
- SaveStatusBadge, ChatPanel, VoiceInterface
- AudioDeviceSettings, PrivacyControls, etc.

**Unused/Future (8 widgets):**
- MetricsDashboard, CompactVoiceProfile, CompactMusicGen
- ProjectList, NewProjectDialog, UserSettingsModal
- ProjectSettingsModal, VoiceProfileManager

---

## 🚨 Risks & Mitigations

### Technical Risks

**1. Performance (Layout Re-renders)**
- Risk: Mode switching causes expensive re-renders
- Mitigation: React.memo widgets, useMemo layouts, lazy loading

**2. State Management Complexity**
- Risk: Mode state conflicts with existing store
- Mitigation: Separate ModeContext, clear separation of concerns

**3. Mobile Responsiveness**
- Risk: Complex layouts break on small screens
- Mitigation: Mobile-first CSS, test at all breakpoints

### UX Risks

**1. User Confusion (Mode Switching)**
- Risk: Users don't understand mode concept
- Mitigation: Onboarding tooltip, default to Record mode

**2. Widget Overload**
- Risk: Too many widgets, UI feels cluttered
- Mitigation: Smart defaults, collapsible panels, minimal initial state

---

## 📈 Success Metrics

### Quantitative
- **Mode switch time:** <300ms ✅
- **Widget load time:** <100ms ✅
- **Layout shift:** 0 (stable grid) ✅
- **Accessibility score:** 95+ (WCAG AA) ✅
- **Mobile responsive:** 100% (down to 768px) ✅

### Qualitative
- Users find Record mode intuitive (user testing)
- Edit workflow feels fast (task completion time)
- Mix mode reduces need for external DAW (user survey)
- Learn mode encourages practice (engagement metrics)
- Transitions feel seamless (user feedback)

---

## 🔔 Next Actions

### For Instance 1 (UI/Frontend)
1. Review UI Redesign Spec: `/docs/design/UI_REDESIGN_SPEC.md`
2. Start with Phase 1.1: Mode Context (T-01JCKMF2...)
3. Build foundation tasks sequentially
4. Create Edit Mode Layout task (Phase 2.2)

### For Instance 2 (Audio)
1. Review Phase 2.1: Record Mode Layout (T-01JCKMFVX...)
2. Wait for Phase 1 completion
3. Build Record and Mix layouts in parallel

### For Instance 3 (AI)
1. Review Phase 2.4: Learn Mode Layout (to be created)
2. Plan AI suggestions system (Phase 3)
3. Build Learn layout when foundation ready

### For Alexis (Planner)
1. ✅ Redesign spec created
2. ✅ Phase 1 tasks created (4 tasks)
3. ✅ Phase 2.1 task created (Record layout)
4. ⏳ Create remaining Phase 2 tasks (Edit, Mix, Learn)
5. ⏳ Create Phase 3 polish tasks
6. ⏳ Update roadmap with redesign timeline

---

## 📁 Files Created

**Design Docs:**
- `/docs/design/UI_REDESIGN_SPEC.md` (complete specification)

**Phase 1 Tasks:**
- `/tasks/T-01JCKMF2Q9VXZN8K4P7M3R5W1T.yaml` (Mode Context)
- `/tasks/T-01JCKMF9X7PSQB4K2N8M6V1R9T.yaml` (Grid System)
- `/tasks/T-01JCKMFHK2ZMVX9P4N7R3W5T1Q.yaml` (Mode Switcher)
- `/tasks/T-01JCKMFP8QVWZR3N7K5M9X2T1P.yaml` (Workspace Orchestrator)

**Phase 2 Tasks:**
- `/tasks/T-01JCKMFVX4NMQP8K7R2Z5W9T1V.yaml` (Record Layout)

**Summary:**
- `/_bus/state/UI_REDESIGN_TASKS.md` (this file)

---

*UI Redesign task breakdown complete. Ready for Phase 1 execution.* 🎨
