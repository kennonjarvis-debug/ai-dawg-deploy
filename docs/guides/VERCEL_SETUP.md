# Vercel Deployment Setup Guide

## ✅ Deployment Status

**Deployed Successfully!**
- Production URL: https://ai-dawg-deploy-mn91d4l40-bens-projects-4e60e0da.vercel.app
- Team: bens-projects-4e60e0da
- Username: bkennon22-7080

## ⚠️ Current Issue: Deployment Protection

The site is deployed but requires authentication to access. You need to disable deployment protection.

## How to Access Your Project

### Method 1: Via Dashboard (Easiest)

1. **Go to**: https://vercel.com/dashboard
2. **Look for team switcher** (top-left corner, might show your email or team name)
3. **Switch to**: `bens-projects-4e60e0da` or look for the `ai-dawg-deploy` project
4. **Click** on `ai-dawg-deploy` project

### Method 2: Direct Link

Try these direct links:
- Project Dashboard: https://vercel.com/bens-projects-4e60e0da/ai-dawg-deploy
- Settings: https://vercel.com/bens-projects-4e60e0da/ai-dawg-deploy/settings

If you see "Pending Approval", you may need to:
- Check if you have multiple Vercel accounts
- Sign out and sign back in with the correct account (kennonjarvis@gmail.com)
- Accept any pending team invitations

## Next Steps Once You Have Access

### 1. Disable Deployment Protection

**Settings → Deployment Protection → Select "None" or "Standard Protection"**

This will make your site publicly accessible without requiring authentication.

### 2. Add Environment Variables

**Settings → Environment Variables → Add these:**

```
ANTHROPIC_API_KEY=<your-anthropic-key>
OPENAI_API_KEY=<your-openai-key>
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://dawg-ai.com,https://*.vercel.app
NODE_ENV=production
```

### 3. Set Custom Domain (Optional)

**Settings → Domains → Add Domain**

Add `dawg-ai.com` to point to this Vercel deployment instead of Netlify.

### 4. Redeploy After Setting Variables

After adding environment variables:
- Go to Deployments tab
- Click "Redeploy" on the latest deployment
- Or use CLI: `vercel --prod`

## Testing Endpoints

Once deployment protection is disabled:

**Health Check:**
```bash
curl https://ai-dawg-deploy-mn91d4l40-bens-projects-4e60e0da.vercel.app/api/health
```

**AI Chat:**
```bash
curl -X POST https://ai-dawg-deploy-mn91d4l40-bens-projects-4e60e0da.vercel.app/api/ai-brain/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help me with music production?"}'
```

## What's Deployed

### Frontend:
- Built from `dist/` folder
- All UI components
- Vite-optimized bundle

### Backend API Functions:
- `/api/health` - Health check endpoint
- `/api/ai-brain/chat` - Claude chat endpoint (60s timeout)
- More API endpoints can be added in `/api` folder

## Vercel vs Railway

**Why Vercel is Better:**
- ✅ Instant deployments (no queue)
- ✅ Better documentation
- ✅ Auto-scaling
- ✅ Better free tier
- ✅ No Docker complexity
- ✅ Integrated with GitHub

**Limitations:**
- ⏱️ 60 second function timeout (vs Railway unlimited)
- 🚫 No WebSocket support (need to use polling or SSE)

## Next Actions

1. ✅ Access Vercel dashboard
2. ✅ Disable deployment protection
3. ✅ Add environment variables
4. ✅ Redeploy
5. ✅ Test endpoints
6. ✅ Point dawg-ai.com domain to Vercel
7. ✅ Delete Railway services

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Dashboard: https://vercel.com/dashboard
