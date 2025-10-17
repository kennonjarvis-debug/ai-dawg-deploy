# 🔄 DAWG AI Multi-Instance Sync

**Last Updated:** 2025-10-02 22:40:00
**Current Sprint:** P0 Stability Sprint
**Status:** 🔴 **GREEN GATE ENFORCED** - No new features until TypeScript is clean

---

## 🚨 P0 STABILITY SPRINT - GREEN GATE POLICY

### Policy

**NO new feature work merges until:**
1. ✅ `npm run type-check` passes (0 critical errors)
2. ✅ `npm run build` succeeds
3. ✅ Max 5 TypeScript warnings
4. ✅ Zero new `any` types (≤3 exceptions with inline comments)

**Current Status:**
- 🔴 **147 total TypeScript errors**
- 🔴 **58 critical errors** (blocking features)
- ⚠️ **89 non-critical errors** (examples/tests - P2)
- 📊 **Progress: 0%** (0 errors fixed)

### Critical Errors Breakdown

| Bucket | Owner       | Errors | Status  | Estimate |
|--------|-------------|--------|---------|----------|
| **D**  | Instance 4  | 10     | 🟡 READY | 1.5 days |
| **A**  | Instance 1  | 26     | 🔴 BLOCKED | 1 day  |
| **B**  | Instance 2  | 17     | 🔴 BLOCKED | 1 day  |
| **C**  | Instance 3  | 11     | 🔴 BLOCKED | 1 day  |

**Total Critical:** 58 errors across 4 buckets

---

## 📋 Current Task Assignments

### Instance 1 (Max - UI Lead)
**Priority:** P0 Stability → P1 UI Redesign

**Active Tasks:**
- 🔴 BLOCKED: `T-STABILITY-A-UI-TYPES` - Fix UI/React Component Type Errors (26 errors)
  - Depends on: Bucket D (Shared Types)
  - Files: transport-bar.tsx (6), journey/page.tsx (4), page.tsx (2), widgets (14)
  - Estimate: 1 day

**Queued (Post-Green Gate):**
- T-01JCKMF2Q9VXZN8K4P7M3R5W1T - Mode Context (1 day)
- T-01JCKMF9X7PSQB4K2N8M6V1R9T - Grid System (1.5 days)
- T-01JCKMFHK2ZMVX9P4N7R3W5T1Q - Mode Switcher (1 day)
- T-01JCKMFP8QVWZR3N7K5M9X2T1P - Workspace Orchestrator (1.5 days)

**Reference:** `/_bus/state/INSTANCE_1_HANDOFF.md`

---

### Instance 2 (Alex - Audio Lead)
**Priority:** P0 Stability → P1 UI Redesign (Record Mode)

**Active Tasks:**
- 🔴 BLOCKED: `T-STABILITY-B-AUDIO-TYPES` - Fix Audio/WebAudio Engine Type Errors (17 errors)
  - Depends on: Bucket D (Shared Types)
  - Files: EffectsPanel.tsx (8), pitch detection (4), VoiceInterface (2), utils (3)
  - Estimate: 1 day

**Queued (Post-Green Gate):**
- T-01JCKMFVX4NMQP8K7R2Z5W9T1V - Record Mode Layout (2 days)
- T-01JCKMA9K3ZMQX7N4P8R5V2W1T - Integrate VocalEffectsPanel (P2, 1 day)

---

### Instance 3 (Karen - Data Lead)
**Priority:** P0 Stability → P1 Journey Integration

**Active Tasks:**
- 🔴 BLOCKED: `T-STABILITY-C-DATA-TYPES` - Fix Data/API/Schema Type Errors (11 errors)
  - Depends on: Bucket D (Shared Types)
  - Files: chat-openai (2), profile (1), voice APIs (6), ProfileManager (2)
  - Critical: Prisma VoiceProfile model missing
  - Estimate: 1 day

**Queued (Post-Green Gate):**
- T-01JCKMA2V8HQSB7K4N9PX3M1R6 - Integrate ExerciseLibrary (P1-B, 0.75 days)
- T-01JCKM6P3RXSB9M4T8ZN1K6V2Q - Integrate AIFeedbackTimeline (P2, 0.5 days)

---

### Instance 4 (Jerry - Types Lead)
**Priority:** P0 Stability (Foundation Owner)

**Active Tasks:**
- 🟡 READY: `T-STABILITY-D-SHARED-TYPES` - Create Shared Types Foundation (10 critical errors + 89 P2)
  - **HIGHEST PRIORITY - BLOCKS ALL OTHER BUCKETS**
  - Critical scope:
    - Fix packages/types/src/events.ts (9 errors) - MUST DO FIRST
    - Fix src/core/eventBus.ts duplicate 'mode' (1 error)
    - Create shared types package structure
    - Configure tsconfig path mappings
  - P2 scope (post-stability):
    - src/widgets/_examples/EffectsPanel.example.tsx (79 errors)
    - tests/e2e/journey-beginner.spec.ts (10 errors)
  - Estimate: 1.5 days (critical only)

**Queued (Post-Green Gate):**
- T-01JCKM6V8KQWP2N7M5SX9R4T1Z - MilestoneTracker Widget (P2, 1.5 days)
- T-01JCKM7J9WSQZ4K8P2MV7N1X3R - Journey Progress Persistence (P2, 2 days)

---

## 📊 Progress Tracking

### Dashboards

**Task Dashboard:**
- URL: http://localhost:3000/tasks-dashboard
- Shows: Task status, Kanban board, stats
- Refresh: Every 5 seconds

**Type Errors Burn-down:**
- URL: http://localhost:3000/type-errors-dashboard (TO BE BUILT)
- Shows: Error count by bucket, burn-down chart, green gate status
- Refresh: Every 30 seconds
- Spec: `/docs/TYPE_ERRORS_DASHBOARD_SPEC.md`

### Event Bus

**Subscribe to:**
- `tasks.started` - Instance begins work
- `tasks.blocked` - Instance hits blocker
- `tasks.completed` - Task finished
- `tasks.progress` - Error count delta

**Publish when:**
- Starting task: `{"event":"tasks.started","task_id":"...","agent":"instance-N"}`
- Fixing errors: POST `/api/type-errors/snapshot` with error count
- Completing task: `{"event":"tasks.completed","task_id":"...","agent":"instance-N"}`

---

## 🔧 Shared Types Package Structure

**Location:** `/packages/types/`

**Exports:**
```typescript
// Event contracts
import { TaskEvent, AudioEvent } from '@dawg-ai/types/events';

// API contracts
import { RestAPI, WebSocketAPI } from '@dawg-ai/types/api';

// Data models
import { UserProfile, Track, VoiceProfile } from '@dawg-ai/types/data';

// Utilities
import { generateId, validateEmail } from '@dawg-ai/types/utils';
```

**Status:** 🔴 Not yet created (Bucket D responsibility)

---

## 🚀 Sprint Timeline

### Day 1 (Today - Oct 2)
- ✅ Alexis: Analyzed 147 errors, created 4 task buckets
- ✅ Alexis: Created stability sprint tasks
- ✅ Alexis: Defined green gate policy
- ⏳ Instance 4 (Jerry): START Bucket D - Shared Types Foundation
  - Priority: Fix packages/types/src/events.ts FIRST (9 errors)
  - Then: Create shared types package structure

### Day 2 (Oct 3)
- ⏳ Instance 4: Complete Bucket D (unblocks A/B/C)
- ⏳ Instances 1/2/3: START Buckets A/B/C (parallel work)

### Day 3 (Oct 4)
- ⏳ Instances 1/2/3: Complete Buckets A/B/C
- ✅ Green gate achieved
- 🎉 Resume feature work (UI Redesign Phase 1, Journey Integrations)

---

## ✅ Green Gate Acceptance Criteria

### Code Quality
- [ ] `npm run type-check` → 0 critical errors (P0 files only)
- [ ] `npm run build` → SUCCESS
- [ ] TypeScript warnings ≤ 5
- [ ] No new `any` types (max 3 exceptions with comments)

### Bucket Completion
- [ ] Bucket D: Shared types package published
- [ ] Bucket D: packages/types/src/events.ts fixed (9 errors)
- [ ] Bucket A: All UI type errors fixed (26 errors)
- [ ] Bucket B: All audio type errors fixed (17 errors)
- [ ] Bucket C: All data type errors fixed (11 errors)

### Testing
- [ ] All modified files have proper type imports
- [ ] Dev server starts without type errors
- [ ] No runtime console errors on page load

### Documentation
- [ ] Shared types package README.md created
- [ ] Type contracts documented in `/docs/TYPE_CONTRACTS.md`
- [ ] All instances acknowledge green gate policy

---

## 📝 Communication Protocol

### Daily Standup (Self-Report)
Each instance posts to event bus:
```json
{
  "event": "standup.report",
  "agent": "instance-N",
  "timestamp": "2025-10-02T22:00:00Z",
  "payload": {
    "yesterday": ["Fixed 5 UI type errors in transport-bar.tsx"],
    "today": ["Will fix remaining 3 errors, then journey/page.tsx"],
    "blockers": ["Waiting on shared types from Bucket D"]
  }
}
```

### Blocker Escalation
If blocked >4 hours:
1. Publish `tasks.blocked` event with reason
2. Tag @alexis in event payload
3. Continue with lower-priority tasks from queue

### Completion Notification
When task 100% done:
1. Verify: `npm run type-check` on modified files
2. Publish `tasks.completed` event
3. Update task status in deps.json via API
4. Move to next queued task OR wait for dependencies

---

## 🔗 Important Links

**Documentation:**
- Stability Sprint Tasks: `/tasks/T-STABILITY-*.yaml`
- Type Errors Dashboard Spec: `/docs/TYPE_ERRORS_DASHBOARD_SPEC.md`
- UI Redesign Spec: `/docs/design/UI_REDESIGN_SPEC.md`
- Instance 1 Handoff: `/_bus/state/INSTANCE_1_HANDOFF.md`

**State Files:**
- Task Dependencies: `/_bus/state/deps.json`
- Event Log: `/_bus/events/2025-10-02/events.jsonl`

**Dashboards:**
- Tasks: http://localhost:3000/tasks-dashboard
- Type Errors: http://localhost:3000/type-errors-dashboard (to be built)

**APIs:**
- Task Status: `GET /api/tasks`
- Type Errors: `GET /api/type-errors` (to be built)
- Progress Report: `POST /api/type-errors/snapshot`

---

## 🎯 Success Criteria

**Sprint Complete When:**
1. All 58 critical errors fixed
2. Green gate checklist 100% complete
3. Build passes: `npm run type-check && npm run build`
4. All 4 instances report `tasks.completed`
5. No new regressions introduced

**Post-Sprint:**
- Resume P1 feature work (UI Redesign, Journey Integrations)
- Tackle P2 errors (examples/tests) as time permits
- Maintain green gate: all PRs must pass `npm run type-check`

---

**Alexis (Planner)** 🤖
*Coordinating the stability sprint. Let's get this codebase clean!*
