# 4-Instance Development Strategy - DAWG AI
**Created:** 2025-10-03
**Purpose:** Define clear scopes and coordination strategy for parallel development

---

## Executive Summary

### Current State Analysis
- **Backend:** 100% complete (Instances 2, 3, 4)
- **Frontend:** 60% complete (Instance 1)
- **Code Files:** 39 TypeScript files (27 src, 12 app)
- **Example Widgets:** 6 copy-paste ready UI components
- **Documentation Overhead:** 40% of development time (per audit)

### Critical Insight
**We have a FRONTEND BOTTLENECK.** All backend systems are complete and waiting for UI integration. Instance 1 cannot build all UI alone.

### Solution
**Split UI development across all 4 instances** with specialized widget domains. Continue backend support as needed.

---

## Revised Instance Scopes

### Instance 1: Core UI & Integration Lead
**Focus:** Main DAW interface, transport, tracks, waveforms

**Responsibilities:**
1. **Integration Coordinator**
   - Integrate widgets from other instances
   - Maintain `/app/page.tsx` (main DAW layout)
   - Coordinate widget placement and sizing
   - Test full workflows end-to-end

2. **Core DAW Widgets (OWN)**
   - `/src/widgets/TransportControls/` ✅
   - `/src/widgets/TrackList/` ✅
   - `/src/widgets/TrackItem/` ✅
   - `/src/widgets/WaveformDisplay/` ✅
   - `/src/widgets/FileUpload/` ✅
   - `/src/widgets/ChatPanel/` ✅

3. **State Management**
   - `/src/core/store.ts` (Zustand)
   - `/src/core/types.ts`
   - Core audio hooks (useRecording, usePlayback)

**File Ownership:**
- `/app/page.tsx` - EXCLUSIVE
- `/src/widgets/Transport*/` - EXCLUSIVE
- `/src/widgets/Track*/` - EXCLUSIVE
- `/src/widgets/Waveform*/` - EXCLUSIVE
- `/src/core/store.ts` - PRIMARY (others request changes)
- `/src/core/types.ts` - PRIMARY (others request changes)

**Weekly Output:** 2-3 widget integrations + testing

---

### Instance 2: Audio Widgets & Effects UI
**Focus:** Audio processing UI, pitch detection, vocal effects

**NEW ROLE:** Build audio-related UI widgets using own hooks

**Responsibilities:**
1. **Audio Effects Widgets (BUILD)**
   - `/src/widgets/EffectsPanel/` ✅ (Instance 3 built this)
   - `/src/widgets/EQControls/` - 3-band EQ UI
   - `/src/widgets/CompressorControls/` - Dynamics UI
   - `/src/widgets/ReverbControls/` - Reverb/Delay UI

2. **Vocal Analysis Widgets (BUILD)**
   - `/src/widgets/PitchMonitor/` - Real-time pitch display ✅
   - `/src/widgets/PianoRoll/` - Pitch history visualizer
   - `/src/widgets/VocalStatsPanel/` - Performance metrics

3. **Vocal Effects Widgets (BUILD)**
   - `/src/widgets/VocalEffectsPanel/` - Auto-Tune, doubler, de-esser UI
   - `/src/widgets/PresetSelector/` - Quick preset dropdown

4. **Backend Maintenance**
   - `/src/utils/audio*.ts` - Audio processing utilities
   - `/src/core/use*.ts` (audio hooks) - Hook maintenance

**File Ownership:**
- `/src/widgets/Effects*/` - BUILD & OWN
- `/src/widgets/Pitch*/` - BUILD & OWN
- `/src/widgets/Vocal*/` - BUILD & OWN
- `/src/utils/audio*.ts` - MAINTAIN
- `/src/core/useEffects.ts` - MAINTAIN
- `/src/core/usePitchDetection.ts` - MAINTAIN
- `/src/core/useVocalEffects.ts` - MAINTAIN

**Weekly Output:** 2-3 audio widgets

**Integration Pattern:**
- Build widget in `/src/widgets/`
- Test with own hooks
- Commit with message: `feat(i2): add EQControls widget`
- Notify Instance 1 via SYNC.md

---

### Instance 3: AI Widgets & Music Generation UI
**Focus:** AI features, music generation, voice cloning UI

**NEW ROLE:** Build AI-related UI widgets using own APIs

**Responsibilities:**
1. **Music Generation Widgets (BUILD)**
   - `/src/widgets/MusicGenerator/` - Backing track UI
   - `/src/widgets/StyleSelector/` - Genre/mood/instruments picker
   - `/src/widgets/MelodyTransformer/` - Melody-to-music UI
   - `/src/widgets/GenerationProgress/` - 30-60s progress tracker

2. **Voice Cloning Widgets (BUILD)**
   - `/src/widgets/VoiceProfileManager/` - Create/list/delete profiles
   - `/src/widgets/HarmonyGenerator/` - Harmony generation UI
   - `/src/widgets/VoiceProfileSelector/` - Profile picker dropdown

3. **AI Enhancement Widgets (BUILD)**
   - `/src/widgets/AIActionBadge/` - Action execution indicator (done?)
   - `/src/widgets/AIFeedbackPanel/` - Real-time coaching display
   - `/src/widgets/AIInsights/` - Post-recording analysis

4. **Backend Maintenance**
   - `/app/api/chat*/` - Chat endpoints
   - `/app/api/generate*/` - Music generation endpoints
   - `/app/api/voice*/` - Voice cloning endpoints
   - `/lib/ai/` - AI utilities

**File Ownership:**
- `/src/widgets/MusicGenerator*/` - BUILD & OWN
- `/src/widgets/Voice*/` - BUILD & OWN
- `/src/widgets/Harmony*/` - BUILD & OWN
- `/src/widgets/AI*/` - BUILD & OWN
- `/app/api/chat*/` - MAINTAIN
- `/app/api/generate*/` - MAINTAIN
- `/app/api/voice*/` - MAINTAIN
- `/lib/ai/` - MAINTAIN

**Weekly Output:** 2-3 AI widgets

**Integration Pattern:**
- Build widget in `/src/widgets/`
- Test with own APIs
- Commit with message: `feat(i3): add MusicGenerator widget`
- Notify Instance 1 via SYNC.md

---

### Instance 4: Data Widgets & Project Management UI
**Focus:** Auth, projects, save/load, user settings UI

**NEW ROLE:** Build data/persistence UI widgets using own APIs

**Responsibilities:**
1. **Authentication Widgets (BUILD)**
   - `/src/widgets/AuthHeader/` - User dropdown, sign out
   - `/src/widgets/LoginPage/` - Login/register forms
   - `/src/widgets/AuthGuard/` - Protected route wrapper
   - Example components already done ✅

2. **Project Management Widgets (BUILD)**
   - `/src/widgets/ProjectSelector/` - Project dropdown
   - `/src/widgets/ProjectList/` - Grid/list view of projects
   - `/src/widgets/ProjectSettingsModal/` - Edit project metadata
   - `/src/widgets/NewProjectDialog/` - Create project wizard

3. **Save/Load Widgets (BUILD)**
   - `/src/widgets/SaveStatusIndicator/` ✅ (already built)
   - `/src/widgets/AutoSaveSettings/` - Configure auto-save
   - `/src/widgets/ProjectHistory/` - Version history (future)

4. **User Settings Widgets (BUILD)**
   - `/src/widgets/UserSettingsModal/` - Account settings
   - `/src/widgets/AudioDeviceSettings/` - Device preferences
   - `/src/widgets/PreferencesPanel/` - UI preferences

5. **Backend Maintenance**
   - `/app/api/projects*/` - Project CRUD
   - `/app/api/auth*/` - Authentication
   - `/app/api/audio*/` - S3 storage
   - `/lib/db/`, `/lib/auth/`, `/lib/storage/` - Backend utilities
   - `/prisma/` - Database schema

**File Ownership:**
- `/src/widgets/Auth*/` - BUILD & OWN
- `/src/widgets/Project*/` - BUILD & OWN
- `/src/widgets/User*/` - BUILD & OWN
- `/src/widgets/Save*/` - BUILD & OWN
- `/app/api/projects*/` - MAINTAIN
- `/app/api/auth*/` - MAINTAIN
- `/app/api/audio*/` - MAINTAIN
- `/lib/db/`, `/lib/auth/`, `/lib/storage/` - MAINTAIN
- `/prisma/` - MAINTAIN

**Weekly Output:** 2-3 data/auth widgets

**Integration Pattern:**
- Build widget in `/src/widgets/`
- Test with own APIs
- Commit with message: `feat(i4): add ProjectSelector widget`
- Notify Instance 1 via SYNC.md

---

## Widget Domain Mapping

| Domain | Instance | Widget Count | Status |
|--------|----------|--------------|--------|
| **Core DAW** | Instance 1 | 6 widgets | ✅ Complete |
| **Audio Effects** | Instance 2 | 5-6 widgets | ⏳ 1/6 done |
| **Pitch/Vocal** | Instance 2 | 3-4 widgets | ⏳ 1/4 done |
| **AI Features** | Instance 3 | 4-5 widgets | ❌ Not started |
| **Music Gen** | Instance 3 | 3-4 widgets | ⏳ 1/4 done (example) |
| **Voice Clone** | Instance 3 | 3-4 widgets | ❌ Not started |
| **Auth/User** | Instance 4 | 3-4 widgets | ⏳ 3/4 done (examples) |
| **Projects** | Instance 4 | 4-5 widgets | ⏳ 1/5 done (example) |

**Total Remaining:** ~25-30 widgets across 3 instances

---

## Coordination Protocol

### Daily Workflow

**Morning (Start of Session):**
1. Read SYNC.md for overnight updates
2. Review assigned widget priorities
3. Start building next widget

**During Work:**
1. Build widget in `/src/widgets/[YourDomain]/`
2. Test widget with your own hooks/APIs
3. Commit frequently: `feat(iX): add WidgetName`
4. Post short update to SYNC.md when done

**End of Session:**
1. Update SYNC.md with completed widgets
2. Mark any blockers
3. Suggest next widget to build

### Communication Rules

**DO:**
- ✅ Post SHORT updates (3-5 lines) when shipping widgets
- ✅ Ask Instance 1 for integration help if stuck
- ✅ Test your widgets before committing
- ✅ Use example widgets as templates
- ✅ Build, test, ship - iterate fast

**DON'T:**
- ❌ Write long integration guides
- ❌ Wait for approval to start coding
- ❌ Edit Instance 1's core files without asking
- ❌ Build widgets outside your domain
- ❌ Over-document - code speaks

### SYNC.md Format (Simplified)

```markdown
### From Instance X - [Widget] SHIPPED
**Date:** YYYY-MM-DD HH:MM
✅ Widget built: `/src/widgets/WidgetName/`
🔗 Uses: hookName / API endpoint
📝 Notes: [one line if needed]
```

---

## Widget Build Pattern

### Standard Widget Structure
```
/src/widgets/WidgetName/
├── WidgetName.tsx          # Main component
├── WidgetName.module.css   # Scoped styles
├── types.ts                # Props interface (optional)
└── README.md               # One-line description (optional)
```

### Build Checklist
1. ✅ Copy from `/src/widgets/_examples/` or `_template/`
2. ✅ Connect to your hooks/APIs
3. ✅ Test in isolation (create demo page if needed)
4. ✅ Dark theme styling (use CSS variables)
5. ✅ TypeScript types for props
6. ✅ Commit: `feat(iX): add WidgetName`
7. ✅ Post to SYNC.md

**Time per widget:** 1-3 hours (goal: 2-3 widgets per day)

---

## Priority Queue (Next 2 Weeks)

### Week 1: Essential UI

**Instance 1 (Core DAW):**
1. Integrate EffectsPanel into main layout ✅
2. Integrate PitchMonitor from Instance 2
3. Test full recording → effects → playback workflow
4. Integrate AuthHeader from Instance 4

**Instance 2 (Audio UI):**
1. Build VocalEffectsPanel (Auto-Tune, doubler, de-esser)
2. Build PianoRoll (pitch history visualizer)
3. Build VocalStatsPanel (performance metrics)
4. Build EQControls (3-band EQ sliders)

**Instance 3 (AI UI):**
1. Convert MusicGenerator.example.tsx to production widget
2. Build StyleSelector (genre/mood picker)
3. Build VoiceProfileManager (create/list/delete)
4. Build HarmonyGenerator (harmony generation UI)

**Instance 4 (Data UI):**
1. Convert AuthHeader.example.tsx to production widget
2. Convert LoginPage.example.tsx to production widget
3. Convert ProjectSelector.example.tsx to production widget
4. Build ProjectList (grid view of user projects)

### Week 2: Advanced Features

**Instance 1:**
- Integration testing across all domains
- Bug fixes and polish
- Performance optimization
- End-to-end workflow testing

**Instance 2:**
- CompressorControls
- ReverbControls
- Advanced pitch visualization
- Effects presets UI

**Instance 3:**
- MelodyTransformer (melody-to-music)
- GenerationProgress (30-60s wait indicator)
- AIFeedbackPanel (coaching display)
- Voice profile enhancements

**Instance 4:**
- ProjectSettingsModal
- AutoSaveSettings
- UserSettingsModal
- Audio device preferences

---

## Success Metrics

### Weekly Targets
- **Instance 1:** 2-3 integrations + testing
- **Instance 2:** 2-3 audio widgets
- **Instance 3:** 2-3 AI widgets
- **Instance 4:** 2-3 data widgets

### Quality Gates
✅ Widget works in isolation
✅ Dark theme styling consistent
✅ TypeScript types complete
✅ No console errors
✅ Mobile-responsive (where applicable)

### Velocity Tracking
- **Current:** 1-2 widgets per instance per week (blocked by Instance 1)
- **Target:** 2-3 widgets per instance per week (parallel development)
- **Expected:** 8-12 widgets per week across all instances
- **MVP Complete:** 2-3 weeks (25-30 widgets remaining)

---

## Risk Mitigation

### Potential Issues

**1. Merge Conflicts**
- **Risk:** Multiple instances editing same files
- **Mitigation:** Strict file ownership rules, Instance 1 owns integration files
- **Resolution:** Instance 1 resolves conflicts during integration

**2. API Contract Changes**
- **Risk:** Backend instance changes API, breaks frontend widget
- **Mitigation:** Freeze backend APIs for 2 weeks, only bug fixes
- **Resolution:** Backend instances notify all if critical change needed

**3. Widget Integration Delays**
- **Risk:** Instance 1 becomes bottleneck integrating widgets
- **Mitigation:** Instances test widgets independently first
- **Resolution:** Instance 1 prioritizes integration over new features

**4. Styling Inconsistencies**
- **Risk:** Each instance uses different styling approaches
- **Mitigation:** Use CSS variables, copy from examples
- **Resolution:** Instance 1 provides style guide if needed

**5. Over-Engineering**
- **Risk:** Instances build overly complex widgets
- **Mitigation:** Start with minimal viable widget, iterate
- **Resolution:** "Ship first, polish later" mentality

---

## Decision Framework

### When to Build vs. Wait

**BUILD IMMEDIATELY if:**
- ✅ Widget is in your domain (audio/AI/data)
- ✅ Backend API/hook is ready
- ✅ Example widget exists to copy from
- ✅ No dependencies on other instances

**COORDINATE WITH INSTANCE 1 if:**
- ⚠️ Widget needs integration into main layout
- ⚠️ Widget affects core state management
- ⚠️ Widget depends on Instance 1's work
- ⚠️ Unsure where widget should go in UI

**WAIT FOR APPROVAL if:**
- 🛑 Want to change `/src/core/store.ts`
- 🛑 Want to change `/src/core/types.ts`
- 🛑 Want to change `/app/page.tsx`
- 🛑 Want to refactor shared utilities

---

## Transition Plan

### Phase 1: Immediate (Today)
1. ✅ Distribute this strategy to all instances
2. ✅ Each instance reads and acknowledges
3. ✅ Each instance picks first widget to build
4. ✅ Start coding immediately

### Phase 2: First Week
1. Each instance ships 2-3 widgets
2. Instance 1 integrates completed widgets
3. Daily SYNC.md updates (short format)
4. Address blockers as they arise

### Phase 3: Second Week
1. Continued widget development
2. Cross-instance testing
3. Bug fixes and polish
4. Performance optimization

### Phase 4: Week 3+
1. Advanced features
2. User testing feedback
3. Final polish
4. Production deployment

---

## Communication Templates

### Widget Completion Message
```markdown
### From Instance X - [WidgetName] SHIPPED
**Date:** 2025-10-03 HH:MM
✅ `/src/widgets/WidgetName/WidgetName.tsx` (120 lines)
🔗 Uses: hookName / POST /api/endpoint
```

### Blocker Message
```markdown
### From Instance X - BLOCKED
**Date:** 2025-10-03 HH:MM
🛑 Blocked on: [specific issue]
💡 Need: [what you need to unblock]
⏰ ETA if unblocked: [time estimate]
```

### Integration Request
```markdown
### From Instance X to Instance 1 - READY FOR INTEGRATION
**Date:** 2025-10-03 HH:MM
✅ Widget: WidgetName
📍 Location: Suggest placing in [sidebar/header/main area]
🧪 Tested: [yes/no]
```

---

## FAQ

### Q: Can I build widgets outside my domain?
**A:** No, stick to your domain. This prevents conflicts and maintains expertise.

### Q: What if I finish my widgets early?
**A:** Pick from "Future Enhancements" list, or help test other widgets.

### Q: Can I refactor Instance 1's code?
**A:** No, request changes via SYNC.md. Instance 1 owns core files.

### Q: What if backend API needs changes?
**A:** Freeze APIs for 2 weeks. Critical bugs only. Notify all if change needed.

### Q: How do I test my widget without main app?
**A:** Create demo page in `/app/demo/widget-name/page.tsx` (see existing demos).

### Q: Widget too complex to finish in one session?
**A:** Ship v1 (minimal), iterate later. Don't perfectit.

### Q: Styling doesn't match?
**A:** Copy CSS from `/src/widgets/_examples/` - consistent dark theme.

### Q: Should I write documentation?
**A:** No. Code is documentation. Add one-line comment in widget if needed.

---

## Summary

### Key Changes
1. **Instances 2, 3, 4 now build UI widgets** in their domains
2. **Instance 1 focuses on integration** and core DAW
3. **Strict file ownership** prevents conflicts
4. **Short SYNC.md updates** reduce coordination overhead
5. **Ship fast, iterate later** mentality

### Expected Outcomes
- **8-12 widgets per week** (vs. current 1-2)
- **2-3 weeks to MVP** (vs. current 6-8 weeks)
- **Less documentation overhead** (40% → 10%)
- **More coding time** (30% → 70%)
- **Parallel development** maximizes all 4 instances

### Success Criteria
✅ Each instance ships 2-3 widgets per week
✅ Instance 1 integrates widgets within 24 hours
✅ No backend API changes for 2 weeks
✅ Short SYNC.md updates (3-5 lines)
✅ MVP complete in 2-3 weeks

---

**Strategy Status:** ✅ Ready to Deploy
**Next Step:** Distribute to all instances and start building
**Goal:** Ship DAWG AI MVP in 2-3 weeks through parallel UI development
