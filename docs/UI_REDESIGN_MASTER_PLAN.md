# DAWG AI - UI/UX Redesign Master Plan
**Created:** 2025-10-02
**Owner:** Alexis (Instance-1 - Planner)
**Timeline:** 4 weeks (2 weeks to green gate)
**Status:** 🟡 IN PROGRESS

---

## 📋 Executive Summary

Complete UI/UX redesign addressing critical issues: zero mobile support, zero accessibility, three conflicting design systems, and 58 unorganized widgets.

**Progress:** Phase 1 ✅ | Phase 2 ✅ | Phases 3-9 ⏳

---

## Phase 3: Layout Architecture

### ✅ Already Implemented (Parallel Work)

- Header component created (`src/components/Header.tsx`)
- Sidebar component created (`src/components/Sidebar.tsx`)
- MainContent component created (`src/components/MainContent.tsx`)
- Lazy loading implemented (PitchMonitor, EffectsPanel)
- Responsive grid system (`components/ui/design-system/grid.css`)

### ⏳ Remaining Work

#### 3.1 Navigation System (Tom - 2 days)

**File:** `src/components/Navigation/Navigation.tsx`

```tsx
interface NavigationProps {
  currentPath: string;
}

export function Navigation({ currentPath }: NavigationProps) {
  const links = [
    { href: '/', label: 'DAW', icon: 'music' },
    { href: '/journey', label: 'Journey', icon: 'map' },
    { href: '/agent-dashboard', label: 'Agents', icon: 'users' },
    { href: '/tasks-dashboard', label: 'Tasks', icon: 'checklist' },
    { href: '/type-errors-dashboard', label: 'Errors', icon: 'alert' },
  ];

  return (
    <nav className="flex gap-2" aria-label="Main navigation">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          className={currentPath === link.href ? 'active' : ''}
          aria-current={currentPath === link.href ? 'page' : undefined}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
```

**Tasks:**
- [ ] Create Navigation component with icons
- [ ] Add to Header component
- [ ] Implement active state styling
- [ ] Add keyboard navigation (Arrow keys)
- [ ] Add mobile hamburger menu

#### 3.2 Breadcrumbs Component (Tom - 1 day)

**File:** `src/components/Breadcrumbs/Breadcrumbs.tsx`

```tsx
export function Breadcrumbs({ paths }: { paths: string[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex gap-2">
        {paths.map((path, i) => (
          <li key={i}>
            {i > 0 && <span>/</span>}
            <a href={path}>{path}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

#### 3.3 Responsive Layout Fixes (Max - 3 days)

**Main App Responsive:**

```tsx
// app/page.tsx - Bottom widget row
// OLD: Fixed 5-column grid
<div style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr' }}>

// NEW: Responsive grid
<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
```

**Tasks Dashboard Responsive:**

```tsx
// app/tasks-dashboard/page.tsx
// OLD: Fixed 5-column stats
<div style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>

// NEW: Responsive stats
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

// OLD: Fixed 4-column task board
<div style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>

// NEW: Responsive task board
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

**Deliverables:**
- [ ] Main app responsive (390px - 1920px)
- [ ] Tasks dashboard responsive
- [ ] Journey page responsive
- [ ] All dashboards tested on mobile/tablet/desktop

---

## Phase 4: Dashboard Consolidation

### Current Dashboards

| Dashboard | Purpose | Status | Action |
|-----------|---------|--------|--------|
| `/agent-dashboard` | Agent coordination | ✅ Keep | Refactor UI |
| `/tasks-dashboard` | Task tracking | ✅ Keep | Add responsive |
| `/type-errors-dashboard` | Type errors | ✅ Keep | Add responsive |
| `/journey` | Song creation | ✅ Keep | Refactor setup flow |
| `/dashboard` | Unknown | ❓ Audit | Merge or remove |
| `/voice-chat` | Voice chat | ✅ Keep | Move to modal |

### 4.1 Shared Components (Max - 2 days)

#### StatCard Component

**File:** `src/components/StatCard/StatCard.tsx`

```tsx
interface StatCardProps {
  label: string;
  value: string | number;
  color?: string;
  trend?: number;
  icon?: ReactNode;
}

export function StatCard({
  label,
  value,
  color = 'var(--accent-blue)',
  trend,
  icon
}: StatCardProps) {
  return (
    <div
      className="glass-panel p-4 rounded-xl"
      style={{ borderColor: `${color}30` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-tertiary uppercase tracking-wide">
          {label}
        </span>
        {icon}
      </div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
      {trend && (
        <div className={trend > 0 ? 'text-green' : 'text-red'} style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
```

#### DashboardLayout Component

**File:** `src/components/DashboardLayout/DashboardLayout.tsx`

```tsx
interface DashboardLayoutProps {
  title: string;
  description?: string;
  stats?: StatCardProps[];
  children: ReactNode;
}

export function DashboardLayout({
  title,
  description,
  stats,
  children
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-primary p-6">
      {/* Header */}
      <header className="mb-8 pb-6 border-b border-light">
        <h1 className="text-3xl font-bold text-gradient-blue-green mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-secondary">{description}</p>
        )}
      </header>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {stats.map((stat, i) => (
            <StatCard key={i} {...stat} />
          ))}
        </div>
      )}

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
```

### 4.2 Refactor Dashboards to Use Shared Components (Tom - 2 days)

**Tasks:**
- [ ] Refactor `/agent-dashboard` to use DashboardLayout + StatCard
- [ ] Refactor `/tasks-dashboard` to use StatCard
- [ ] Refactor `/type-errors-dashboard` to use StatCard
- [ ] Remove duplicate stat card implementations
- [ ] Verify all dashboards render correctly

---

## Phase 5: Widget System Modernization

### 5.1 Widget Categorization (Alexis + Team - 1 day)

**Categories:**

```
src/widgets/
├── audio/              # Alex (Audio Engine)
│   ├── PitchMonitor/
│   ├── EffectsPanel/
│   ├── VocalEffectsPanel/
│   ├── CompactEQControls/
│   ├── CompactVocalPresets/
│   └── WaveformDisplay/
│
├── journey/            # Tom (Implementation)
│   ├── JourneyDashboard/
│   ├── LiveCoachingPanel/
│   ├── LyricWorkspace/
│   ├── VocalAssessment/
│   ├── SongStructureBuilder/
│   ├── GoalSettingWizard/
│   └── StylePreferencesQuiz/
│
├── project/            # Max (UI Lead)
│   ├── ProjectSelector/
│   ├── ProjectStats/
│   ├── FileUpload/
│   ├── TrackList/
│   └── TransportControls/
│
├── user/               # Karen (Data)
│   ├── AuthHeader/
│   ├── UserProfileCard/
│   ├── UserSettingsModal/
│   └── PrivacyControls/
│
├── ai/                 # Jerry (Infrastructure)
│   ├── ChatPanel/
│   ├── MusicGenerator/
│   ├── HarmonyGenerator/
│   └── VoiceInterface/
│
└── shared/             # Team
    ├── QuickActions/
    ├── AgentStatusBoard/
    └── MetricsDashboard/
```

**Tasks:**
- [ ] Create category directories
- [ ] Move widgets to categories
- [ ] Update imports across codebase
- [ ] Verify all widgets still work

### 5.2 Widget Lazy Loading (Tom - 2 days)

**Pattern:**

```tsx
// app/page.tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy audio widgets
const PitchMonitor = lazy(() => import('@/src/widgets/audio/PitchMonitor'));
const EffectsPanel = lazy(() => import('@/src/widgets/audio/EffectsPanel'));
const MusicGenerator = lazy(() => import('@/src/widgets/ai/MusicGenerator'));

// In render:
<Suspense fallback={<WidgetSkeleton />}>
  <PitchMonitor />
</Suspense>
```

**Widgets to Lazy Load:**
- [x] PitchMonitor (done)
- [x] EffectsPanel (done)
- [ ] MusicGenerator
- [ ] HarmonyGenerator
- [ ] LiveCoachingPanel
- [ ] VocalAssessment
- [ ] SongStructureBuilder

### 5.3 Widget Naming Convention (Alexis - 1 day)

**Standardize naming:**

| Old Name | New Name | Reason |
|----------|----------|--------|
| `CompactEQControls` | `EQControlsCompact` | Consistent suffix |
| `CompactVocalPresets` | `VocalPresetsCompact` | Consistent suffix |
| `CompactPitchMonitor` | `PitchMonitorCompact` | Consistent suffix |
| `CompactMusicGen` | `MusicGeneratorCompact` | Full word, consistent |

**Tasks:**
- [ ] Rename widget directories
- [ ] Update all imports
- [ ] Update documentation
- [ ] Verify builds

---

## Phase 6: Dependency Graph & Critical Path

### 6.1 Dependency Graph

```
Design System (tokens, utils, grid)
    ↓
Shared Components (StatCard, DashboardLayout, Navigation)
    ↓
    ├── Dashboards (agent, tasks, type-errors)
    ├── Main App (Header, Sidebar, MainContent)
    └── Journey Page
            ↓
        Widget System (audio, journey, project, user, ai, shared)
```

### 6.2 Critical Path

**Week 1 (Foundation):**
1. Day 1: ~~Design system tokens~~ ✅
2. Day 2: ~~Design system utils + grid~~ ✅
3. Day 3: Shared components (StatCard, DashboardLayout)
4. Day 4-5: Responsive layout fixes (main app, dashboards)

**Week 2 (Mobile + Accessibility):**
1. Day 1-2: Navigation system + breadcrumbs
2. Day 3-4: Mobile testing + fixes
3. Day 5: Accessibility audit (ARIA labels, focus states)

**Week 3 (Widgets + Dashboards):**
1. Day 1: Widget categorization
2. Day 2-3: Dashboard consolidation
3. Day 4-5: Widget lazy loading

**Week 4 (Polish + Testing):**
1. Day 1-2: Widget naming convention + cleanup
2. Day 3: Performance profiling
3. Day 4: E2E testing
4. Day 5: Final polish + documentation

### 6.3 Blockers & Dependencies

**Blockers:**
- ❌ None currently (design system complete)

**Dependencies:**
- Shared components → Dashboard refactoring
- Widget categorization → Lazy loading
- Navigation system → Breadcrumbs

**Parallel Work:**
- Max: Shared components + responsive fixes
- Tom: Navigation + lazy loading
- Jerry: Performance profiling
- Karen: Data layer updates
- Alex: Audio widget optimization

---

## Phase 7: Task YAML Generation

### 7.1 Max (UI Lead) - `/tasks/max-ui-lead.yaml`

```yaml
name: Max - UI Lead
role: UI/Frontend Lead
sprint: Week 1-2 (Foundation + Mobile)
owner: Instance assigned to Max role

tasks:
  # Week 1: Shared Components
  - id: MAX-001
    title: Create StatCard shared component
    priority: P0-Critical
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Build reusable StatCard component with:
      - Color variants (blue, purple, green, red)
      - Trend indicators (up/down)
      - Icon support
      - Responsive sizing
    acceptance:
      - Component in src/components/StatCard/
      - Used in all 3 dashboards
      - Storybook story created

  - id: MAX-002
    title: Create DashboardLayout shared component
    priority: P0-Critical
    estimate: 4 hours
    status: ready
    dependencies: [MAX-001]
    description: |
      Build dashboard layout template with:
      - Header section (title, description)
      - Stats grid (responsive)
      - Main content area
      - Consistent spacing
    acceptance:
      - Component in src/components/DashboardLayout/
      - Used in at least 2 dashboards

  - id: MAX-003
    title: Make main app responsive (390px - 1920px)
    priority: P0-Critical
    estimate: 8 hours
    status: ready
    dependencies: []
    description: |
      Fix app/page.tsx responsive issues:
      - Bottom widget row: 2 cols (mobile) → 5 cols (desktop)
      - Sidebar: hidden by default on mobile
      - Transport bar: stack vertically on mobile
      - Test on: iPhone SE, iPad, laptop, 4K
    acceptance:
      - All breakpoints working
      - No horizontal scroll on mobile
      - No cut-off content

  # Week 2: Dashboard Refactoring
  - id: MAX-004
    title: Refactor tasks-dashboard to use shared components
    priority: P1-High
    estimate: 3 hours
    status: ready
    dependencies: [MAX-001, MAX-002]
    description: |
      Replace custom implementations with:
      - StatCard for all 5 stats
      - DashboardLayout for page structure
      - Responsive grid classes
    acceptance:
      - No custom stat card code
      - Fully responsive
      - Visual parity with original

  - id: MAX-005
    title: Refactor agent-dashboard to use shared components
    priority: P1-High
    estimate: 3 hours
    status: ready
    dependencies: [MAX-001, MAX-002]

  - id: MAX-006
    title: Add accessibility attributes (ARIA, semantic HTML)
    priority: P1-High
    estimate: 6 hours
    status: ready
    dependencies: []
    description: |
      Accessibility improvements:
      - Add aria-label to all buttons
      - Add aria-expanded to toggles
      - Use semantic HTML (<nav>, <main>, <aside>)
      - Add skip-to-content link
      - Test with screen reader
    acceptance:
      - WCAG 2.1 Level AA compliance
      - Lighthouse accessibility score > 90
```

### 7.2 Tom (Implementation) - `/tasks/tom-implementation.yaml`

```yaml
name: Tom - Implementation Support
role: Implementation + Refactoring
sprint: Week 1-3 (Foundation + Widgets)
owner: Instance-2

tasks:
  # Week 1: Navigation
  - id: TOM-001
    title: Create Navigation component
    priority: P1-High
    estimate: 6 hours
    status: ready
    dependencies: []
    description: |
      Build main navigation with:
      - Links to all pages (DAW, Journey, Dashboards)
      - Active state styling
      - Keyboard navigation (Tab, Arrow keys)
      - Mobile hamburger menu
      - Smooth transitions
    acceptance:
      - Component in src/components/Navigation/
      - Works on all pages
      - Keyboard accessible

  - id: TOM-002
    title: Create Breadcrumbs component
    priority: P2-Medium
    estimate: 2 hours
    status: ready
    dependencies: []
    description: |
      Build breadcrumb navigation:
      - Shows current path
      - Clickable ancestors
      - Auto-generates from route
    acceptance:
      - Component in src/components/Breadcrumbs/
      - Used in dashboards + journey

  # Week 2: Lazy Loading
  - id: TOM-003
    title: Implement widget lazy loading
    priority: P1-High
    estimate: 8 hours
    status: ready
    dependencies: []
    description: |
      Add lazy loading to heavy widgets:
      - MusicGenerator (AI model heavy)
      - HarmonyGenerator
      - LiveCoachingPanel
      - VocalAssessment
      - SongStructureBuilder
      Create loading skeletons for each
    acceptance:
      - Bundle size reduced by 30%+
      - Initial load < 3s
      - Smooth skeleton transitions

  # Week 3: Dashboard Consolidation
  - id: TOM-004
    title: Audit and consolidate /dashboard page
    priority: P1-High
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Determine purpose of /dashboard page:
      - If duplicate → merge with /agent-dashboard
      - If unique → refactor to DashboardLayout
      - If unused → remove
    acceptance:
      - Decision documented
      - Action completed (merge, refactor, or remove)

  - id: TOM-005
    title: Move voice-chat to modal
    priority: P2-Medium
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Convert /voice-chat page to modal:
      - Accessible from main app header
      - Uses modal component
      - Keyboard accessible (Esc to close)
    acceptance:
      - Modal in main app
      - /voice-chat route removed
```

### 7.3 Jerry (Infrastructure) - `/tasks/jerry-infrastructure.yaml`

```yaml
name: Jerry - Infrastructure Lead
role: Infrastructure + Performance
sprint: Week 1-4 (Continuous)
owner: Instance-3

tasks:
  # Week 1: Design System (COMPLETE)
  - id: JERRY-001
    title: Design system consolidation
    priority: P0-Critical
    estimate: 8 hours
    status: completed
    description: Created tokens.css, utils.css, grid.css

  # Week 2: Performance
  - id: JERRY-002
    title: Font optimization
    priority: P1-High
    estimate: 3 hours
    status: ready
    dependencies: []
    description: |
      Optimize font loading:
      - Self-host Inter + JetBrains Mono
      - Add font-display: swap
      - Preload font files
      - Remove unused weights (keep 400, 500, 600, 700)
    acceptance:
      - Fonts in /public/fonts/
      - @font-face in globals.css
      - Lighthouse performance score > 90

  - id: JERRY-003
    title: Bundle size optimization
    priority: P1-High
    estimate: 4 hours
    status: ready
    dependencies: [TOM-003]
    description: |
      Analyze and reduce bundle:
      - Run webpack-bundle-analyzer
      - Code split heavy dependencies
      - Tree-shake unused code
      - Optimize images
    acceptance:
      - Main bundle < 300KB
      - Route chunks < 100KB
      - Report in docs/BUNDLE_ANALYSIS.md

  - id: JERRY-004
    title: Performance profiling
    priority: P2-Medium
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Profile and optimize:
      - React DevTools Profiler
      - Chrome Performance tab
      - Identify heavy renders
      - Optimize with useMemo, useCallback
    acceptance:
      - Render time < 16ms (60fps)
      - No unnecessary re-renders
      - Report in docs/PERFORMANCE.md

  # Week 4: CI/CD
  - id: JERRY-005
    title: Add Lighthouse CI to GitHub Actions
    priority: P2-Medium
    estimate: 3 hours
    status: ready
    dependencies: []
    description: |
      Add automated quality gates:
      - Lighthouse CI in .github/workflows/ci.yml
      - Fail if performance < 90
      - Fail if accessibility < 90
      - Comment on PRs with scores
    acceptance:
      - CI fails on regressions
      - Reports visible in PRs
```

### 7.4 Karen (Data) - `/tasks/karen-data.yaml`

```yaml
name: Karen - Data Layer Lead
role: Data Models + State Management
sprint: Week 2-3 (Data + Preferences)
owner: Instance-4

tasks:
  - id: KAREN-001
    title: User preferences data model
    priority: P1-High
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Create user preferences system:
      - Theme preference (light/dark/auto)
      - Layout preference (sidebar collapsed)
      - Accessibility preferences (reduce motion, high contrast)
      - Save to localStorage
    acceptance:
      - Schema in lib/types/preferences.ts
      - Hook: usePreferences()
      - Persisted across sessions

  - id: KAREN-002
    title: Analytics event tracking
    priority: P2-Medium
    estimate: 6 hours
    status: ready
    dependencies: []
    description: |
      Track UI/UX metrics:
      - Page views
      - Widget interactions
      - Error rates
      - Performance metrics (LCP, FID, CLS)
    acceptance:
      - Events in lib/analytics/
      - Privacy compliant (no PII)
      - Dashboard in /metrics-dashboard

  - id: KAREN-003
    title: Dashboard state management
    priority: P1-High
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Centralize dashboard state:
      - Zustand store for dashboard filters
      - Query params for shareable state
      - Persist view preferences
    acceptance:
      - Store in lib/stores/dashboard.ts
      - URL shareable (e.g., /tasks?status=in_progress)
```

### 7.5 Alex (Audio) - `/tasks/alex-audio-widgets.yaml`

```yaml
name: Alex - Audio Widget Lead
role: Audio Visualizations + Real-time Processing
sprint: Week 2-4 (Widget Optimization)
owner: Instance assigned to Alex role

tasks:
  - id: ALEX-001
    title: Optimize WaveformDisplay performance
    priority: P1-High
    estimate: 6 hours
    status: ready
    dependencies: []
    description: |
      Performance optimizations:
      - Use OffscreenCanvas for rendering
      - Throttle redraws (60fps max)
      - Lazy render off-screen portions
      - Use WebGL for large waveforms
    acceptance:
      - 60fps on 10+ tracks
      - < 100ms initial render
      - No janky scrolling

  - id: ALEX-002
    title: PitchMonitor real-time optimization
    priority: P1-High
    estimate: 6 hours
    status: ready
    dependencies: []
    description: |
      Reduce latency:
      - Move pitch detection to Web Worker
      - Use AudioWorklet (not ScriptProcessor)
      - Buffer management optimization
      - Reduce GC pauses
    acceptance:
      - < 20ms latency (pitch detection to display)
      - No audio glitches
      - Stable 60fps visualization

  - id: ALEX-003
    title: Canvas-based visual feedback system
    priority: P2-Medium
    estimate: 8 hours
    status: ready
    dependencies: []
    description: |
      Build reusable canvas widgets:
      - Meter (VU, peak, RMS)
      - Spectrum analyzer
      - Pitch graph
      - All 60fps, shared rendering loop
    acceptance:
      - Components in src/widgets/audio/canvas/
      - < 5% CPU on idle
      - Reusable across audio widgets
```

### 7.6 Alexis (Planner) - `/tasks/alexis-coordination.yaml`

```yaml
name: Alexis - Planning & Coordination
role: Master Planning + Coordination
sprint: Week 1-4 (Continuous)
owner: Instance-1

tasks:
  - id: ALEXIS-001
    title: UI/UX audit
    priority: P0-Critical
    estimate: 8 hours
    status: completed
    description: Created docs/UI_UX_AUDIT.md

  - id: ALEXIS-002
    title: Design system documentation
    priority: P0-Critical
    estimate: 4 hours
    status: completed
    description: Created docs/DESIGN_SYSTEM.md

  - id: ALEXIS-003
    title: Master redesign plan
    priority: P0-Critical
    estimate: 4 hours
    status: in_progress
    description: Created docs/UI_REDESIGN_MASTER_PLAN.md

  - id: ALEXIS-004
    title: Widget categorization + naming audit
    priority: P1-High
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Audit all 58 widgets:
      - Assign to categories (audio, journey, project, user, ai, shared)
      - Rename for consistency (suffix pattern)
      - Document ownership
      - Create migration guide
    acceptance:
      - Categorization matrix in docs/
      - Renaming guide documented
      - Team assignments clear

  - id: ALEXIS-005
    title: Sprint planning + checkpoints
    priority: P1-High
    estimate: 4 hours
    status: ready
    dependencies: []
    description: |
      Create sprint structure:
      - Week 1 checkpoint: Design system + shared components
      - Week 2 checkpoint: Mobile responsive + navigation
      - Week 3 checkpoint: Dashboards + widgets
      - Week 4 checkpoint: Performance + polish
      - Green gate criteria for each
    acceptance:
      - Sprint board in /tasks-dashboard
      - Daily standups scheduled
      - Blocker resolution process

  - id: ALEXIS-006
    title: Progress tracking + reporting
    priority: P2-Medium
    estimate: 2 hours/week
    status: in_progress
    description: |
      Weekly progress reports:
      - Completed tasks
      - Blockers
      - Metrics (bundle size, type errors, test coverage)
      - Screenshots of UI improvements
    acceptance:
      - Weekly report in _bus/events/
      - Dashboard shows real-time progress
```

---

## Phase 8: Sprint Goals & Green Gates

### Week 1: Foundation ✅ (Green Gate #1)

**Goals:**
- ✅ Design system consolidated (3 → 1)
- ⏳ Shared components created (StatCard, DashboardLayout)
- ⏳ Main app responsive

**Green Gate Criteria:**
- [x] Design system documented
- [ ] StatCard component working in 3+ places
- [ ] Main app works on mobile (390px)
- [ ] No TypeScript errors in foundation
- [ ] Build passing

**Exit Criteria:** Can build responsive features on solid foundation

---

### Week 2: Mobile + Accessibility (Green Gate #2)

**Goals:**
- Navigation system complete
- All dashboards responsive
- Accessibility Level AA

**Green Gate Criteria:**
- [ ] All pages work 390px - 1920px
- [ ] Navigation accessible (keyboard + screen reader)
- [ ] Lighthouse accessibility > 90
- [ ] No horizontal scroll on any page
- [ ] Touch targets ≥ 44px

**Exit Criteria:** App usable on mobile devices with assistive technology

---

### Week 3: Dashboards + Widgets (Green Gate #3)

**Goals:**
- Dashboards consolidated
- Widgets categorized + lazy loaded
- Performance optimized

**Green Gate Criteria:**
- [ ] Dashboard duplication removed
- [ ] Widget lazy loading working
- [ ] Bundle size < 300KB (main)
- [ ] 60fps on 10+ tracks
- [ ] Lighthouse performance > 90

**Exit Criteria:** Production-ready performance

---

### Week 4: Polish + Ship (Final Green Gate)

**Goals:**
- E2E tests passing
- Documentation complete
- Zero critical bugs

**Green Gate Criteria:**
- [ ] All P0 and P1 tasks complete
- [ ] E2E tests passing
- [ ] Type errors ≤ 100
- [ ] No console errors
- [ ] User acceptance testing passed

**Exit Criteria:** Ready to ship to users

---

## Phase 9: Success Metrics

### Performance Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Initial bundle size | ~800KB | <300KB | webpack-bundle-analyzer |
| Time to Interactive (TTI) | ~5s | <3s | Lighthouse |
| First Contentful Paint (FCP) | ~2s | <1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | ~4s | <2.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | 0.3 | <0.1 | Lighthouse |
| Frame rate (10 tracks) | 30fps | 60fps | Chrome DevTools |

### Accessibility Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Lighthouse accessibility | 45 | >90 | Lighthouse |
| ARIA landmarks | 0 | All pages | Manual audit |
| Focus indicators | 20% | 100% | Manual audit |
| Keyboard navigation | Broken | Full support | Manual audit |
| Screen reader compat | None | NVDA + VoiceOver | Manual testing |

### UX Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Mobile usability | 0% | 100% | Manual testing (390px-768px) |
| Tablet usability | 50% | 100% | Manual testing (768px-1024px) |
| Desktop usability | 90% | 100% | Manual testing (1024px+) |
| Navigation clarity | Poor | Excellent | User testing |
| Dashboard consistency | 0% | 100% | Visual audit |

### Code Quality Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| TypeScript errors | 218 | <100 | npm run type-check |
| Test coverage | 15% | >70% | npm run test:coverage |
| Component reuse | 20% | >60% | Code analysis |
| Design token usage | 40% | >90% | Grep analysis |
| Bundle duplication | High | <5% | webpack-bundle-analyzer |

### Tracking & Reporting

**Daily:**
- TypeScript error count
- Build status
- Blocked tasks

**Weekly:**
- Lighthouse scores
- Bundle size
- Completed tasks vs planned
- Screenshots of progress

**Sprint End:**
- All metrics dashboard
- User feedback summary
- Retrospective
- Next sprint planning

---

## Implementation Timeline

### Week 1: Foundation (Oct 2-9)

| Day | Focus | Owner | Deliverables |
|-----|-------|-------|--------------|
| Mon | ~~Design system~~ ✅ | ~~Jerry~~ | ~~tokens.css, utils.css, grid.css~~ |
| Tue | Shared components | Max | StatCard, DashboardLayout |
| Wed | Navigation system | Tom | Navigation, Breadcrumbs |
| Thu | Main app responsive | Max | app/page.tsx responsive |
| Fri | Dashboard responsive | Max | tasks/agent/type-errors responsive |

**Checkpoint:** Green Gate #1 - Foundation complete

---

### Week 2: Mobile + Accessibility (Oct 9-16)

| Day | Focus | Owner | Deliverables |
|-----|-------|-------|--------------|
| Mon | Mobile testing | Max | All pages 390px tested |
| Tue | Accessibility | Max | ARIA labels, semantic HTML |
| Wed | Dashboard refactor | Tom | Use shared components |
| Thu | Journey responsive | Tom | Journey page mobile |
| Fri | Testing + fixes | Team | Green Gate #2 verification |

**Checkpoint:** Green Gate #2 - Mobile ready

---

### Week 3: Dashboards + Widgets (Oct 16-23)

| Day | Focus | Owner | Deliverables |
|-----|-------|-------|--------------|
| Mon | Widget categorization | Alexis | Categories + moves |
| Tue | Lazy loading | Tom | 5 widgets lazy loaded |
| Wed | Performance profiling | Jerry + Alex | Optimization targets |
| Thu | Audio optimization | Alex | Waveform, PitchMonitor |
| Fri | Dashboard consolidation | Tom | /dashboard merged/removed |

**Checkpoint:** Green Gate #3 - Performance ready

---

### Week 4: Polish + Ship (Oct 23-30)

| Day | Focus | Owner | Deliverables |
|-----|-------|-------|--------------|
| Mon | Widget naming | Alexis | Standardized names |
| Tue | Font optimization | Jerry | Self-hosted fonts |
| Wed | E2E testing | Tom | Playwright tests |
| Thu | Bug fixes | Team | Zero critical bugs |
| Fri | Documentation + ship | Alexis | Final docs, release |

**Checkpoint:** Final Green Gate - Ship ready ✅

---

## Risk Mitigation

### High Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes in refactor | High | Medium | Feature flags, rollback plan |
| Performance regressions | High | Low | Continuous profiling, budgets |
| Accessibility gaps | Medium | Medium | Weekly audits, screen reader testing |
| Timeline slippage | Medium | Medium | Daily standups, blocker escalation |

### Dependencies

**External:**
- shadcn/ui library updates
- Next.js 15 compatibility
- Browser API support

**Internal:**
- TypeScript error fixes (from stability sprint)
- Test infrastructure
- Event bus coordination

---

## Communication Plan

### Daily Standups (Async via Event Bus)

**Format:**
```json
{
  "event": "daily.standup",
  "producer": "instance-1-alexis",
  "payload": {
    "completed": ["ALEXIS-001", "ALEXIS-002"],
    "in_progress": ["ALEXIS-003"],
    "blockers": [],
    "help_needed": null
  }
}
```

### Weekly Reviews

**Friday EOD:**
- Progress report published to `_bus/events/YYYY-MM-DD/weekly-report.md`
- Metrics dashboard updated
- Screenshots shared
- Retrospective notes

### Green Gate Reviews

**At each checkpoint:**
- Criteria verification
- Demo of functionality
- Go/No-go decision
- Blocker resolution

---

## Rollback Plan

If critical issues arise:

1. **Feature flags** - disable new UI, fallback to old
2. **Git revert** - revert to last stable commit
3. **Incremental rollout** - ship to 10% → 50% → 100%
4. **Emergency fixes** - hotfix branch, fast-track review

---

## Success Criteria (Final)

**Ship when:**
- ✅ All P0 and P1 tasks complete
- ✅ Green Gates #1-4 passed
- ✅ Lighthouse scores: Performance >90, Accessibility >90
- ✅ Mobile usability 100% (390px-1920px)
- ✅ TypeScript errors <100
- ✅ E2E tests passing
- ✅ User acceptance testing passed
- ✅ Documentation complete

---

## Appendix

### Related Documents

- [UI/UX Audit](./UI_UX_AUDIT.md) - Detailed findings
- [Design System](./DESIGN_SYSTEM.md) - Design tokens & patterns
- [Verification Results](../_bus/state/VERIFICATION_RESULTS.md) - Current state

### Tools

- **Design:** Figma
- **Testing:** Playwright, Vitest
- **Performance:** Lighthouse, webpack-bundle-analyzer
- **Accessibility:** axe DevTools, NVDA, VoiceOver
- **Tracking:** Tasks Dashboard (`/tasks-dashboard`)

---

*Master Plan maintained by Alexis (Instance-1)*
*Last Updated: 2025-10-02 23:45*
*Status: Phase 1 ✅ | Phase 2 ✅ | Phase 3-9 ⏳*
