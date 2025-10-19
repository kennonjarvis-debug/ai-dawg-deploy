# 🚨 FIX AI BRAIN SERVER NOW - Quick Action Guide

## ⚡ The Problem

Your Railway service is **NOT running the AI brain server** because the `SERVICE_TYPE` environment variable is not set to `ai-brain`.

**Current Status**: Service is probably running backend or gateway server instead of AI brain.

---

## ✅ THE FIX (5 Minutes)

### Step 1: Go to Railway Dashboard

Open this URL:
```
https://railway.com/project/cfe8b20f-10c5-40f6-a612-70a7f1cbc1ad/service/99216f79-322e-40b3-8547-392a1e4ddf21
```

### Step 2: Click "Variables" Tab

You'll see all environment variables for your service.

### Step 3: Add SERVICE_TYPE Variable

Click **"+ New Variable"**

Enter:
- **Variable Name**: `SERVICE_TYPE`
- **Value**: `ai-brain`

Click **"Add"**

### Step 4: Redeploy

Click **"Redeploy"** button (top right)

Wait 2-3 minutes for build to complete.

### Step 5: Verify It Worked

Click **"Deployments"** → Click latest deployment → Click **"View Logs"**

You should see:
```
🚀 Starting DAWG AI service...
📋 SERVICE_TYPE: ai-brain
🧠 Starting AI Brain Server (Text Chat - Port 8002)...
🧠 AI Brain server running on port 8002
✅ OpenAI API key configured
```

✅ **SUCCESS!** Your AI brain is now running!

---

## 🔍 What Was Wrong

**Before Fix**:
```bash
# SERVICE_TYPE was not set (or set to wrong value)
# start.sh defaulted to running backend server
⚠️  SERVICE_TYPE not set, defaulting to DAW Backend Server...
🎛️  Starting DAW Backend Server (Main API - Port 3001)...
```

**After Fix**:
```bash
# SERVICE_TYPE=ai-brain tells start.sh which server to run
📋 SERVICE_TYPE: ai-brain
🧠 Starting AI Brain Server (Text Chat - Port 8002)...
```

---

## 📋 Environment Variables You Need

**Required for AI Brain**:
```bash
SERVICE_TYPE=ai-brain         # ← THIS IS THE KEY ONE!
AI_BRAIN_PORT=8002
OPENAI_API_KEY=sk-...        # Your OpenAI API key
NODE_ENV=production
```

**Check these are set** in Railway dashboard → Variables tab.

---

## 🧪 Test After Deployment

### Test from Browser Console

```javascript
// Open your DAW frontend in browser
// Press F12 to open console
// Run this:

fetch('https://[your-railway-url]/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Create a stereo aux track called Test',
    project_context: {}
  })
})
.then(r => r.json())
.then(d => console.log('AI Response:', d));
```

**Expected Response**:
```json
{
  "response": "I'll create a stereo aux track called 'Test' for you.",
  "function_call": {
    "name": "createAuxTrack",
    "arguments": {
      "name": "Test",
      "channels": "stereo"
    }
  }
}
```

### Test from Command Line

```bash
curl -X POST https://[your-railway-url]/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","project_context":{}}'
```

---

## 🚨 If It's STILL Not Working

### Check These:

**1. Is OPENAI_API_KEY set?**
- Go to Variables tab
- Look for `OPENAI_API_KEY`
- Should start with `sk-`
- If missing, add it

**2. Check the Build Logs**
- Click "Deployments" → Latest deployment
- Click "View Logs"
- Look for **build errors** (red text)
- Common issues:
  - `npm install` failures
  - Missing dependencies
  - Dockerfile errors

**3. Check the Runtime Logs**
- Same logs view
- Look for **startup messages**
- Should see: "🧠 Starting AI Brain Server"
- If you see: "🎛️  Starting DAW Backend Server" → SERVICE_TYPE is still wrong

**4. Verify Port Configuration**
- AI brain uses port 8002
- In Variables tab, check:
  - `AI_BRAIN_PORT=8002` (optional, defaults to 8002)
  - `PORT` should NOT be set (or set to 8002)

---

## 📞 Common Error Messages

### "Gateway Server starting instead"
```
🚪 Starting Gateway Server...
```
**Fix**: Set `SERVICE_TYPE=ai-brain` in Railway variables

### "Backend Server starting instead"
```
🎛️  Starting DAW Backend Server (Main API - Port 3001)...
```
**Fix**: Set `SERVICE_TYPE=ai-brain` in Railway variables

### "OpenAI API key not configured"
```
⚠️  WARNING: OPENAI_API_KEY not set!
```
**Fix**: Add `OPENAI_API_KEY=sk-...` to Railway variables

### "Build failed"
**Check**: Dockerfile build logs for specific error
**Common fix**: Already fixed OpenSSL issue in latest commit

---

## 📊 Current Deployment

**Git Commit**: `216c4a9`
**Deployment**: Railway (building now)
**Build Logs**: https://railway.com/project/cfe8b20f-10c5-40f6-a612-70a7f1cbc1ad/service/99216f79-322e-40b3-8547-392a1e4ddf21?id=d5642203-62b8-43a5-a949-46e90f00f6e1

---

## ✅ Summary

**What I Fixed in Code**:
- ✅ Updated `start.sh` to support all 4 server types
- ✅ Added logging to show which SERVICE_TYPE is set
- ✅ Fixed default behavior
- ✅ Deployed to Railway

**What YOU Need to Do in Railway**:
1. ❗ **Add `SERVICE_TYPE=ai-brain` variable** ← MOST IMPORTANT
2. Verify `OPENAI_API_KEY` is set
3. Redeploy
4. Check logs for "🧠 Starting AI Brain Server"

**Expected Result**:
- AI brain server runs on port 8002
- `/api/chat` endpoint works
- AI can execute routing commands
- Text chat with function calling works

---

## 🎯 Quick Checklist

Before you say "it's working":

- [ ] Railway Variables tab has `SERVICE_TYPE=ai-brain`
- [ ] Railway Variables tab has `OPENAI_API_KEY=sk-...`
- [ ] Latest deployment build succeeded (green checkmark)
- [ ] Logs show "🧠 Starting AI Brain Server (Text Chat - Port 8002)..."
- [ ] Logs show "✅ OpenAI API key configured"
- [ ] Test curl command returns AI response
- [ ] Frontend can send chat messages and get responses

---

**Last Updated**: 2025-10-18
**Fix Deployed**: Commit 216c4a9
**Action Required**: Add SERVICE_TYPE=ai-brain in Railway dashboard
