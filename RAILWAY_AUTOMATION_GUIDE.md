# 🤖 Railway Deep Integration & Automation Guide

Complete guide to integrating Claude Code with Railway for automated CI/CD, health monitoring, and auto-scaling.

---

## ✅ COMPLETED INTEGRATIONS

### 1. GitHub Actions CI/CD

**File:** `.github/workflows/deploy.yml`

**What it does:**
- ✅ Automatically deploys on every push to `main`
- ✅ Runs tests before deployment
- ✅ Deploys backend and gateway services
- ✅ Health checks after deployment
- ✅ Notifies on success/failure

**Setup:**
1. Add Railway token to GitHub Secrets:
   - Go to: https://github.com/kennonjarvis-debug/ai-dawg-deploy/settings/secrets/actions
   - Click "New repository secret"
   - Name: `RAILWAY_TOKEN`
   - Value: Get from Railway CLI:
     ```bash
     railway whoami --json | jq -r .token
     ```

2. Add Anthropic API key to GitHub Secrets:
   - Name: `ANTHROPIC_API_KEY`
   - Value: `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`

3. Push to trigger:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Add GitHub Actions CI/CD"
   git push
   ```

**Usage:**
- Every push to `main` automatically deploys
- Pull requests run tests but don't deploy
- View progress: https://github.com/kennonjarvis-debug/ai-dawg-deploy/actions

---

### 2. Automated Health Monitoring

**File:** `scripts/health-monitor.ts`

**What it does:**
- ✅ Checks all services every 60 seconds
- ✅ Monitors response times
- ✅ Alerts after 3 consecutive failures
- ✅ Sends macOS notifications + speech alerts
- ✅ Logs to `/tmp/health-monitor.log`
- ✅ Auto-checks Railway deployment status

**Run it:**
```bash
npm run health:monitor
```

**Quick health check:**
```bash
npm run health:check
```

**Features:**
- 🔔 **macOS notifications** when services go down
- 🔊 **Speech alerts** for critical issues
- 📊 **Response time monitoring** (alerts if > 5s)
- 🔄 **Auto-recovery detection** (alerts when back up)
- 📝 **Detailed logging** to `/tmp/health-monitor.log`

**Example output:**
```
🔍 Health Monitor Running...
Time: 10/16/2025, 3:45:30 AM
================================================================================
✅ Backend: OK (247ms)
✅ Gateway: OK (312ms)
✅ Frontend: OK (198ms)
================================================================================
Status Summary:
  ✅ Backend: 0 failures, 15 successes
  ✅ Gateway: 0 failures, 15 successes
  ✅ Frontend: 0 failures, 15 successes
================================================================================
Next check in 60 seconds...
```

---

### 3. Railway Auto-Scaling Configuration

**Railway Platform Capabilities:**

Railway currently supports **vertical scaling** (adjusting resources per instance) but NOT horizontal auto-scaling via configuration files.

**Current Options:**

#### Option A: Vertical Scaling (Available Now)
Configure via Railway Dashboard:
1. Go to service settings
2. Adjust memory/CPU limits based on load
3. Railway auto-restarts with new resources

**Recommended Settings for Production:**
```
Backend:
- Memory: 2GB
- CPU: 2 vCPU
- Replicas: 1 (Railway Pro plan)

Gateway:
- Memory: 1GB
- CPU: 1 vCPU
- Replicas: 1

Redis:
- Memory: 512MB
- Default configuration
```

#### Option B: Manual Horizontal Scaling
Railway Pro plan allows multiple replicas:
1. Go to service settings
2. Set "Replicas" to desired count (e.g., 2-3)
3. Railway automatically load balances

**Costs:**
- Replicas cost scales linearly
- 2 replicas = 2x cost
- Recommended: Start with 1, scale up based on traffic

#### Option C: Custom Auto-Scaling Script

I can create a script that monitors metrics and scales via Railway API:

**What it would do:**
- Monitor request rate, CPU, memory
- Call Railway API to adjust replicas
- Scale up during high traffic
- Scale down during low traffic

**Limitations:**
- Railway API is rate-limited
- No sub-minute scaling
- Requires Railway Pro plan

**Would you like me to implement this?**

---

## 🎯 NEXT: AI PLUGIN INTEGRATION

Based on your AI plugins, here's the integration plan:

### Your AI Plugins

You mentioned these plugins:
1. **AI-Powered Mastering Chain Optimizer**
2. **AI-powered EQ analyzer**
3. **Neural analog modeling for saturation**
4. **Intelligent mastering chain optimizer**
5. **Reference track matching system**
6. **AI reverb impulse response generator**

### Integration Strategy

#### Step 1: Plugin Discovery & Registration

Create a plugin system that auto-discovers and registers AI plugins:

**File:** `src/plugins/plugin-manager.ts`
```typescript
interface AIPlugin {
  name: string;
  version: string;
  capabilities: string[];
  process: (audio: AudioBuffer, params: any) => Promise<AudioBuffer>;
}

class PluginManager {
  private plugins: Map<string, AIPlugin> = new Map();

  register(plugin: AIPlugin) {
    this.plugins.set(plugin.name, plugin);
  }

  async process(pluginName: string, audio: AudioBuffer, params: any) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) throw new Error(`Plugin ${pluginName} not found`);
    return plugin.process(audio, params);
  }
}
```

#### Step 2: Mother-Load Integration

Extend the NLP intent system to recognize plugin commands:

**New Intent Patterns:**
```typescript
// In src/backend/chat/nlp-intent-detector.ts
{
  intent: 'APPLY_MASTERING',
  patterns: [
    /master (this|the) (track|beat|audio)/i,
    /apply mastering/i,
    /optimize (the )?master(ing)?/i
  ]
},
{
  intent: 'ANALYZE_EQ',
  patterns: [
    /analyze (the )?eq/i,
    /check (the )?frequency/i,
    /eq suggestions?/i
  ]
},
{
  intent: 'MATCH_REFERENCE',
  patterns: [
    /match (to|this) reference/i,
    /sound like (.+)/i,
    /reference track matching/i
  ]
}
```

#### Step 3: API Endpoints

Add plugin endpoints to backend:

**File:** `src/backend/routes/plugins.ts`
```typescript
router.post('/api/plugins/:pluginName/process', async (req, res) => {
  const { pluginName } = req.params;
  const { audioId, params } = req.body;

  // Load audio
  const audio = await audioService.load(audioId);

  // Process with plugin
  const processed = await pluginManager.process(pluginName, audio, params);

  // Save processed audio
  const newAudioId = await audioService.save(processed);

  res.json({ audioId: newAudioId });
});

router.get('/api/plugins', async (req, res) => {
  const plugins = pluginManager.listPlugins();
  res.json({ plugins });
});
```

#### Step 4: Gateway Integration

Extend gateway to route plugin requests:

**File:** `src/gateway/routes/ai-plugins.ts`
```typescript
// Route to appropriate AI provider based on plugin type
router.post('/ai/plugin/:pluginName', async (req, res) => {
  const { pluginName } = req.params;
  const { audio, params } = req.body;

  // Route to specialized AI provider
  if (pluginName.includes('mastering')) {
    return await anthropicService.processMastering(audio, params);
  } else if (pluginName.includes('eq')) {
    return await openaiService.analyzeEQ(audio, params);
  }
  // ... etc
});
```

### Would you like me to implement the AI plugin integration system?

I'll need:
1. **Location of your AI plugins** - Where are they in the codebase?
2. **Plugin interface** - Do they follow a specific interface/format?
3. **Priority order** - Which plugin to integrate first?

---

## 🚀 DEPLOYMENT CHECKLIST

### Immediate Actions:

- [ ] Add Railway token to GitHub Secrets
- [ ] Add Anthropic API key to GitHub Secrets
- [ ] Push GitHub Actions workflow
- [ ] Test first automated deployment
- [ ] Start health monitoring: `npm run health:monitor`

### Railway Dashboard Setup:

- [ ] Set service memory limits (Backend: 2GB, Gateway: 1GB)
- [ ] Enable replicas if traffic demands (Pro plan)
- [ ] Set up billing alerts

### Optional:

- [ ] Implement custom auto-scaling script
- [ ] Integrate AI plugins
- [ ] Set up Slack/Discord webhooks for alerts

---

## 📊 MONITORING & METRICS

### View Logs:

```bash
# Backend logs
railway logs --service dawg-ai-backend

# Gateway logs
railway logs --service dawg-ai-gateway

# Web logs
railway logs --service web

# Follow logs in real-time
railway logs --service dawg-ai-backend -f
```

### Check Deployment Status:

```bash
railway status
```

### Manual Health Check:

```bash
npm run health:check
```

---

## 🆘 TROUBLESHOOTING

### Issue: GitHub Actions fails with "railway: command not found"
**Solution:** Railway CLI installs automatically in workflow. Check Railway token is set correctly.

### Issue: Health monitor can't reach services
**Solution:**
1. Check domains are correct in `scripts/health-monitor.ts`
2. Verify services are actually deployed: `railway status`

### Issue: Auto-scaling not working
**Solution:** Railway doesn't support auto-scaling via config. Use manual replicas or custom script.

---

## 📞 NEED HELP?

**Railway Docs:** https://docs.railway.app/
**GitHub Actions Docs:** https://docs.github.com/en/actions
**Railway Dashboard:** https://railway.app/project/dazzling-happiness

---

## 🎯 NEXT STEPS

1. ✅ **GitHub Actions CI/CD** - Set up secrets and test
2. ✅ **Health Monitoring** - Run `npm run health:monitor`
3. ⏳ **Auto-scaling** - Decide on vertical vs custom script
4. ⏳ **AI Plugin Integration** - Provide plugin details

**Current Status:**
- Monitoring: Running ✅
- Deployments: QUEUED 🔄
- Integrations: Ready to implement ⏳

---

**Generated by Claude Code**
**Date:** 2025-10-16
**Ready to automate everything! 🚀**
