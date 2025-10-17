# 🚨 P0 Stability Sprint - Summary

**Created:** 2025-10-02 22:40:00
**Owner:** Alexis (Planner)
**Status:** 🟡 READY TO START

---

## 📊 Current State

### TypeScript Errors
- **Total:** 147 errors
- **Critical (P0):** 58 errors - MUST FIX to unblock features
- **Non-Critical (P2):** 89 errors - Example files and tests (post-stability)

### Error Breakdown by File
```
79  src/widgets/_examples/EffectsPanel.example.tsx  (P2 - low priority)
10  tests/e2e/journey-beginner.spec.ts              (P2 - low priority)
 9  packages/types/src/events.ts                    (P0 - CRITICAL)
 8  src/widgets/EffectsPanel/EffectsPanel.tsx
 6  components/layout/transport-bar.tsx
 5  src/widgets/PianoRoll/PianoRoll.tsx
 4  app/journey/page.tsx
 4  app/api/voice/clone/route.ts
 ... (plus 21 more files)
```

---

## 🎯 Stability Sprint Tasks

### Task Buckets (4 total)

#### Bucket D - Shared Types Foundation (Jerry/Instance-4)
**Status:** 🟡 READY
**Priority:** P0 - HIGHEST (blocks all others)
**Estimate:** 1.5 days

**Scope:**
- Fix `packages/types/src/events.ts` (9 errors) - DO FIRST
- Create `/packages/types/` shared package
- Define event bus types, API contracts, data models
- Fix `src/core/eventBus.ts` duplicate 'mode' property (1 error)
- Configure tsconfig path mappings
- P2 (post-sprint): Example files (79) and E2E tests (10)

**Files:**
- `/tasks/T-STABILITY-D-SHARED-TYPES.yaml`

#### Bucket A - UI/React Types (Max/Instance-1)
**Status:** 🔴 BLOCKED (waiting on Bucket D)
**Priority:** P0
**Estimate:** 1 day

**Scope:**
- Fix 26 UI/React component type errors
- transport-bar.tsx (6), journey/page.tsx (4), page.tsx (2)
- Widgets: PianoRoll (5), WaveformDisplay (2), others (7)

**Files:**
- `/tasks/T-STABILITY-A-UI-TYPES.yaml`

#### Bucket B - Audio/WebAudio Types (Alex/Instance-2)
**Status:** 🔴 BLOCKED (waiting on Bucket D)
**Priority:** P0
**Estimate:** 1 day

**Scope:**
- Fix 17 audio/WebAudio engine type errors
- EffectsPanel.tsx (8), pitch detection (4), VoiceInterface (2), utils (3)

**Files:**
- `/tasks/T-STABILITY-B-AUDIO-TYPES.yaml`

#### Bucket C - Data/API/Schema Types (Karen/Instance-3)
**Status:** 🔴 BLOCKED (waiting on Bucket D)
**Priority:** P0
**Estimate:** 1 day

**Scope:**
- Fix 11 data/API/schema type errors
- OpenAI chat tools (2), profile API (1), voice APIs (6), ProfileManager (2)
- Critical: Add Prisma VoiceProfile model

**Files:**
- `/tasks/T-STABILITY-C-DATA-TYPES.yaml`

---

## 🚦 Green Gate Policy

### Definition
**NO new feature work merges until ALL of the following pass:**

1. ✅ `npm run type-check` → 0 critical errors
2. ✅ `npm run build` → SUCCESS
3. ✅ TypeScript warnings ≤ 5
4. ✅ No new `any` types (max 3 exceptions with inline comments)
5. ✅ All 4 stability tasks completed
6. ✅ Dev server starts without errors

### Current Status
🔴 **Gate is CLOSED** - 58 critical errors remaining

---

## 📈 Success Metrics

### Green Gate Checklist
```
⬜ Bucket D: Shared types package created
⬜ Bucket D: packages/types/src/events.ts fixed (9 errors)
⬜ Bucket A: All UI type errors fixed (26 errors)
⬜ Bucket B: All audio type errors fixed (17 errors)
⬜ Bucket C: All data type errors fixed (11 errors)
⬜ npm run type-check passes (critical files only)
⬜ npm run build succeeds
⬜ Max 5 TypeScript warnings
⬜ Zero new 'any' types (≤3 exceptions with comments)
⬜ All instances report completion
```

### Timeline
- **Day 1 (Oct 2):** Bucket D starts
- **Day 2 (Oct 3):** Buckets A/B/C start (parallel)
- **Day 3 (Oct 4):** All buckets complete, green gate achieved
- **Post-Sprint:** Resume P1 feature work (UI Redesign, Journey)

---

## 📊 Progress Tracking

### Dashboards

**1. Task Dashboard** (Already Built)
- URL: http://localhost:3000/tasks-dashboard
- Shows Kanban board, task stats
- Refresh: Every 5 seconds

**2. Type Errors Burn-down** (To Be Built)
- URL: http://localhost:3000/type-errors-dashboard
- Shows error count, burn-down chart, green gate status
- Spec: `/docs/TYPE_ERRORS_DASHBOARD_SPEC.md`
- Priority: Build alongside sprint (2.5 hours)

### Event Bus
Instances publish:
- `tasks.started` - When beginning work
- `tasks.progress` - Error count updates (POST /api/type-errors/snapshot)
- `tasks.blocked` - When hitting blockers
- `tasks.completed` - When task 100% done

---

## 🔧 Files Created

### Task Definitions
1. `/tasks/T-STABILITY-D-SHARED-TYPES.yaml` - Bucket D (Jerry)
2. `/tasks/T-STABILITY-A-UI-TYPES.yaml` - Bucket A (Max)
3. `/tasks/T-STABILITY-B-AUDIO-TYPES.yaml` - Bucket B (Alex)
4. `/tasks/T-STABILITY-C-DATA-TYPES.yaml` - Bucket C (Karen)

### Documentation
1. `/docs/TYPE_ERRORS_DASHBOARD_SPEC.md` - Burn-down dashboard spec
2. `/_bus/state/SYNC.md` - Multi-instance coordination (green gate policy)
3. `/_bus/state/STABILITY_SPRINT_SUMMARY.md` - This file

### State Updates
1. `/_bus/state/deps.json` - Updated with 4 stability tasks + 5 UI redesign tasks
2. `/_bus/events/2025-10-02/events.jsonl` - Published tasks.created event

---

## 🚀 Next Actions

### For Instance 4 (Jerry) - START NOW
```bash
# 1. Review Bucket D task
cat /Users/benkennon/dawg-ai/tasks/T-STABILITY-D-SHARED-TYPES.yaml

# 2. Publish start event
echo '{"event":"tasks.started","task_id":"T-STABILITY-D-SHARED-TYPES","agent":"instance-4","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' >> _bus/events/2025-10-02/events.jsonl

# 3. Fix packages/types/src/events.ts FIRST (9 errors)
npm run type-check 2>&1 | grep "packages/types/src/events.ts"

# 4. Create shared types package structure
mkdir -p packages/types/src/{events,api,data,utils}

# 5. Report progress every 2-3 errors fixed
curl -X POST http://localhost:3000/api/type-errors/snapshot \
  -H "Content-Type: application/json" \
  -d '{"bucket":"D","instance":"instance-4","errors_fixed":2,"errors_remaining":8}'
```

### For Instances 1/2/3 - WAIT
- Review your assigned Bucket task (T-STABILITY-A/B/C-*.yaml)
- Wait for Instance 4 to complete Bucket D
- Once unblocked, start immediately in parallel

### For Alexis (Me) - OPTIONAL
Build type errors dashboard:
1. Create `/app/type-errors-dashboard/page.tsx` (static first)
2. Create `/app/api/type-errors/route.ts` (parse npm run type-check)
3. Add burn-down chart with Recharts
4. Implement green gate logic

---

## 📞 Support

**Questions?**
- Check SYNC.md: `/_bus/state/SYNC.md`
- Review task YAML: `/tasks/T-STABILITY-*.yaml`
- Dashboard spec: `/docs/TYPE_ERRORS_DASHBOARD_SPEC.md`

**Event Bus:**
- Subscribe: `tasks.started`, `tasks.blocked`, `tasks.completed`
- Publish when starting/progressing/completing tasks

---

**Alexis (Planner) 🤖**

*P0 Stability Sprint initialized. Let's get this codebase clean!*

*Instance 4 (Jerry): You're up first. The team is counting on you to build the shared types foundation. 🚀*
