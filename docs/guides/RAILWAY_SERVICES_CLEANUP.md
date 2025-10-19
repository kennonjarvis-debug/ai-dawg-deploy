# Railway Services Cleanup Plan

## Current Railway Services Status

Based on Railway API scan (2025-10-19 4:05 PM):

### Active Services

| Service Name | Status | Keep/Delete | Monthly Cost | Notes |
|-------------|---------|-------------|--------------|-------|
| **Redis** | SUCCESS | ✅ KEEP | $5 | Database - Required |
| **dawg-ai-backend** | QUEUED | ✅ KEEP | $5 | **NEW unified server** |
| **dawg-ai-gateway** | QUEUED | ⚠️ OPTIONAL | $5 | Only needed for terminal features |
| **web** | FAILED | ❌ DELETE | $5 | Old/broken service |
| **dawg-ai-web** | CRASHED | ❌ DELETE | $5 | Old/broken service |

### Services NOT Found (Good News!)

These services don't exist, which means you may have already deleted them or they were configured differently:
- ✅ No separate `ai-brain` service
- ✅ No separate `realtime-voice` service

## Deployment Status

### ⚠️ ISSUE DISCOVERED: Configuration Problem

**Current Status** (as of 4:25 PM):
- **dawg-ai-backend** deployment: Still QUEUED (30+ minutes)
- **Active deployment**: NULL (no deployment currently active!)
- **Current production URL**: Serving frontend HTML instead of backend API

**Problem Analysis:**
The `dawg-ai-backend-production.up.railway.app` URL is currently returning frontend HTML, but the unified server doesn't serve static files. Investigation shows:
- All configuration files are correct (railway.json, Dockerfile, start.sh)
- Git commit pushed successfully (9d139794)
- Railway deployment triggered but stuck in QUEUED state
- Active deployment shows as NULL in Railway status

**Possible Causes:**
1. Railway may be experiencing high load (deployments can queue for 30+ mins during busy times)
2. The service may have never had a successful deployment
3. Domain routing may be misconfigured in Railway dashboard

### Next Steps Required

**IMMEDIATE** - Check Railway Dashboard Manually:
1. Visit: https://railway.app/project/cfe8b20f-10c5-40f6-a612-70a7f1cbc1ad
2. Click on "dawg-ai-backend" service
3. Check:
   - Is there a deployment in progress?
   - What's the deployment history?
   - Are there any error messages?
4. If deployment is stuck, click "Redeploy" button manually

**IF DEPLOYMENT CONTINUES TO HANG:**
Consider canceling and creating fresh deployment:
```bash
railway up --service dawg-ai-backend --detach
```

### Expected Timeline (Updated)
- **Now**: QUEUED for 30+ minutes (unusual delay)
- **Action needed**: Manual intervention in Railway Dashboard
- **After manual redeploy**: 5-10 mins to BUILD + DEPLOY

## Action Plan

### Step 1: Wait for Deployment (Automated)

**Monitor deployment status:**

```bash
# Check every minute
watch -n 60 'railway status --json | jq ".services.edges[] | select(.node.name == \"dawg-ai-backend\") | {status: .node.serviceInstances.edges[0].node.latestDeployment.status}"'
```

**Or check in browser:**
- Railway Dashboard: https://railway.com/project/cfe8b20f-10c5-40f6-a612-70a7f1cbc1ad/service/99216f79-322e-40b3-8547-392a1e4ddf21

**Wait for status to change:**
- QUEUED → BUILDING → **SUCCESS** ✅

### Step 2: Verify Production Health

Once status = SUCCESS, verify the unified backend is working:

```bash
curl https://dawg-ai-backend-production.up.railway.app/health | jq .
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "unified-backend",
  "services": {
    "main": "healthy",
    "ai_brain": "healthy",
    "realtime_voice": "healthy"
  },
  "version": "2.0.0"  ← Must see this version!
}
```

**Also test frontend:**
- Visit: https://dawg-ai.com
- Open console (F12)
- Check for connection errors
- Test AI features

### Step 3: Delete Broken Services (IMMEDIATE SAVINGS)

⚠️ **ONLY after Step 2 verification is successful!**

#### Services to DELETE (Save $10/month):

**1. Delete "web" service (FAILED)**
- Railway Dashboard → Click "web" service
- Settings → Scroll to bottom → Delete Service
- Type `web` to confirm → Delete
- **Saves: $5/month**

**2. Delete "dawg-ai-web" service (CRASHED)**
- Railway Dashboard → Click "dawg-ai-web" service
- Settings → Scroll to bottom → Delete Service
- Type `dawg-ai-web` to confirm → Delete
- **Saves: $5/month**

**Total Immediate Savings: $10/month**

#### Optional: Delete "dawg-ai-gateway" (Save $5/month more)

**Only delete if you DON'T use these features:**
- Terminal access
- SSH connections
- Gateway-specific routing

**If you're NOT using those features, delete it:**
- Railway Dashboard → Click "dawg-ai-gateway"
- Settings → Delete Service
- **Saves: $5/month**

**Additional Savings: $5/month (if deleted)**

### Step 4: Verify Final Cost

After deleting services, check your Railway bill:

1. Go to: https://railway.app/account/billing
2. Check "Active Services"
3. Should show:
   - ✅ Redis ($5/mo)
   - ✅ dawg-ai-backend ($5/mo)
   - ⚠️ dawg-ai-gateway ($5/mo) - only if you kept it

**Target Monthly Cost:**
- **With gateway**: $15/month (down from $25+)
- **Without gateway**: $10/month (down from $25+)

**Annual Savings:**
- **With gateway**: $120/year
- **Without gateway**: $180/year

## Railway CLI Commands for Service Management

### Check All Services
```bash
railway status --json | jq '.services.edges[] | {name: .node.name, status: .node.serviceInstances.edges[0].node.latestDeployment.status}'
```

### Monitor Specific Service
```bash
# Watch dawg-ai-backend deployment
railway logs --service dawg-ai-backend --tail 50
```

### Check Health Endpoints
```bash
# Unified backend
curl https://dawg-ai-backend-production.up.railway.app/health | jq .

# Gateway (if kept)
curl https://dawg-ai-gateway-production.up.railway.app/health | jq .
```

## Troubleshooting

### If Deployment Stays QUEUED Too Long (>15 mins)

Railway might be experiencing high load. Try:

```bash
# Force redeploy
railway up --detach
```

Or in Railway Dashboard:
- Click service → Deployments → Click deployment → "Redeploy"

### If Health Check Fails

1. Check Railway logs:
```bash
railway logs --tail 200
```

2. Look for errors:
   - Missing environment variables
   - Port binding issues
   - Docker build failures

3. Verify environment variables are set:
   - ANTHROPIC_API_KEY
   - OPENAI_API_KEY
   - CORS_ORIGINS
   - DATABASE_URL

### If Frontend Can't Connect

1. Check Netlify deployed with new backend URLs
2. Clear browser cache
3. Check browser console for CORS errors
4. Verify netlify.toml has correct backend URL

## Success Criteria

- [ ] dawg-ai-backend deployment status = SUCCESS
- [ ] Health endpoint returns version "2.0.0"
- [ ] All 3 services healthy (main, ai_brain, realtime_voice)
- [ ] Frontend at dawg-ai.com works correctly
- [ ] "web" service deleted
- [ ] "dawg-ai-web" service deleted
- [ ] Monthly Railway bill reduced to $10-15

## Cost Summary

### Before Cleanup
- Redis: $5
- dawg-ai-backend: $5 (old version)
- dawg-ai-gateway: $5
- web: $5
- dawg-ai-web: $5
- **Total: $25/month**

### After Cleanup (Recommended)
- Redis: $5
- dawg-ai-backend: $5 (unified server)
- **Total: $10/month**
- **Savings: $180/year** 💰

### After Cleanup (If keeping gateway)
- Redis: $5
- dawg-ai-backend: $5 (unified server)
- dawg-ai-gateway: $5
- **Total: $15/month**
- **Savings: $120/year** 💰

---

**Last Updated**: 2025-10-19 4:05 PM
**Deployment Status**: QUEUED (building)
**Next Check**: In 5-10 minutes
