# DAWG AI - Persistent Memory

## Project Overview
**DAWG AI** is an AI-powered Digital Audio Workstation (DAW) that acts as both a vocal coach and music producer. The core innovation is an **adaptive journey system** where AI guides users through personalized song creation workflows that adapt in real-time to their vocal abilities, skill level, and creative goals.

### Vision
Create a revolutionary music production tool that:
- Removes creative paralysis through AI-guided workflows
- Accelerates vocal learning with real-time coaching
- Produces professional-quality tracks from idea to final mix
- Adapts difficulty dynamically based on user performance

### Target Users
- Beginner to intermediate vocalists
- Country music enthusiasts (initial focus: Morgan Wallen, Jason Aldean, Randy Houser style)
- Singer-songwriters who want production help
- Anyone who wants to create music but lacks technical DAW knowledge

## Architecture Decisions

### Tech Stack
**Frontend:**
- Next.js 14 (App Router) with TypeScript
- Tailwind CSS + shadcn/ui for UI components
- Web Audio API + Tone.js for audio processing
- Pitchy.js for real-time pitch detection
- wavesurfer.js for waveform visualization
- Zustand for state management (chosen for performance with real-time audio)

**Backend:**
- Node.js + Express
- PostgreSQL for user data and project storage
- S3 (or similar) for audio file storage
- Socket.io for real-time AI feedback during recording

**AI Services:**
- Anthropic Claude API (Sonnet 4.5) - Main AI coach/producer
- Suno API / MusicGen - Music generation for backing tracks
- ElevenLabs / Kits.AI - Voice cloning for harmonies

### Design Philosophy
1. **AI-First Architecture** - Chat interface always accessible, not bolted on
2. **Progressive Disclosure** - UI complexity grows with feature additions
3. **Vocal-Centric** - Optimized for singing/vocal recording (not instrument production)
4. **Real-time Feedback** - Visual feedback for pitch, timing, performance quality
5. **Clean, Modern Aesthetic** - Inspired by Ableton Live 12's streamlined approach

### Layout Structure
```
┌──────────┬─────────────────────┬──────────┐
│  Tracks  │  Main Workspace     │ AI Chat  │
│ Sidebar  │  (Waveform/Mixer)   │  Panel   │
└──────────┴─────────────────────┴──────────┘
           Transport Controls (Bottom)
```

## Development Stages

### Stage 0: Foundation
- ✅ Persistent memory setup
- ✅ Next.js project initialization
- ✅ Basic dashboard layout
- ✅ Audio recording infrastructure
- ✅ AI chat interface (backend ready)

### Stage 1-12+ Roadmap
1. ✅ **Recording infrastructure & waveform display (COMPLETE)**
   - Widget-based modular architecture
   - Transport controls, track management, waveform display
   - Audio recording with device selection
   - Multi-track playback with volume/pan/solo/mute
   - Export to WAV
   - Pro Tools-style input/output device selection per track

2. 🔄 **File Upload & Import (IN PROGRESS - Instance 1)**
3. ⏳ **Effects & Processing** (EQ, compression, reverb)
4. ✅ **AI Chat Integration - Backend (COMPLETE - Instance 2)**
   - `/api/chat` endpoint with streaming support
   - Vocal coach system prompt
   - Project context awareness
   - Error handling and validation
5. AI Mixing Suggestions
6. Vocal Coaching with Pitch Analysis
7. Real-time Effects During Recording
8. Generative Backing Tracks
9. Voice Cloning & Harmony Generation
10. User Profiling & Vocal Analysis
11. Adaptive Journey System (Core)
12. Advanced Adaptation (Dynamic Difficulty)
13. Full Journey Orchestration

## Code Style Preferences

### TypeScript
- Use strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Avoid `any` - use `unknown` if type is truly unknown

### Naming Conventions
- Components: PascalCase (`AudioRecorder.tsx`)
- Files: kebab-case for utilities (`audio-utils.ts`)
- Hooks: camelCase with `use` prefix (`useAudioRecorder.ts`)
- API routes: kebab-case (`/api/audio-recording`)

### React/Next.js
- Use function components with hooks (no class components)
- Prefer server components where possible (Next.js 14 App Router)
- Client components only when needed (interactivity, browser APIs)
- Use `"use client"` directive explicitly at top of file

### Formatting
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Max line length: 100 characters (soft limit)
- Trailing commas in multi-line objects/arrays

### Component Structure
```typescript
'use client'

import { useState } from 'react'
import { ComponentProps } from './types'

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState()

  // Handlers
  const handleSomething = () => {}

  // Effects
  useEffect(() => {}, [])

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  )
}
```

## File Structure (Current - Widget-Based)

```
dawg-ai/
├── app/                      # Next.js 15 App Router
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main DAW interface (integrated widgets)
│   ├── globals.css          # Global styles + design tokens
│   ├── demo/                # Widget demo pages
│   │   ├── transport/      # TransportControls demo
│   │   └── tracks/         # Track management demo
│   └── api/                 # API routes (future)
│       ├── chat/           # Claude AI endpoints (future)
│       └── audio/          # Audio processing endpoints (future)
├── src/
│   ├── widgets/             # Modular widget components ⭐
│   │   ├── _template/      # Widget template for new widgets
│   │   ├── TransportControls/
│   │   │   ├── TransportControls.tsx
│   │   │   ├── TransportControls.module.css
│   │   │   └── types.ts
│   │   ├── TrackList/
│   │   │   ├── TrackList.tsx
│   │   │   └── TrackList.module.css
│   │   ├── TrackItem/
│   │   │   ├── TrackItem.tsx
│   │   │   ├── TrackItem.module.css
│   │   │   ├── DeviceSelector.tsx
│   │   │   └── DeviceSelector.module.css
│   │   └── WaveformDisplay/
│   │       ├── WaveformDisplay.tsx
│   │       └── WaveformDisplay.module.css
│   ├── core/                # Core audio engine & state
│   │   ├── types.ts        # Track & Recording interfaces
│   │   ├── store.ts        # Zustand track store
│   │   ├── transport.ts    # Tone.js transport wrapper
│   │   ├── useRecording.ts # Recording hook
│   │   └── usePlayback.ts  # Playback hook
│   ├── utils/               # Utilities
│   │   ├── exportAudio.ts  # WAV/WebM export
│   │   └── audioDevices.ts # Device enumeration
│   └── styles/              # Design system
│       └── minimal-tokens.css # Design tokens (appended to globals.css)
├── public/                  # Static assets
├── CLAUDE.md               # This file - persistent memory
├── SESSION_LOG.md          # Session progress tracking
├── MANUAL_TESTS.md         # Manual testing guide
├── ROADMAP.md              # Stage 2-12+ detailed roadmap
└── SYNC.md                 # Multi-instance coordination
```

## Common Commands

### Development
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

### Testing (to be added)
```bash
npm test             # Run tests
npm test:watch       # Watch mode
```

### Audio Testing
- Test microphone access in Chrome: Settings > Privacy > Microphone
- Always use HTTPS in production (required for mic access)
- Use headphones during development to avoid feedback loops

## Important Patterns

### Widget Development Pattern ⭐
1. Copy `/src/widgets/_template/` to new widget folder
2. Build component with CSS modules for scoped styling
3. Connect to core stores (useTrackStore, useTransport)
4. Keep widgets self-contained (no external dependencies)
5. Export main component from index file
6. Add to main app layout when ready

### Audio Recording Pattern (Implemented)
1. Record arm button clicked → Request microphone permission
2. `useRecording` hook initializes MediaStream with selected device
3. Connect mic → MediaRecorder (WebM/Opus codec)
4. Recording starts when transport state = 'recording' AND track is record-armed
5. On stop → Store Blob in track store with metadata
6. Record arm disabled → Release microphone stream completely

### Audio Playback Pattern (Implemented)
1. `usePlayback` hook manages AudioContext and nodes
2. Create per-track gain/pan nodes
3. Load recording Blob → decode to AudioBuffer
4. Create AudioBufferSourceNode connected to track nodes
5. Play/pause controlled by transport state
6. Volume/pan updates happen in real-time via node parameters

### Device Selection Pattern (Implemented)
1. `audioDevices.ts` enumerates available input/output devices
2. Each track stores `inputDeviceId` and `outputDeviceId`
3. DeviceSelector component shows dropdown with devices
4. On device change → reinitialize stream with new deviceId
5. Hot-swap detection via `devicechange` event listener

### State Management
- **Zustand** for global state (tracks, transport, recordings)
- **Component state** for UI-only concerns (dropdowns, modals)
- **Audio state** centralized in core hooks (useRecording, usePlayback)
- Track store is single source of truth for all track data

## Quirks & Gotchas

### Web Audio API
- AudioContext must be created AFTER user interaction (browser policy)
- Sample rate can vary by device (usually 44100 or 48000)
- Use `audioContext.resume()` if context gets suspended
- Clean up audio nodes to prevent memory leaks
- **IMPORTANT**: Don't auto-initialize audio - wait for user action (recording or monitoring)
- Microphone access requires explicit user permission

### Next.js App Router
- API routes use `export async function POST()` syntax (not req/res)
- Server components can't use browser APIs (window, document, audio)
- Use dynamic imports for client-only libraries: `const WaveSurfer = dynamic(() => import('wavesurfer.js'))`

### Real-time Audio
- Target latency: <20ms for comfortable monitoring
- Use AudioWorklet (not ScriptProcessor) for custom processing
- Buffer size affects latency (smaller = lower latency, more CPU)

### Claude API
- Context window: 200k tokens (Sonnet 4.5)
- Streaming recommended for chat interface
- Include vocal profile and journey context in system prompt
- Rate limits: monitor usage for production

## Environment Variables
```bash
ANTHROPIC_API_KEY=         # Claude API key
NEXT_PUBLIC_APP_URL=       # App URL for audio file references
DATABASE_URL=              # PostgreSQL connection
S3_BUCKET=                 # Audio file storage
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

## Current Progress

### ✅ Completed
**Stage 1 (Instance 1):**
- Widget-based modular architecture
- TransportControls widget (play/pause, BPM, keyboard shortcuts)
- TrackManagement widgets (TrackList, TrackItem, DeviceSelector)
- WaveformDisplay widget (zoom controls, WaveSurfer.js integration)
- Audio recording with device selection (useRecording hook)
- Multi-track playback with real-time mixing (usePlayback hook)
- Export to WAV (16-bit PCM with proper headers)
- Pro Tools-style input/output device selection per track
- Comprehensive manual testing guide (80+ tests)

**Stage 4 - AI Backend (Instance 2):**
- `/app/api/chat/route.ts` with streaming and non-streaming modes
- Server-Sent Events (SSE) for real-time AI responses
- Vocal coach system prompt (country music specialist)
- Project context integration (track count, current track, duration)
- Comprehensive error handling (401, 429, 500)
- API documentation (`/API.md`)
- Test suite (`test-chat-api.sh`)

### 🔄 In Progress
**Stage 2 (Instance 1):**
- File upload & import widget

### 📋 Next Steps
**Instance 1 (Frontend):**
1. Stage 2: File upload widget (drag & drop, file picker)
2. Stage 3: Effects widgets (EQ, compressor, reverb)
3. Stage 4: ChatPanel widget (integrate with `/api/chat`)

**Instance 2 (Backend - THIS INSTANCE):**
1. Stage 6: Database setup (PostgreSQL + Prisma)
2. Stage 6: Authentication (NextAuth.js or Clerk)
3. Stage 6: Save/load project endpoints
4. Stage 6: S3 audio storage integration

## User Preferences

### Communication Style
- Be concise and direct
- Minimize preamble and postamble
- Only explain when complexity warrants it
- Use technical language (user is developer)

### Memory Management
- Auto-update CLAUDE.md for architectural decisions
- Track discovered bugs and quirks
- Document coding patterns as they emerge
- Quick memory: Messages starting with `#` get saved automatically

### Workflow
- Always use TodoWrite for multi-step tasks
- Mark todos complete immediately after finishing
- Keep ONE task in_progress at a time
- Run tools in parallel when possible (single message, multiple tool calls)

## Resources & References

### Documentation
- Next.js 14: https://nextjs.org/docs
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Anthropic Claude: https://docs.anthropic.com
- shadcn/ui: https://ui.shadcn.com

### Inspiration
- Ableton Live 12 (streamlined interface)
- WavTool (chat-based DAW - defunct but good reference)
- Vocal Pitch Monitor (real-time pitch visualization)

## Multi-Instance Development Strategy

### When to Use Multiple Instances
✅ **YES** - When working on independent areas:
- Instance 1: Frontend (widgets, audio, UI)
- Instance 2: Backend (API, database, AI integration)

❌ **NO** - When working on same files:
- Both instances editing same component
- Merge conflicts likely

### Recommended Split

#### Instance 1 (Frontend) - **This Session**
**Focus:** Widgets, audio features, visual components
**File Areas:**
- `/src/widgets/` - All widget components
- `/src/core/` - Audio hooks (useRecording, usePlayback)
- `/src/utils/` - Client-side utilities
- `/app/page.tsx` - Main app layout
- `/src/styles/` - CSS and design tokens

#### Instance 2 (Backend) - **New Terminal Session**
**Focus:** API routes, AI integration, database
**File Areas:**
- `/app/api/` - Next.js API routes
- `/lib/ai/` - Claude client
- `/lib/db/` - Database utilities
- `/prisma/` - Database schema (if using Prisma)

### Sync Strategy
1. **Before starting work:** Read `SYNC.md`
2. **After completing task:** Update `SYNC.md` with status
3. **Commit frequently:** Small, atomic commits
4. **Pull before editing:** Check if other instance modified shared files

### Communication Protocol
Use `SYNC.md` to coordinate:
```markdown
## Instance 1 (Frontend) - Updated: 2025-10-02 14:30
Working on: File upload widget
Status: In progress (50%)
Blocks: None
Provides: N/A

## Instance 2 (Backend) - Updated: 2025-10-02 14:15
Working on: /api/chat endpoint
Status: Complete
Blocks: None
Provides: POST /api/chat ready for frontend integration
```

---

**Last Updated:** 2025-10-02
**Current Stage:** Stage 1 Complete ✅ | Stage 2 In Progress
