# Type Errors Burn-down Dashboard

**Purpose:** Real-time visual tracking of TypeScript errors during P0 Stability Sprint

**URL:** `/type-errors-dashboard` (separate Chrome tab from main app)

---

## 📊 Dashboard Layout

### Header Section
```
┌─────────────────────────────────────────────────────────────┐
│  🔧 DAWG AI - Type Errors Burn-down                         │
│  Last Update: 2025-10-02 22:40:30                           │
│  Sprint Status: IN PROGRESS | Target: 0 errors              │
└─────────────────────────────────────────────────────────────┘
```

### Stats Cards (5 columns)
```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  TOTAL   │ CRITICAL │   NON-   │  FIXED   │ PROGRESS │
│          │          │ CRITICAL │          │          │
│   147    │    58    │    89    │    0     │   0%     │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

- **Total:** All TypeScript errors (npm run type-check)
- **Critical (P0):** Production errors blocking features (58)
  - UI/React: 26
  - Audio/WebAudio: 17
  - Data/API: 11
  - Cross-package: 4
- **Non-Critical (P2):** Examples/Tests (89)
  - EffectsPanel.example.tsx: 79
  - E2E tests: 10
- **Fixed:** Errors resolved (incremental)
- **Progress:** (Fixed / Critical) × 100%

### Burn-down Chart
```
Line chart showing:
- X-axis: Time (hours since sprint start)
- Y-axis: Error count
- Lines:
  - Total errors (gray)
  - Critical errors (red)
  - Target line (green - zero)
```

### Task Status Board (4 columns)
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Bucket D   │  Bucket A   │  Bucket B   │  Bucket C   │
│  (Jerry)    │  (Max)      │  (Alex)     │  (Karen)    │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ 🟡 READY    │ 🔴 BLOCKED  │ 🔴 BLOCKED  │ 🔴 BLOCKED  │
│ Shared      │ UI Types    │ Audio Types │ Data Types  │
│ Types       │             │             │             │
│ 10 errors   │ 26 errors   │ 17 errors   │ 11 errors   │
│ 1.5 days    │ 1 day       │ 1 day       │ 1 day       │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

Status indicators:
- 🟢 READY - Can start work
- 🔴 BLOCKED - Waiting on dependency
- 🟡 IN PROGRESS - Active work
- ✅ COMPLETE - All errors fixed

### Error Details Table
```
┌─────────────────────────────────────────────────────────────┐
│ File                              │ Count │ Owner  │ Status │
├─────────────────────────────────────────────────────────────┤
│ src/widgets/_examples/Effects...  │  79   │ Jerry  │ P2     │
│ packages/types/src/events.ts      │   9   │ Jerry  │ Ready  │
│ src/widgets/EffectsPanel/...      │   8   │ Alex   │ Blocked│
│ components/layout/transport-bar   │   6   │ Max    │ Blocked│
│ src/widgets/PianoRoll/PianoRoll   │   5   │ Max    │ Blocked│
│ app/api/voice/clone/route.ts      │   4   │ Karen  │ Blocked│
│ app/journey/page.tsx              │   4   │ Max    │ Blocked│
│ ... (show top 20 files)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Green Gate Checklist
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Acceptance Criteria                                       │
├─────────────────────────────────────────────────────────────┤
│ ⬜ Bucket D: Shared types package created                   │
│ ⬜ Bucket D: packages/types/src/events.ts errors fixed (9)  │
│ ⬜ Bucket A: All UI type errors fixed (26)                  │
│ ⬜ Bucket B: All audio type errors fixed (17)               │
│ ⬜ Bucket C: All data type errors fixed (11)                │
│ ⬜ npm run type-check passes (critical files only)          │
│ ⬜ Build succeeds: npm run build                            │
│ ⬜ Max 5 TypeScript warnings allowed                        │
│ ⬜ Zero new 'any' types added (≤3 exceptions with comments) │
│ ⬜ All instances report completion via event bus            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Sources

### Error Count (Auto-refresh every 30s)
```bash
# Run type-check and parse output
npm run type-check 2>&1 | grep "error TS" | wc -l
```

### Error Breakdown by File
```bash
npm run type-check 2>&1 | grep "error TS" | sed 's/(.*//' | sort | uniq -c | sort -rn
```

### Task Status
- Read from: `/_bus/state/deps.json`
- Watch for events: `/_bus/events/*/events.jsonl`
  - `tasks.started`
  - `tasks.progress` (custom event with error_count delta)
  - `tasks.completed`

---

## 📡 API Endpoints

### `GET /api/type-errors`
Returns current TypeScript error analysis
```json
{
  "success": true,
  "timestamp": "2025-10-02T22:40:30Z",
  "total_errors": 147,
  "critical_errors": 58,
  "non_critical_errors": 89,
  "fixed": 0,
  "progress_percent": 0,
  "by_bucket": {
    "A": { "errors": 26, "status": "blocked", "owner": "instance-1" },
    "B": { "errors": 17, "status": "blocked", "owner": "instance-2" },
    "C": { "errors": 11, "status": "blocked", "owner": "instance-3" },
    "D": { "errors": 10, "status": "ready", "owner": "instance-4" }
  },
  "by_file": [
    { "file": "src/widgets/_examples/EffectsPanel.example.tsx", "count": 79, "priority": "P2" },
    { "file": "packages/types/src/events.ts", "count": 9, "priority": "P0" }
  ],
  "green_gate": {
    "ready": false,
    "blockers": ["Bucket D not complete", "58 critical errors remaining"]
  }
}
```

### `POST /api/type-errors/snapshot`
Agent reports progress (called by instances when fixing errors)
```json
{
  "bucket": "D",
  "instance": "instance-4",
  "errors_fixed": 2,
  "errors_remaining": 8,
  "files_modified": ["packages/types/src/events.ts"],
  "commit_sha": "abc123..."
}
```

---

## 🎨 Visual Design

### Color Scheme
```css
--error-critical: #ef4444;    /* Red - blocking */
--error-warning: #f59e0b;     /* Orange - P2 */
--success: #22c55e;           /* Green - fixed */
--progress: #3b82f6;          /* Blue - in progress */
--blocked: #9ca3af;           /* Gray - blocked */

--bg-primary: #0a0a0a;
--surface-1: rgba(255, 255, 255, 0.05);
--border: rgba(255, 255, 255, 0.1);
```

### Typography
```css
--font-display: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xl: 24px;  /* Headers */
--text-lg: 18px;  /* Stat numbers */
--text-md: 14px;  /* Labels */
--text-sm: 12px;  /* Details */
```

---

## 🧪 Implementation Plan

### Phase 1: Static Dashboard (30 min)
1. Create `/app/type-errors-dashboard/page.tsx`
2. Hardcode current stats from analysis
3. Create 4 task status cards
4. Build error details table

### Phase 2: Live Data (1 hour)
1. Create `/app/api/type-errors/route.ts`
2. Parse `npm run type-check` output server-side
3. Add auto-refresh (30s interval)
4. Connect to deps.json for task status

### Phase 3: Burn-down Chart (30 min)
1. Add Recharts or Chart.js
2. Track error count over time
3. Store snapshots in JSON file
4. Plot critical vs non-critical trends

### Phase 4: Green Gate Logic (30 min)
1. Implement acceptance criteria checks
2. Auto-update checklist as tasks complete
3. Show "🎉 Green Gate Achieved!" banner when done

---

## 📈 Success Metrics

### Dashboard Effectiveness
- Agents check dashboard ≥3 times per day
- Error count decreases monotonically (no regressions)
- All agents report via `/api/type-errors/snapshot`

### Sprint Success
- Critical errors: 58 → 0 within 3 days
- Build green: `npm run type-check && npm run build`
- Max 5 warnings remaining
- Zero `any` types added (with rare exceptions)

---

## 🚀 Agent Integration

### How Instances Report Progress

**Before starting work:**
```bash
# Publish tasks.started event
echo '{"event":"tasks.started","task_id":"T-STABILITY-D-SHARED-TYPES","agent":"instance-4"}' \
  >> _bus/events/2025-10-02/events.jsonl
```

**After fixing errors:**
```bash
# Run type-check to get new count
npm run type-check 2>&1 > /tmp/typecheck.txt

# Report progress via API
curl -X POST http://localhost:3000/api/type-errors/snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "bucket": "D",
    "instance": "instance-4",
    "errors_fixed": 2,
    "errors_remaining": 8
  }'
```

**When task complete:**
```bash
# Publish tasks.completed event
echo '{"event":"tasks.completed","task_id":"T-STABILITY-D-SHARED-TYPES","agent":"instance-4"}' \
  >> _bus/events/2025-10-02/events.jsonl
```

---

## 🔍 Monitoring & Alerts

### Auto-alerts (Optional Future Enhancement)
- 🚨 Error count increases → Send alert to planning agent
- ⚠️ Task blocked >6 hours → Notify owner instance
- ✅ Bucket complete → Unblock dependent tasks
- 🎉 Green gate achieved → Notify all instances

### Manual Checks
- View dashboard: http://localhost:3000/type-errors-dashboard
- Check errors: `npm run type-check`
- Verify green: `npm run type-check && echo "✅ GREEN"`

---

**Implementation Priority:** P0 (build alongside stability sprint)

**Owner:** Alexis (Planner)

**Timeline:**
- Static dashboard: 30 min
- Live data: 1 hour
- Burn-down chart: 30 min
- Green gate logic: 30 min
- **Total: 2.5 hours**
