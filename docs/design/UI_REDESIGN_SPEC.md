# DAWG AI - UI Redesign Specification

**Version:** 2.0
**Date:** 2025-10-03
**Owner:** Alexis (Planner) + Design Team
**Status:** Draft - Ready for Review

---

## 🎯 Vision

Transform DAWG AI from a traditional DAW layout into a **modern, AI-first vocal production interface** that blends the best of:
- **Ableton Live's** clip-based workflow flexibility
- **Logic Pro's** AI-powered studio assistants
- **Pro Tools'** professional aesthetic
- **Modern mobile apps'** intuitive UX

---

## 📊 Research Findings

### Industry Trends (2025)
✅ **AI-First Design** - Google Gemini watching DAW, real-time AI feedback
✅ **Generative Audio Workstations (GAWs)** - Next-gen AI-powered DAWs
✅ **Simplified Interfaces** - Ableton/FL Studio playful accessibility
✅ **Dual-View Workflows** - Linear (Arrangement) + Non-linear (Session/Clip) views
✅ **Voice Integration** - Voice control becoming standard
✅ **Mobile-First Thinking** - Tablet/phone versions driving design

### Current State Analysis
📍 **Main DAW Page** (`/app/page.tsx`)
- Grid-based layout (compact widgets at bottom)
- Sidebar for project/AI coach
- Traditional linear waveform + track list
- Pro Tools dark aesthetic ✅

📍 **Journey Page** (`/app/journey/page.tsx`)
- Multi-view navigation (Dashboard/Lyrics/Structure/Schedule/Progress)
- Setup wizard flow
- Coaching overlay modal
- **Missing:** Seamless integration with main DAW

### Available Widgets (46 total)

**🎵 Audio/Production (12)**
- WaveformDisplay, TrackList, TransportControls
- PitchMonitor, CompactPitchMonitor
- EQControls, CompactEQControls
- VocalEffectsPanel, EffectsPanel
- PianoRoll, HarmonyGenerator
- PerformanceScorer, WaveformAnnotations

**🤖 AI/Coaching (8)**
- ChatPanel, LiveCoachingPanel
- AIFeedbackTimeline, ExerciseLibrary
- VocalAssessment, GoalSettingWizard
- StylePreferencesQuiz, AutoCompingTool

**🎨 Creative Tools (6)**
- LyricWorkspace, SongStructureBuilder
- MusicGenerator, CompactMusicGen
- JourneyDashboard, SessionPlanner

**📊 Analytics/Progress (7)**
- SkillProgressChart, UserProfileCard
- VocalStatsPanel, ProjectStats
- CompactVoiceProfile, MetricsDashboard
- MilestoneTracker (planned)

**🔧 System/UI (13)**
- AuthHeader, ProjectSelector, ProjectList
- FileUpload, QuickActions, SaveStatusBadge
- AudioDeviceSettings, PrivacyControls
- UserSettingsModal, ProjectSettingsModal
- NewProjectDialog, VoiceProfileManager
- VoiceInterface (in main page)

---

## 🎨 Redesign Concept: "Adaptive Workspace"

### Core Principle
**Context-Aware Layouts** - UI adapts to user intent (Recording, Editing, Mixing, Learning)

### Three Primary Modes

#### 1. **RECORD Mode** (Vocal-First)
**Layout:**
```
┌─────────────────────────────────────────┐
│  🎤 [RECORD]  Edit  Mix  Learn          │ Mode Switcher
├─────────────────────────────────────────┤
│                                         │
│         LARGE WAVEFORM                  │ 60% height
│         + Real-time Pitch Overlay       │
│                                         │
├─────────────────────────────────────────┤
│ Transport │ Pitch │ Effects │ Coach AI  │ 20% height
├─────────────────────────────────────────┤
│ Lyrics/Notes Panel (collapsible)        │ 20% height
└─────────────────────────────────────────┘
```

**Active Widgets:**
- WaveformDisplay (primary)
- PerformanceScorer (real-time)
- WaveformAnnotations (AI feedback)
- LiveCoachingPanel (sidebar/overlay)
- LyricWorkspace (bottom panel)
- VocalEffectsPanel (quick access)

#### 2. **EDIT Mode** (Arrangement-First)
**Layout:**
```
┌─────────────────────────────────────────┐
│  Record  🎹 [EDIT]  Mix  Learn          │
├─────────────────────────────────────────┤
│ Tracks (30%) │  Waveform/Piano (70%)   │
│              │                          │
│ TrackList    │  Arrangement View        │
│ + Controls   │  or Clip Grid            │
│              │  or Lyric Editor         │
│              │  or Structure Builder    │
├─────────────────────────────────────────┤
│ Transport │ Tools │ AI Suggestions      │
└─────────────────────────────────────────┘
```

**Active Widgets:**
- TrackList (left sidebar)
- WaveformDisplay OR PianoRoll OR LyricWorkspace (switchable)
- SongStructureBuilder (tab option)
- AutoCompingTool (for take selection)
- AIFeedbackTimeline (bottom drawer)

#### 3. **MIX Mode** (Polish & Effects)
**Layout:**
```
┌─────────────────────────────────────────┐
│  Record  Edit  🎚️ [MIX]  Learn         │
├─────────────────────────────────────────┤
│         Waveform (40%)                  │
├─────────────────────────────────────────┤
│ EQ/Effects (30%) │ Mixer (30%)         │
│                  │                      │
│ Visual EQ        │ Track Levels        │
│ Effects Chain    │ Pan/Send/Master     │
│ Harmony Gen      │ VocalStats          │
├─────────────────────────────────────────┤
│ Transport │ Master Out │ Export         │
└─────────────────────────────────────────┘
```

**Active Widgets:**
- WaveformDisplay (compact)
- EQControls (primary)
- VocalEffectsPanel (primary)
- HarmonyGenerator (optional)
- VocalStatsPanel (analysis)
- MusicGenerator (backing track)

#### 4. **LEARN Mode** (Journey-Focused)
**Layout:**
```
┌─────────────────────────────────────────┐
│  Record  Edit  Mix  📚 [LEARN]          │
├─────────────────────────────────────────┤
│ Progress     │                          │
│ Dashboard    │   Active Lesson/         │
│ (25%)        │   Exercise/              │
│              │   Coaching Session       │
│ Exercises    │   (75%)                  │
│ Goals        │                          │
│ Milestones   │                          │
├─────────────────────────────────────────┤
│ AI Coach Chat │ Practice Timer          │
└─────────────────────────────────────────┘
```

**Active Widgets:**
- JourneyDashboard (sidebar)
- ExerciseLibrary (main area)
- LiveCoachingPanel (main area)
- SkillProgressChart (sidebar)
- AIFeedbackTimeline (bottom)
- UserProfileCard (sidebar header)
- SessionPlanner (calendar view)

---

## 🏗️ Design System Updates

### Layout Principles

**1. Responsive Grid System**
```css
/* Base grid: 12 columns */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
  height: 100vh;
  padding: 12px;
}

/* Mode-specific layouts */
.record-mode { /* Waveform-first */ }
.edit-mode { /* Arrangement-first */ }
.mix-mode { /* Tools-first */ }
.learn-mode { /* Progress-first */ }
```

**2. Widget Containers**
```css
.widget-panel {
  /* Collapsible panels */
  transition: width 0.3s, height 0.3s;
}

.widget-drawer {
  /* Bottom/side drawers */
  transform: translateY(100%);
  transition: transform 0.3s;
}

.widget-overlay {
  /* Modal overlays */
  backdrop-filter: blur(10px);
}
```

**3. Color Palette (Pro Tools Dark)**
```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --surface-1: rgba(255, 255, 255, 0.05);
  --surface-2: rgba(255, 255, 255, 0.08);

  /* Accents (neon) */
  --accent-cyan: #00e5ff;
  --accent-purple: #b066ff;
  --accent-green: #00ff88;
  --accent-pink: #ff66cc;
  --accent-blue: #00d4ff;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --text-tertiary: #666666;

  /* Semantic */
  --success: #00ff88;
  --warning: #ffaa00;
  --error: #ff5555;
  --info: #00e5ff;
}
```

### Typography
```css
/* Headers */
--font-display: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Sizes */
--text-xs: 11px;
--text-sm: 13px;
--text-md: 15px;
--text-lg: 18px;
--text-xl: 24px;
--text-2xl: 36px;
```

### Component Patterns

**Widget Header Standard:**
```tsx
<WidgetHeader
  icon={IconComponent}
  title="Widget Name"
  subtitle="Optional description"
  actions={[<Button />, <Menu />]}
  color="cyan" // accent color
/>
```

**Panel States:**
- `collapsed` - Icon + title only
- `compact` - Essential controls visible
- `expanded` - Full feature set
- `fullscreen` - Takes over viewport

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Mode switching infrastructure

**Tasks:**
1. Create mode context/state management
2. Build LayoutManager component
3. Design responsive grid system
4. Create mode switcher UI
5. Migrate existing widgets to new containers

**Deliverables:**
- Mode switching works (Record/Edit/Mix/Learn)
- Widgets adapt to mode context
- Grid system responsive

### Phase 2: Record Mode (Week 2)
**Goal:** Perfect the recording experience

**Tasks:**
1. Large waveform with pitch overlay
2. Real-time performance scoring integration
3. AI annotations during recording
4. Coaching panel sidebar
5. Lyric sync during recording

**Deliverables:**
- Seamless recording UX
- Real-time AI feedback
- Vocal health features (warm-ups)

### Phase 3: Edit Mode (Week 3)
**Goal:** Powerful arrangement tools

**Tasks:**
1. Clip-based grid view (Ableton-style)
2. Track list with inline controls
3. Piano roll integration
4. Auto-comping take selection
5. Lyric/structure editors

**Deliverables:**
- Flexible arrangement workflow
- Multiple editor views
- Quick edits without mode switching

### Phase 4: Mix Mode (Week 4)
**Goal:** Professional mixing tools

**Tasks:**
1. Visual EQ with frequency analyzer
2. Effects chain builder
3. Mixer panel with automation
4. Harmony generator integration
5. Export presets

**Deliverables:**
- Mixing workflow complete
- Effects processing
- Polished output

### Phase 5: Learn Mode (Week 5)
**Goal:** Journey integration perfected

**Tasks:**
1. Progress dashboard sidebar
2. Exercise library main view
3. Coaching session integration
4. Skill tracking visualization
5. Milestone celebrations

**Deliverables:**
- Journey fully integrated
- Seamless DAW ↔ Learn transitions
- Gamification complete

---

## 📐 Widget Mapping to Modes

### Record Mode Widgets (8)
- ✅ WaveformDisplay (primary)
- ✅ PerformanceScorer
- ✅ WaveformAnnotations
- ✅ LiveCoachingPanel
- ✅ VocalEffectsPanel
- ✅ LyricWorkspace
- ✅ TransportControls
- ⚠️ ExerciseLibrary (warm-up)

### Edit Mode Widgets (9)
- ✅ TrackList
- ✅ WaveformDisplay
- ✅ PianoRoll
- ✅ LyricWorkspace
- ✅ SongStructureBuilder
- ✅ AutoCompingTool
- ✅ AIFeedbackTimeline
- ✅ FileUpload
- ⚠️ MusicGenerator (backing tracks)

### Mix Mode Widgets (10)
- ✅ WaveformDisplay (compact)
- ✅ EQControls
- ✅ VocalEffectsPanel
- ✅ EffectsPanel
- ✅ HarmonyGenerator
- ✅ VocalStatsPanel
- ✅ MusicGenerator
- ✅ CompactPitchMonitor
- ✅ CompactEQControls
- ⚠️ Export tools (new)

### Learn Mode Widgets (11)
- ✅ JourneyDashboard
- ✅ ExerciseLibrary
- ✅ LiveCoachingPanel
- ✅ VocalAssessment
- ✅ GoalSettingWizard
- ✅ StylePreferencesQuiz
- ✅ SessionPlanner
- ✅ SkillProgressChart
- ✅ UserProfileCard
- ✅ AIFeedbackTimeline
- ⚠️ MilestoneTracker (new)

### Global Widgets (Always Available)
- AuthHeader
- ProjectSelector
- QuickActions
- SaveStatusBadge
- ChatPanel (AI assistant)
- VoiceInterface
- AudioDeviceSettings
- PrivacyControls

---

## 🎯 Key UX Improvements

### 1. **Contextual Sidebar**
- Adapts content based on mode
- Collapsible (keyboard shortcut: `Cmd+B`)
- Remembers state per mode

### 2. **Command Palette** (NEW)
```
Cmd+K → Opens quick actions
- "Start recording"
- "Open lyrics"
- "Add harmony"
- "Export mix"
- "Begin warm-up"
```

### 3. **Smart Suggestions** (AI-Powered)
```
When user is recording:
→ "Your pitch is drifting sharp. Try the breathing exercise."

When user is editing:
→ "This take has better tone. Want to use it as the main?"

When user is mixing:
→ "Add reverb to match your reference track?"
```

### 4. **Gesture Support**
- Pinch to zoom waveform
- Swipe to switch modes
- Two-finger scroll for timeline navigation

### 5. **Keyboard-First Workflow**
```
Space: Play/Pause
R: Toggle recording
E: Enter edit mode
M: Enter mix mode
L: Enter learn mode
Cmd+Shift+E: Export
Cmd+Shift+S: Save project
```

---

## 📊 Success Metrics

### Quantitative
- **Mode switch time:** <300ms
- **Widget load time:** <100ms
- **Layout shift:** 0 (stable grid)
- **Accessibility score:** 95+ (WCAG AA)
- **Mobile responsive:** 100% (down to 768px)

### Qualitative
- Users find recording mode intuitive
- Editing workflow feels fast
- Mixing doesn't require external DAW
- Learning mode encourages practice
- Transitions feel seamless

---

## 🔄 Migration Strategy

### Backward Compatibility
1. Keep existing routes working
2. Add `/workspace` route with new layout
3. User preference toggle (old vs new UI)
4. Gradual rollout with feature flags

### Data Migration
- Existing projects load in any mode
- Widget preferences per mode saved
- Layout state persisted in localStorage
- Cloud sync for cross-device

---

## 📁 File Structure (Post-Redesign)

```
/app/
  /workspace/           # New unified workspace
    layout.tsx          # Mode-aware layout
    page.tsx            # Main workspace orchestrator
  /page.tsx             # Legacy DAW (redirect to /workspace)
  /journey/             # Keep as-is, integrate into Learn mode

/src/
  /layouts/
    ModeLayout/         # Base layout for each mode
      RecordLayout.tsx
      EditLayout.tsx
      MixLayout.tsx
      LearnLayout.tsx
    LayoutManager.tsx   # Mode switcher logic

  /contexts/
    ModeContext.tsx     # Current mode state
    LayoutContext.tsx   # Layout preferences

  /widgets/             # Existing widgets (enhanced)
    [WidgetName]/
      [WidgetName].tsx
      [WidgetName].compact.tsx  # NEW: Compact variant
      [WidgetName].module.css
      [WidgetName].config.ts    # NEW: Mode visibility config
```

---

## 🎬 Next Steps

1. **Review & Approve** this spec with stakeholders
2. **Create detailed tasks** for Phase 1 (Foundation)
3. **Design mockups** for each mode
4. **Build prototype** of mode switching
5. **User testing** with beta users
6. **Iterate** based on feedback

---

*This redesign transforms DAWG AI into a modern, AI-first vocal production suite that rivals professional DAWs while remaining accessible to beginners.* 🎵
