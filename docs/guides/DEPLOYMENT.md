# DAWG AI Deployment Guide

## Architecture Overview

### Unified Backend (Cost Optimization)

DAWG AI now uses a **consolidated backend architecture** that reduces deployment costs from **$20/month to $5/month** on Railway.

### Before (4 Railway Services - $20/mo)
```
┌─────────────┐
│   Netlify   │  Frontend (Static hosting)
│  dawg-ai.com│
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Gateway   │  Railway Service 1 ($5/mo)
│  Port: Auto │  - Routes requests
└──────┬──────┘  - Proxies to backends
       │
       ├──────►┌─────────────────┐
       │       │ Main Backend    │  Railway Service 2 ($5/mo)
       │       │ Port: 3001      │
       │       └─────────────────┘
       │
       ├──────►┌─────────────────┐
       │       │ AI Brain        │  Railway Service 3 ($5/mo)
       │       │ Port: 8002      │
       │       └─────────────────┘
       │
       └──────►┌─────────────────┐
               │ Realtime Voice  │  Railway Service 4 ($5/mo)
               │ Port: 3100      │
               └─────────────────┘
```

### After (1 Railway Service - $5/mo) ✅
```
┌─────────────┐
│   Netlify   │  Frontend (Static hosting - FREE)
│  dawg-ai.com│
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────┐
│   Unified Backend                   │  Railway Service ($5/mo)
│   Port: 3001                        │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Main Backend Routes         │  │
│  │  /api/generate               │  │
│  │  /api/tracks                 │  │
│  │  /api/lyrics                 │  │
│  │  Socket.IO: /                │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  AI Brain Routes             │  │
│  │  /api/ai-brain/*             │  │
│  │  Socket.IO: /ai-brain        │  │
│  │  (Claude 3.5 Sonnet)         │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Realtime Voice Routes       │  │
│  │  /api/voice/*                │  │
│  │  Socket.IO: /voice           │  │
│  │  (OpenAI Realtime API)       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Cost Savings: $15/month (75% reduction)**

## Services Breakdown

### 1. Main Backend
- **Routes**: `/api/generate`, `/api/tracks`, `/api/lyrics`, `/api/clips`, `/api/v1/*`
- **WebSocket**: Socket.IO namespace `/` (default)
- **Purpose**: Core DAW operations (tracks, clips, generation, lyrics)
- **External APIs**: Replicate (MusicGen), Suno API, AWS S3

### 2. AI Brain
- **Routes**: `/api/ai-brain/*`
- **WebSocket**: Socket.IO namespace `/ai-brain`
- **Purpose**: Claude-powered text chat for DAW control
- **External API**: Anthropic Claude 3.5 Sonnet
- **Why Separate Namespace**: Expensive API calls, needs rate limiting

### 3. Realtime Voice
- **Routes**: `/api/voice/*`
- **WebSocket**: Socket.IO namespace `/voice`
- **Purpose**: OpenAI Realtime API for live voice interaction
- **External API**: OpenAI GPT-4o Realtime
- **Why Separate Namespace**: WebSocket-heavy, different scaling needs

## Environment Variables

### Required for All Services
```bash
# CORS Configuration
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,https://dawg-ai.com"

# Main Backend
BACKEND_PORT=3001
REPLICATE_API_KEY=your_replicate_key
SUNO_API_KEY=your_suno_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket

# AI Brain (Anthropic)
ANTHROPIC_API_KEY=your_anthropic_key

# Realtime Voice (OpenAI)
OPENAI_API_KEY=your_openai_key

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Redis (optional, for clustering)
REDIS_URL=redis://host:port
WEBSOCKET_REDIS_ADAPTER=false
```

## Deployment Instructions

### 1. Netlify (Frontend)

**Already configured** - No changes needed!

```toml
# netlify.toml (already updated)
[build]
  command = "npm run build:ui"
  publish = "dist"

[context.production.environment]
  VITE_API_URL = "https://dawg-ai-backend-production.up.railway.app/api"
  VITE_WEBSOCKET_URL = "https://dawg-ai-backend-production.up.railway.app"
  VITE_AI_BRAIN_URL = "https://dawg-ai-backend-production.up.railway.app"
  VITE_REALTIME_VOICE_URL = "https://dawg-ai-backend-production.up.railway.app"
```

### 2. Railway (Unified Backend)

#### Option A: Update Existing "backend" Service

1. **Go to Railway Dashboard**: https://railway.app
2. **Select "dawg-ai-backend" service**
3. **Environment Variables**: Verify all required env vars are set (see list above)
4. **Deploy**: Push to main branch

```bash
git add .
git commit -m "Consolidate backends into unified server"
git push origin main
```

Railway will automatically:
- Detect changes
- Run `start.sh` (which now runs `unified-server.ts`)
- Deploy to production

#### Option B: Create New Railway Service

1. **Create New Service** in Railway Dashboard
2. **Connect GitHub** repository
3. **Set Environment Variables** (copy from list above)
4. **Configure Build**:
   - Start Command: `sh start.sh`
   - Healthcheck Path: `/health`
5. **Deploy**

### 3. Delete Old Railway Services (**Save $15/month**)

Once the unified backend is deployed and working:

1. **Delete** `dawg-ai-ai-brain` service
2. **Delete** `dawg-ai-realtime-voice` service
3. **Optional**: Delete `dawg-ai-gateway` (if not using terminal features)

## Local Development

### Start Unified Backend
```bash
pnpm run dev:unified
```

Starts all 3 services on port 3001:
- Main Backend: `http://localhost:3001/api/*`
- AI Brain: `http://localhost:3001/api/ai-brain/*`
- Realtime Voice: `http://localhost:3001/api/voice/*`

### Start Frontend
```bash
pnpm run dev:ui
```

Frontend runs on `http://localhost:5174` and connects to local backend.

### Health Checks

```bash
# Unified health check
curl http://localhost:3001/health

# Individual service health
curl http://localhost:3001/api/ai-brain/health
curl http://localhost:3001/api/voice/health
```

## WebSocket Connections

### Frontend Connection Examples

**Main Backend WebSocket:**
```typescript
import { io } from 'socket.io-client';

const socket = io('https://dawg-ai-backend-production.up.railway.app', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
```

**AI Brain WebSocket:**
```typescript
const aiBrainSocket = io('https://dawg-ai-backend-production.up.railway.app/ai-brain', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

aiBrainSocket.emit('message', { message: 'Help me mix this track' });
```

**Realtime Voice WebSocket:**
```typescript
const voiceSocket = io('https://dawg-ai-backend-production.up.railway.app/voice', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

voiceSocket.emit('start-realtime', { voice: 'alloy' });
```

## Migration Checklist

- [x] Create unified-server.ts
- [x] Update start.sh
- [x] Update package.json scripts
- [x] Update netlify.toml
- [x] Test locally
- [ ] Deploy to Railway
- [ ] Test production
- [ ] Delete old Railway services
- [ ] Update DNS/domains if needed
- [ ] Monitor logs for errors

## Rollback Plan

If something goes wrong:

1. **Keep old services running** until unified backend is verified
2. **Revert netlify.toml** to point back to gateway:
   ```toml
   VITE_API_URL = "https://dawg-ai-gateway-production.up.railway.app/api/v1"
   ```
3. **Restore from backup**:
   ```bash
   cp src/backend/server.ts.pre-consolidation src/backend/server.ts
   ```

## Monitoring

### Railway Logs
```bash
# View unified backend logs
railway logs

# Filter by service
railway logs | grep "ai-brain"
railway logs | grep "voice"
```

### Health Monitoring
```bash
# Check all services
curl https://dawg-ai-backend-production.up.railway.app/health

# Expected response:
{
  "status": "healthy",
  "service": "unified-backend",
  "services": {
    "main": "healthy",
    "ai_brain": "healthy",
    "realtime_voice": "healthy"
  },
  "timestamp": "2025-10-19T...",
  "version": "2.0.0"
}
```

## Troubleshooting

### "Port already in use" error
```bash
# Kill processes on backend ports
lsof -ti:3001,3100,8002 | xargs kill -9
```

### WebSocket connection fails
- Check CORS_ORIGINS includes your frontend domain
- Verify SSL certificate is valid
- Check Railway logs for connection errors

### API calls return 404
- Verify routes are correctly mounted in unified-server.ts
- Check netlify.toml has correct API_URL
- Test with curl to isolate frontend vs backend issue

## Support

- **Railway Dashboard**: https://railway.app
- **Netlify Dashboard**: https://app.netlify.com
- **Repository Issues**: https://github.com/your-org/ai-dawg/issues
