# DAWG AI - Quick Reference Guide

## Project At a Glance

**Location**: `/Users/benkennon/Projects_Archive/dawg/ai-dawg-deploy`

**What is it?**: AI-powered Digital Audio Workstation with voice control, real-time audio processing, and music generation.

---

## Quick Navigation Map

```
PROJECT ROOT
│
├── 📁 /src                          # Source code (all features)
│   ├── 📄 main.tsx                  # Frontend entry point
│   ├── 📄 App.tsx                   # Router setup
│   │
│   ├── 🎨 /components               # React UI components
│   │   ├── /billing                 # Stripe payment UI
│   │   ├── /dashboard               # Analytics components
│   │   ├── /studio                  # Audio production UI
│   │   └── /imessage                # Messaging UI
│   │
│   ├── 📄 /pages                    # Page components
│   │   ├── LandingPage.tsx          # Marketing landing
│   │   ├── LoginPage.tsx            # Auth
│   │   ├── DAWDashboard.tsx         # Main audio editor
│   │   ├── BillingPage.tsx          # Payments
│   │   └── /dashboard               # Analytics dashboards
│   │
│   ├── 🖇️ /hooks                    # React hooks
│   │   ├── useGeneration.ts         # Music generation
│   │   ├── useAudioEngine.ts        # Web Audio API
│   │   ├── useWebSocket.ts          # Real-time comms
│   │   └── useBilling.ts            # Payment handling
│   │
│   ├── 🏪 /stores                   # Zustand state
│   │   ├── transportStore.ts        # Play/pause/stop
│   │   ├── timelineStore.ts         # Sequencer state
│   │   └── dashboardStore.ts        # UI state
│   │
│   ├── 🔧 /backend                  # Server-side code
│   │   ├── server.ts                # Main Express app
│   │   ├── unified-server.ts        # All-in-one server
│   │   │
│   │   ├── /routes                  # API endpoints
│   │   │   ├── generation-routes.ts # Music generation
│   │   │   ├── track-routes.ts      # Track management
│   │   │   ├── lyrics-routes.ts     # Lyrics generation
│   │   │   └── ...                  # 8 more route files
│   │   │
│   │   ├── /services                # Business logic
│   │   │   ├── musicgen-service.ts  # Music gen API
│   │   │   ├── stem-separation      # Audio stem separation
│   │   │   ├── melody-vocals        # Melody to vocals
│   │   │   ├── expert-music-service.ts # ML models
│   │   │   └── ...                  # 15+ service files
│   │   │
│   │   ├── /middleware              # Express middleware
│   │   │   ├── project-permissions.ts
│   │   │   └── cost-tracking-middleware.ts
│   │   │
│   │   ├── /queues                  # Job processing
│   │   │   └── generation-queue.ts  # BullMQ jobs
│   │   │
│   │   └── /utils                   # Helpers
│   │       └── logger.ts            # Winston logging
│   │
│   ├── 🎙️ /gateway                  # Terminal/SSH service
│   │   ├── server.ts                # Gateway server
│   │   ├── websocket-server.ts      # WebSocket for terminal
│   │   └── ...                      # Session, firewall, AI service
│   │
│   ├── 🎛️ /plugins                  # Audio plugins
│   │   ├── /ai-eq                   # AI Equalizer
│   │   ├── /ai-reverb               # AI Reverb effects
│   │   ├── /audio-engine            # Core processor
│   │   └── /presets                 # Genre presets
│   │
│   ├── 🎵 /audio-engine             # Web Audio API engine
│   │   ├── /core                    # Audio context
│   │   ├── /dsp                     # Signal processing
│   │   ├── /plugins                 # Plugin integration
│   │   └── /routing                 # Signal routing
│   │
│   ├── 🤖 /agent-dashboard          # AI terminal UI
│   │   ├── AgentDashboard.tsx       # Main dashboard
│   │   ├── /components              # Terminal, chat, status
│   │   └── /hooks                   # WebSocket hook
│   │
│   ├── 📡 /api                      # API SDK layer
│   │   ├── /sdk                     # Client SDK
│   │   └── /websocket               # WebSocket server
│   │
│   ├── 🎨 /ui                       # UI components library
│   │   ├── /components              # DAWDashboard, players, etc
│   │   ├── /chatbot                 # Chat interface
│   │   └── /panels                  # UI panels
│   │
│   ├── 🔌 /modules                  # Feature modules
│   │   ├── /music                   # Music generation
│   │   ├── /automation              # Workflow automation
│   │   ├── /marketing               # Marketing features
│   │   └── /engagement              # User engagement
│   │
│   ├── 🛠️ /services                 # Business services
│   │   ├── voiceCommandService.ts   # Voice control
│   │   ├── rhymeService.ts          # Lyrics help
│   │   ├── /analytics               # Metrics
│   │   └── /imessage                # iMessage integration
│   │
│   ├── 📦 /lib                      # Utilities
│   ├── 🎨 /styles                   # CSS
│   ├── 📝 /types                    # TypeScript types
│   └── 🔐 /contexts                 # React contexts (Auth)
│
├── 📁 /config                       # Config files
│   ├── admin-permissions.json       # RBAC roles
│   └── docker-compose.gateway.yaml  # Docker setup
│
├── 📁 /prisma                       # Database
│   └── schema.prisma                # ORM schema
│
├── 📁 /tests                        # Test files
│   ├── /e2e                         # Playwright tests
│   ├── /integration                 # Integration tests
│   ├── /unit                        # Unit tests
│   ├── /ai-agents                   # AI agent tests
│   └── ...
│
├── ⚙️ package.json                  # NPM dependencies
├── ⚙️ tsconfig.json                 # TypeScript config
├── ⚙️ vite.config.ts                # Build config
├── 🐳 Dockerfile                    # Container image
├── 🚀 vercel.json                   # Vercel deploy
├── 🚀 railway.json                  # Railway deploy
├── 🚀 netlify.toml                  # Netlify deploy
└── 📄 .env.example                  # Config template
```

---

## Key Files by Purpose

### Start Frontend Development
```bash
/src/main.tsx          # Entry point
/src/App.tsx           # Routes defined here
/vite.config.ts        # Frontend build config
npm run dev:ui         # Command to run
```

### Start Backend Development
```bash
/src/backend/server.ts          # Main API server
/src/backend/unified-server.ts  # All-in-one option
npm run dev:server              # Command to run
npm run dev:unified             # Unified option
```

### Database Operations
```bash
/prisma/schema.prisma           # Schema definition
npm run db:migrate              # Run migrations
npm run db:generate             # Generate Prisma client
```

### Configuration
```bash
.env.example                    # Copy this to .env
/src/backend/config/database.ts # Database setup
/src/config/pricing.ts          # Pricing config
```

### API Endpoints
```
GET  /health                    # Health check
POST /api/generate              # Generate music
GET  /api/tracks                # List tracks
POST /api/lyrics                # Generate lyrics
GET  /api/cost-monitoring       # API costs
```

---

## Frontend Routing Quick Ref

| URL | Component | Protected? |
|-----|-----------|-----------|
| `/` | Landing or App (localhost) | No |
| `/home` | LandingPage | No |
| `/demo` | LiveDemoPage | No |
| `/features` | FeaturesPage | No |
| `/pricing` | PricingPage | No |
| `/login` | LoginPage | No |
| `/register` | RegisterPage | No |
| `/app` | ProjectListPage | Yes |
| `/project/:id` | DAWDashboard | Yes |
| `/freestyle/:id` | FreestylePage | Yes |
| `/studio` | LiveStudioPage | Yes |
| `/settings/billing` | BillingPage | Yes |
| `/dashboard/*` | Analytics dashboards | Yes |

---

## Backend Routes Quick Ref

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/generate` | Create music |
| GET/POST | `/api/tracks/*` | Track operations |
| POST | `/api/lyrics` | Generate lyrics |
| GET/POST | `/api/clips/*` | Clip operations |
| GET | `/api/cost-monitoring` | Track costs |
| POST | `/api/v1/*` | Advanced features |
| GET | `/health` | Health check |

---

## Technology Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- React Router (routing)
- Zustand (state management)
- Tailwind CSS + Radix UI (styling)
- Socket.IO (real-time)

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- BullMQ + Redis (job queue)
- Socket.IO (WebSocket)

### Audio Processing
- Web Audio API (browser)
- Tone.js (browser synth)
- FFmpeg (server)
- Demucs (stem separation)
- Expert Music AI (Python service)

### AI & APIs
- OpenAI (voice, chat)
- Anthropic Claude (generation)
- Google Gemini (optional)
- Replicate (audio models)

### Infrastructure
- AWS S3 (file storage)
- PostgreSQL (production DB)
- Redis (caching, queues)
- Stripe (payments)

### DevOps
- Docker (containerization)
- Railway (backend deploy)
- Vercel (frontend deploy)
- Netlify (alternative frontend)

---

## Development Workflow

### Setup
```bash
npm install                     # Install dependencies
cp .env.example .env           # Create env file
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Setup database
```

### Run Locally
```bash
npm run dev:ui                 # Frontend on :5173
npm run dev:server             # Backend on :3001
# OR unified:
npm run dev:unified            # Both on :3001
```

### Build for Production
```bash
npm run build:ui               # Frontend build
npm run build                  # TypeScript build
```

### Testing
```bash
npm run test                   # Unit tests
npm run test:e2e              # Playwright tests
npm run test:backend          # Backend tests
```

---

## Common Tasks

### Add New API Endpoint
1. Create file: `/src/backend/routes/your-feature-routes.ts`
2. Create file: `/src/backend/services/your-feature-service.ts`
3. Import in `/src/backend/server.ts`
4. Add route: `app.use('/api/your-feature', yourRoutes)`

### Add New Page
1. Create file: `/src/pages/YourPage.tsx`
2. Import in `/src/App.tsx`
3. Add route: `<Route path="/your-path" element={<YourPage />} />`

### Add New Hook
1. Create file: `/src/hooks/useYourHook.ts`
2. Use in components: `const data = useYourHook()`

### Add New Plugin
1. Create directory: `/src/plugins/your-plugin/`
2. Create `index.ts` with plugin definition
3. Register in plugin system

---

## Port Map

| Service | Port | Dev Command |
|---------|------|-------------|
| Frontend | 5173 | `npm run dev:ui` |
| Backend | 3001 | `npm run dev:server` |
| Unified Server | 3001 | `npm run dev:unified` |
| AI Brain | 8002 | (optional service) |
| Expert Music AI | 8000+ | (Python service) |

---

## Environment Variables (Key Ones)

```bash
# App
NODE_ENV=development
PORT=3001
VITE_API_URL=http://localhost:3100

# Database
DATABASE_URL=sqlite:./dev.db (or postgres://...)

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# AWS Storage
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Payments
STRIPE_SECRET_KEY=sk_...

# Redis
REDIS_URL=redis://localhost:6379
```

See `/src/.env.example` for all options.

---

## Useful Npm Scripts

```bash
# Development
npm run dev:ui              # Frontend dev server
npm run dev:server          # Backend dev server
npm run dev:unified         # All-in-one server
npm run dev:dash            # Monitor dashboard

# Building
npm run build:ui            # Build frontend (Vite)
npm run build               # Build TypeScript

# Testing
npm run test                # Unit tests (Vitest)
npm run test:e2e            # E2E tests (Playwright)
npm run test:backend        # Backend tests
npm run test:jest           # Jest runner

# Database
npm run db:migrate          # Run migrations
npm run db:generate         # Generate Prisma client
npm run db:studio           # Open Prisma Studio

# Deployment
npm run gateway             # Start gateway service
npm run gateway:dev         # Dev gateway
```

---

## Project Stats

- **Frontend Components**: 40+ React components
- **Backend Services**: 20+ service modules
- **API Routes**: 11+ route handlers
- **Plugins**: 8+ audio plugins (EQ, Reverb, Mixer, etc)
- **Database Models**: 10+ Prisma models
- **Test Suites**: 22+ test directories
- **Tech Stack**: React + TypeScript + Express + Prisma
- **Audio Libraries**: Web Audio API, Tone.js, FFmpeg, Demucs

---

## Need to Find Something?

| What? | Where? |
|-------|--------|
| API endpoint | `/src/backend/routes/` |
| Business logic | `/src/backend/services/` |
| UI component | `/src/components/` or `/src/ui/components/` |
| Page | `/src/pages/` |
| Hook | `/src/hooks/` |
| Store | `/src/stores/` |
| Plugin | `/src/plugins/` |
| Audio processing | `/src/audio/` or `/src/audio-engine/` |
| Type definition | `/src/types/` |
| Config | `/prisma/`, `/config/`, root level |
| Test | `/tests/` |

**Document Version**: 1.0
**Generated**: October 20, 2025
