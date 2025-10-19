# JARVIS & DAWG AI Integration Overview

**Last Updated:** 2025-10-19
**Project:** AI-Powered Digital Audio Workstation

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Environment](#development-environment)
3. [Production Environment](#production-environment)
4. [Frontend Configuration](#frontend-configuration)
5. [Backend Configuration](#backend-configuration)
6. [API Endpoints](#api-endpoints)
7. [WebSocket Integration](#websocket-integration)
8. [Environment Variables](#environment-variables)
9. [Suggested Improvements](#suggested-improvements)

---

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  Vite + React (Port 5173) → dawg-ai.com                    │
│  • Landing Page                                              │
│  • DAW Interface                                             │
│  • AI Chat Widget                                            │
│  • Audio Workstation                                         │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API GATEWAY                            │
│  Development: Vite Proxy → localhost:3100                   │
│  Production:  Vercel Functions → /api/*                     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    UNIFIED BACKEND                           │
│  Development: localhost:3100                                 │
│  Production:  Vercel Serverless Functions                    │
│                                                              │
│  Components:                                                 │
│  ├── Main Backend (formerly port 3001)                      │
│  ├── AI Brain Server (formerly port 8002)                   │
│  ├── Realtime Voice (formerly port 3003)                    │
│  └── Gateway (port 3002)                                     │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  • Anthropic Claude AI (Chat & AI Brain)                    │
│  • OpenAI (Realtime Voice, Embeddings)                      │
│  • Google AI (Multi-provider support)                       │
│  • Redis (Job Queue & WebSocket clustering)                 │
│  • PostgreSQL/SQLite (Database)                             │
│  • AWS S3 (Audio storage - optional)                        │
│  • Stripe (Billing)                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Development Environment

### NPM Scripts

```bash
# Frontend Development
npm run dev:ui                 # Vite dev server (port 5173)
npm run dev:dash              # Vite with monitor API (port 5173)
npm run build:ui              # Build production frontend
npm run preview:ui            # Preview production build

# Backend Development
npm run dev:unified           # Unified backend server (port 3100)
npm run dev:server            # Legacy main server (port 3001)
npm start                     # Start unified server via start.sh

# Gateway
npm run gateway               # Start SSH gateway (port 3002)
npm run gateway:dev           # Watch mode gateway

# Testing
npm run test                  # Run all tests
npm run test:e2e              # Playwright E2E tests
npm run test:backend          # Jest backend tests
```

### Development Ports

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Frontend (Vite)** | 5173 | http://localhost:5173 | React UI development |
| **Unified Backend** | 3100 | http://localhost:3100 | Consolidated server |
| **SSH Gateway** | 3002 | http://localhost:3002 | Terminal/SSH access |
| **WebSocket** | 3003 | ws://localhost:3003 | Real-time communications |
| **Expert Music AI** | 8003 | http://localhost:8003 | Advanced music generation |
| **AI Brain (Legacy)** | 8002 | http://localhost:8002 | AI chat (now unified) |
| **Redis** | 6379 | redis://localhost:6379 | Job queue & caching |
| **PostgreSQL** | 5432 | postgresql://... | Database (production) |

### Frontend → Backend Communication (Dev)

```javascript
// vite.config.ts - Automatic API proxying
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:3100',  // All /api/* requests proxied here
      changeOrigin: true,
      secure: false,
    },
  },
}

// Frontend makes request to: /api/v1/projects
// Vite automatically proxies to: http://localhost:3100/api/v1/projects
```

**API Client Configuration (src/api/client.ts):**

```javascript
// Uses relative path for both dev and production
this.baseURL = baseURL || '/api/v1';

// Development: Vite proxy forwards to localhost:3100
// Production:  Vercel serves from /api/* functions
```

---

## 🚀 Production Environment

### Vercel Deployment

**Domain:** https://dawg-ai.com
**Deployment:** Vercel (Frontend + Serverless Functions)

### Vercel Configuration (vercel.json)

```json
{
  "buildCommand": "npm run build:ui",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60
    }
  }
}
```

### Production API Structure

```
api/
├── health.js                    # Health check endpoint
└── ai-brain/
    └── chat.js                  # Claude AI chat endpoint
```

**Available Endpoints:**
- `https://dawg-ai.com/api/health` - Health check
- `https://dawg-ai.com/api/ai-brain/chat` - AI chat (Anthropic Claude)

**Note:** Most backend functionality is currently serverless-ready but not yet deployed to Vercel. The unified backend (src/backend/unified-server.ts) needs to be split into Vercel serverless functions.

---

## 🎨 Frontend Configuration

### Environment Variables (Frontend)

```bash
# .env (Development)
VITE_DEMO_MODE=true                        # Disable auth for demo
VITE_API_URL=/api/v1                       # API base path
VITE_AI_BRAIN_URL=http://localhost:8002   # AI Brain URL (legacy)
```

### Frontend API Client (src/api/client.ts)

**Base Configuration:**

```typescript
constructor(baseURL?: string) {
  // Force relative path for both dev & production
  this.baseURL = baseURL || '/api/v1';
  this.loadTokens();
}
```

**Key Features:**
- JWT token management (localStorage + sessionStorage)
- CSRF token protection
- Automatic token refresh (401 handling)
- Demo mode support (bypasses auth)
- Upload progress tracking
- Entitlement/billing checks

**API Methods Available:**

```typescript
// Authentication
apiClient.register(data, rememberMe)
apiClient.login(data, rememberMe)
apiClient.logout()
apiClient.getCurrentUser()

// Projects
apiClient.listProjects(params)
apiClient.createProject(data)
apiClient.getProject(id)
apiClient.updateProject(id, data)
apiClient.deleteProject(id)

// Tracks & Clips
apiClient.listTracks(projectId)
apiClient.createTrack(data)
apiClient.createClip(data)

// Audio Processing
apiClient.uploadAudio(projectId, file, onProgress)
apiClient.autoComp(audioFileIds, options)
apiClient.timeAlign(audioFileId, options)
apiClient.pitchCorrect(audioFileId, options)
apiClient.autoMix(trackIds, options)

// AI Features
apiClient.sendMessage(conversationId, message)
apiClient.generateBeat(params)
apiClient.generateLyrics(params)
apiClient.generateMelody(params)

// Billing
apiClient.getEntitlements()
apiClient.createCheckout(plan)
apiClient.createPortal()
```

### WebSocket Client (Frontend)

**Connection Pattern:**

```typescript
// src/api/websocket.ts
const getWebSocketUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:3100';

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  // Production: wss://dawg-ai.com
  // Development: ws://localhost:3100
  return `${protocol}//${host}`;
};
```

**Socket.IO Namespaces:**
- `/` - Main namespace (general events)
- `/ai-brain` - AI chat streaming
- `/realtime-voice` - Voice analysis

---

## ⚙️ Backend Configuration

### Unified Backend Server (src/backend/unified-server.ts)

**Purpose:** Consolidates 3 separate backend services into one:
- Main Backend (port 3001) → Express REST API
- AI Brain (port 8002) → Claude AI chat
- Realtime Voice (port 3003) → OpenAI Realtime + Voice analysis

**Port:** 3100 (development), Serverless (production)

**CORS Configuration:**

```typescript
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://dawg-ai.com'
];
```

**Main Routes:**

```typescript
app.use('/api/generate', generationRoutes);          // Music generation
app.use('/api/tracks', trackRoutes);                 // Track management
app.use('/api/cost-monitoring', costMonitoringRoutes); // AI cost tracking
app.use('/api/lyrics', lyricsRoutes);                // Lyrics generation
app.use('/api/clips', clipsRoutes);                  // Audio clips
app.use('/api/advanced-features', advancedFeaturesRoutes); // Premium features
```

**Socket.IO Namespaces:**

```typescript
const mainNamespace = io.of('/');
const aiBrainNamespace = io.of('/ai-brain');
const realtimeVoiceNamespace = io.of('/realtime-voice');
```

### Gateway Server (src/gateway/server.ts)

**Purpose:** Secure SSH/terminal access for AI agents
**Port:** 3002

**Security Features:**
- Command whitelisting/blacklisting
- ChatGPT CLI mode (allows AI tools when enabled)
- Session management & timeouts
- Telemetry tracking

**Allowed Commands (Base):**
```bash
git, ps, top, df, free, ls, cat, grep, pwd, echo, vim, nano
```

**Allowed Commands (ChatGPT Mode):**
```bash
+ node, gemini, codex, claude, python3, npx, export, gh
```

**Configuration:**

```typescript
export const config = {
  port: parseInt(process.env.GATEWAY_PORT || '3002', 10),
  sessionTTL: 3600000,        // 1 hour
  maxSessions: 6,
  enableAI: process.env.ENABLE_AI === 'true',
  privilegedApproval: process.env.PRIVILEGED_APPROVAL === 'true',
};
```

---

## 🌐 API Endpoints

### REST API Structure

```
/api/v1
├── /auth
│   ├── POST /register          # Create new user
│   ├── POST /login             # User login
│   ├── POST /logout            # User logout
│   ├── GET  /me                # Get current user
│   ├── PUT  /me                # Update profile
│   └── POST /refresh           # Refresh JWT token
│
├── /projects
│   ├── GET    /                # List projects
│   ├── POST   /                # Create project
│   ├── GET    /:id             # Get project
│   ├── PUT    /:id             # Update project
│   ├── DELETE /:id             # Delete project
│   └── GET    /:id/export      # Export project
│
├── /tracks
│   ├── GET    /project/:id     # List tracks for project
│   ├── POST   /                # Create track
│   ├── GET    /:id             # Get track
│   ├── PUT    /:id             # Update track
│   └── DELETE /:id             # Delete track
│
├── /clips
│   ├── GET    /track/:id       # List clips for track
│   ├── POST   /                # Create clip
│   ├── PUT    /:id             # Update clip
│   └── DELETE /:id             # Delete clip
│
├── /audio
│   ├── POST   /upload          # Upload audio file
│   ├── GET    /:id             # Get audio metadata
│   ├── GET    /:id/download    # Get download URL
│   └── DELETE /:id             # Delete audio file
│
├── /generate
│   ├── POST   /beat            # Generate beat
│   ├── POST   /lyrics          # Generate lyrics
│   ├── POST   /melody          # Generate melody
│   ├── POST   /stems           # Generate stems
│   ├── POST   /mix             # Auto-mix tracks
│   ├── POST   /master          # Master track
│   └── GET    /status/:jobId   # Get job status
│
├── /ai
│   ├── POST   /autocomp        # Auto-comp vocals
│   ├── POST   /timealign       # Time alignment
│   ├── POST   /pitchcorrect    # Pitch correction
│   ├── POST   /mix             # AI mixing
│   └── POST   /dawg            # Full AI processing
│
├── /chat
│   ├── POST   /message         # Send chat message
│   ├── GET    /conversations   # List conversations
│   ├── POST   /conversations   # Create conversation
│   └── DELETE /conversations/:id # Delete conversation
│
└── /billing
    ├── GET    /entitlements    # Get user plan & limits
    ├── POST   /checkout        # Create Stripe checkout
    └── POST   /portal          # Create customer portal
```

### Vercel Serverless Functions (Production)

**Current Deployment:**

```
/api/health                     → api/health.js
/api/ai-brain/chat              → api/ai-brain/chat.js
```

**Both functions include:**
- CORS headers (dawg-ai.com, localhost, *.vercel.app)
- Error handling
- Environment variable validation

---

## 🔌 WebSocket Integration

### Socket.IO Events

**Main Namespace (`/`):**

```typescript
// Server → Client
socket.emit('generation:progress', { jobId, progress, stage });
socket.emit('generation:complete', { jobId, result });
socket.emit('generation:error', { jobId, error });
socket.emit('project:updated', { projectId, changes });
socket.emit('track:updated', { trackId, changes });

// Client → Server
socket.on('subscribe:project', (projectId));
socket.on('unsubscribe:project', (projectId));
```

**AI Brain Namespace (`/ai-brain`):**

```typescript
// Client → Server
socket.emit('chat:message', { conversationId, message });

// Server → Client (streaming)
socket.emit('chat:token', { conversationId, token });
socket.emit('chat:complete', { conversationId, messageId, fullText });
socket.emit('chat:error', { conversationId, error });
```

**Realtime Voice Namespace (`/realtime-voice`):**

```typescript
// Client → Server
socket.emit('audio:chunk', { audioData });
socket.emit('start:session', { config });
socket.emit('stop:session');

// Server → Client
socket.emit('transcript:partial', { text });
socket.emit('transcript:final', { text });
socket.emit('function:call', { name, args });
```

### Room-based Subscriptions

```typescript
// User joins project room
socket.join(`project:${projectId}`);

// Broadcast to all users in project
io.to(`project:${projectId}`).emit('project:updated', data);

// User-specific events
io.to(`user:${userId}`).emit('notification', data);
```

---

## 🔐 Environment Variables

### Development (.env)

```bash
#─────────────────────────────────────────
# Application
#─────────────────────────────────────────
NODE_ENV=development
PORT=3001                                    # Legacy - now 3100
VITE_API_URL=/api/v1
VITE_DEMO_MODE=true                          # Bypass auth in demo
VITE_AI_BRAIN_URL=http://localhost:8002

#─────────────────────────────────────────
# AI Providers
#─────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-...          # Claude AI (ACTIVE)
OPENAI_API_KEY=sk-proj-...                  # OpenAI (ACTIVE)
GOOGLE_AI_API_KEY=                          # Gemini (optional)

#─────────────────────────────────────────
# Database
#─────────────────────────────────────────
DATABASE_URL=file:./dev.db                   # SQLite (dev)
# DATABASE_URL=postgresql://...             # PostgreSQL (prod)

#─────────────────────────────────────────
# Redis (Job Queue & WebSocket)
#─────────────────────────────────────────
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

#─────────────────────────────────────────
# AWS S3 (Audio Storage)
#─────────────────────────────────────────
USE_S3=false                                 # Use local storage in dev
AWS_S3_BUCKET=dawg-ai-audio-development
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

#─────────────────────────────────────────
# WebSocket
#─────────────────────────────────────────
WEBSOCKET_PORT=3003
WEBSOCKET_REDIS_ADAPTER=false                # Single instance in dev
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://dawg-ai.com

#─────────────────────────────────────────
# Job Queue (BullMQ)
#─────────────────────────────────────────
GENERATION_QUEUE_CONCURRENCY=5
GENERATION_JOB_TIMEOUT=30000                 # 30 seconds
GENERATION_JOB_ATTEMPTS=3

#─────────────────────────────────────────
# Feature Flags
#─────────────────────────────────────────
FEATURE_CHAT_TO_CREATE=true
FEATURE_COLLABORATION=true
FEATURE_AI_MIXING=true
ENABLE_AI=true

#─────────────────────────────────────────
# Music Generation
#─────────────────────────────────────────
REPLICATE_API_TOKEN=r8_...                   # MusicGen
MUSICAPI_AI_KEY=5fae426...                   # Suno (professional)
MUSIC_GENERATION_PROVIDER=udio               # or "suno"

#─────────────────────────────────────────
# Expert Music AI
#─────────────────────────────────────────
EXPERT_MUSIC_AI_ENABLED=true
EXPERT_MUSIC_AI_URL=http://localhost:8003

#─────────────────────────────────────────
# Stripe (Billing)
#─────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

#─────────────────────────────────────────
# Gateway/SSH
#─────────────────────────────────────────
GATEWAY_PORT=3002
CHATGPT_CLI_MODE=true                        # Enable AI CLI tools
ENABLE_AI=true
PRIVILEGED_APPROVAL=true
```

### Production (Vercel Environment Variables)

**Required for current deployment:**

```bash
ANTHROPIC_API_KEY=sk-ant-...                 # For /api/ai-brain/chat
NODE_ENV=production
```

**Required for full backend migration:**

```bash
# Database
DATABASE_URL=postgresql://...                # Supabase/Neon PostgreSQL

# Redis
REDIS_URL=redis://...                        # Upstash Redis

# AWS S3
USE_S3=true
AWS_S3_BUCKET=dawg-ai-audio-production
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# CORS
CORS_ORIGINS=https://dawg-ai.com,https://www.dawg-ai.com

# Features
FEATURE_CHAT_TO_CREATE=true
FEATURE_COLLABORATION=true
FEATURE_AI_MIXING=true
```

---

## 💡 Suggested Improvements

### 🔧 Configuration Issues

#### 1. **Inconsistent Port Usage**
**Problem:**
- Legacy code references port 3001 (old main server)
- Unified server uses port 3100
- Some files still hardcoded to localhost:3001

**Files affected:**
- `src/modules/music/music-production-domain.ts` (10+ occurrences)
- `src/api/sdk/client.ts`
- `src/monitor/Dashboard.jsx`
- `src/ui/components/CostMonitoringDashboard.tsx`

**Suggested Fix:**
```typescript
// Create centralized config file
// src/config/api.ts
export const API_CONFIG = {
  dev: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3100',
    wsURL: 'ws://localhost:3100',
  },
  prod: {
    baseURL: '/api/v1',
    wsURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`,
  }
};

// Use throughout app:
import { API_CONFIG } from '@/config/api';
const config = import.meta.env.PROD ? API_CONFIG.prod : API_CONFIG.dev;
```

#### 2. **Hardcoded localhost URLs**
**Problem:** 50+ hardcoded localhost URLs in codebase

**Suggested Fix:**
```bash
# Replace all hardcoded URLs with environment variables
VITE_BACKEND_URL=http://localhost:3100
VITE_GATEWAY_URL=http://localhost:3002
VITE_WS_URL=ws://localhost:3100
VITE_EXPERT_MUSIC_URL=http://localhost:8003
```

Then use: `import.meta.env.VITE_BACKEND_URL`

#### 3. **Demo Mode Confusion**
**Problem:**
- `VITE_DEMO_MODE=true` in .env but not documented
- Bypasses authentication but keeps AI features
- Not clear when it should be enabled/disabled

**Suggested Fix:**
```typescript
// src/config/demo.ts
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

export const DEMO_CONFIG = {
  skipAuth: isDemoMode,
  showUpgradeBanners: !isDemoMode,
  maxProjects: isDemoMode ? 1 : Infinity,
  allowedFeatures: isDemoMode ? ['basic_mixing', 'ai_chat'] : 'all',
};
```

### 🚀 Production Deployment Gaps

#### 4. **Incomplete Vercel Migration**
**Current State:**
- ✅ Frontend deployed to Vercel
- ✅ 2 API functions deployed (/health, /ai-brain/chat)
- ❌ Full backend not migrated

**Missing Functionality:**
- Project management (/api/projects/*)
- Track/clip operations (/api/tracks/*, /api/clips/*)
- Audio upload (/api/audio/upload)
- Music generation (/api/generate/*)
- AI features (/api/ai/*)
- Billing (/api/billing/*)
- WebSocket connections (not supported in Vercel)

**Suggested Fix:**

**Option A: Hybrid Architecture (Recommended)**
```
Frontend (Vercel) → Vercel Functions (simple endpoints)
                  → Railway/Fly.io (WebSocket + heavy processing)
```

**Option B: Full Vercel**
```
- Migrate REST endpoints to serverless functions
- Use Pusher/Ably for WebSocket replacement
- Use Upstash Redis for job queue
- Keep heavy processing in separate service
```

**Option C: Back to Railway/Fly.io**
```
- Deploy unified-server.ts to Railway/Fly.io
- Use Vercel only for static frontend
- Simpler architecture, more traditional
```

#### 5. **No WebSocket Support on Vercel**
**Problem:**
- Socket.IO requires persistent connections
- Vercel functions are stateless
- Real-time features won't work in production

**Suggested Alternatives:**
```typescript
// Option 1: Use Pusher (managed WebSocket)
import Pusher from 'pusher-js';
const pusher = new Pusher(process.env.VITE_PUSHER_KEY, {
  cluster: 'us2',
});
const channel = pusher.subscribe('project-123');

// Option 2: Use Ably (real-time messaging)
import Ably from 'ably';
const ably = new Ably.Realtime(process.env.VITE_ABLY_KEY);

// Option 3: Deploy Socket.IO server separately
// Keep on Railway/Fly.io at wss://ws.dawg-ai.com
```

### 🔒 Security Improvements

#### 6. **API Keys Exposed in .env**
**Problem:**
- API keys committed to .env file
- Should use .env.example with placeholders

**Suggested Fix:**
```bash
# .env.example (commit this)
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE

# .env (DO NOT COMMIT - add to .gitignore)
ANTHROPIC_API_KEY=sk-ant-api03-JPhD1tCdTQ2Y4...
OPENAI_API_KEY=sk-proj-mSHCOx1JUmNYkI2mpIL5...
```

Update `.gitignore`:
```
.env
.env.local
.env.production
```

#### 7. **CORS Configuration Scattered**
**Problem:** CORS settings duplicated across multiple files

**Centralize:**
```typescript
// src/config/cors.ts
export const CORS_CONFIG = {
  development: [
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  production: [
    'https://dawg-ai.com',
    'https://www.dawg-ai.com',
  ],
};

export const getAllowedOrigins = () => {
  return process.env.NODE_ENV === 'production'
    ? CORS_CONFIG.production
    : [...CORS_CONFIG.development, ...CORS_CONFIG.production];
};
```

### 📦 Code Organization

#### 8. **Monorepo Structure Needed**
**Current:** Everything in one package
**Problem:** Frontend, backend, gateway all mixed

**Suggested Structure:**
```
ai-dawg-deploy/
├── packages/
│   ├── frontend/          # React/Vite UI
│   ├── backend/           # Express server
│   ├── gateway/           # SSH gateway
│   ├── shared/            # Shared types & utils
│   └── functions/         # Vercel serverless functions
├── package.json           # Root package.json (workspaces)
└── turbo.json            # Turborepo config (optional)
```

Benefits:
- Clear separation of concerns
- Independent deployments
- Better TypeScript path resolution
- Easier testing

#### 9. **Environment Variable Schema Validation**
**Current:** Manual checks scattered throughout code
**Better:** Use Zod schema (already exists!)

**File:** `src/shared/schemas/env.schema.ts`

**Use it:**
```typescript
// src/config/env.ts
import { envSchema } from '@/shared/schemas/env.schema';

export const env = envSchema.parse(process.env);

// Now use typed env vars:
console.log(env.ANTHROPIC_API_KEY); // Type-safe!
```

### 🧪 Testing & Monitoring

#### 10. **Missing Health Checks**
**Add comprehensive health checks:**

```typescript
// api/health.js (enhanced)
export default async function handler(req, res) {
  const checks = {
    api: true,
    database: await checkDatabase(),
    redis: await checkRedis(),
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  };

  const healthy = Object.values(checks).every(Boolean);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    service: 'vercel-backend',
    timestamp: new Date().toISOString(),
    checks,
  });
}
```

#### 11. **Add Error Tracking**
**Current:** Console.log errors
**Better:** Use Sentry

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Catch errors
app.use(Sentry.Handlers.errorHandler());
```

### ⚡ Performance

#### 12. **Bundle Size Optimization**
**Current:** vite.config.ts has good chunking
**Additional:**

```typescript
// Add compression in production
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    compression({ algorithm: 'brotliCompress' })
  ],
  build: {
    minify: 'terser', // Better minification than esbuild
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in prod
      },
    },
  },
});
```

---

## 📊 Summary

### Current State

**✅ Working Well:**
- Unified backend consolidation (saved $10-15/mo)
- Frontend deployed to Vercel with DNS
- API client with JWT auth
- Demo mode for testing
- Comprehensive AI integrations

**⚠️ Needs Attention:**
- Inconsistent port configurations (3001 vs 3100)
- 50+ hardcoded localhost URLs
- Incomplete Vercel migration (only 2 endpoints)
- No WebSocket support in production
- API keys in committed .env file
- Scattered CORS configuration

**❌ Missing for Production:**
- Full REST API deployment
- WebSocket/real-time features
- Database connection (PostgreSQL)
- Redis for job queue
- S3 for audio storage
- Comprehensive error tracking
- Load testing & monitoring

### Recommended Next Steps

1. **Immediate (Week 1):**
   - [ ] Move API keys to .env.local (not committed)
   - [ ] Create centralized config/api.ts
   - [ ] Replace hardcoded localhost URLs
   - [ ] Document DEMO_MODE usage

2. **Short-term (Month 1):**
   - [ ] Decide on production architecture (Hybrid vs Full Vercel)
   - [ ] Migrate remaining API endpoints
   - [ ] Implement WebSocket alternative (Pusher/Ably)
   - [ ] Add Sentry error tracking
   - [ ] Set up production database (Supabase)

3. **Medium-term (Quarter 1):**
   - [ ] Consider monorepo structure
   - [ ] Add comprehensive E2E tests
   - [ ] Implement rate limiting
   - [ ] Add API documentation (Swagger)
   - [ ] Performance optimization & caching

---

**Questions or Issues?** Review this document and make decisions on architecture before proceeding with production deployment.
