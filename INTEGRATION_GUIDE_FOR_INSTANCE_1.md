# Integration Guide for Instance 1 - Dashboard Assembly

## Overview
This guide shows how to integrate all widgets from Instances 2, 3, and 4 into the main dashboard.

**Status:**
- ✅ Instance 2: 2 compact widgets ready (CompactPitchMonitor, CompactEQControls)
- ✅ Instance 3: 2 compact widgets ready (CompactMusicGen, CompactVoiceProfile)
- ✅ Instance 4: 2 compact widgets + 8 full widgets + integration helpers ready

---

## Step 1: Use Pre-Built Components

I've created two ready-to-use components that combine all widgets:

### 1. DashboardHeader
**Location:** `/src/components/DashboardHeader.tsx`

Combines: AuthHeader + ProjectSelector + SaveStatusBadge

```tsx
import { DashboardHeader } from '@/src/components/DashboardHeader';

<DashboardHeader
  currentProjectId={projectId}
  currentProjectName={projectName}
  onProjectChange={(id) => setProjectId(id)}
  saveStatus={saveStatus}
  lastSaved={lastSaved}
  saveError={saveError}
  onManualSave={handleSave}
  onSettingsClick={() => openModal('userSettings')}
/>
```

### 2. DashboardCompactBar
**Location:** `/src/components/DashboardCompactBar.tsx`

Combines: ProjectStats + QuickActions + placeholders for audio/AI widgets

```tsx
import { DashboardCompactBar } from '@/src/components/DashboardCompactBar';

<DashboardCompactBar
  projectName={projectName}
  trackCount={tracks.length}
  totalDuration={maxDuration}
  bpm={bpm}
  lastSaved={lastSaved}
  onSave={handleSave}
  onExport={handleExport}
  onShare={handleShare}
  isSaving={saving}
  canExport={tracks.some(t => t.recordings?.length > 0)}
  showAudioWidgets={true} // Set to true when adding Instance 2/3 widgets
/>
```

---

## Step 2: Use Integration Helpers

**Location:** `/src/utils/widgetIntegration.ts`

### Available Hooks:

```tsx
import {
  useProjectState,
  useProjectStats,
  useAudioDevicePreferences,
  useUserPreferences,
  useModalManager,
  useSaveStatus,
  exportProjectToWAV,
  shareProject,
} from '@/src/utils/widgetIntegration';

// Load project data
const { project, loading, error } = useProjectState(projectId);

// Get aggregated stats
const { trackCount, totalDuration, hasRecordings } = useProjectStats(tracks);

// Get audio preferences
const audioPrefs = useAudioDevicePreferences();

// Get user preferences
const userPrefs = useUserPreferences();

// Manage modals
const { openModal, closeModal, isOpen } = useModalManager();

// Manage save status
const {
  status,
  lastSaved,
  error: saveError,
  markSaving,
  markSaved,
  markError,
  markUnsaved,
} = useSaveStatus();

// Export functionality
const handleExport = async () => {
  await exportProjectToWAV(tracks, audioContext);
};

// Share functionality
const handleShare = async () => {
  await shareProject(projectId);
};
```

---

## Step 3: Complete Dashboard Layout Example

Here's a complete `page.tsx` structure:

```tsx
'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/src/components/DashboardHeader';
import { DashboardCompactBar } from '@/src/components/DashboardCompactBar';
import { TrackList } from '@/src/widgets/TrackList/TrackList';
import { WaveformDisplay } from '@/src/widgets/WaveformDisplay/WaveformDisplay';
import { ChatPanel } from '@/src/widgets/ChatPanel/ChatPanel';
import { TransportControls } from '@/src/widgets/TransportControls/TransportControls';
import { UserSettingsModal } from '@/src/widgets/UserSettingsModal/UserSettingsModal';
import { ProjectSettingsModal } from '@/src/widgets/ProjectSettingsModal/ProjectSettingsModal';
import { NewProjectDialog } from '@/src/widgets/NewProjectDialog/NewProjectDialog';
import {
  useProjectState,
  useProjectStats,
  useModalManager,
  useSaveStatus,
  exportProjectToWAV,
  shareProject,
} from '@/src/utils/widgetIntegration';
import { useTrackStore } from '@/src/core/store';

export default function DawPage() {
  const [projectId, setProjectId] = useState<string>('');
  const [projectName, setProjectName] = useState('Untitled Project');
  const [bpm, setBpm] = useState(120);

  const tracks = useTrackStore((state) => state.tracks);
  const { trackCount, totalDuration, hasRecordings } = useProjectStats(tracks);

  const { openModal, closeModal, isOpen } = useModalManager();
  const {
    status: saveStatus,
    lastSaved,
    error: saveError,
    markSaving,
    markSaved,
    markError,
  } = useSaveStatus();

  const handleSave = async () => {
    try {
      markSaving();
      // Your save logic here
      await fetch('/api/projects/save', {
        method: 'POST',
        body: JSON.stringify({ projectId, project: { name: projectName, bpm }, tracks }),
      });
      markSaved();
    } catch (err: any) {
      markError(err.message);
    }
  };

  const handleExport = async () => {
    const audioContext = new AudioContext();
    await exportProjectToWAV(tracks, audioContext);
  };

  const handleShare = async () => {
    await shareProject(projectId);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <DashboardHeader
        currentProjectId={projectId}
        currentProjectName={projectName}
        onProjectChange={setProjectId}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        saveError={saveError}
        onManualSave={handleSave}
        onSettingsClick={() => openModal('userSettings')}
      />

      {/* Main Content - 2x2 Grid */}
      <div className="main-grid">
        <div className="tracks-section">
          <TrackList />
        </div>

        <div className="waveform-section">
          <WaveformDisplay />
        </div>

        <div className="transport-section">
          <TransportControls bpm={bpm} onBpmChange={setBpm} />
        </div>

        <div className="chat-section">
          <ChatPanel />
        </div>
      </div>

      {/* Compact Bottom Bar */}
      <DashboardCompactBar
        projectName={projectName}
        trackCount={trackCount}
        totalDuration={totalDuration}
        bpm={bpm}
        lastSaved={lastSaved}
        onSave={handleSave}
        onExport={handleExport}
        onShare={handleShare}
        isSaving={saveStatus === 'saving'}
        canExport={hasRecordings}
        showAudioWidgets={true}
      />

      {/* Modals */}
      <UserSettingsModal
        isOpen={isOpen('userSettings')}
        onClose={() => closeModal('userSettings')}
      />

      <ProjectSettingsModal
        isOpen={isOpen('projectSettings')}
        onClose={() => closeModal('projectSettings')}
        projectId={projectId}
        onSave={(updated) => {
          setProjectName(updated.name);
          setBpm(updated.bpm);
          closeModal('projectSettings');
        }}
      />

      <NewProjectDialog
        isOpen={isOpen('newProject')}
        onClose={() => closeModal('newProject')}
        onCreate={(newProject) => {
          setProjectName(newProject.name);
          setBpm(newProject.bpm);
          closeModal('newProject');
        }}
      />
    </div>
  );
}
```

---

## Step 4: Add Compact Widgets from Instance 2 & 3

Update `DashboardCompactBar.tsx` to include audio and AI widgets:

```tsx
import { CompactPitchMonitor } from '@/src/widgets/CompactPitchMonitor/CompactPitchMonitor';
import { CompactEQControls } from '@/src/widgets/CompactEQControls/CompactEQControls';
import { CompactMusicGen } from '@/src/widgets/CompactMusicGen/CompactMusicGen';
import { CompactVoiceProfile } from '@/src/widgets/CompactVoiceProfile/CompactVoiceProfile';

// Replace placeholders with:
<CompactPitchMonitor
  currentPitch={currentPitch}
  isRecording={isRecording}
/>

<CompactEQControls
  trackId={activeTrackId}
  audioContext={audioContext}
/>

<CompactMusicGen
  onGenerate={(audio) => addTrack(audio)}
/>

<CompactVoiceProfile
  onProfileSelect={(profileId) => setActiveProfile(profileId)}
/>
```

---

## Step 5: CSS for Dashboard Grid

Add to `page.module.css` or `globals.css`:

```css
.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.main-grid {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  grid-template-rows: 1fr auto;
  flex: 1;
  gap: 0;
  overflow: hidden;
}

.tracks-section {
  grid-column: 1;
  grid-row: 1 / 3;
  overflow-y: auto;
  border-right: 1px solid var(--border, #444);
}

.waveform-section {
  grid-column: 2;
  grid-row: 1;
  overflow: hidden;
}

.transport-section {
  grid-column: 2;
  grid-row: 2;
  border-top: 1px solid var(--border, #444);
}

.chat-section {
  grid-column: 3;
  grid-row: 1 / 3;
  overflow: hidden;
  border-left: 1px solid var(--border, #444);
}

@media (max-width: 1024px) {
  .main-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
  }

  .tracks-section,
  .waveform-section,
  .transport-section,
  .chat-section {
    grid-column: 1;
    grid-row: auto;
    border: none;
    border-bottom: 1px solid var(--border, #444);
  }
}
```

---

## All Available Widgets

### Instance 4 (Data/Auth) - READY ✅
- `AuthHeader` - User authentication dropdown
- `ProjectSelector` - Project switcher dropdown
- `ProjectList` - Grid view of all projects
- `ProjectSettingsModal` - Edit project metadata
- `UserSettingsModal` - User preferences (3 tabs)
- `SaveStatusBadge` - Auto-save status indicator
- `NewProjectDialog` - Create new project wizard
- `AudioDeviceSettings` - Audio device configuration
- `ProjectStats` - Compact project overview (dashboard)
- `QuickActions` - Compact action buttons (dashboard)

### Instance 2 (Audio) - READY ✅
- `CompactPitchMonitor` - Current note display (dashboard)
- `CompactEQControls` - 3-band EQ sliders (dashboard)
- `VocalEffectsPanel` - Auto-Tune/Doubler/De-Esser (full)
- `VocalStatsPanel` - Performance metrics (full)
- `PianoRoll` - Pitch history visualizer (full)
- `EQControls` - Full parametric EQ (full)

### Instance 3 (AI) - READY ✅
- `CompactMusicGen` - Quick music generation (dashboard)
- `CompactVoiceProfile` - Voice profile selector (dashboard)
- `MusicGenerator` - Full music generation UI (full)
- `VoiceProfileManager` - Voice profile management (full)
- `HarmonyGenerator` - Harmony generation UI (full)

---

## Quick Start Checklist

- [ ] Copy `DashboardHeader` component to your page
- [ ] Copy `DashboardCompactBar` component to your page
- [ ] Import integration helpers from `widgetIntegration.ts`
- [ ] Add modal components to page
- [ ] Apply dashboard grid CSS
- [ ] Test header (auth, project selector, save status)
- [ ] Test compact bar (stats, quick actions)
- [ ] Add Instance 2 compact widgets to compact bar
- [ ] Add Instance 3 compact widgets to compact bar
- [ ] Test full workflow (create project, save, export)

---

**All code is production-ready. Just import and use!** 🚀
