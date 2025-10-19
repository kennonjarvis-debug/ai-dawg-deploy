# 🚀 Mother-Load Production Deployment Guide

**Date:** 2025-10-15
**Status:** READY TO DEPLOY

---

## 📋 Deployment Architecture

You need to deploy **3 services** to Railway:

1. **Frontend (Web)** - Already deployed at https://www.dawg-ai.com ✅
2. **Backend API** - New service for music generation
3. **Gateway API** - New service for chat/intent detection

Additionally, you'll need:
4. **Redis** - Job queue and WebSocket clustering
5. **PostgreSQL** - Database (may already exist)

---

## 🎯 Quick Deployment (5 Minutes)

### Step 1: Create Backend Service on Railway

```bash
# In Railway dashboard (https://railway.app/project):
# 1. Click "New Service" → "Empty Service"
# 2. Name it: "dawg-ai-backend"
# 3. Connect to GitHub repo: "ai-dawg-deploy"
# 4. Set custom start command: tsx src/backend/server.ts
# 5. Set PORT environment variable to: 3001
```

**Environment Variables for Backend:**
```env
NODE_ENV=production
BACKEND_PORT=3001
PORT=${{RAILWAY_STATIC_URL_PORT}}

# Redis
REDIS_URL=${{Redis.REDIS_URL}}

# OpenAI
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google AI
GOOGLE_AI_API_KEY=...

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# S3 Storage
AWS_S3_BUCKET=dawg-ai-audio-production
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# CORS
CORS_ORIGIN=https://www.dawg-ai.com,https://dawg-ai.com

# Generation Queue
GENERATION_QUEUE_CONCURRENCY=5
GENERATION_JOB_TIMEOUT=30000
GENERATION_JOB_ATTEMPTS=3
```

### Step 2: Create Gateway/Chat Service on Railway

```bash
# In Railway dashboard:
# 1. Click "New Service" → "Empty Service"
# 2. Name it: "dawg-ai-gateway"
# 3. Connect to GitHub repo: "ai-dawg-deploy"
# 4. Set custom start command: tsx src/gateway/server.ts
# 5. Set PORT environment variable to: 3002
```

**Environment Variables for Gateway:**
```env
NODE_ENV=production
GATEWAY_PORT=3002
PORT=${{RAILWAY_STATIC_URL_PORT}}

# OpenAI (for chat)
OPENAI_API_KEY=sk-...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Google AI
GOOGLE_AI_API_KEY=...

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS
CORS_ORIGIN=https://www.dawg-ai.com,https://dawg-ai.com

# AI Features
ENABLE_AI=true
CHATGPT_CLI_MODE=true

# Session Management
SESSION_TTL=3600000
MAX_SESSIONS=100
INACTIVITY_TIMEOUT=600000
```

### Step 3: Add Redis Service

```bash
# In Railway dashboard:
# 1. Click "New Service" → "Database" → "Add Redis"
# 2. Redis will automatically provide ${{Redis.REDIS_URL}}
```

### Step 4: Update Frontend Environment Variables

Update the existing "web" service with these additional variables:

```env
# Add to existing frontend service:
VITE_BACKEND_API_URL=${{dawg-ai-backend.RAILWAY_STATIC_URL}}
VITE_GATEWAY_API_URL=${{dawg-ai-gateway.RAILWAY_STATIC_URL}}
VITE_DEMO_MODE=false
```

---

## 🔐 Environment Variables Summary

### Required API Keys (Get These First!)

1. **OpenAI API Key** → https://platform.openai.com/api-keys
2. **Anthropic API Key** → https://console.anthropic.com/
3. **Google AI API Key** → https://makersuite.google.com/app/apikey
4. **AWS S3 Credentials** → https://console.aws.amazon.com/iam/

### Optional Services

- **Sentry** (error tracking) → https://sentry.io/
- **Stripe** (payments) → https://stripe.com/

---

## 📊 Service URLs After Deployment

After deploying, your services will be at:

- **Frontend:** https://www.dawg-ai.com (existing)
- **Backend:** https://dawg-ai-backend-production.up.railway.app
- **Gateway:** https://dawg-ai-gateway-production.up.railway.app
- **Redis:** Internal (not exposed)

---

## ✅ Deployment Checklist

- [ ] Railway project created (already exists ✅)
- [ ] Backend service created
- [ ] Gateway service created
- [ ] Redis added
- [ ] All environment variables set
- [ ] Services deployed successfully
- [ ] Health checks passing
- [ ] Frontend updated with production API URLs
- [ ] Frontend redeployed
- [ ] Comprehensive test run

---

## 🧪 Post-Deployment Testing

Once deployed, test these endpoints:

```bash
# 1. Backend Health
curl https://dawg-ai-backend-production.up.railway.app/health

# Expected:
# {"status":"healthy","service":"backend","timestamp":"...","version":"1.0.0"}

# 2. Gateway Health
curl https://dawg-ai-gateway-production.up.railway.app/health

# Expected:
# {"status":"healthy","service":"gateway","timestamp":"...","version":"1.0.0"}

# 3. Chat Intent Detection
curl -X POST https://dawg-ai-gateway-production.up.railway.app/api/chat/detect-intent \
  -H "Content-Type: application/json" \
  -d '{"message":"create a trap beat at 140 bpm"}'

# Expected:
# {"intent":"GENERATE_BEAT","entities":{"genre":"trap","bpm":140},"confidence":0.95}

# 4. Generation API
curl -X POST https://dawg-ai-backend-production.up.railway.app/api/generate/beat \
  -H "Content-Type: application/json" \
  -d '{"genre":"trap","bpm":140,"duration":30}'

# Expected:
# {"jobId":"...","status":"queued","message":"Beat generation started"}
```

---

## 🚨 Troubleshooting

### Issue: Services won't start

**Solution:** Check Railway logs:
```bash
railway logs --service dawg-ai-backend
railway logs --service dawg-ai-gateway
```

### Issue: "Cannot find module 'tsx'"

**Solution:** Add to `package.json` dependencies (already done ✅):
```json
{
  "dependencies": {
    "tsx": "^4.20.6"
  }
}
```

### Issue: Redis connection fails

**Solution:** Verify `REDIS_URL` variable is set:
```bash
railway variables --service dawg-ai-backend | grep REDIS
```

### Issue: CORS errors in browser

**Solution:** Add frontend domain to `CORS_ORIGIN`:
```env
CORS_ORIGIN=https://www.dawg-ai.com,https://dawg-ai.com
```

---

## 📈 Monitoring

After deployment, monitor these metrics:

1. **Railway Dashboard** → https://railway.app/project/...
   - CPU usage (should be < 50%)
   - Memory usage (should be < 500MB per service)
   - Response time (should be < 200ms)

2. **Error Rates**
   - Check logs for errors
   - Set up Sentry alerts

3. **API Usage**
   - Monitor OpenAI API costs
   - Monitor Anthropic API costs
   - Set budget alerts

---

## 💰 Expected Costs

### Railway Costs
- **Starter Plan:** $5/month (includes $5 credit)
- **Pro Plan:** $20/month (recommended for production)
  - 3 services (Frontend + Backend + Gateway) = ~$15/month
  - Redis = ~$5/month
  - PostgreSQL = ~$5/month
  - **Total:** ~$25/month

### AI Provider Costs
- **OpenAI:** ~$0.50-2.00 per 1000 chat requests
- **Anthropic:** ~$2.40 per 1M tokens (~500 chat sessions)
- **Google AI:** ~$0.19 per 1M tokens (cheapest)
- **Estimated:** $50-200/month depending on usage

### AWS S3 Costs
- **Storage:** $0.023/GB/month
- **Transfer:** $0.09/GB out
- **Estimated:** $10-50/month for ~500GB storage

### Total Monthly Cost
- **Development:** ~$75/month
- **Production (low traffic):** ~$150/month
- **Production (high traffic):** ~$500/month

---

## 🎯 Success Criteria

Deployment is successful when:

1. ✅ All 3 services show "Active" in Railway dashboard
2. ✅ Health checks return 200 OK
3. ✅ Chat intent detection works
4. ✅ Beat generation API accepts requests
5. ✅ Frontend can communicate with backend
6. ✅ User can create a beat via chat interface
7. ✅ E2E test suite passes

---

## 🚀 READY TO DEPLOY?

If you have all API keys ready, proceed with Step 1!

If you need help, check:
- Railway docs: https://docs.railway.app/
- Mother-Load implementation plan: MOTHERLOAD_IMPLEMENTATION_PLAN.md
- Backend implementation report: BACKEND_IMPLEMENTATION_REPORT.md

---

**Questions? Check the troubleshooting section or review deployment logs!**
