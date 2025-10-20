# DAWG AI - Comprehensive Architecture Analysis

**Project Location:** `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy`

**Project Overview:**
DAWG AI is an AI-powered Digital Audio Workstation featuring voice-controlled interface, advanced audio processing plugins, and real-time music production capabilities. The project uses a hybrid frontend/backend architecture with multiple backend services (currently consolidating into a unified server).

---

## 1. DIRECTORY STRUCTURE & PURPOSE

### Root-Level Source Directory (`/src`)

```
/src
├── agent-dashboard/          # AI Agent Terminal Dashboard - WebSocket-based terminal UI
├── ai/                        # Core AI integration modules
├── api/                       # API SDK and WebSocket communication layer
├── audio/                     # Audio processing DSP and workers
├── audio-engine/              # Web Audio API engine with plugins
├── backend/                   # Main backend server and services
├── components/                # React UI components (billing, dashboard, studio, imessage)
├── config/                    # Configuration files (pricing, etc.)
├── contexts/                  # React contexts (Auth, etc.)
├── controllers/               # Backend request controllers
├── examples/                  # Example implementations
├── frontend/                  # Frontend services
├── gateway/                   # Gateway/Terminal service for SSH/CLI access
├── hooks/                     # React custom hooks
├── jobs/                      # Background job handlers
├── lib/                       # Utility functions and helpers
├── module-sdk/                # Module SDK for extensibility
├── modules/                   # Feature modules (automation, engagement, marketing, music, testing)
├── monitor/                   # Monitoring and health check services
├── pages/                     # React page components (landing, dashboard, pricing, etc.)
├── plugins/                   # Audio plugins (AI EQ, Reverb, Bridge, etc.)
├── recording/                 # Audio recording utilities
├── routes/                    # Frontend route definitions
├── server/                    # Server infrastructure
├── services/                  # Business logic services
├── shared/                    # Shared schemas and features
├── stores/                    # Zustand state management stores
├── styles/                    # CSS/styling
├── types/                     # TypeScript type definitions
└── ui/                        # UI components (chatbot, components, panels, recording, etc.)
```

---

## 2. ENTRY POINTS

### Frontend Entry Points

| Entry Point | File | Purpose |
|------------|------|---------|
| **Web App** | `/src/main.tsx` | React app entry - mounts App component to DOM |
| **App Router** | `/src/App.tsx` | Main routing setup with React Router v6 |
| **Vite Config** | `/vite.config.ts` | Frontend build configuration |

### Backend Entry Points

| Entry Point | File | Purpose |
|------------|------|---------|
| **Main Backend** | `/src/backend/server.ts` | Express server on port 3001 - main API |
| **Unified Server** | `/src/backend/unified-server.ts` | Consolidated backend (Main + AI Brain + Realtime Voice) |
| **AI Brain Server** | `/src/backend/ai-brain-server.ts` | Separate AI services server (optional) |
| **Realtime Voice** | `/src/backend/realtime-voice-server.ts` | OpenAI Realtime voice API server (optional) |
| **Gateway Server** | `/src/gateway/server.ts` | Terminal/SSH gateway service |

### Build & Development Scripts

From `package.json`:
```
npm run dev:ui              # Frontend dev (Vite, port 5173)
npm run dev:server          # Backend dev (tsx watch)
npm run dev:unified         # Unified server dev
npm run build:ui            # Production frontend build
npm run dev:dash            # Monitor dashboard
npm run gateway             # Gateway server
npm run test                # Run tests
npm run test:e2e            # Playwright E2E tests
```

---

## 3. MODULE ORGANIZATION

### Backend Services (`/src/backend/services`)

**Audio & Music Processing:**
- `udio-service.ts` - Udio music generation integration
- `musicgen-service.ts` - Music generation with parameters
- `stem-quality-validator.ts` - Audio quality validation
- `demucs-service.ts` - Stem separation (Demucs model)
- `melody-vocals-service.ts` - Convert melody to vocals
- `melody-extractor-pitchfinder.ts` - Pitch detection
- `midi-service.ts` - MIDI file handling
- `audio-processor.ts` - Generic audio processing
- `audio-converter.ts` - Audio format conversion

**AI & ML:**
- `expert-music-service.ts` - Expert Music AI integration
- `lyrics-analysis-service.ts` - NLP for lyrics
- `beatbox-to-drums-service.ts` - Beatbox to drum conversion
- `multi-clip-analyzer.ts` - Multi-clip audio analysis

**Utilities & Infrastructure:**
- `function-cache-service.ts` - AI function caching
- `budget-management-service.ts` - Cost tracking
- `crdt-service.ts` - Collaborative editing
- `daw-integration-service.ts` - DAW compatibility

### Backend Routes (`/src/backend/routes`)

| Route | File | Endpoints |
|-------|------|-----------|
| Generation | `generation-routes.ts` | `/api/generate/*` - Music/beat generation |
| Tracks | `track-routes.ts` | `/api/tracks/*` - Track management |
| Lyrics | `lyrics-routes.ts` | `/api/lyrics/*` - Lyrics generation |
| Clips | `clips-routes.ts` | `/api/clips/*` - Clip management |
| Cost Monitoring | `cost-monitoring-routes.ts` | `/api/cost-monitoring/*` - API costs |
| Advanced Features | `advanced-features-routes.ts` | `/api/v1/*` - Advanced AI features |
| Voice Test | `voice-test-routes.ts` | Voice testing endpoints |
| Separation | `separation-routes.ts` | Stem separation endpoints |
| Function Cache | `function-cache-routes.ts` | Function caching endpoints |
| OAuth | `oauth-routes.ts` | Social login |
| Storage | `storage-routes.ts` | File storage |

### Frontend Components (`/src/components`)

| Category | Directory | Purpose |
|----------|-----------|---------|
| Billing | `/components/billing/` | Stripe integration, invoices, payments |
| Dashboard | `/components/dashboard/` | Analytics, metrics, filters |
| Studio | `/components/studio/` | Audio production UI |
| iMessage | `/components/imessage/` | iMessage/messaging UI |
| General | `/components/*.tsx` | Logo, JarvisPanel, ProtectedRoute |

### Frontend Pages (`/src/pages`)

| Page | File | Route |
|------|------|-------|
| Landing Page | `LandingPage.tsx` | `/home` |
| Features | `FeaturesPage.tsx` | `/features` |
| Pricing | `PricingPage.tsx` | `/pricing` |
| Login | `LoginPage.tsx` | `/login` |
| Register | `RegisterPage.tsx` | `/register` |
| Freestyle | `FreestylePage.tsx` | `/freestyle/:projectId` |
| Live Studio | `LiveStudioPage.tsx` | `/studio` |
| Live Demo | `LiveDemoPage.tsx` | `/demo` |
| Billing | `BillingPage.tsx` | `/settings/billing` |
| Dashboard | `/pages/dashboard/*` | `/dashboard/*` - Analytics dashboards |

### React Hooks (`/src/hooks`)

| Hook | File | Purpose |
|------|------|---------|
| useGeneration | `useGeneration.ts` | Music generation API calls |
| useAudioEngine | `useAudioEngine.ts` | Web Audio API management |
| useWebSocket | `useWebSocket.ts` | WebSocket connections |
| useChat | `useChat.ts` | Chat/messaging |
| useMultiTrackRecording | `useMultiTrackRecording.ts` | Multi-track recording |
| useBilling | `useBilling.ts` | Billing operations |
| useFeature | `useFeature.ts` | Feature flags |
| useDashboardSSE | `useDashboardSSE.ts` | Server-sent events |

### Zustand Stores (`/src/stores`)

| Store | File | State |
|-------|------|-------|
| Transport | `transportStore.ts` | Playback controls (play/pause/stop) |
| Timeline | `timelineStore.ts` | Timeline/sequencer state |
| Dashboard | `dashboardStore.ts` | Dashboard UI state |
| DAW UI | `dawUiStore.ts` | Main DAW UI state |

### React Contexts (`/src/contexts`)

| Context | File | Purpose |
|---------|------|---------|
| Auth | `AuthContext.tsx` | User authentication state |

### Plugin System (`/src/plugins`)

| Plugin Type | Directory | Purpose |
|-------------|-----------|---------|
| AI EQ | `/plugins/ai-eq/` | Intelligent equalization (Auto, Surgical, Mastering, Vintage) |
| AI Reverb | `/plugins/ai-reverb/` | Intelligent reverb effects (Hall, Room, Plate, Spring) |
| AI Mixer | `/plugins/ai/` | AI-powered mixing engine |
| Bridge | `/plugins/bridge/` | Plugin bridge server for communication |
| Core | `/plugins/core/` | Core plugin types and utilities |
| Client | `/plugins/client/` | Plugin controller (PluginController.ts) |
| Presets | `/plugins/presets/` | Genre presets (GenrePresets.ts) |
| Utility | `/plugins/utility/` | Modulation and effects (AIModulation.ts) |

### Audio Engine (`/src/audio-engine`)

| Module | Directory | Purpose |
|--------|-----------|---------|
| Core | `/audio-engine/core/` | Audio context, graph management |
| DSP | `/audio-engine/dsp/` | Digital signal processing |
| MIDI | `/audio-engine/midi/` | MIDI handling |
| Routing | `/audio-engine/routing/` | Signal routing |
| Plugins | `/audio-engine/plugins/` | Plugin integration |

### Modules (`/src/modules`)

| Module | Directory | Purpose |
|--------|-----------|---------|
| Music | `/modules/music/` | Music generation and processing |
| Automation | `/modules/automation/` | Workflow automation |
| Marketing | `/modules/marketing/` | Marketing/engagement features |
| Engagement | `/modules/engagement/` | User engagement tracking |
| Testing | `/modules/testing/` | Testing utilities |

### Services (`/src/services`)

| Service | File | Purpose |
|---------|------|---------|
| Voice Command | `voiceCommandService.ts` | Natural language commands |
| AI Cache | `ai-cache-service.ts` | Caching AI responses |
| Voice Cache | `voice-cache-service.ts` | Voice processing cache |
| Rhyme Service | `rhymeService.ts` | Rhyme generation for lyrics |
| Dashboard API | `dashboardApi.ts` | Dashboard data fetching |
| Analytics | `/services/analytics/` | Real-time metrics |
| Marketing | `/services/marketing/` | Marketing campaigns |
| iMessage | `/services/imessage/` | iMessage integration |

---

## 4. BACKEND ARCHITECTURE

### Server Implementation

**Main Backend Server** (`/src/backend/server.ts`)
- Express.js-based REST API
- Socket.IO for WebSocket communications
- CORS enabled for frontend communication
- Routes: Generation, Tracks, Lyrics, Clips, Cost Monitoring, Advanced Features
- Health check endpoint: `GET /health`

**Unified Server** (`/src/backend/unified-server.ts`)
- Consolidates Main Backend + AI Brain + Realtime Voice
- Reduces Railway costs from $20/mo (4 services) to $5/mo (1 service)
- Shared Express app with Socket.IO namespaces
- Includes Anthropic AI Brain integration
- OpenAI Realtime voice support

**Gateway Server** (`/src/gateway/server.ts`)
- Terminal and SSH gateway access
- Session management
- Command firewall for security
- AI-powered command assistance
- WebSocket-based terminal UI

### Middleware (`/src/backend/middleware`)

| Middleware | File | Purpose |
|-----------|------|---------|
| Project Permissions | `project-permissions.ts` | RBAC for project access |
| Cost Tracking | `cost-tracking-middleware.ts` | API cost monitoring |

### Job Queue (`/src/backend/queues`)

| Queue | File | Purpose |
|-------|------|---------|
| Generation Queue | `generation-queue.ts` | BullMQ queue for async music generation |

### Validation (`/src/backend/validators`)

Request validation and schema enforcement

### Backend Utilities (`/src/backend/utils`)

| Utility | File | Purpose |
|---------|------|---------|
| Logger | `logger.ts` | Winston-based logging |

### Shared Code (`/src/backend/shared`)

Common utilities and types shared across services

### Metrics (`/src/backend/metrics`)

Monitoring and metrics collection

### Sockets (`/src/backend/sockets`)

Socket.IO event handlers

---

## 5. FRONTEND ARCHITECTURE

### React Router Structure

```
/                    → LandingPage (production) / ProjectListPage (localhost)
/home                → LandingPage
/demo                → LiveDemoPage
/features            → FeaturesPage
/pricing             → PricingPage
/login               → LoginPage
/register            → RegisterPage
/app                 → ProjectListPage (protected)
/project/:projectId  → DAWDashboard (protected)
/freestyle/:id       → FreestylePage (protected)
/studio              → LiveStudioPage (protected)
/settings/billing    → BillingPage (protected)
/dashboard/*         → Dashboard pages (protected)
/agent               → AgentDashboard
/imessage            → iMessageDashboard
```

### UI Component Organization (`/src/ui/components`)

**Major Components:**
- `DAWDashboard.tsx` - Main DAW interface
- `ProjectListPage.tsx` - Project management
- `RealtimeVoiceWidget.tsx` - Voice control UI
- `MultiTrackRecorderWidget.tsx` - Recording interface
- `MusicGeneratorPanel.tsx` - Generation controls
- `AudioPlayer.tsx` - Audio playback
- `ExportModal.tsx` - Export dialog
- `UpsellModal.tsx` - Premium features upsell
- `AIFeatureHub.tsx` - AI features showcase
- `ExpertMusicStatusIndicator.tsx` - Status monitoring

**Utility Components:**
- `AudioFileList.tsx` - File management
- `LiveWaveformRecorder.tsx` - Waveform visualization
- `Track.tsx` - Individual track rendering
- `GenerationProgress.tsx` - Progress tracking
- `SectionMarkers.tsx` - Timeline markers

### Agent Dashboard (`/src/agent-dashboard`)

WebSocket-based AI agent terminal dashboard

**Components:**
- `AgentDashboard.tsx` - Main dashboard
- `TerminalCard.tsx` - Terminal display
- `TerminalGrid.tsx` - Multi-terminal layout
- `CommandBar.tsx` - Command input
- `ChatPanel.tsx` - Chat interface
- `StatusPill.tsx` - Status indicator
- `Notepad.tsx` - Notes
- `OfflineBanner.tsx` - Offline indicator
- `LatencyBadge.tsx` - Latency display
- `MobileHotkeys.tsx` - Mobile shortcuts

**Supporting:**
- `useTerminalWebSocket.ts` - WebSocket hook
- `terminalStore.ts` - Terminal state
- `RingBuffer.ts` - Circular buffer for output

---

## 6. CONFIGURATION FILES

### Root Configuration Files

| File | Type | Purpose |
|------|------|---------|
| `package.json` | NPM Config | Project metadata, scripts, dependencies |
| `package-lock.json` | NPM Lock | Dependency lock file |
| `tsconfig.json` | TypeScript | Compiler options (ES2020, strict mode) |
| `vite.config.ts` | Vite | Frontend build configuration |
| `vite.config.ts` | Playwright | E2E test configuration |
| `.env` | Environment | Local environment variables (not in repo) |
| `.env.example` | Environment | Example environment template |
| `.env.local` | Environment | Local development overrides |
| `vercel.json` | Deployment | Vercel deployment config |
| `railway.json` | Deployment | Railway deployment config |
| `netlify.toml` | Deployment | Netlify deployment config |
| `.gitignore` | Git | Ignored files |
| `.dockerignore` | Docker | Docker build ignores |
| `Dockerfile` | Docker | Container image definition |

### Database Configuration

| File | Purpose |
|------|---------|
| `/prisma/schema.prisma` | ORM schema - Users, Projects, Generations, Conversations, AI Memory, Sessions |

### Backend Configuration

| File | Purpose |
|------|---------|
| `/src/backend/config/database.ts` | Prisma database client initialization |
| `/src/config/pricing.ts` | Pricing configuration |

### Deployment Infrastructure

| File | Purpose |
|------|---------|
| `/config/admin-permissions.json` | Admin role definitions |
| `/config/docker-compose.gateway.yaml` | Docker compose for gateway |

---

## 7. DATABASE SCHEMA (Prisma)

### Models

**User Management:**
- `User` - User profiles with OAuth support (Google)
- `Session` - User sessions with token-based auth
- `AIMemory` - Persistent AI memory system (preferences, facts, context)

**Content & Projects:**
- `Project` - User projects/workspaces
- `Conversation` - Chat conversations
- `Message` - Chat messages with intent/entity parsing
- `Generation` - Generated content (beats, stems, mixes, masters)

**Additional Models:**
- Likely additional models for tracks, recordings, billing

### Database Provider
- SQLite (local development) via Prisma
- PostgreSQL (production) - configured via DATABASE_URL

---

## 8. API ENDPOINTS SUMMARY

### Main API Routes (`/api`)

| Route | Purpose | Services |
|-------|---------|----------|
| `/api/generate/*` | Music and beat generation | MusicGen, Udio |
| `/api/tracks/*` | Track management and CRUD | Track service |
| `/api/lyrics/*` | Lyrics generation and analysis | Lyrics service |
| `/api/clips/*` | Clip management | Clip service |
| `/api/cost-monitoring/*` | API cost tracking | Budget service |
| `/api/v1/*` | Advanced AI features | Multiple services |
| `/api/v1/csrf-token` | CSRF token endpoint | Security |
| `/api/auth/*` | Authentication | Auth service |
| `/health` | Health check | All services |

### WebSocket Events

- Socket.IO namespaces for different features
- Real-time voice control
- Live collaboration
- Terminal commands (gateway)

---

## 9. EXTERNAL SERVICES INTEGRATION

### AI Providers

| Provider | Usage | Config Variable |
|----------|-------|------------------|
| OpenAI | Voice control, chat, embeddings | `OPENAI_API_KEY` |
| Anthropic Claude | Lyrics, generation, analysis | `ANTHROPIC_API_KEY` |
| Google Gemini | Optional chat/generation | `GOOGLE_AI_API_KEY` |
| Replicate | Audio AI models | (in services) |

### Audio Services

| Service | Purpose | Integration |
|---------|---------|-------------|
| Udio | Music generation | `udio-service.ts` |
| MusicGen | Beat and music generation | `musicgen-service.ts` |
| Demucs | Stem separation | `demucs-service.ts` |
| Expert Music AI | Python-based audio processing | Separate service |

### Infrastructure

| Service | Purpose | Config |
|---------|---------|--------|
| AWS S3 | Audio file storage | `AWS_S3_BUCKET`, S3 credentials |
| CloudFront | CDN for audio delivery | `AWS_CLOUDFRONT_URL` |
| PostgreSQL | Production database | `DATABASE_URL` |
| Redis | Job queue & WebSocket clustering | `REDIS_URL` |
| Stripe | Payment processing | Stripe API keys |
| Supabase | Optional backend services | Supabase client |

---

## 10. BUILD & DEPLOYMENT

### Build Commands

```bash
npm run build          # TypeScript compilation
npm run build:ui       # Vite frontend build (production)
npm run build:electron # Electron app build
```

### Deployment Targets

| Target | Config File | Purpose |
|--------|------------|---------|
| Vercel | `vercel.json` | Frontend deployment (Vite build) |
| Railway | `railway.json` | Backend service deployment |
| Netlify | `netlify.toml` | Alternative frontend hosting |
| Docker | `Dockerfile` | Containerized deployment |
| Electron | Build config | Desktop application |

### Deployment Environments

- **Development**: localhost (ports 5173/3001)
- **Production**: Deployed via Railway/Vercel/Netlify
- **Staging**: Optional staging environment

---

## 11. TEST ORGANIZATION (`/tests`)

| Directory | Purpose |
|-----------|---------|
| `/ai-agents/` | AI agent integration tests |
| `/e2e/` | Playwright end-to-end tests |
| `/integration/` | Backend integration tests |
| `/unit/` | Unit tests |
| `/backend/` | Backend-specific tests |
| `/load/` | Load testing (k6) |
| `/accuracy/` | AI accuracy tests |
| `/production/` | Production smoke tests |
| `/piano-roll/` | DAW piano roll tests |
| `/helpers/` | Test utilities and helpers |

### Test Scripts

```bash
npm run test                # Vitest unit tests
npm run test:jest           # Jest tests
npm run test:e2e            # Playwright E2E
npm run test:backend        # Backend tests
npm run test:ai             # AI-specific tests
npm run test:load           # Load tests
npm run test:visual         # Visual regression tests
npm run test:a11y           # Accessibility tests
```

---

## 12. KEY ARCHITECTURAL FEATURES

### 1. **Hybrid Frontend/Backend Architecture**
- React frontend (Vite) on port 5173
- Express backend (TypeScript) on port 3001
- Optional Python service (Expert Music AI) on port 8000+

### 2. **Real-time Capabilities**
- Socket.IO for WebSocket communication
- Server-sent events (SSE) for streaming
- OpenAI Realtime API for voice control

### 3. **State Management**
- Zustand for UI state (stores)
- React Context for auth
- Redux toolkit (via dependencies, optional usage)

### 4. **Audio Processing**
- Web Audio API for browser-based DSP
- Python backend for complex ML models
- Plugin architecture for extensibility
- Stem separation and analysis

### 5. **AI Integration**
- Multi-provider support (OpenAI, Anthropic, Google)
- Persistent memory system for user preferences
- Intent detection and entity extraction
- Cost tracking and budgeting

### 6. **Scalability**
- Redis for caching and job queues (BullMQ)
- Database connection pooling
- Async job processing
- Microservice-ready architecture (now unified into single server)

### 7. **Security**
- Authentication via JWT tokens
- RBAC for project permissions
- CORS protection
- Helmet for HTTP headers
- Session management
- Command firewall (gateway)

---

## 13. FILE PATH REFERENCE

### Critical Entry Points

- **Frontend Entry**: `/src/main.tsx` → `/src/App.tsx`
- **Backend Entry**: `/src/backend/server.ts` (or `/src/backend/unified-server.ts`)
- **Gateway Entry**: `/src/gateway/server.ts`
- **Database**: `/prisma/schema.prisma`
- **Build Config**: `/vite.config.ts` (frontend) + `tsconfig.json`

### Environment Configuration

- **Example**: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/.env.example`
- **Local Dev**: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/.env`
- **Database URL**: Set in `.env` as `DATABASE_URL`

### Key Directories

- Source: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/src`
- Tests: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/tests`
- Config: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/config`
- Prisma: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy/prisma`

---

## 14. TECHNOLOGY STACK SUMMARY

### Frontend
- **Framework**: React 19.2 + TypeScript
- **Build Tool**: Vite 5.4
- **Routing**: React Router v6
- **State**: Zustand 5.0 + React Context
- **UI**: Tailwind CSS 3.4 + Radix UI
- **Charts**: Recharts 3.2
- **Toasts**: Sonner 2.0

### Backend
- **Runtime**: Node.js + TypeScript
- **Framework**: Express 4.18
- **Real-time**: Socket.IO 4.8
- **Database**: Prisma ORM + SQLite/PostgreSQL
- **Job Queue**: BullMQ 5.1 + Redis
- **Auth**: JWT + bcrypt
- **Cloud**: AWS S3
- **Payment**: Stripe API
- **AI APIs**: OpenAI, Anthropic, Google

### Audio
- **Browser**: Web Audio API
- **Processing**: Tone.js 15.1
- **MIDI**: Web MIDI API
- **Server**: FFmpeg, Demucs, Expert Music AI (Python)

### Testing
- **Unit**: Jest 29 + Vitest 3
- **E2E**: Playwright 1.55
- **Load**: k6

### DevOps
- **Containerization**: Docker
- **Deployment**: Railway, Vercel, Netlify
- **Monitoring**: OpenTelemetry + Loki
- **Logs**: Winston logger

---

**Document Generated**: October 20, 2025
**Analysis Depth**: Very Thorough
**Coverage**: Complete architecture map with all entry points, modules, configurations, and technology stack.
