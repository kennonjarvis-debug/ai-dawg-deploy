# DAWG AI - Refined Backlog (Post-Review)

**Planner:** Alexis
**Last Updated:** 2025-10-03T03:45:00Z
**Status:** Backlog refined and optimized

---

## 🔍 Review Summary

### Discoveries
✅ **Found existing widgets not integrated:**
- AIFeedbackTimeline - timeline UI for AI feedback
- ExerciseLibrary - vocal warm-up exercises
- VocalEffectsPanel - real-time vocal effects

### Changes Made
1. **Updated T-01JCKM6P3...** - Changed from "create" to "integrate" AIFeedbackTimeline (2 days → 0.5 days)
2. **Added T-01JCKMA2...** - Integrate ExerciseLibrary (0.75 days) - **Elevated to P1-B**
3. **Added T-01JCKMA9...** - Integrate VocalEffectsPanel (1 day)
4. Updated dependency graph with new tasks

### Impact
- **Net savings:** 1.5 days (integration faster than creation)
- **Added value:** 2 high-impact widgets discovered and queued
- **Total effort:** 11.25 days (down from 12 days)

---

## 📋 Refined Task Queue (8 Tasks)

### Priority 1-B: Critical for UX (Start Immediately)
```
T-01JCKMA2V8... | ExerciseLibrary Integration    | 0.75d | Instance 3 | INTEGRATE
```
**Rationale:** Vocal warm-ups essential for vocal health before recording

---

### Priority 2: Feature Enhancement (Next Sprint)

#### Instance 1 - UI/Frontend (1 task, 1.5 days)
```
T-01JCKM6A7T... | ReferenceTrackUploader          | 1.5d  | CREATE
```

#### Instance 2 - Audio (3 tasks, 5 days)
```
T-01JCKM7B2P... | Real-time Audio Integration     | 2d    | ENHANCE
T-01JCKM6H9Z... | VoicematchVisualizer            | 2d    | CREATE    | Depends: T-01JCKM6A7T
T-01JCKMA9K3... | VocalEffectsPanel Integration   | 1d    | INTEGRATE | Depends: T-01JCKM7B2P
```

#### Instance 3 - AI (1 task, 0.5 days)
```
T-01JCKM6P3R... | AIFeedbackTimeline Integration  | 0.5d  | INTEGRATE
```

#### Instance 4 - Data (2 tasks, 3.5 days)
```
T-01JCKM6V8K... | MilestoneTracker                | 1.5d  | CREATE
T-01JCKM7J9W... | Progress Persistence & Sync     | 2d    | ENHANCE
```

---

## 🔗 Dependency Graph (Updated)

```
Critical Path:
  ExerciseLibrary (P1-B) → [no blockers] → 0.75d

Parallel Paths:
  Path 1: ReferenceTrackUploader (1.5d) → VoicematchVisualizer (2d) = 3.5d
  Path 2: Real-time Audio (2d) → VocalEffectsPanel (1d) = 3d
  Path 3: AIFeedbackTimeline (0.5d) → [done] = 0.5d
  Path 4: MilestoneTracker (1.5d) → [done] = 1.5d
  Path 5: Progress Persistence (2d) → [done] = 2d

Total Duration (with parallelization): ~4 days critical path (Path 1)
```

---

## 🎯 Recommended Execution Strategy

### Week 1 (Days 1-2)
**Start Immediately (Parallel):**
1. Instance 3: ExerciseLibrary (0.75d) - **P1-B - Start first!**
2. Instance 1: ReferenceTrackUploader (1.5d)
3. Instance 2: Real-time Audio Integration (2d)
4. Instance 3: AIFeedbackTimeline (0.5d) - **Can finish same day as ExerciseLibrary**
5. Instance 4: MilestoneTracker (1.5d)
6. Instance 4: Progress Persistence (2d)

**End of Day 2:** 4 tasks complete (ExerciseLibrary, AIFeedbackTimeline, ReferenceTrackUploader, Real-time Audio starting)

### Week 1 (Days 3-4)
**Continue:**
1. Instance 2: VoicematchVisualizer (2d) - **Now unblocked**
2. Instance 2: VocalEffectsPanel (1d) - **Now unblocked**

**End of Day 4:** All 8 tasks complete ✅

**Total Timeline: 4 days with full parallelization** (vs 11.25 days sequential)

---

## 📊 Task Breakdown by Type

### Create (3 tasks, 5 days)
- Widget development from scratch
- ReferenceTrackUploader, VoicematchVisualizer, MilestoneTracker

### Integrate (3 tasks, 2.25 days)
- Existing widgets into journey page
- ExerciseLibrary, AIFeedbackTimeline, VocalEffectsPanel
- **High ROI:** Already built, just need wiring

### Enhance (2 tasks, 4 days)
- Improve existing functionality
- Real-time Audio, Progress Persistence

---

## 🚨 Risks & Mitigations

### Medium Risks
1. **Real-time Audio Integration (Instance 2)**
   - Risk: Audio latency, browser compatibility
   - Mitigation: Use existing hooks, thorough testing

2. **VocalEffectsPanel Integration (Instance 2)**
   - Risk: Audio glitches with effects
   - Mitigation: Depends on successful Real-time Audio task

### Low Risks
- All integration tasks (existing code reduces risk)
- MilestoneTracker (straightforward logic)
- Progress Persistence (well-defined scope)

---

## 📈 Value vs Effort Analysis

### High Value, Low Effort (Quick Wins) ⭐
1. **ExerciseLibrary** (0.75d) - P1-B - Vocal health critical
2. **AIFeedbackTimeline** (0.5d) - Progress visibility
3. **VocalEffectsPanel** (1d) - User confidence boost

### High Value, Medium Effort
1. **Real-time Audio** (2d) - Enables live coaching
2. **MilestoneTracker** (1.5d) - Gamification/motivation

### Medium Value, Medium Effort
1. **ReferenceTrackUploader** (1.5d) - Learning by comparison
2. **VoicematchVisualizer** (2d) - Visual feedback
3. **Progress Persistence** (2d) - Data safety

---

## 🎯 Success Metrics (Post-Sprint)

### Quantitative
- ✅ 8/8 tasks completed
- ✅ 15 total widgets integrated into journey (12 existing + 3 new)
- ✅ <4 day completion (with parallelization)
- ✅ 0 build errors
- ✅ 100% test coverage on new code

### Qualitative
- Users can warm up with exercises before recording
- Real-time audio feedback works in coaching
- Progress tracked and persisted
- Visual comparison to reference tracks
- Achievement system motivates users

---

## 📁 Files Updated

**Task YAML Files (8 total):**
- `/tasks/T-01JCKM6A7TQRS4M8N9PX2V5W1Y.yaml` (ReferenceTrackUploader)
- `/tasks/T-01JCKM6H9ZVWX3K7N2QY8P4M1S.yaml` (VoicematchVisualizer)
- `/tasks/T-01JCKM6P3RXSB9M4T8ZN1K6V2Q.yaml` (AIFeedbackTimeline - **UPDATED**)
- `/tasks/T-01JCKM6V8KQWP2N7M5SX9R4T1Z.yaml` (MilestoneTracker)
- `/tasks/T-01JCKM7B2PMZK8V4N3WX6Q9R1T.yaml` (Real-time Audio)
- `/tasks/T-01JCKM7J9WSQZ4K8P2MV7N1X3R.yaml` (Progress Persistence)
- `/tasks/T-01JCKMA2V8HQSB7K4N9PX3M1R6.yaml` (ExerciseLibrary - **NEW**)
- `/tasks/T-01JCKMA9K3ZMQX7N4P8R5V2W1T.yaml` (VocalEffectsPanel - **NEW**)

**State Files:**
- `/_bus/state/deps.json` (Updated with 8 tasks, 2 dependency edges)
- `/_bus/state/backlog-refined.md` (This file)

---

## 🔔 Events to Publish

```json
{
  "event": "tasks.updated",
  "producer": "alexis",
  "payload": {
    "action": "backlog_refined",
    "tasks_modified": 1,
    "tasks_added": 2,
    "total_tasks": 8,
    "estimate_change": "-0.75 days",
    "priority_elevated": ["T-01JCKMA2V8HQSB7K4N9PX3M1R6"],
    "critical_path_days": 4
  }
}
```

---

## 🎬 Next Steps

**For Instance Agents:**
1. Subscribe to `tasks.updated` event
2. Review refined task queue above
3. Claim tasks via `tasks.assigned` event
4. **Start with P1-B task (ExerciseLibrary) immediately**

**For Alexis (Self):**
1. Monitor WIP limits (max 7 concurrent)
2. Publish `tasks.updated` event
3. Update roadmap if needed
4. Stand by for task status updates

---

*Backlog review complete. System optimized for maximum throughput.* 🚀
