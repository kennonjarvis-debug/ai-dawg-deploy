# DAWG AI - Production Deployment Plan

**Version:** 2.0.0
**Last Updated:** 2025-10-19
**Target Platform:** Vercel (Frontend) + Railway (Backend) + Supabase (Database) + AWS S3 (Storage)
**Domain:** dawg-ai.com

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Steps](#deployment-steps)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Plan](#rollback-plan)
6. [Monitoring & Alerts](#monitoring--alerts)
7. [Production Hardening](#production-hardening)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture Summary

```
┌─────────────────┐
│   Users/Clients │
└────────┬────────┘
         │
    ┌────▼─────┐
    │   CDN    │ (Vercel Edge Network)
    └────┬─────┘
         │
┌────────┴────────────────────────────────────────┐
│                                                  │
│  ┌──────────────┐          ┌─────────────────┐ │
│  │   Frontend   │          │  Unified Backend│ │
│  │   (Vercel)   │◄────────►│   (Railway)     │ │
│  │  Static UI   │          │  - Main API     │ │
│  └──────────────┘          │  - AI Brain     │ │
│                            │  - Voice RT     │ │
│                            └────────┬────────┘ │
│                                     │          │
│              ┌──────────────────────┼─────┐    │
│              │                      │     │    │
│      ┌───────▼──────┐     ┌────────▼───┐ │    │
│      │   Supabase   │     │   AWS S3   │ │    │
│      │  PostgreSQL  │     │   Storage  │ │    │
│      └──────────────┘     └────────────┘ │    │
│                                           │    │
│      ┌───────────────┐     ┌────────────┐│    │
│      │ External APIs │     │   Redis    ││    │
│      │ - OpenAI      │     │  (Railway) ││    │
│      │ - Anthropic   │     └────────────┘│    │
│      │ - Suno        │                    │    │
│      │ - Expert AI   │                    │    │
│      └───────────────┘                    │    │
└───────────────────────────────────────────┘    │
```

### Services Overview

| Service | Platform | Purpose | URL |
|---------|----------|---------|-----|
| Frontend | Vercel | React UI, Static Assets | https://dawg-ai.com |
| Unified Backend | Railway | API, WebSocket, AI Services | https://api.dawg-ai.com |
| Database | Supabase | PostgreSQL + Auth | Managed |
| Storage | AWS S3 | Audio Files, Assets | s3://dawg-ai-audio-production |
| Redis | Railway | Job Queue, Cache, Sessions | Internal |

### Cost Estimate
- **Frontend (Vercel):** $0-20/month (Pro plan if needed)
- **Backend (Railway):** $5/month (consolidated unified backend)
- **Database (Supabase):** $0-25/month (Free tier or Pro)
- **Storage (AWS S3):** ~$5-20/month (usage-based)
- **External APIs:** Variable (usage-based)
- **Total:** ~$15-70/month

---

## Pre-Deployment Checklist

### 1. Environment Variables Verification

#### 1.1 Verify All Required Variables

```bash
#!/bin/bash
# Run this script to verify all environment variables

echo "🔍 Verifying Environment Variables..."

# AI Provider Keys
required_vars=(
  "ANTHROPIC_API_KEY"
  "OPENAI_API_KEY"
  "GOOGLE_AI_API_KEY"
  "DATABASE_URL"
  "REDIS_URL"
  "AWS_S3_BUCKET"
  "AWS_ACCESS_KEY_ID"
  "AWS_SECRET_ACCESS_KEY"
  "AWS_REGION"
  "JWT_SECRET"
  "SESSION_SECRET"
  "STRIPE_SECRET_KEY"
  "STRIPE_WEBHOOK_SECRET"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
    echo "❌ Missing: $var"
  else
    echo "✅ Found: $var"
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  Missing ${#missing_vars[@]} required variables!"
  exit 1
else
  echo ""
  echo "✅ All required environment variables are set!"
  exit 0
fi
```

**Expected Output:**
```
✅ Found: ANTHROPIC_API_KEY
✅ Found: OPENAI_API_KEY
✅ Found: GOOGLE_AI_API_KEY
...
✅ All required environment variables are set!
```

#### 1.2 Test API Keys

```bash
# Test OpenAI API Key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  | jq '.data[0].id'

# Expected: "gpt-4o" or similar model name

# Test Anthropic API Key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1,
    "messages": [{"role": "user", "content": "Hi"}]
  }' | jq '.type'

# Expected: "message"
```

#### 1.3 Railway Environment Variables

Set these in Railway dashboard for your unified backend service:

```bash
# Application
NODE_ENV=production
PORT=3000

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# Redis (Railway internal)
REDIS_URL=redis://default:[password]@[host]:6379

# AWS S3
AWS_S3_BUCKET=dawg-ai-audio-production
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Security
JWT_SECRET=[generate-secure-random-string-64-chars]
SESSION_SECRET=[generate-secure-random-string-64-chars]

# CORS
CORS_ORIGINS=https://dawg-ai.com,https://www.dawg-ai.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Feature Flags
FEATURE_CHAT_TO_CREATE=true
FEATURE_COLLABORATION=true
FEATURE_AI_MIXING=true

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
SENTRY_DSN=[optional-sentry-dsn]
```

#### 1.4 Vercel Environment Variables

Set these in Vercel dashboard:

```bash
# API Configuration
VITE_API_URL=https://api.dawg-ai.com
VITE_AI_BRAIN_URL=https://api.dawg-ai.com
VITE_REALTIME_VOICE_URL=https://api.dawg-ai.com

# Demo Mode
VITE_DEMO_MODE=false

# Stripe (Public Keys Only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Analytics (Optional)
VITE_GOOGLE_ANALYTICS_ID=[optional]
VITE_SENTRY_DSN=[optional]
```

### 2. Database Migrations

#### 2.1 Backup Current Database

```bash
# Backup Supabase database
pg_dump "$DATABASE_URL" > "backup-$(date +%Y%m%d-%H%M%S).sql"

# Verify backup
ls -lh backup-*.sql

# Expected: File size > 0 bytes
```

#### 2.2 Test Migrations on Staging

```bash
# Run migrations in dry-run mode
npx prisma migrate deploy --preview-feature

# Expected output:
# "Database schema is up to date!"
```

#### 2.3 Run Production Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Deploy migrations
npx prisma migrate deploy

# Expected output:
# "The following migration(s) have been applied:
#  migrations/
#    └─ 20XXXXXX_init/
#        └─ migration.sql
# All migrations have been successfully applied."
```

#### 2.4 Verify Database Schema

```bash
# Connect to database and verify tables
psql "$DATABASE_URL" -c "\dt"

# Expected tables:
# - User
# - Session
# - Conversation
# - Message
# - Generation
# - AIMemory
# - Project
```

### 3. API Key Validation

#### 3.1 Test External Service Integration

```bash
# Test Suno API (if configured)
curl -X POST https://api.suno.ai/v1/generate \
  -H "Authorization: Bearer $SUNO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}' \
  | jq '.status'

# Test Expert Music AI
curl https://expert-music-ai-url.com/health

# Expected: {"status": "healthy"}
```

### 4. Service Health Checks

#### 4.1 Local Health Check

```bash
# Start unified backend locally
npm run dev:unified

# Test health endpoint
curl http://localhost:3000/health | jq '.'

# Expected:
# {
#   "status": "healthy",
#   "service": "unified-backend",
#   "services": {
#     "main": true,
#     "ai-brain": true,
#     "voice": true
#   },
#   "connections": {
#     "database": true,
#     "redis": true,
#     "s3": true
#   },
#   "timestamp": "2025-10-19T..."
# }
```

#### 4.2 Component Health Checks

```bash
# Test AI Brain health
curl http://localhost:3000/api/ai-brain/health | jq '.'

# Expected:
# {
#   "status": "healthy",
#   "service": "ai-brain",
#   "anthropic_configured": true
# }

# Test Voice service health
curl http://localhost:3000/api/voice/health | jq '.'

# Expected:
# {
#   "status": "healthy",
#   "service": "realtime-voice",
#   "openai_configured": true,
#   "functions_cached": 15
# }
```

### 5. SSL/TLS Certificates

#### 5.1 Vercel SSL (Automatic)

- Vercel automatically provisions SSL certificates for custom domains
- Verify certificate in Vercel dashboard under "Domains"
- Ensure HTTPS redirect is enabled

#### 5.2 Railway SSL (Automatic)

- Railway provides SSL for `.railway.app` domains
- For custom domains, add domain in Railway dashboard
- Railway auto-provisions Let's Encrypt certificates

#### 5.3 Verify SSL Configuration

```bash
# Test SSL certificate
echo | openssl s_client -servername dawg-ai.com -connect dawg-ai.com:443 2>/dev/null | openssl x509 -noout -dates

# Expected:
# notBefore=...
# notAfter=... (should be in future)

# Test SSL rating
curl https://www.ssllabs.com/ssltest/analyze.html?d=dawg-ai.com
```

### 6. DNS Configuration

#### 6.1 Vercel DNS Records

Add these DNS records in your domain registrar:

```
# A Record (or CNAME for root domain)
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP)
TTL: 3600

# CNAME for www
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600

# CNAME for API (Railway)
Type: CNAME
Name: api
Value: [your-service].railway.app
TTL: 3600
```

#### 6.2 Verify DNS Propagation

```bash
# Check DNS resolution
dig dawg-ai.com +short
dig www.dawg-ai.com +short
dig api.dawg-ai.com +short

# Expected: IP addresses resolving correctly

# Check DNS propagation globally
curl https://www.whatsmydns.net/dawg-ai.com/A
```

### 7. Pre-Deployment Testing

#### 7.1 Run Full Test Suite

```bash
# Unit tests
npm run test:unit

# Expected: All tests passing

# Integration tests
npm run test:integration

# Expected: All tests passing

# E2E tests (against staging)
VITE_API_URL=https://staging-api.dawg-ai.com npm run test:e2e

# Expected: All critical paths passing
```

#### 7.2 Load Testing

```bash
# Install k6 (if not installed)
brew install k6  # macOS
# or: sudo apt install k6  # Ubuntu

# Run API load test
k6 run tests/load/api-load-test.js

# Expected:
# ✓ http_req_duration..............: avg=150ms p95=300ms
# ✓ http_req_failed................: 0.00%
# ✓ http_reqs......................: 10000

# Run WebSocket load test
k6 run tests/load/websocket-load-test.js
```

#### 7.3 Security Scan

```bash
# Run npm audit
npm audit --production

# Expected: 0 critical vulnerabilities

# Check for exposed secrets
git secrets --scan

# Run dependency vulnerability check
npm run test:security
```

---

## Deployment Steps

### Phase 1: Database Deployment

#### Step 1: Apply Database Migrations

```bash
# Connect to production database
export DATABASE_URL="postgresql://postgres:[password]@[supabase-host]:5432/postgres"

# Run migrations
npx prisma migrate deploy

# Expected output:
# "All migrations have been successfully applied."

# Verify migration
psql "$DATABASE_URL" -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;"
```

**Expected Output:**
```
                  id                  |       name        |    started_at     |   finished_at
--------------------------------------+-------------------+-------------------+------------------
 abc123...                            | 20250115_init     | 2025-01-15 10:00  | 2025-01-15 10:01
```

#### Step 2: Seed Essential Data (Optional)

```bash
# Seed initial data if needed
npx prisma db seed

# Or manually insert essential records
psql "$DATABASE_URL" -f scripts/seed-production.sql
```

### Phase 2: Backend Deployment (Railway)

#### Step 1: Prepare Backend Build

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Tag the deployment
git tag -a production-$(date +%Y%m%d-%H%M%S) -m "Production deployment"
git push --tags

# Verify package.json scripts
cat package.json | jq '.scripts.start'

# Expected: "sh start.sh"
```

#### Step 2: Deploy to Railway

```bash
# Option 1: Auto-deploy via Git (Recommended)
# - Railway auto-deploys when you push to connected branch
git push origin main

# Option 2: Manual deploy via Railway CLI
railway login
railway link
railway up

# Monitor deployment
railway logs --follow
```

**Expected Log Output:**
```
🚀 Starting DAWG AI Unified Backend...
📦 Services: Main Backend + AI Brain + Realtime Voice
💰 Cost Savings: $15/month (consolidated from 3 services to 1)
🎛️  Starting Unified Backend Server...
✅ Connected to database
✅ Redis connected
✅ Voice function cache ready
✅ Server running on port 3000
```

#### Step 3: Verify Backend Deployment

```bash
# Get Railway service URL
RAILWAY_URL=$(railway status --json | jq -r '.url')

# Test health endpoint
curl "$RAILWAY_URL/health" | jq '.'

# Expected:
# {
#   "status": "healthy",
#   "service": "unified-backend",
#   "services": {
#     "main": true,
#     "ai-brain": true,
#     "voice": true
#   }
# }

# Test individual service endpoints
curl "$RAILWAY_URL/api/ai-brain/health" | jq '.'
curl "$RAILWAY_URL/api/voice/health" | jq '.'
```

#### Step 4: Configure Custom Domain (Optional)

```bash
# Add custom domain in Railway
railway domain add api.dawg-ai.com

# Wait for DNS propagation (5-30 minutes)
# Verify SSL certificate
curl -I https://api.dawg-ai.com

# Expected:
# HTTP/2 200
# content-type: application/json
```

### Phase 3: Frontend Deployment (Vercel)

#### Step 1: Build Frontend

```bash
# Build production frontend
npm run build:ui

# Verify build output
ls -lh dist/

# Expected:
# - index.html
# - assets/ (CSS, JS bundles)
# - manifest.json
```

#### Step 2: Deploy to Vercel

```bash
# Option 1: Auto-deploy via Git (Recommended)
git push origin main

# Vercel automatically:
# 1. Detects push to main branch
# 2. Runs build command: npm run build:ui
# 3. Deploys to production
# 4. Invalidates CDN cache

# Option 2: Manual deploy via Vercel CLI
npm install -g vercel
vercel login
vercel --prod

# Follow prompts:
# - Link to existing project
# - Confirm production deployment
```

**Expected CLI Output:**
```
🔍 Inspect: https://vercel.com/[project]/[deployment-id]
✅ Production: https://dawg-ai.com [1s]
```

#### Step 3: Verify Frontend Deployment

```bash
# Test homepage
curl -I https://dawg-ai.com

# Expected:
# HTTP/2 200
# content-type: text/html

# Test API proxy (should route to Railway backend)
curl https://dawg-ai.com/api/health | jq '.'

# Expected:
# {
#   "status": "healthy",
#   "service": "unified-backend"
# }

# Test asset loading
curl -I https://dawg-ai.com/assets/index-[hash].js

# Expected:
# HTTP/2 200
# content-type: application/javascript
# cache-control: public, max-age=31536000, immutable
```

#### Step 4: Configure Vercel Settings

In Vercel Dashboard:

1. **Domain Settings**
   - Verify `dawg-ai.com` is set as production domain
   - Add `www.dawg-ai.com` redirect
   - Enable automatic HTTPS redirect

2. **Build & Development Settings**
   - Build Command: `npm run build:ui`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Environment Variables**
   - Verify all `VITE_*` variables are set
   - Ensure `VITE_API_URL=https://api.dawg-ai.com`

### Phase 4: Cache Clearing & CDN Invalidation

#### Step 1: Clear Vercel CDN Cache

```bash
# Clear all cached assets
vercel --prod --force

# Or via API
curl -X DELETE \
  "https://api.vercel.com/v2/deployments/[deployment-id]/cache" \
  -H "Authorization: Bearer $VERCEL_TOKEN"

# Expected:
# { "status": "ok" }
```

#### Step 2: Clear Browser Cache Headers

```bash
# Verify cache headers are correct
curl -I https://dawg-ai.com/

# Expected:
# cache-control: public, max-age=0, must-revalidate (HTML)

curl -I https://dawg-ai.com/assets/index-[hash].js

# Expected:
# cache-control: public, max-age=31536000, immutable (assets)
```

#### Step 3: Clear Service Worker Cache (if applicable)

```javascript
// Add to frontend if using service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.update();
    });
  });
}
```

### Phase 5: Post-Deployment Configuration

#### Step 1: Configure Stripe Webhooks

```bash
# Update webhook endpoint in Stripe Dashboard
# URL: https://api.dawg-ai.com/api/stripe/webhook
# Events to listen for:
# - checkout.session.completed
# - customer.subscription.created
# - customer.subscription.updated
# - customer.subscription.deleted
# - invoice.payment_succeeded
# - invoice.payment_failed

# Test webhook
stripe listen --forward-to https://api.dawg-ai.com/api/stripe/webhook

# Expected:
# Ready! Your webhook signing secret is whsec_... (use it in env vars)
```

#### Step 2: Configure CORS

Verify CORS is configured correctly in backend:

```bash
# Test CORS from browser origin
curl -X OPTIONS https://api.dawg-ai.com/api/generate \
  -H "Origin: https://dawg-ai.com" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: https://dawg-ai.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Credentials: true
```

#### Step 3: Test Rate Limiting

```bash
# Test rate limits are working
for i in {1..110}; do
  curl -w "%{http_code}\n" https://api.dawg-ai.com/api/generate \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test"}' \
    -o /dev/null -s
done

# Expected:
# First 100 requests: 200 or 401 (if auth required)
# Next 10 requests: 429 (Too Many Requests)
```

---

## Post-Deployment Verification

### 1. Smoke Tests for Critical Paths

#### 1.1 User Authentication Flow

```bash
# Test registration
curl -X POST https://api.dawg-ai.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }' | jq '.'

# Expected:
# {
#   "success": true,
#   "user": { "id": "...", "email": "test@example.com" },
#   "token": "eyJ..."
# }

# Test login
curl -X POST https://api.dawg-ai.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }' | jq '.'

# Expected:
# {
#   "success": true,
#   "token": "eyJ...",
#   "user": { ... }
# }
```

#### 1.2 Music Generation Flow

```bash
# Get auth token from login
TOKEN="eyJ..."

# Test music generation
curl -X POST https://api.dawg-ai.com/api/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat electronic dance music",
    "duration": 30,
    "genre": "electronic"
  }' | jq '.'

# Expected:
# {
#   "jobId": "abc-123",
#   "status": "queued",
#   "estimatedTime": 25
# }

# Check job status
curl "https://api.dawg-ai.com/api/generate/abc-123/status" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Expected (after completion):
# {
#   "jobId": "abc-123",
#   "status": "completed",
#   "audioUrl": "https://dawg-ai-audio-production.s3.amazonaws.com/..."
# }
```

#### 1.3 AI Chat Flow

```bash
# Test AI Brain chat
curl -X POST https://api.dawg-ai.com/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me create a lofi hip hop beat",
    "conversationId": null
  }' | jq '.'

# Expected:
# {
#   "conversationId": "conv-123",
#   "message": {
#     "role": "assistant",
#     "content": "I'd be happy to help you create a lofi hip hop beat! ..."
#   }
# }
```

### 2. API Endpoint Health Checks

#### 2.1 Core Endpoints Test Suite

```bash
#!/bin/bash
# Production smoke test suite

BASE_URL="https://api.dawg-ai.com"
TOKEN="[get-from-login]"

echo "🧪 Running production smoke tests..."

# Test 1: Health check
echo "Test 1: Health check"
curl -f "$BASE_URL/health" || echo "❌ Health check failed"

# Test 2: AI Brain health
echo "Test 2: AI Brain health"
curl -f "$BASE_URL/api/ai-brain/health" || echo "❌ AI Brain health failed"

# Test 3: Voice service health
echo "Test 3: Voice service health"
curl -f "$BASE_URL/api/voice/health" || echo "❌ Voice health failed"

# Test 4: Database connectivity
echo "Test 4: Database connectivity"
curl -f "$BASE_URL/api/tracks" \
  -H "Authorization: Bearer $TOKEN" || echo "❌ Database connectivity failed"

# Test 5: S3 connectivity (upload test)
echo "Test 5: S3 connectivity"
curl -X POST "$BASE_URL/api/tracks/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-audio.mp3" || echo "❌ S3 connectivity failed"

echo "✅ Smoke tests complete!"
```

#### 2.2 Verify All Critical Endpoints

| Endpoint | Method | Expected Status | Purpose |
|----------|--------|----------------|---------|
| `/health` | GET | 200 | Service health |
| `/api/auth/register` | POST | 201 | User registration |
| `/api/auth/login` | POST | 200 | User login |
| `/api/generate` | POST | 202 | Music generation |
| `/api/tracks` | GET | 200 | Fetch user tracks |
| `/api/chat` | POST | 200 | AI chat |
| `/api/cost-monitoring/usage` | GET | 200 | Cost tracking |

### 3. WebSocket Connection Tests

#### 3.1 Test Main WebSocket

```javascript
// Run in browser console at https://dawg-ai.com
const ws = new WebSocket('wss://api.dawg-ai.com');

ws.onopen = () => {
  console.log('✅ WebSocket connected');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  console.log('📨 Message received:', event.data);
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = () => {
  console.log('🔌 WebSocket closed');
};

// Expected:
// ✅ WebSocket connected
// 📨 Message received: {"type":"pong"}
```

#### 3.2 Test AI Brain WebSocket

```javascript
const aiBrainWs = new WebSocket('wss://api.dawg-ai.com/ai-brain');

aiBrainWs.onopen = () => {
  console.log('✅ AI Brain WebSocket connected');
  aiBrainWs.send(JSON.stringify({
    message: 'Test message',
    conversationHistory: []
  }));
};

aiBrainWs.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('📨 AI Brain response:', data);
};

// Expected: Streaming AI response
```

#### 3.3 Test Voice WebSocket

```javascript
const voiceWs = new WebSocket('wss://api.dawg-ai.com/voice');

voiceWs.onopen = () => {
  console.log('✅ Voice WebSocket connected');
  voiceWs.send(JSON.stringify({
    type: 'voice-connect',
    voice: 'alloy'
  }));
};

// Expected: Connection acknowledgment
```

### 4. Database Connectivity Tests

```bash
# Test database connectivity from backend
railway run psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"

# Expected:
#  count
# -------
#      0 (or number of users)

# Test database performance
railway run psql "$DATABASE_URL" -c "EXPLAIN ANALYZE SELECT * FROM \"User\" LIMIT 10;"

# Expected: Execution time < 10ms
```

### 5. External Service Integration Tests

#### 5.1 Test OpenAI Integration

```bash
# Test from backend (using cost-tracked client)
curl -X POST https://api.dawg-ai.com/api/test/openai \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' | jq '.'

# Expected:
# {
#   "status": "success",
#   "openai_available": true,
#   "model": "gpt-4o"
# }
```

#### 5.2 Test Anthropic Integration

```bash
# Test Claude API
curl -X POST https://api.dawg-ai.com/api/test/anthropic \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' | jq '.'

# Expected:
# {
#   "status": "success",
#   "anthropic_available": true,
#   "model": "claude-3-5-sonnet-20241022"
# }
```

#### 5.3 Test AWS S3 Integration

```bash
# Test S3 upload
echo "test content" > test-file.txt
curl -X POST https://api.dawg-ai.com/api/test/s3 \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-file.txt" | jq '.'

# Expected:
# {
#   "status": "success",
#   "s3_available": true,
#   "uploadedUrl": "https://dawg-ai-audio-production.s3.amazonaws.com/test-..."
# }

# Verify file is accessible
curl -I "https://dawg-ai-audio-production.s3.amazonaws.com/test-..."

# Expected:
# HTTP/2 200
```

### 6. Performance Benchmarks

#### 6.1 API Response Time Test

```bash
# Test API latency (10 requests)
for i in {1..10}; do
  curl -w "Response time: %{time_total}s\n" \
    -o /dev/null -s \
    https://api.dawg-ai.com/health
done

# Expected: All responses < 200ms
```

#### 6.2 Frontend Load Time Test

```bash
# Test frontend performance
curl -w "@curl-timing.txt" -o /dev/null -s https://dawg-ai.com

# curl-timing.txt format:
# time_namelookup:  %{time_namelookup}s
# time_connect:     %{time_connect}s
# time_appconnect:  %{time_appconnect}s
# time_pretransfer: %{time_pretransfer}s
# time_redirect:    %{time_redirect}s
# time_starttransfer: %{time_starttransfer}s
# time_total:       %{time_total}s

# Expected:
# - time_namelookup: < 50ms
# - time_connect: < 100ms
# - time_starttransfer: < 200ms
# - time_total: < 500ms
```

#### 6.3 WebSocket Latency Test

```javascript
// Run in browser console
const measureLatency = () => {
  const ws = new WebSocket('wss://api.dawg-ai.com');
  const startTime = Date.now();

  ws.onopen = () => {
    const connectTime = Date.now() - startTime;
    console.log(`🔌 Connection time: ${connectTime}ms`);

    const pingStart = Date.now();
    ws.send(JSON.stringify({ type: 'ping' }));

    ws.onmessage = () => {
      const roundTrip = Date.now() - pingStart;
      console.log(`⚡ Round-trip time: ${roundTrip}ms`);
      ws.close();
    };
  };
};

measureLatency();

// Expected:
// 🔌 Connection time: < 200ms
// ⚡ Round-trip time: < 100ms
```

---

## Rollback Plan

### Emergency Rollback Procedures

#### Scenario 1: Frontend Rollback (Vercel)

```bash
# Method 1: Instant rollback via Vercel dashboard
# 1. Go to Vercel dashboard → Deployments
# 2. Find previous working deployment
# 3. Click "..." → "Promote to Production"
# 4. Confirm promotion

# Method 2: Rollback via CLI
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Expected:
# ✅ Rolled back to https://dawg-ai.com

# Verification
curl -I https://dawg-ai.com | grep -i "x-vercel-id"
```

**Time to Rollback:** ~30 seconds
**CDN Cache Invalidation:** Automatic
**User Impact:** Minimal (CDN edge locations update in ~1 minute)

#### Scenario 2: Backend Rollback (Railway)

```bash
# Method 1: Rollback via Railway dashboard
# 1. Go to Railway dashboard → Deployments
# 2. Find previous working deployment
# 3. Click "Redeploy"
# 4. Wait for deployment (~2-3 minutes)

# Method 2: Rollback via Git
# Revert to previous commit
git log --oneline -10  # Find previous working commit
git revert HEAD  # Or specific commit hash
git push origin main

# Railway auto-deploys the reverted code

# Method 3: Rollback via Railway CLI
railway rollback

# Monitor rollback
railway logs --follow
```

**Time to Rollback:** ~2-5 minutes
**Database Impact:** None (unless schema change)
**User Impact:** ~2-3 minutes downtime

#### Scenario 3: Database Rollback

**⚠️ CRITICAL: Only use for schema issues, not data corruption**

```bash
# 1. Stop all backend services
railway service stop

# 2. Restore from backup
psql "$DATABASE_URL" < backup-YYYYMMDD-HHMMSS.sql

# Expected:
# SET
# SET
# CREATE TABLE
# ...
# COPY 1000 (or number of rows)

# 3. Verify restoration
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"

# 4. Restart services
railway service start

# 5. Monitor logs
railway logs --follow
```

**Time to Rollback:** ~5-15 minutes (depends on database size)
**Data Loss:** Possible (all changes since backup)
**User Impact:** ~5-15 minutes downtime

#### Scenario 4: Environment Variable Rollback

```bash
# Restore previous environment variables

# 1. Railway dashboard → Variables → History
# 2. Select previous configuration
# 3. Click "Restore"
# 4. Service auto-restarts

# Or via CLI
railway variables set VARIABLE_NAME="previous-value"

# Verify
railway variables list
```

**Time to Rollback:** ~1 minute
**Service Impact:** Auto-restart required
**User Impact:** ~30 seconds downtime

### Rollback Decision Matrix

| Severity | Issue Type | Rollback Method | Time | Data Loss |
|----------|-----------|----------------|------|-----------|
| P0 - Critical | Frontend crash | Vercel instant rollback | 30s | None |
| P0 - Critical | Backend API down | Railway rollback | 2-5min | None |
| P0 - Critical | Database corruption | DB restore + backend rollback | 10-20min | Since last backup |
| P1 - High | Performance degradation | Backend rollback | 2-5min | None |
| P1 - High | Feature bug | Code revert + redeploy | 5-10min | None |
| P2 - Medium | UI glitch | Frontend rollback | 30s | None |
| P3 - Low | Minor bug | Fix forward (no rollback) | N/A | None |

### Post-Rollback Procedures

#### 1. Verify System Health

```bash
# Run full smoke test suite
./scripts/smoke-test.sh

# Check all critical endpoints
curl https://dawg-ai.com/health
curl https://api.dawg-ai.com/health
curl https://api.dawg-ai.com/api/ai-brain/health
curl https://api.dawg-ai.com/api/voice/health

# Verify database connectivity
railway run psql "$DATABASE_URL" -c "SELECT 1;"
```

#### 2. Clear Caches

```bash
# Clear Vercel CDN cache
vercel --prod --force

# Clear Redis cache (if needed)
railway run redis-cli FLUSHDB

# Clear browser service workers
# (Instruct users to hard refresh: Cmd+Shift+R / Ctrl+Shift+F5)
```

#### 3. User Communication

```bash
# Post status update
cat <<EOF > status-update.md
## System Status Update

**Time:** $(date)
**Status:** Rolled back to previous stable version

We encountered an issue with the latest deployment and have rolled back to the previous stable version. All services are now operational.

If you experience any issues, please:
1. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+F5)
2. Clear your browser cache
3. Contact support if issues persist

Thank you for your patience.
EOF

# Post to status page, Slack, email users
```

#### 4. Incident Analysis

```bash
# Create postmortem document
cat <<EOF > incident-YYYYMMDD.md
# Incident Postmortem - $(date +%Y-%m-%d)

## Summary
[Brief description of what went wrong]

## Timeline
- HH:MM - Deployment initiated
- HH:MM - Issue detected
- HH:MM - Rollback initiated
- HH:MM - System restored

## Impact
- Users affected: [number]
- Duration: [minutes]
- Services impacted: [list]

## Root Cause
[Detailed analysis]

## Resolution
[How it was fixed]

## Action Items
1. [ ] Update deployment checklist
2. [ ] Add monitoring for [specific issue]
3. [ ] Improve testing for [area]
4. [ ] Document lessons learned

## Prevention
[Steps to prevent recurrence]
EOF
```

---

## Monitoring & Alerts

### 1. Error Tracking Setup

#### 1.1 Sentry Configuration (Optional but Recommended)

```bash
# Install Sentry
npm install --save @sentry/node @sentry/react

# Configure backend (src/backend/utils/sentry.ts)
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
});

# Configure frontend (src/utils/sentry.ts)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### 1.2 Custom Error Logger

```typescript
// src/backend/utils/error-logger.ts
import { logger } from './logger';

export function logError(error: Error, context?: any) {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

// Usage
try {
  await generateMusic(prompt);
} catch (error) {
  logError(error, { userId, prompt });
  throw error;
}
```

### 2. Performance Monitoring

#### 2.1 Prometheus Metrics

```typescript
// src/backend/utils/metrics.ts
import promClient from 'prom-client';

// Create metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
});

const activeConnections = new promClient.Gauge({
  name: 'active_websocket_connections',
  help: 'Number of active WebSocket connections',
});

const generationJobsTotal = new promClient.Counter({
  name: 'generation_jobs_total',
  help: 'Total number of generation jobs',
  labelNames: ['status', 'type'],
});

// Middleware to track request duration
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });

  next();
};

// Export metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

#### 2.2 Custom Performance Tracking

```typescript
// Track generation job performance
export async function trackGenerationPerformance(
  jobId: string,
  type: string,
  fn: () => Promise<any>
) {
  const startTime = Date.now();

  try {
    const result = await fn();
    const duration = Date.now() - startTime;

    generationJobsTotal.labels('success', type).inc();
    logger.info('Generation completed', { jobId, type, duration });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    generationJobsTotal.labels('failure', type).inc();
    logger.error('Generation failed', { jobId, type, duration, error });
    throw error;
  }
}
```

### 3. Uptime Monitoring

#### 3.1 External Uptime Monitors (Recommended Services)

**Option 1: UptimeRobot (Free)**
- Website: https://uptimerobot.com
- Configure monitors for:
  - `https://dawg-ai.com` (interval: 5 minutes)
  - `https://api.dawg-ai.com/health` (interval: 1 minute)
  - `https://api.dawg-ai.com/api/ai-brain/health` (interval: 5 minutes)
  - `https://api.dawg-ai.com/api/voice/health` (interval: 5 minutes)

**Option 2: Better Uptime**
- Website: https://betteruptime.com
- More advanced features, status page

**Option 3: Pingdom**
- Website: https://www.pingdom.com
- Enterprise-grade monitoring

#### 3.2 Internal Health Check Endpoint

```typescript
// src/backend/routes/health-routes.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

const router = Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'unified-backend',
    services: {
      main: true,
      aiBrain: !!process.env.ANTHROPIC_API_KEY,
      voice: !!process.env.OPENAI_API_KEY,
    },
    connections: {
      database: false,
      redis: false,
      s3: false,
    },
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  };

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.connections.database = true;
  } catch (error) {
    health.status = 'degraded';
    health.connections.database = false;
  }

  // Test Redis connection
  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    await redis.ping();
    health.connections.redis = true;
    await redis.disconnect();
  } catch (error) {
    health.status = 'degraded';
    health.connections.redis = false;
  }

  // Test S3 connectivity (optional, can be slow)
  // ... S3 health check ...
  health.connections.s3 = true;

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

### 4. Alert Thresholds

#### 4.1 Critical Alerts (Immediate Response Required)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Service down | > 1 minute | Page on-call engineer |
| Error rate | > 5% of requests | Investigate immediately |
| Database connection failures | > 3 in 5 minutes | Check database health |
| Response time P95 | > 5 seconds | Check for bottlenecks |
| WebSocket disconnections | > 50% of active connections | Check backend health |

#### 4.2 Warning Alerts (Action Within 1 Hour)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 1% of requests | Investigate |
| Response time P95 | > 1 second | Monitor performance |
| API rate limit hits | > 10/minute | Check abuse |
| Memory usage | > 80% | Consider scaling |
| Disk usage | > 80% | Clean up or expand |

#### 4.3 Info Alerts (Monitor)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Response time P95 | > 500ms | Note for optimization |
| Active users | New peak | Celebrate! |
| Generation queue depth | > 100 jobs | Monitor for backlog |

### 5. Alert Configuration

#### 5.1 Email Alerts (via SendGrid/Mailgun)

```typescript
// src/backend/utils/alerts.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendAlert(
  level: 'critical' | 'warning' | 'info',
  subject: string,
  message: string
) {
  const recipients = {
    critical: 'oncall@dawg-ai.com,engineering@dawg-ai.com',
    warning: 'engineering@dawg-ai.com',
    info: 'monitoring@dawg-ai.com',
  };

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipients[level],
    subject: `[${level.toUpperCase()}] ${subject}`,
    text: message,
    html: `<pre>${message}</pre>`,
  });
}

// Usage
if (errorRate > 0.05) {
  await sendAlert(
    'critical',
    'High Error Rate Detected',
    `Error rate: ${errorRate * 100}%\nTime: ${new Date()}\nService: unified-backend`
  );
}
```

#### 5.2 Slack Alerts

```typescript
// src/backend/utils/slack-alerts.ts
import axios from 'axios';

export async function sendSlackAlert(
  webhook: string,
  level: 'critical' | 'warning' | 'info',
  message: string
) {
  const colors = {
    critical: '#FF0000',
    warning: '#FFA500',
    info: '#0000FF',
  };

  await axios.post(webhook, {
    attachments: [{
      color: colors[level],
      title: `${level.toUpperCase()} Alert`,
      text: message,
      footer: 'DAWG AI Monitoring',
      ts: Math.floor(Date.now() / 1000),
    }],
  });
}

// Usage
if (serviceDown) {
  await sendSlackAlert(
    process.env.SLACK_WEBHOOK_URL!,
    'critical',
    '🚨 Backend service is down!\nInvestigating...'
  );
}
```

#### 5.3 PagerDuty Integration (For Critical Alerts)

```typescript
// src/backend/utils/pagerduty.ts
import axios from 'axios';

export async function triggerPagerDutyAlert(
  severity: 'critical' | 'error' | 'warning',
  summary: string,
  details: any
) {
  await axios.post('https://events.pagerduty.com/v2/enqueue', {
    routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
    event_action: 'trigger',
    payload: {
      summary,
      severity,
      source: 'dawg-ai-backend',
      custom_details: details,
    },
  });
}
```

### 6. Monitoring Dashboard Setup

#### 6.1 Simple Monitoring Dashboard (Built-in)

```typescript
// src/backend/routes/monitoring-routes.ts
import { Router } from 'express';
import os from 'os';

const router = Router();

router.get('/monitoring/dashboard', async (req, res) => {
  const metrics = {
    system: {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      platform: os.platform(),
      nodeVersion: process.version,
    },
    application: {
      activeConnections: io.engine.clientsCount,
      queueDepth: await generationQueue.count(),
      cacheSize: await redis.dbsize(),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(metrics);
});

export default router;
```

#### 6.2 Grafana Dashboard (Recommended)

**Dashboard JSON Configuration:**

```json
{
  "dashboard": {
    "title": "DAWG AI Production Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_ms_bucket)",
            "legendFormat": "P95"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          }
        ]
      },
      {
        "title": "Active WebSocket Connections",
        "targets": [
          {
            "expr": "active_websocket_connections",
            "legendFormat": "Connections"
          }
        ]
      }
    ]
  }
}
```

---

## Production Hardening

### 1. Rate Limiting

#### 1.1 Express Rate Limit Configuration

```typescript
// src/backend/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// General API rate limit
export const generalLimiter = rateLimit({
  store: new RedisStore({
    client: createClient({ url: process.env.REDIS_URL }),
    prefix: 'rl:general:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for generation endpoints
export const generationLimiter = rateLimit({
  store: new RedisStore({
    client: createClient({ url: process.env.REDIS_URL }),
    prefix: 'rl:generation:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 generations per hour
  message: {
    error: 'Generation limit exceeded. Please wait before creating more.',
    retryAfter: '1 hour',
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: true,
});

// Very strict limit for auth endpoints (prevent brute force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  skipSuccessfulRequests: true,
});

// Apply to routes
app.use('/api/', generalLimiter);
app.use('/api/generate', generationLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

#### 1.2 IP-based Rate Limiting with Whitelist

```typescript
// src/backend/middleware/smart-rate-limit.ts
import rateLimit from 'express-rate-limit';

const WHITELISTED_IPS = process.env.WHITELISTED_IPS?.split(',') || [];

export const smartRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    // Whitelist certain IPs (e.g., monitoring services)
    if (WHITELISTED_IPS.includes(req.ip)) {
      return 0; // No limit
    }

    // Higher limits for authenticated users
    if (req.user) {
      return 200;
    }

    // Default limit for unauthenticated
    return 50;
  },
});
```

### 2. CORS Configuration

```typescript
// src/backend/middleware/cors.ts
import cors from 'cors';

const allowedOrigins = [
  'https://dawg-ai.com',
  'https://www.dawg-ai.com',
];

// Add development origins in non-production
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173');
  allowedOrigins.push('http://localhost:5174');
}

export const corsOptions = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours
});

app.use(corsOptions);
```

### 3. Security Headers

```typescript
// src/backend/middleware/security-headers.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Vite in dev
        "https://js.stripe.com",
      ],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://api.dawg-ai.com",
        "wss://api.dawg-ai.com",
        "https://*.stripe.com",
      ],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "blob:"],
      frameSrc: ["https://js.stripe.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
});

app.use(securityHeaders);
```

### 4. API Authentication

#### 4.1 JWT Authentication Middleware

```typescript
// src/backend/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Usage
app.get('/api/tracks', authenticate, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  // ... fetch user's tracks
});
```

#### 4.2 API Key Authentication (for external integrations)

```typescript
// src/backend/middleware/api-key-auth.ts
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Validate API key against database
  const validKey = await prisma.apiKey.findUnique({
    where: { key: apiKey as string },
    include: { user: true },
  });

  if (!validKey || !validKey.active) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Attach user to request
  req.user = validKey.user;

  next();
};
```

### 5. DDoS Protection

#### 5.1 Connection Limits

```typescript
// src/backend/middleware/connection-limits.ts
import { Server } from 'socket.io';

export function applyConnectionLimits(io: Server) {
  const MAX_CONNECTIONS_PER_IP = 10;
  const connectionsByIP = new Map<string, Set<string>>();

  io.use((socket, next) => {
    const ip = socket.handshake.address;

    if (!connectionsByIP.has(ip)) {
      connectionsByIP.set(ip, new Set());
    }

    const connections = connectionsByIP.get(ip)!;

    if (connections.size >= MAX_CONNECTIONS_PER_IP) {
      return next(new Error('Too many connections from this IP'));
    }

    connections.add(socket.id);

    socket.on('disconnect', () => {
      connections.delete(socket.id);
      if (connections.size === 0) {
        connectionsByIP.delete(ip);
      }
    });

    next();
  });
}
```

#### 5.2 Request Size Limits

```typescript
// src/backend/server.ts
import express from 'express';

app.use(express.json({
  limit: '10mb', // Prevent large payload attacks
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
}));

// Specific limits for file uploads
import multer from 'multer';

const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 5, // Max 5 files per request
  },
});
```

#### 5.3 Slow Request Protection

```typescript
// src/backend/middleware/timeout.ts
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({ error: 'Request timeout' });
      }
    }, timeoutMs);

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));

    next();
  };
};

// Apply to all routes
app.use(requestTimeout(30000)); // 30 second timeout
```

### 6. Input Validation & Sanitization

```typescript
// src/backend/middleware/validation.ts
import { z } from 'zod';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

// Usage
const generateMusicSchema = z.object({
  prompt: z.string().min(1).max(500),
  duration: z.number().min(5).max(300),
  genre: z.enum(['electronic', 'rock', 'jazz', 'classical']).optional(),
});

app.post(
  '/api/generate',
  authenticate,
  validateRequest(generateMusicSchema),
  async (req, res) => {
    // req.body is now validated and typed
  }
);
```

### 7. Secrets Management

```bash
# DO NOT commit secrets to Git
# Use environment variables or secret management services

# Option 1: Railway Secrets (Recommended)
# Set in Railway dashboard under Variables → Add Variable

# Option 2: AWS Secrets Manager
npm install @aws-sdk/client-secrets-manager

# Fetch secrets on startup
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });
const secret = await client.send(
  new GetSecretValueCommand({ SecretId: 'dawg-ai/production' })
);

const secrets = JSON.parse(secret.SecretString!);
process.env.JWT_SECRET = secrets.JWT_SECRET;
// ... etc

# Option 3: HashiCorp Vault
# More complex, enterprise-grade
```

### 8. Logging & Audit Trails

```typescript
// src/backend/middleware/audit-logger.ts
export const auditLogger = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - startTime;

    await prisma.auditLog.create({
      data: {
        userId: req.user?.id,
        action: `${req.method} ${req.path}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
      },
    });
  });

  next();
};

// Apply to sensitive endpoints
app.use('/api/auth', auditLogger);
app.use('/api/admin', auditLogger);
```

---

## Troubleshooting

### Common Issues & Solutions

#### Issue 1: Frontend Not Loading

**Symptoms:**
- White screen
- 404 errors
- `Cannot GET /` error

**Diagnosis:**
```bash
# Check Vercel deployment status
vercel ls

# Check deployment logs
vercel logs [deployment-url]

# Test direct asset access
curl -I https://dawg-ai.com/assets/index-[hash].js
```

**Solutions:**
1. **Build failed:** Check build logs for errors
   ```bash
   # Rebuild locally
   npm run build:ui
   ```

2. **Routing issue:** Verify `vercel.json` rewrites
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

3. **Cache issue:** Hard refresh browser (Cmd+Shift+R)

#### Issue 2: Backend API Not Responding

**Symptoms:**
- 502 Bad Gateway
- Connection timeouts
- Health check failing

**Diagnosis:**
```bash
# Check Railway service status
railway status

# View recent logs
railway logs --tail 100

# Test health endpoint
curl -v https://api.dawg-ai.com/health
```

**Solutions:**
1. **Service crashed:** Check logs for errors
   ```bash
   railway logs --filter error
   ```

2. **Database connection failed:** Verify DATABASE_URL
   ```bash
   railway variables list | grep DATABASE_URL
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

3. **Memory limit exceeded:** Scale up service
   ```bash
   # In Railway dashboard, increase memory allocation
   ```

#### Issue 3: WebSocket Connection Failed

**Symptoms:**
- Real-time features not working
- `WebSocket connection failed` in console
- Voice chat not connecting

**Diagnosis:**
```javascript
// Browser console
const ws = new WebSocket('wss://api.dawg-ai.com');
ws.onerror = (err) => console.error('WS Error:', err);
```

**Solutions:**
1. **CORS issue:** Verify CORS_ORIGINS includes frontend domain
   ```bash
   railway variables set CORS_ORIGINS="https://dawg-ai.com,https://www.dawg-ai.com"
   ```

2. **SSL certificate issue:** Verify wss:// (not ws://)

3. **Firewall blocking:** Test from different network

#### Issue 4: Database Connection Pool Exhausted

**Symptoms:**
- `Error: Connection pool timeout`
- Slow API responses
- Intermittent 500 errors

**Diagnosis:**
```bash
# Check active connections
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection limits
psql "$DATABASE_URL" -c "SHOW max_connections;"
```

**Solutions:**
1. **Increase pool size:**
   ```typescript
   // prisma/schema.prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     // Add connection pool settings
     // ?connection_limit=20&pool_timeout=20
   }
   ```

2. **Fix connection leaks:** Ensure `prisma.$disconnect()` in cleanup

3. **Scale database:** Upgrade Supabase plan

#### Issue 5: High API Costs

**Symptoms:**
- Unexpected API bills
- OpenAI/Anthropic costs higher than expected

**Diagnosis:**
```bash
# Check cost monitoring dashboard
curl https://api.dawg-ai.com/api/cost-monitoring/usage \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# View cost breakdown by user
curl https://api.dawg-ai.com/api/cost-monitoring/breakdown \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

**Solutions:**
1. **Set user budgets:**
   ```typescript
   await prisma.userBudget.upsert({
     where: { userId },
     create: { userId, monthlyLimit: 100.00 },
     update: { monthlyLimit: 100.00 },
   });
   ```

2. **Implement caching:** Cache frequently requested generations

3. **Add rate limits:** Prevent abuse
   ```typescript
   app.use('/api/generate', generationLimiter);
   ```

#### Issue 6: S3 Upload Failing

**Symptoms:**
- `Error uploading to S3`
- 403 Forbidden errors
- Files not appearing in bucket

**Diagnosis:**
```bash
# Test S3 credentials
aws s3 ls s3://dawg-ai-audio-production \
  --profile production

# Test upload directly
echo "test" > test.txt
aws s3 cp test.txt s3://dawg-ai-audio-production/test.txt \
  --profile production
```

**Solutions:**
1. **Invalid credentials:** Verify AWS keys
   ```bash
   railway variables list | grep AWS
   ```

2. **Bucket permissions:** Update S3 bucket policy
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": { "AWS": "arn:aws:iam::ACCOUNT:user/dawg-ai" },
       "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
       "Resource": "arn:aws:s3:::dawg-ai-audio-production/*"
     }]
   }
   ```

3. **CORS misconfigured:** Add CORS policy to S3
   ```json
   [{
     "AllowedOrigins": ["https://dawg-ai.com"],
     "AllowedMethods": ["GET", "PUT", "POST"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3000
   }]
   ```

---

## Appendix

### A. Environment Variables Reference

Complete list of all environment variables:

```bash
# ======================
# APPLICATION
# ======================
NODE_ENV=production
PORT=3000

# ======================
# AI PROVIDERS
# ======================
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# ======================
# DATABASE
# ======================
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
DATABASE_MAX_CONNECTIONS=10
DATABASE_CONNECTION_TIMEOUT=20000

# ======================
# REDIS
# ======================
REDIS_URL=redis://default:[password]@[host]:6379
REDIS_QUEUE_DB=1

# ======================
# AWS S3
# ======================
AWS_S3_BUCKET=dawg-ai-audio-production
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_CLOUDFRONT_URL=https://...cloudfront.net

# ======================
# SECURITY
# ======================
JWT_SECRET=[64-char-random-string]
SESSION_SECRET=[64-char-random-string]
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# ======================
# CORS
# ======================
CORS_ORIGINS=https://dawg-ai.com,https://www.dawg-ai.com

# ======================
# STRIPE
# ======================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ======================
# MONITORING
# ======================
LOG_LEVEL=info
ENABLE_METRICS=true
SENTRY_DSN=[optional]

# ======================
# FEATURE FLAGS
# ======================
FEATURE_CHAT_TO_CREATE=true
FEATURE_COLLABORATION=true
FEATURE_AI_MIXING=true

# ======================
# EMAIL
# ======================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password
EMAIL_FROM=DAWG AI <noreply@dawg-ai.com>
```

### B. Deployment Commands Cheat Sheet

```bash
# FRONTEND (Vercel)
vercel --prod                    # Deploy to production
vercel ls                        # List deployments
vercel logs [deployment]         # View deployment logs
vercel rollback [deployment]     # Rollback to previous version
vercel env ls                    # List environment variables
vercel env add [name]            # Add environment variable

# BACKEND (Railway)
railway login                    # Login to Railway
railway link                     # Link to project
railway up                       # Deploy
railway logs --follow            # View live logs
railway logs --tail 100          # View last 100 lines
railway status                   # Check service status
railway variables list           # List environment variables
railway variables set KEY=value  # Set environment variable
railway service                  # List services
railway run [command]            # Run command in Railway environment

# DATABASE (Prisma + Supabase)
npx prisma generate              # Generate Prisma client
npx prisma migrate deploy        # Run migrations
npx prisma db seed               # Seed database
npx prisma studio                # Open database GUI
psql "$DATABASE_URL"             # Connect to database

# GIT
git tag production-YYYYMMDD-HHMMSS  # Tag deployment
git push --tags                     # Push tags
git log --oneline -10               # View recent commits
git revert HEAD                     # Revert last commit

# TESTING
npm run test                     # Run unit tests
npm run test:e2e                 # Run E2E tests
npm run test:integration         # Run integration tests
npm run test:security            # Run security tests
curl -f [url] || echo "Failed"   # Quick health check
```

### C. Monitoring Queries

```bash
# Check system health
curl https://api.dawg-ai.com/health | jq '.connections'

# View metrics
curl https://api.dawg-ai.com/metrics | grep http_request_duration

# Check active users
psql "$DATABASE_URL" -c "
  SELECT COUNT(*) as active_users
  FROM \"User\"
  WHERE \"lastLoginAt\" > NOW() - INTERVAL '24 hours';
"

# Check generation stats
psql "$DATABASE_URL" -c "
  SELECT
    status,
    COUNT(*) as count,
    AVG(duration) as avg_duration_ms
  FROM \"Generation\"
  WHERE \"createdAt\" > NOW() - INTERVAL '24 hours'
  GROUP BY status;
"

# Check error rate
railway logs --tail 1000 | grep -i error | wc -l

# Check response times
curl -w "Total time: %{time_total}s\n" -o /dev/null -s https://api.dawg-ai.com/health
```

### D. Emergency Contacts

```
On-Call Engineer: oncall@dawg-ai.com
Engineering Team: engineering@dawg-ai.com
DevOps Team: devops@dawg-ai.com

Slack Channels:
- #dawg-ai-deploy (deployments)
- #dawg-ai-incidents (incidents)
- #dawg-ai-monitoring (alerts)

External Services:
- Vercel Support: support@vercel.com
- Railway Support: team@railway.app
- Supabase Support: support@supabase.io
- AWS Support: [via AWS Console]
```

---

## Checklist Summary

Use this quick checklist before deploying:

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables verified
- [ ] Database migrations tested
- [ ] API keys validated
- [ ] SSL certificates checked
- [ ] DNS configured
- [ ] Backup created

### Deployment
- [ ] Database migrations applied
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Vercel
- [ ] CDN cache cleared
- [ ] Custom domains configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Smoke tests complete
- [ ] WebSocket connections working
- [ ] Database connectivity verified
- [ ] External APIs responding
- [ ] Performance benchmarks met
- [ ] Monitoring alerts configured
- [ ] Team notified

### Production Hardening
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set
- [ ] Authentication working
- [ ] DDoS protection active
- [ ] Input validation implemented
- [ ] Secrets secured
- [ ] Audit logging enabled

---

**Document Version:** 2.0.0
**Last Updated:** 2025-10-19
**Next Review:** 2025-11-19
**Owner:** DevOps Team

For questions or issues with this deployment plan, contact: devops@dawg-ai.com
