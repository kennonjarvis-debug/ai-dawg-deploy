# 🎨 Instance 1 - UI Redesign Phase 1 Handoff

**From:** Alexis (Planner)
**To:** Instance 1 (UI/Frontend Lead)
**Date:** 2025-10-03
**Status:** Ready to Start

---

## 🎯 Your Mission

Build the **Adaptive Workspace** foundation for DAWG AI - a modern, AI-first DAW with 4 context-aware modes (Record/Edit/Mix/Learn).

You're leading **Phase 1: Foundation** - the infrastructure that enables mode switching.

---

## 📋 Your Task Queue (Sequential Execution)

### Task 1: Mode Context & State Management ⚡ START HERE
**File:** `T-01JCKMF2Q9VXZN8K4P7M3R5W1T.yaml`
**Estimate:** 1 day
**Priority:** P1-Redesign

**What to Build:**
```typescript
// /src/contexts/ModeContext.tsx
type WorkspaceMode = 'record' | 'edit' | 'mix' | 'learn';

interface ModeContextValue {
  mode: WorkspaceMode;
  setMode: (mode: WorkspaceMode) => void;
}

// Create React Context
// Add localStorage persistence
// Export useModeContext hook
```

**Deliverables:**
- ✅ ModeContext created
- ✅ Mode persists in localStorage
- ✅ useModeContext() hook works
- ✅ TypeScript types defined

**Files to Create:**
- `/src/contexts/ModeContext.tsx`
- `/src/types/workspace.ts`

---

### Task 2: Responsive Grid System
**File:** `T-01JCKMF9X7PSQB4K2N8M6V1R9T.yaml`
**Estimate:** 1.5 days
**Depends on:** Task 1
**Priority:** P1-Redesign

**What to Build:**
```css
/* 12-column grid system */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 12px;
  height: 100vh;
  padding: 12px;
}

/* Mode-specific templates */
.record-mode {
  grid-template-areas:
    "header header header"
    "wave wave wave"
    "controls controls controls"
    "lyrics lyrics lyrics";
  grid-template-rows: 60px 1fr auto auto;
}
```

**Deliverables:**
- ✅ 12-column grid system
- ✅ Breakpoints: 768px, 1024px, 1440px
- ✅ GridContainer, GridArea, GridPanel components
- ✅ Mode-specific grid templates

**Files to Create:**
- `/src/layouts/GridSystem/GridContainer.tsx`
- `/src/layouts/GridSystem/GridSystem.module.css`
- `/src/layouts/GridSystem/index.ts`

---

### Task 3: Mode Switcher UI
**File:** `T-01JCKMFHK2ZMVX9P4N7R3W5T1Q.yaml`
**Estimate:** 1 day
**Depends on:** Task 1
**Priority:** P1-Redesign

**What to Build:**
```tsx
// Tab-style mode switcher
<ModeSwitcher
  currentMode={mode}
  onModeChange={setMode}
/>

// With keyboard shortcuts
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'r') setMode('record');
    if (e.key === 'e') setMode('edit');
    if (e.key === 'm') setMode('mix');
    if (e.key === 'l') setMode('learn');
  };
  window.addEventListener('keydown', handleKeyPress);
}, []);
```

**Deliverables:**
- ✅ Tab-style UI component
- ✅ Icons: Mic, Edit3, Sliders, BookOpen (Lucide)
- ✅ Keyboard shortcuts (R/E/M/L)
- ✅ Active state indicators
- ✅ <300ms transition animations

**Files to Create:**
- `/src/components/ModeSwitcher/ModeSwitcher.tsx`
- `/src/components/ModeSwitcher/ModeSwitcher.module.css`

---

### Task 4: Workspace Orchestrator
**File:** `T-01JCKMFP8QVWZR3N7K5M9X2T1P.yaml`
**Estimate:** 1.5 days
**Depends on:** Tasks 1, 2, 3
**Priority:** P1-Redesign

**What to Build:**
```tsx
// /app/workspace/page.tsx
export default function WorkspacePage() {
  const { mode } = useModeContext();

  return (
    <ModeProvider>
      <WorkspaceLayout>
        <ModeSwitcher />
        <GridContainer>
          {mode === 'record' && <RecordLayout />}
          {mode === 'edit' && <EditLayout />}
          {mode === 'mix' && <MixLayout />}
          {mode === 'learn' && <LearnLayout />}
        </GridContainer>
      </WorkspaceLayout>
    </ModeProvider>
  );
}
```

**Deliverables:**
- ✅ `/app/workspace` route working
- ✅ Mode switching renders correct layout
- ✅ URL param mode sync (?mode=record)
- ✅ Redirect from `/` to `/workspace`

**Files to Create:**
- `/app/workspace/page.tsx`
- `/app/workspace/layout.tsx`

**Files to Modify:**
- `/app/page.tsx` (add redirect to /workspace)

---

## 📚 Reference Materials

### Design Spec
📄 **Full Specification:** `/docs/design/UI_REDESIGN_SPEC.md`

**Key Sections:**
- Research findings (Ableton, Logic Pro, modern DAWs)
- Layout mockups for all 4 modes
- Design system (colors, typography)
- Widget mapping per mode
- Success metrics

### Task Files
📁 **All Task YAMLs:** `/tasks/T-01JCKMF*.yaml`

### Existing Code to Reference
- `/src/contexts/AudioContext.tsx` - Example of React Context pattern
- `/src/core/store.ts` - Zustand store (we're using Context instead)
- `/app/page.tsx` - Current DAW layout
- `/app/journey/page.tsx` - Journey layout patterns

---

## 🎨 Design System Quick Reference

### Colors
```css
--bg-primary: #0a0a0a;
--bg-secondary: #1a1a1a;
--surface-1: rgba(255, 255, 255, 0.05);
--surface-2: rgba(255, 255, 255, 0.08);

--accent-cyan: #00e5ff;
--accent-purple: #b066ff;
--accent-green: #00ff88;
--accent-pink: #ff66cc;
--accent-blue: #00d4ff;
```

### Typography
```css
--font-display: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

--text-xs: 11px;
--text-sm: 13px;
--text-md: 15px;
--text-lg: 18px;
```

### Spacing
```css
--gap-sm: 8px;
--gap-md: 12px;
--gap-lg: 20px;
```

---

## ✅ Acceptance Criteria Checklist

### Phase 1 Complete When:
- [ ] Mode context manages state globally
- [ ] Mode persists across page reloads
- [ ] 12-column grid system works
- [ ] Grid responsive at all breakpoints
- [ ] Mode switcher renders correctly
- [ ] Keyboard shortcuts work (R/E/M/L)
- [ ] /workspace route accessible
- [ ] Mode switching changes layout
- [ ] URL params sync with mode
- [ ] No TypeScript errors
- [ ] No layout shift/jank
- [ ] All 4 mode placeholders render

---

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test mode context
npm test -- ModeContext.test.tsx

# Test grid system
npm test -- GridContainer.test.tsx

# Test mode switcher
npm test -- ModeSwitcher.test.tsx
```

### Manual Testing
1. Start dev server: `npm run dev`
2. Navigate to `/workspace`
3. Click each mode tab → verify layout placeholder changes
4. Press R/E/M/L keys → verify mode changes
5. Refresh page → verify mode persists
6. Resize window → verify grid responsive

### E2E Testing
```typescript
// User flow to test
test('mode switching workflow', () => {
  visit('/workspace');
  expect(mode).toBe('record'); // default
  click('Edit mode tab');
  expect(mode).toBe('edit');
  expect(url).toContain('?mode=edit');
  refresh();
  expect(mode).toBe('edit'); // persisted
});
```

---

## 🚨 Potential Issues & Solutions

### Issue 1: Mode State Conflicts
**Problem:** Mode state conflicts with existing Zustand store
**Solution:** Keep ModeContext separate, don't integrate with store yet

### Issue 2: Layout Shift During Switch
**Problem:** Layout jumps when switching modes
**Solution:** Use CSS transitions, maintain viewport height

### Issue 3: localStorage Not Working
**Problem:** Mode doesn't persist across reloads
**Solution:** Check browser privacy settings, use fallback to sessionStorage

### Issue 4: Grid Breaks on Mobile
**Problem:** 12-column grid too complex for small screens
**Solution:** Use `grid-template-columns: 1fr` at <768px breakpoint

---

## 📈 Success Metrics

**Quantitative:**
- Mode switch time: <300ms ✅
- No layout shift (CLS = 0) ✅
- Grid renders: <100ms ✅
- TypeScript: 0 errors ✅

**Qualitative:**
- Code is clean and maintainable
- Context pattern is reusable
- Grid system is flexible for Phase 2

---

## 🔄 Workflow

### Daily Standup (Self-Report)
Publish progress via event bus:
```bash
# When starting task
{"event":"tasks.started","task_id":"T-01JCKMF2Q9...","agent":"instance-1"}

# When blocked
{"event":"tasks.blocked","task_id":"...","reason":"..."}

# When complete
{"event":"tasks.completed","task_id":"...","pr_url":"..."}
```

### Code Review Protocol
1. Create feature branch: `feature/ui-redesign-phase1`
2. Commit with prefix: `[UI-REDESIGN]`
3. Open PR with task reference
4. Self-review checklist:
   - [ ] TypeScript passes
   - [ ] No console errors
   - [ ] Responsive works
   - [ ] Tests pass

---

## 🎯 Expected Outcomes (Phase 1)

### By End of Week 1:
- ✅ Mode switching infrastructure complete
- ✅ Grid system working
- ✅ Mode switcher UI functional
- ✅ /workspace route live
- ✅ 4 mode placeholders render
- ✅ Foundation ready for Phase 2 layouts

### Next Phase Preview (Phase 2):
Once Phase 1 done, you'll build:
- Edit Mode Layout (Task 5, 2 days)
- Then Phase 2 continues with Instance 2 (Record, Mix)
- And Instance 3 (Learn mode)

---

## 📞 Support & Communication

### Questions?
- Review design spec: `/docs/design/UI_REDESIGN_SPEC.md`
- Check task YAML: `/tasks/T-01JCKMF*.yaml`
- Ask Alexis (me) via event bus or direct message

### Event Bus Topics to Subscribe:
- `tasks.assigned` - New tasks for you
- `tasks.blocked` - Someone needs help
- `conductor.plan.updated` - Priorities changed

### Event Bus Topics to Publish:
- `tasks.started` - You began a task
- `tasks.completed` - You finished a task
- `tasks.blocked` - You're stuck
- `code.diff.proposed` - You have a PR ready

---

## 🚀 Ready to Start?

### Step 1: Review Design Spec
```bash
cat /Users/benkennon/dawg-ai/docs/design/UI_REDESIGN_SPEC.md
```

### Step 2: Read First Task
```bash
cat /Users/benkennon/dawg-ai/tasks/T-01JCKMF2Q9VXZN8K4P7M3R5W1T.yaml
```

### Step 3: Create ModeContext
```bash
# Create the file and start coding!
mkdir -p /Users/benkennon/dawg-ai/src/contexts
touch /Users/benkennon/dawg-ai/src/contexts/ModeContext.tsx
```

### Step 4: Publish Start Event
```bash
# Let the team know you've started
echo '{"event":"tasks.started","task_id":"T-01JCKMF2Q9VXZN8K4P7M3R5W1T","agent":"instance-1"}' >> /_bus/events/$(date +%Y-%m-%d)/events.jsonl
```

---

## 🎉 Let's Build!

**Phase 1 transforms DAWG AI from a static layout to an adaptive, mode-aware workspace.**

This is the foundation for a modern, AI-first vocal production suite! 🎵

*Alexis standing by for support. Good luck, Instance 1!* 🤖

---

**Quick Links:**
- Design Spec: `/docs/design/UI_REDESIGN_SPEC.md`
- Task 1: `/tasks/T-01JCKMF2Q9VXZN8K4P7M3R5W1T.yaml`
- Event Bus: `/_bus/events/2025-10-03/events.jsonl`
- Summary: `/_bus/state/UI_REDESIGN_TASKS.md`
