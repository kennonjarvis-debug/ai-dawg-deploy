# 🔧 DAWG AI Refactoring Roadmap

## Executive Summary

**Codebase Size:** 56,692 lines of TypeScript/Svelte code
**Files Analyzed:** 174 files (91 in audio module alone)
**Top Findings:**
- 5 files >700 lines (candidates for splitting)
- 46 console.log statements (should use logger)
- 148 type safety issues (": any" and "as any")
- 36 TODO/FIXME comments
- 10 functions >100 lines

**Priority:** Focus on high-impact, low-risk refactoring to improve maintainability

---

## 📊 Analysis Results

### Largest Files (Refactoring Candidates)

| File | Lines | Priority | Estimated Effort |
|------|-------|----------|------------------|
| `AudioEngine.ts` | 985 | ⭐⭐⭐ High | 4-6 hours |
| `AIAudioPanel.svelte` | 848 | ⭐⭐ Medium | 3-4 hours |
| `VoiceInterface.ts` | 765 | ⭐⭐ Medium | 3-4 hours |
| `Track.ts` | 704 | ⭐⭐⭐ High | 4-5 hours |
| `VoiceController.ts` | 700 | ⭐⭐ Medium | 3-4 hours |
| `AUPluginWrapper.ts` | 673 | ⭐ Low | 2-3 hours |
| `CLAPPluginWrapper.ts` | 665 | ⭐ Low | 2-3 hours |
| `vocalEffects.ts` | 631 | ⭐ Low | 2-3 hours |
| `PluginInstanceManager.ts` | 618 | ⭐ Low | 2-3 hours |

### Code Quality Issues

| Issue | Count | Priority | Estimated Effort |
|-------|-------|----------|------------------|
| `console.log` statements | 46 | ⭐⭐⭐ High | 1 hour |
| `: any` type annotations | 104 | ⭐⭐ Medium | 4-6 hours |
| `as any` type assertions | 44 | ⭐⭐ Medium | 2-3 hours |
| TODO/FIXME comments | 36 | ⭐ Low | Review only |

### Complexity Hotspots

| File | Conditionals | Density | Risk |
|------|-------------|---------|------|
| `scanner/utils.ts` | 88 | 16% | High |
| `testing/bridge.ts` | 46 | 12% | High |
| `scanner/PluginScanner.ts` | 37 | 10.75% | Medium |
| `CommandParser.ts` | 41 | 9.55% | Medium |
| `eventBus.ts` | 34 | 9.26% | Medium |
| `daw/+page.svelte` | 46 | 8.74% | Medium |

### Large Functions (>100 lines)

1. `useTransport` store (164 lines) - `core/transport.ts:55`
2. `useTrackStore` store (185 lines) - `core/store.ts:39`
3. `eventBus` init (352 lines) - `core/eventBus.ts`
4. `metricsCollector` (413 lines) - `core/metricsCollector.ts`
5. `agentCoordination` (452 lines) - `core/agentCoordination.ts`
6. `EQCurveViz` (311 lines) - `visualizers/EQCurveViz.ts`
7. `WaveformViz` (360 lines) - `visualizers/WaveformViz.ts`
8. `AudioVisualizer` (216 lines) - `visualizers/AudioVisualizer.ts`
9. `PitchViz` (340 lines) - `visualizers/PitchViz.ts`

### Module Distribution

| Module | Files | Avg Lines/File | Notes |
|--------|-------|----------------|-------|
| `lib/audio` | 91 | 203 | Largest module, core audio engine |
| `lib/design-system` | 31 | 89 | UI components |
| `lib/ai` | 13 | 187 | AI/NLU features |
| `lib/components` | 11 | 298 | Large components |
| `lib/voice` | 5 | 272 | Voice control |

---

## 🎯 Refactoring Priorities

### Priority 1: Quick Wins (1-2 days) ⭐⭐⭐

**High impact, low risk, quick execution**

#### 1.1 Replace Console Statements (1 hour)
**Impact:** Improved logging, security, debugging
**Risk:** Low
**Effort:** 1 hour

**Task:** Replace 46 `console.log` statements with structured logger

```bash
# Already have a script for this from Phase 1-2
node scripts/replace-console-with-logger.ts
```

**Files affected:** 46 occurrences across codebase
**Benefits:**
- Consistent logging format
- Production-safe (no sensitive data in console)
- Better debugging with structured logs

---

#### 1.2 Fix TypeScript `any` Types (4-6 hours)
**Impact:** Better type safety, fewer runtime errors
**Risk:** Low-Medium (may reveal bugs)
**Effort:** 4-6 hours

**Task:** Replace 104 `: any` and 44 `as any` with proper types

**Top offenders:**
- `src/lib/audio/plugins/*` - Plugin type definitions
- `src/core/` - Store and coordination types
- `src/lib/audio/Track.ts` - MIDI instrument type

**Approach:**
1. Start with simple cases (known types)
2. Create proper type definitions for plugin interfaces
3. Add generics where needed
4. Use `unknown` for truly dynamic data

**Benefits:**
- Catch errors at compile time
- Better IDE autocomplete
- Easier refactoring

---

#### 1.3 Address TODO/FIXME Comments (2 hours review)
**Impact:** Code clarity, identify hidden issues
**Risk:** Low
**Effort:** 2 hours (review), varies (fixes)

**Task:** Review and categorize 36 TODO/FIXME comments

**Action plan:**
1. Create GitHub issues for important TODOs
2. Fix trivial ones immediately
3. Remove outdated comments
4. Add context to remaining TODOs

---

### Priority 2: File Splitting (3-5 days) ⭐⭐

**Medium impact, medium risk, improves maintainability**

#### 2.1 Split AudioEngine.ts (985 lines → 3-4 files)
**Impact:** High - Core audio system more maintainable
**Risk:** Medium - Many dependencies
**Effort:** 4-6 hours

**Current structure:**
```
AudioEngine.ts (985 lines)
├── Transport control
├── Track management
├── Recording system
├── Loop recording
├── Automation
├── Analysis
├── Export/rendering
└── Metrics
```

**Proposed split:**
```
AudioEngine.ts (200 lines) - Core orchestration
├── AudioEngineTransport.ts (150 lines) - Transport/timing
├── AudioEngineRecording.ts (200 lines) - Recording & loop recording
├── AudioEngineExport.ts (250 lines) - Rendering & export
└── AudioEngineAnalysis.ts (150 lines) - Analysis & metrics
```

**Benefits:**
- Easier to test individual systems
- Clearer separation of concerns
- Smaller files are easier to navigate

**Migration strategy:**
1. Create new files with extracted code
2. Keep AudioEngine.ts as facade
3. Update imports gradually
4. Run tests at each step

---

#### 2.2 Split Track.ts (704 lines → 2-3 files)
**Impact:** High - Used throughout audio system
**Risk:** Medium - Many consumers
**Effort:** 4-5 hours

**Proposed split:**
```
Track.ts (300 lines) - Core track functionality
├── TrackAudio.ts (200 lines) - Audio/playback
├── TrackMIDI.ts (150 lines) - MIDI functionality
└── TrackEffects.ts (100 lines) - Effects management
```

**Benefits:**
- Clearer audio vs MIDI separation
- Easier to add features to specific track types
- Reduced cognitive load

---

#### 2.3 Split AIAudioPanel.svelte (848 lines → 3-4 components)
**Impact:** Medium - UI easier to maintain
**Risk:** Low - Svelte components easy to split
**Effort:** 3-4 hours

**Proposed split:**
```
AIAudioPanel.svelte (200 lines) - Layout & orchestration
├── AIControlPanel.svelte (150 lines) - AI controls
├── AIVisualization.svelte (200 lines) - Waveform/meters
├── AISettings.svelte (150 lines) - Settings panel
└── AIHistory.svelte (100 lines) - Command history
```

**Benefits:**
- Reusable sub-components
- Easier to test individual UI pieces
- Better performance (smaller re-renders)

---

#### 2.4 Refactor Large Store Functions
**Impact:** Medium - Easier to maintain state logic
**Risk:** Low - Well-tested
**Effort:** 3-4 hours

**Targets:**
- `useTransport` (164 lines) → Extract action handlers
- `useTrackStore` (185 lines) → Extract track operations

**Approach:**
```typescript
// Before: Monolithic store
export const useTrackStore = create<TrackStore>((set, get) => ({
  // 185 lines of logic here
}));

// After: Modular actions
const trackActions = {
  addTrack: (set, get) => (config) => { ... },
  removeTrack: (set, get) => (id) => { ... },
  updateTrack: (set, get) => (id, updates) => { ... }
};

export const useTrackStore = create<TrackStore>((set, get) => ({
  ...trackActions(set, get)
}));
```

---

### Priority 3: Complexity Reduction (1 week) ⭐

**Lower priority but improves long-term maintainability**

#### 3.1 Simplify Plugin Scanner Logic
**Files:**
- `scanner/utils.ts` (549 lines, 16% conditional density)
- `scanner/PluginScanner.ts` (344 lines, 10.75% density)

**Approach:**
1. Extract platform-specific logic to separate files
2. Use strategy pattern for different plugin formats
3. Add comprehensive tests for edge cases

**Effort:** 6-8 hours

---

#### 3.2 Refactor Visualizer Classes
**Files:**
- `WaveformViz.ts` (360 lines)
- `PitchViz.ts` (340 lines)
- `EQCurveViz.ts` (311 lines)

**Approach:**
1. Create base `BaseVisualizer` class with common logic
2. Extract rendering logic to separate methods
3. Use composition over inheritance where appropriate

**Effort:** 8-10 hours

---

#### 3.3 Consolidate Event Bus Logic
**File:** `core/eventBus.ts` (367 lines, 9.26% conditional density)

**Approach:**
1. Extract event handlers to separate files
2. Use TypeScript discriminated unions for event types
3. Add event replay/debugging functionality

**Effort:** 4-6 hours

---

## 🏗️ Architectural Improvements

### Module Organization

**Current issues:**
- 91 files in `lib/audio` (too many in one directory)
- Inconsistent naming (some use index.ts, some don't)
- Mix of core and optional features

**Proposed structure:**
```
src/lib/audio/
├── core/              # Core audio engine (must-have)
│   ├── AudioEngine.ts
│   ├── Track.ts
│   ├── MasterBus.ts
│   └── BufferPool.ts
├── effects/           # Audio effects (existing)
├── recording/         # Recording system (existing)
├── analysis/          # Analysis tools (existing)
├── midi/              # MIDI functionality (existing)
├── plugins/           # Plugin system (optional)
│   ├── scanner/
│   ├── wrappers/
│   ├── bridges/
│   └── ai/
└── automation/        # Automation system (existing)
```

**Benefits:**
- Clearer separation between core and optional features
- Easier to tree-shake unused features
- Better mental model of the codebase

---

### Type Safety Strategy

**Issues:**
- 104 `: any` annotations
- 44 `as any` assertions
- Plugin system has weak types

**Proposed improvements:**

1. **Create proper plugin type definitions:**
```typescript
// Instead of: any
// Use:
interface PluginBase {
  id: string;
  name: string;
  version: string;
  process(input: AudioBuffer): AudioBuffer;
}

interface AUPlugin extends PluginBase {
  format: 'au';
  componentType: string;
}

interface VST3Plugin extends PluginBase {
  format: 'vst3';
  uid: string;
}

type Plugin = AUPlugin | VST3Plugin | CLAPPlugin;
```

2. **Use generics for flexible typing:**
```typescript
// Instead of: value: any
// Use:
function processEffect<T extends Effect>(effect: T, params: T['params']): void
```

3. **Replace `as any` with proper type guards:**
```typescript
// Instead of: (x as any).foo
// Use:
function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

if (hasProperty(x, 'foo')) {
  x.foo; // TypeScript knows this is safe
}
```

---

## 📅 Implementation Timeline

### Week 1: Quick Wins
- ✅ Day 1: Replace console.log (1 hour)
- ✅ Day 1-2: Fix simple `: any` types (4 hours)
- ✅ Day 2: Review TODO/FIXME (2 hours)
- ✅ Day 3-5: Fix complex `: any` types (8 hours)

**Deliverable:** Cleaner, type-safe codebase

---

### Week 2: File Splitting
- ⏳ Day 1-2: Split AudioEngine.ts (6 hours)
- ⏳ Day 3: Split Track.ts (5 hours)
- ⏳ Day 4: Split AIAudioPanel.svelte (4 hours)
- ⏳ Day 5: Refactor large store functions (4 hours)

**Deliverable:** Modular, maintainable core files

---

### Week 3: Complexity Reduction (Optional)
- ⏳ Day 1-2: Simplify plugin scanner (8 hours)
- ⏳ Day 3-4: Refactor visualizers (10 hours)
- ⏳ Day 5: Event bus refactor (6 hours)

**Deliverable:** Lower complexity, easier to extend

---

## 🎯 Success Metrics

### Code Quality
- [ ] Zero `console.log` statements
- [ ] <20 `: any` type annotations (from 104)
- [ ] <10 `as any` assertions (from 44)
- [ ] All TODO/FIXME categorized

### Maintainability
- [ ] No files >500 lines
- [ ] No functions >80 lines
- [ ] <10% conditional density per file
- [ ] Clear module boundaries

### Performance
- [ ] No regression in build time
- [ ] No regression in bundle size
- [ ] Same or better runtime performance

---

## ⚠️ Risks & Mitigation

### Risk 1: Breaking Changes
**Mitigation:**
- Write tests before refactoring
- Use TypeScript to catch breaking changes
- Refactor incrementally, not all at once
- Keep git history clean (one refactor per commit)

### Risk 2: Time Investment
**Mitigation:**
- Prioritize high-impact refactorings first
- Skip low-priority items if time-constrained
- Measure value vs effort for each task

### Risk 3: Scope Creep
**Mitigation:**
- Stick to roadmap, don't add features
- Document new feature requests for later
- Focus on refactoring, not rewriting

---

## 💡 Recommendations

### Immediate Action (This Week)
1. ✅ Replace 46 console.log statements (1 hour)
2. ✅ Fix top 20 `: any` types in critical paths (2 hours)
3. ✅ Split AudioEngine.ts (6 hours)

**Total effort:** ~9 hours
**Impact:** Major improvement in code quality

### Next Sprint (Next 2 Weeks)
1. Complete type safety fixes
2. Split Track.ts and AIAudioPanel.svelte
3. Refactor large store functions

**Total effort:** ~20 hours
**Impact:** Significantly more maintainable codebase

### Long-Term (Month 2-3)
1. Reorganize module structure
2. Simplify complex algorithms
3. Extract base classes for visualizers

**Total effort:** ~30 hours
**Impact:** Production-grade architecture

---

## 📚 Resources

### Tools
- **TypeScript:** Use `tsc --noEmit` for type checking
- **Bundle Analyzer:** `rollup-plugin-visualizer` (already configured)
- **Code Analysis:** `scripts/code-analysis.sh` (created)

### Best Practices
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [Svelte Best Practices](https://svelte.dev/docs/svelte/overview)

---

**Report Generated:** October 20, 2025, 2:20 PM
**Codebase Size:** 56,692 lines
**Status:** Ready for refactoring

**Next Step:** Start with Priority 1 quick wins (console.log replacement + type safety)
