# Cost Monitoring Quick Start Guide

Get started with OpenAI API cost tracking in 5 minutes.

## Step 1: Run Database Migration

```bash
npx prisma migrate dev --name add_cost_monitoring
npx prisma generate
```

This creates three new tables:
- `ApiUsageLog` - Logs every API call and cost
- `BudgetLimit` - Stores user budget settings
- `CostAlert` - Tracks budget alerts

## Step 2: Start Using Cost-Tracked OpenAI Client

### Before (Direct OpenAI Calls)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// No cost tracking
const result = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### After (With Cost Tracking)

```typescript
import { createCostTrackedClient } from './middleware/cost-tracking-middleware';

const userId = req.user.id; // Your user ID
const openai = createCostTrackedClient(userId);

// Automatically tracked!
const result = await openai.createChatCompletion([
  { role: 'user', content: 'Hello' }
]);
// Cost is automatically calculated and logged to database
```

## Step 3: Set Budget Limits (Optional)

```typescript
import { updateBudgetConfig } from './services/budget-management-service';

await updateBudgetConfig(userId, {
  dailyLimit: 10.00,      // $10 per day
  monthlyLimit: 200.00,   // $200 per month
  alertThreshold: 0.8,    // Alert at 80% of budget
  alertsEnabled: true,    // Enable alerts
  pauseOnExceed: true     // Block API calls when budget exceeded
});
```

## Step 4: View Dashboard

Open the cost monitoring dashboard to see:
- Real-time spending (today, week, month)
- Spending trends chart
- Service breakdown
- Budget status
- Cost alerts

```typescript
import CostMonitoringDashboard from './ui/components/CostMonitoringDashboard';

// Add to your app routing
<Route path="/cost-monitoring" element={<CostMonitoringDashboard />} />
```

## Step 5: Monitor Usage via API

```typescript
// Get cost summary
const response = await fetch('/api/cost-monitoring/summary?period=month');
const { summary } = await response.json();

console.log(`Total cost: $${summary.totalCost.toFixed(4)}`);
console.log(`API calls: ${summary.count}`);
console.log('By service:', summary.byService);
```

## Complete Integration Example

Here's a complete example integrating cost tracking into an audio transcription endpoint:

```typescript
import { Router } from 'express';
import { createCostTrackedClient } from './middleware/cost-tracking-middleware';
import { canMakeApiCall } from './services/cost-monitoring-service';

const router = Router();

router.post('/transcribe', async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Check if user can make API call (budget check)
    const canCall = await canMakeApiCall(userId);
    if (!canCall) {
      return res.status(402).json({
        error: 'Budget limit exceeded',
        message: 'Please increase your budget or wait until the next period.'
      });
    }

    // 2. Create cost-tracked OpenAI client
    const openai = createCostTrackedClient(userId);

    // 3. Make API call - cost is automatically tracked
    const audioFile = req.file; // From multer
    const transcription = await openai.transcribeAudio(audioFile);

    // 4. Return result
    res.json({
      success: true,
      transcription: transcription.text
    });

    // Cost has been automatically:
    // - Calculated based on audio duration
    // - Logged to ApiUsageLog table
    // - Added to user's daily/monthly spent
    // - Checked against budget limits
    // - Generated alerts if needed

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

## API Endpoints Reference

### Get Dashboard Data
```bash
GET /api/cost-monitoring/dashboard
```

Returns all dashboard data in one call.

### Get Cost Summary
```bash
GET /api/cost-monitoring/summary?period=today|week|month
```

### Get Usage Logs
```bash
GET /api/cost-monitoring/usage-logs?service=whisper&limit=100
```

### Update Budget
```bash
PUT /api/cost-monitoring/budget
Content-Type: application/json

{
  "dailyLimit": 10.00,
  "monthlyLimit": 200.00,
  "alertThreshold": 0.8,
  "pauseOnExceed": true
}
```

### Get Alerts
```bash
GET /api/cost-monitoring/alerts?unreadOnly=true
```

### Export Data
```bash
GET /api/cost-monitoring/export?format=csv
```

## Current Pricing (as of 2024)

| Service | Pricing | What's Tracked |
|---------|---------|----------------|
| **Whisper** | $0.006/minute | Audio duration |
| **GPT-4o** | $2.50/$10 per 1M tokens | Input/output tokens |
| **TTS-1-HD** | $0.030 per 1K characters | Character count |
| **Realtime API** | $5/$20 per 1M tokens + $0.06/$0.24 per min | Tokens + audio duration |

## Cost Calculation Helpers

Use these functions to estimate costs before making API calls:

```typescript
import {
  calculateWhisperCost,
  calculateGPT4oCost,
  calculateTTSCost,
  calculateRealtimeAPICost
} from './services/cost-monitoring-service';

// Estimate Whisper cost
const whisperCost = calculateWhisperCost(5.5); // 5.5 minutes
console.log(whisperCost.breakdown);
// 5.50 minutes × $0.006 = $0.033000

// Estimate GPT-4o cost
const gpt4oCost = calculateGPT4oCost(1500, 2000); // 1500 input, 2000 output tokens
console.log(gpt4oCost.breakdown);
// Input: 1500 tokens × $2.50/1M = $0.003750
// Output: 2000 tokens × $10.00/1M = $0.020000

// Estimate TTS cost
const ttsCost = calculateTTSCost(5000); // 5000 characters
console.log(ttsCost.breakdown);
// 5000 characters × $0.030/1K = $0.150000

// Estimate Realtime API cost
const realtimeCost = calculateRealtimeAPICost(
  10000,  // input tokens
  15000,  // output tokens
  5.5,    // audio input minutes
  7.2     // audio output minutes
);
console.log(realtimeCost.breakdown);
// Full breakdown with all components
```

## Typical Session Costs

Based on example calculations:

### Casual User Session (~$1.70)
- 10 min audio transcription: $0.06
- Chat conversations: $0.04
- Voice generation: $0.03
- Realtime coaching: $1.57

### Active Producer Session (~$5.08)
- 30 min audio transcription: $0.18
- Extended chat: $0.07
- Multiple voice samples: $0.09
- Extended coaching: $4.74

### Professional Session (~$10.13)
- 60 min audio transcription: $0.36
- Complex analysis: $0.15
- Reference vocals: $0.15
- Full coaching session: $9.48

## Budget Recommendations

Based on usage patterns:

| User Type | Sessions/Month | Cost/Session | Monthly Total | Recommended Budget |
|-----------|----------------|--------------|---------------|-------------------|
| Casual | 5 | $1.70 | $8.50 | $10/month |
| Active | 20 | $5.08 | $101.60 | $125/month |
| Professional | 100 | $10.13 | $1,013.00 | $1,250/month |

Add 20-25% buffer for unexpected usage.

## Troubleshooting

### Issue: "Budget limit exceeded" error

**Solution**: Check budget status:
```typescript
const status = await getBudgetStatus(userId);
console.log('Daily spent:', status.dailySpent);
console.log('Daily limit:', status.dailyLimit);
```

Either increase the budget or disable `pauseOnExceed`.

### Issue: Costs not appearing in dashboard

**Checklist**:
1. Verify you're using `createCostTrackedClient()` instead of direct OpenAI
2. Check that database migrations ran successfully
3. Verify userId is being passed correctly
4. Check backend logs for errors

### Issue: Usage logs missing some calls

**Common causes**:
- Direct OpenAI calls (not using cost-tracked client)
- Errors during API calls (logged but may not complete)
- Database connection issues

**Solution**: Use middleware consistently:
```typescript
// Always use this
const openai = createCostTrackedClient(userId);

// Not this
const openai = new OpenAI({ apiKey: ... });
```

## Next Steps

1. **Set up budget alerts**: Configure email/SMS notifications
2. **Add cron jobs**: Automate daily/monthly budget resets
3. **Customize dashboard**: Modify UI to match your app's design
4. **Export data**: Download usage logs for analysis
5. **Optimize costs**: Review high-cost operations and optimize

## Support

See full documentation in `COST_MONITORING_README.md`

Run examples: `npx tsx src/backend/examples/cost-monitoring-example.ts`
