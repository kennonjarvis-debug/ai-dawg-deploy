# Railway Multi-Service Setup for DAWG AI

## Overview

DAWG AI requires **3 separate Railway services** to run properly:

1. **Backend Service** - Main DAW API (port 3001)
2. **AI Brain Service** - Text chat AI (port 8002)
3. **Realtime Voice Service** - Voice chat AI (port 3100)

---

## How to Set Up in Railway

### Step 1: Create Project (if not exists)

```bash
railway login
railway init
```

### Step 2: Create 3 Services

In Railway dashboard:
1. Go to your project
2. Click "+ New Service" for each service below

---

## Service 1: Backend (Main DAW API)

**Service Name**: `dawg-backend`

**Environment Variables**:
```bash
SERVICE_TYPE=backend
PORT=3001
NODE_ENV=production
DATABASE_URL=your_database_url
OPENAI_API_KEY=your_openai_key
```

**What it does**: Handles main DAW operations, audio uploads, project management

**Health Check**: `http://[service-url]/health`

---

## Service 2: AI Brain (Text Chat)

**Service Name**: `dawg-ai-brain`

**Environment Variables**:
```bash
SERVICE_TYPE=ai-brain
AI_BRAIN_PORT=8002
NODE_ENV=production
OPENAI_API_KEY=your_openai_key
```

**What it does**: Handles text chat AI with routing commands

**Endpoint**: `/api/chat`

**Health Check**: `http://[service-url]:8002/health`

---

## Service 3: Realtime Voice (Voice Chat)

**Service Name**: `dawg-realtime-voice`

**Environment Variables**:
```bash
SERVICE_TYPE=realtime-voice
PORT=3100
NODE_ENV=production
OPENAI_API_KEY=your_openai_key
```

**What it does**: Handles live voice chat via WebSocket

**Endpoint**: WebSocket on `ws://[service-url]:3100`

---

## Deployment Steps

### 1. Deploy All Services

```bash
# Deploy to backend service
railway link --service dawg-backend
railway up

# Deploy to AI brain service
railway link --service dawg-ai-brain
railway up

# Deploy to realtime voice service
railway link --service dawg-realtime-voice
railway up
```

### 2. Verify Each Service

Check logs for startup messages:

**Backend**:
```
🎛️  Starting DAW Backend Server (Main API - Port 3001)...
Backend server running on port 3001
```

**AI Brain**:
```
🧠 Starting AI Brain Server (Text Chat - Port 8002)...
🧠 AI Brain server running on port 8002
✅ OpenAI API key configured
```

**Realtime Voice**:
```
🎤 Starting Realtime Voice Server (Voice Chat - Port 3100)...
🎙️  Realtime Voice Server running on port 3100
```

---

## Environment Variables Reference

### Required for ALL Services
```bash
NODE_ENV=production
OPENAI_API_KEY=sk-...
```

### Service-Specific

**Backend**:
```bash
SERVICE_TYPE=backend
PORT=3001
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=...
```

**AI Brain**:
```bash
SERVICE_TYPE=ai-brain
AI_BRAIN_PORT=8002
```

**Realtime Voice**:
```bash
SERVICE_TYPE=realtime-voice
PORT=3100
```

---

## Current Deployment (Single Service)

If you currently have only **one Railway service**, you need to:

### Option A: Use Existing Service as Backend, Add 2 New Services

1. **Keep existing service** as `dawg-backend`
   - Set `SERVICE_TYPE=backend`

2. **Create new service** for `dawg-ai-brain`
   - Set `SERVICE_TYPE=ai-brain`

3. **Create new service** for `dawg-realtime-voice`
   - Set `SERVICE_TYPE=realtime-voice`

### Option B: Reconfigure Existing Service

If you want the existing service to be the AI Brain:

1. Go to Railway dashboard → Your service → Variables
2. Add/update: `SERVICE_TYPE=ai-brain`
3. Redeploy

Then create 2 additional services for backend and realtime-voice.

---

## Checking Which Server is Running

After deployment, check the Railway logs. You'll see one of these:

```bash
🎛️  Starting DAW Backend Server (Main API - Port 3001)...
🧠 Starting AI Brain Server (Text Chat - Port 8002)...
🎤 Starting Realtime Voice Server (Voice Chat - Port 3100)...
🚪 Starting Gateway Server...
⚠️  SERVICE_TYPE not set, defaulting to DAW Backend Server...
```

**If you see "defaulting to DAW Backend Server"**, the `SERVICE_TYPE` env var is not set. Add it in Railway dashboard.

---

## Frontend Configuration

Update frontend to point to Railway services:

**`.env.production`**:
```bash
VITE_API_URL=https://dawg-backend-production.up.railway.app
VITE_AI_BRAIN_URL=https://dawg-ai-brain-production.up.railway.app
VITE_VOICE_URL=wss://dawg-realtime-voice-production.up.railway.app
```

---

## Troubleshooting

### "AI brain not working"

**Check**:
1. Is `SERVICE_TYPE=ai-brain` set in Railway environment variables?
2. Is `OPENAI_API_KEY` set?
3. Check logs for "Starting AI Brain Server" message
4. Verify port 8002 is accessible

### "Service keeps restarting"

**Check**:
1. Railway logs for error messages
2. DATABASE_URL is correct (for backend)
3. OPENAI_API_KEY is valid
4. Dependencies installed (check build logs)

### "Wrong server starting"

**Fix**:
1. Check `SERVICE_TYPE` env var is set correctly
2. Should be exactly: `ai-brain`, `realtime-voice`, or `backend`
3. Case sensitive!

---

## Testing After Deployment

### Backend
```bash
curl https://[backend-url]/health
```

### AI Brain
```bash
curl -X POST https://[ai-brain-url]/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'
```

### Realtime Voice
```bash
# WebSocket - test via browser console
const ws = new WebSocket('wss://[voice-url]');
ws.onopen = () => console.log('Connected!');
```

---

## Service URLs

After deployment, Railway gives you URLs like:

- Backend: `https://dawg-backend-production.up.railway.app`
- AI Brain: `https://dawg-ai-brain-production.up.railway.app`
- Realtime Voice: `https://dawg-realtime-voice-production.up.railway.app`

Update your frontend `.env.production` with these URLs.

---

## Quick Fix for Current Issue

If your AI brain isn't working right now:

1. **Go to Railway Dashboard**
2. **Click your service** (e.g., dawg-ai-backend)
3. **Go to "Variables" tab**
4. **Add new variable**:
   - Name: `SERVICE_TYPE`
   - Value: `ai-brain`
5. **Click "Redeploy"**
6. **Check logs** - should see "🧠 Starting AI Brain Server"

---

## Summary

- ✅ 3 services needed for full functionality
- ✅ Each service uses same codebase
- ✅ `SERVICE_TYPE` env var determines which server runs
- ✅ `start.sh` script routes to correct server
- ✅ All services need `OPENAI_API_KEY`

**Current Issue**: Your Railway service probably doesn't have `SERVICE_TYPE=ai-brain` set, so it's defaulting to backend server instead of AI brain.
