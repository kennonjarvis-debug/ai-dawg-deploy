# DAWG AI - 4-Instance Architecture Guide

## Overview

DAWG AI uses a **4-instance development architecture** where four separate Claude Code sessions work in parallel on different parts of the codebase. This approach maximizes development velocity while maintaining clear separation of concerns.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         DAWG AI                              │
│                  (Multi-Instance Architecture)               │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐   ┌────────────────┐
│  Instance 1   │    │  Instance 2    │   │  Instance 3    │
│  UI/Frontend  │◄──►│  Audio Engine  │   │  AI Conductor  │
│               │    │                │   │                │
│  - Widgets    │    │  - Effects     │   │  - Chat API    │
│  - React UI   │    │  - DSP         │   │  - Music Gen   │
│  - Styling    │    │  - Pitch Det.  │   │  - Voice Clone │
└───────┬───────┘    └────────┬───────┘   └────────┬───────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌────────────────┐
                    │  Instance 4    │
                    │ Data & Storage │
                    │                │
                    │  - Database    │
                    │  - Auth        │
                    │  - S3 Storage  │
                    └────────────────┘
```

---

## Instance Responsibilities

### Instance 1: User Interface / Frontend
**Human Analogy:** The artist/designer who creates what users see and interact with

**Focus:**
- React components and widgets
- UI/UX design and styling
- User interactions and state management
- Visual feedback and animations

**Technologies:**
- Next.js 15, React, TypeScript
- CSS Modules, Tailwind CSS
- Zustand for state management
- Lucide icons

**Key Files:**
- `/src/widgets/**` - All widget components
- `/app/page.tsx` - Main app layout
- `/src/styles/**` - Design system
- `/components/**` - Shared UI components

**Current Status:** ✅ Stage 1 & 2 Complete (Recording, playback, file upload, waveforms)

---

### Instance 2: Audio Engine
**Human Analogy:** The sound engineer who handles all audio processing

**Focus:**
- Web Audio API processing
- Real-time audio effects (EQ, compression, reverb)
- Pitch detection and analysis
- Audio routing and mixing

**Technologies:**
- Web Audio API
- Tone.js for transport/timing
- Pitchy.js for pitch detection
- AudioWorklet for low-latency processing

**Key Files:**
- `/src/core/audio/**` - Audio processing utilities
- `/src/utils/audioEffects.ts` - Effects processors
- `/src/utils/pitchDetection.ts` - Pitch analysis
- `/src/core/useEffects.ts` - Effects React hook

**Current Status:** ⏳ Not started yet (ready to begin Stage 3)

---

### Instance 3: AI Conductor
**Human Analogy:** The AI coach/producer who guides and enhances the creative process

**Focus:**
- Claude AI chat integration
- AI function calling (trigger DAW actions)
- Music generation (Suno/MusicGen)
- Voice cloning (ElevenLabs/Kits.AI)
- Adaptive AI logic

**Technologies:**
- Anthropic Claude API (Sonnet 4.5)
- Suno API or MusicGen
- ElevenLabs or Kits.AI
- Server-Sent Events for streaming

**Key Files:**
- `/app/api/chat/**` - Chat endpoints
- `/app/api/generate/**` - Music generation
- `/app/api/voice/**` - Voice cloning
- `/lib/ai/**` - AI utilities
- `/prompts/**` - System prompts

**Current Status:** ✅ Stage 4 backend complete (Chat API with streaming)

---

### Instance 4: Data & Storage
**Human Analogy:** The librarian/archivist who manages data persistence and security

**Focus:**
- PostgreSQL database management
- Prisma ORM and migrations
- User authentication (NextAuth.js/Clerk)
- S3/R2 cloud storage for audio
- Auto-save mechanism

**Technologies:**
- PostgreSQL, Prisma ORM
- NextAuth.js or Clerk
- AWS S3 or Cloudflare R2
- Server actions for mutations

**Key Files:**
- `/app/api/projects/**` - Project CRUD
- `/app/api/auth/**` - Authentication
- `/prisma/**` - Database schema
- `/lib/db/**` - Database utilities
- `/lib/storage/**` - S3 integration

**Current Status:** ✅ Stage 6.1 & 6.3 complete (Database schema, project API)

---

## Inter-Instance Communication

### How Instances Communicate

**1. File-Based APIs:**
Instances define TypeScript interfaces that other instances consume.

Example:
```typescript
// Instance 2 defines (in /src/core/audio/types.ts):
export interface EQParams {
  lowGain: number;    // -12 to +12 dB
  midGain: number;
  highGain: number;
  lowFreq: number;    // Hz
  midFreq: number;
  highFreq: number;
}

// Instance 1 uses (in /src/widgets/EffectsPanel.tsx):
import { EQParams } from '@/src/core/audio/types';
```

**2. HTTP APIs:**
Backend instances expose REST endpoints that frontend consumes.

Example:
```typescript
// Instance 3 creates:
POST /api/chat - Chat with AI

// Instance 1 calls:
fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages })
})
```

**3. Zustand Store:**
Instance 1 owns the main store, other instances read it via imports.

Example:
```typescript
// Instance 1 defines (in /src/core/store.ts):
export const useTrackStore = create<TrackStore>((set) => ({
  tracks: [],
  addTrack: (type) => { /* ... */ }
}));

// Instance 2 uses:
import { useTrackStore } from '@/src/core/store';
const tracks = useTrackStore((state) => state.tracks);
```

**4. SYNC.md Messages:**
For async communication, instances leave messages in SYNC.md.

---

## Development Workflow

### Starting a New Session

**Instance 1 (You):**
1. Already running - continue working
2. Update SYNC.md with your current status
3. Commit changes frequently

**Instances 2-4:**
1. Open new terminal: `cd /Users/benkennon/dawg-ai`
2. Copy prompt from INSTANCE_PROMPTS.md
3. Paste to Claude Code in new terminal
4. Read SYNC.md, CLAUDE.md, ROADMAP.md
5. Begin assigned tasks

### During Development

**Every 30-60 minutes:**
- Update SYNC.md with progress
- Commit changes with instance prefix
- Pull before editing shared files

**When completing a feature:**
- Mark as complete in SYNC.md "Recent Completions"
- Update "Provides" section if exposing APIs
- Leave message for instances that depend on your work
- Update timestamp in SYNC.md

### Resolving Conflicts

**File Ownership Rule:**
- ONLY edit files you own (see "File Ownership" in SYNC.md)
- If you need changes in another instance's files, leave a message in SYNC.md

**Shared File Protocol:**
```bash
# Before editing shared files (SYNC.md, types.ts):
git pull

# Make minimal edits
# Edit only your section in SYNC.md

# Commit immediately
git add SYNC.md
git commit -m "feat(i2): update status - EQ complete"
git push
```

**Merge Conflicts:**
If conflict occurs in SYNC.md:
1. Pull with `git pull --rebase`
2. Resolve conflict (keep both changes)
3. Commit and push

---

## File Ownership Matrix

| Directory/File | Owner | Other Instances Access |
|---|---|---|
| `/src/widgets/**` | Instance 1 | Read-only |
| `/app/page.tsx` | Instance 1 | Read-only |
| `/src/styles/**` | Instance 1 | Read-only |
| `/src/core/audio/**` | Instance 2 | Read-only |
| `/src/utils/audioEffects.ts` | Instance 2 | Read-only |
| `/src/utils/pitchDetection.ts` | Instance 2 | Read-only |
| `/app/api/chat/**` | Instance 3 | Read-only |
| `/app/api/generate/**` | Instance 3 | Read-only |
| `/lib/ai/**` | Instance 3 | Read-only |
| `/app/api/projects/**` | Instance 4 | Read-only |
| `/prisma/**` | Instance 4 | Read-only |
| `/lib/db/**` | Instance 4 | Read-only |
| `/src/core/types.ts` | Shared | Coordinate! |
| `/src/core/store.ts` | Instance 1 (primary) | Read-only |
| `SYNC.md` | Shared | Edit own section |
| `CLAUDE.md` | Instance 1 | Read-only |
| `SESSION_LOG.md` | Instance 1 | Read-only |

---

## Integration Points

### Instance 1 ↔ Instance 2 (UI ↔ Audio)

**What Instance 1 Needs:**
- TypeScript interfaces for effect parameters (EQParams, CompressorParams)
- React hooks to apply effects (useEffects)
- Pitch detection results (for visualization)

**What Instance 2 Provides:**
```typescript
// /src/core/audio/types.ts
export interface EQParams { /* ... */ }

// /src/core/useEffects.ts
export function useEffects(trackId: string) {
  return {
    applyEQ: (params: EQParams) => void,
    applyCompressor: (params: CompressorParams) => void,
  }
}
```

**Integration Steps:**
1. Instance 2 creates interfaces and hooks
2. Instance 2 commits and updates SYNC.md
3. Instance 1 builds UI components that call hooks

---

### Instance 1 ↔ Instance 3 (UI ↔ AI)

**What Instance 1 Needs:**
- Chat API endpoint (already exists: `/api/chat`)
- Response streaming support
- Error handling

**What Instance 3 Provides:**
```typescript
// POST /api/chat
{
  messages: Array<{role: 'user' | 'assistant', content: string}>,
  stream?: boolean,
  projectContext?: { trackCount, currentTrack, ... }
}
```

**Integration Steps:**
1. Instance 3 has already created `/api/chat`
2. Instance 1 builds ChatPanel widget
3. Instance 1 uses fetch() with streaming to call API

---

### Instance 1 ↔ Instance 4 (UI ↔ Data)

**What Instance 1 Needs:**
- Save/load project endpoints (already exist)
- Authentication UI (login/signup forms)
- User session management

**What Instance 4 Provides:**
```typescript
// POST /api/projects/save
// GET /api/projects/load?projectId=xxx
// GET /api/projects/list?userId=xxx
// DELETE /api/projects/delete

// Future: /api/auth/[...nextauth]
```

**Integration Steps:**
1. Instance 4 completes auth setup
2. Instance 4 updates SYNC.md with auth instructions
3. Instance 1 builds Save/Load UI + Login UI

---

## Testing Cross-Instance Features

### Test Plan 1: Audio Effects (I1 + I2)
```
1. Instance 2 implements EQ processor
2. Instance 1 builds EQ UI widget
3. Manual test:
   - Record or upload audio
   - Open EQ panel (Instance 1 UI)
   - Adjust low/mid/high gains
   - Verify audio changes in real-time
4. Both instances commit
```

### Test Plan 2: AI Chat (I1 + I3)
```
1. Instance 3 has `/api/chat` ready ✅
2. Instance 1 builds ChatPanel widget
3. Manual test:
   - Open chat panel
   - Type "How do I improve my pitch?"
   - Verify streaming response
   - Check conversation history persists
4. Both instances commit
```

### Test Plan 3: Save/Load (I1 + I4)
```
1. Instance 4 completes auth + database
2. Instance 1 builds Save/Load UI
3. Manual test:
   - Create project with tracks
   - Click "Save Project"
   - Reload page
   - Click "Load Project"
   - Verify all tracks/recordings restored
4. Both instances commit
```

---

## Common Pitfalls

### ❌ Don't Do This:
- Edit files owned by other instances
- Make large changes to shared files without coordination
- Commit without updating SYNC.md
- Work on features without checking SYNC.md first
- Forget to prefix commits with instance number

### ✅ Do This Instead:
- Respect file ownership boundaries
- Communicate in SYNC.md before editing shared files
- Update SYNC.md after every completed task
- Check SYNC.md at start of session
- Use commit prefix: `feat(i1):`, `fix(i2):`, etc.

---

## Scaling Beyond 4 Instances

**Future Instance Ideas:**

**Instance 5: Mobile (React Native)**
- Focus: iOS/Android apps
- Syncs with web app via Instance 4 APIs
- Simplified recording interface

**Instance 6: DevOps/Infrastructure**
- Focus: CI/CD, deployment, monitoring
- Manages production infrastructure
- Performance optimization

**Instance 7: Testing/QA**
- Focus: Automated testing, E2E tests
- Jest, Playwright, performance tests
- Quality assurance

---

## FAQ

**Q: What if two instances need to edit the same file?**
A: Coordinate in SYNC.md messages first. One instance makes the change, commits, then the other pulls and continues.

**Q: How do I know what to work on?**
A: Read your instance section in SYNC.md → Check "Next Task" → See INSTANCE_PROMPTS.md for detailed instructions

**Q: Can I help another instance with their work?**
A: Leave suggestions in SYNC.md messages, but don't edit their files directly.

**Q: What if I'm blocked waiting for another instance?**
A: Work on your next priority task, or leave a message in SYNC.md requesting help.

**Q: How do I test my changes without other instances' code?**
A: Use mock data or stub functions temporarily. Remove stubs when other instance completes.

---

**Last Updated:** 2025-10-02 20:15 (Instance 1)
**Next Review:** After first multi-instance integration test
