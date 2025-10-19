# OpenAI API Cost Monitoring System

Comprehensive cost tracking and budget management for all OpenAI API services used in the AI DAW.

## Features

- **Real-time Cost Tracking**: Automatic logging of all OpenAI API usage and costs
- **Multi-Service Support**: Tracks Whisper, GPT-4o, TTS-1-HD, and Realtime API
- **Budget Management**: Set daily/monthly budget limits with alerts
- **Cost Dashboard**: Beautiful UI showing usage trends, breakdowns, and alerts
- **Budget Alerts**: Automatic notifications when approaching or exceeding limits
- **Service Pause**: Option to automatically pause services when budget is exceeded
- **Export Data**: Download usage logs as JSON or CSV for analysis

## Supported Services & Pricing

### Whisper API (Audio Transcription)
- **Cost**: $0.006 per minute
- **Tracks**: Audio duration in minutes
- **Use Cases**: Transcribing vocal recordings, analyzing lyrics

### GPT-4o (Chat Completion)
- **Input Cost**: $2.50 per 1M tokens
- **Output Cost**: $10.00 per 1M tokens
- **Tracks**: Input and output token counts
- **Use Cases**: AI chat, songwriting assistance, production advice

### TTS-1-HD (Text-to-Speech)
- **Cost**: $0.030 per 1K characters
- **Tracks**: Character count
- **Use Cases**: Generating reference vocals, voice demos

### Realtime API (Real-time Voice)
- **Input Tokens**: $5.00 per 1M tokens
- **Output Tokens**: $20.00 per 1M tokens
- **Audio Input**: $0.06 per minute
- **Audio Output**: $0.24 per minute
- **Tracks**: Token counts and audio duration
- **Use Cases**: Live vocal coaching, real-time feedback

## Architecture

### Database Schema

The system uses three main database models:

#### ApiUsageLog
Stores every API call with detailed metrics:
- Service type (whisper, gpt-4o, tts-1-hd, realtime-api)
- Operation type (transcription, chat, synthesis, etc.)
- Usage metrics (tokens, minutes, characters)
- Cost calculation (unit cost, total cost)
- Metadata (request ID, model, timestamps)

#### BudgetLimit
Manages user budget settings:
- Daily and monthly budget limits
- Current spending tracking
- Alert thresholds (default 80%)
- Auto-pause settings
- Last reset timestamps

#### CostAlert
Tracks budget alerts and notifications:
- Alert type (threshold_reached, budget_exceeded, daily_summary)
- Severity (info, warning, critical)
- Current spending and budget info
- Read/resolved status

## Implementation

### 1. Cost Monitoring Service

**Location**: `/src/backend/services/cost-monitoring-service.ts`

Core service that handles:
- Cost calculations for each service type
- Usage logging to database
- Budget tracking and updates
- Alert generation

```typescript
import { logApiUsage, getCostSummary } from './services/cost-monitoring-service';

// Log Whisper usage
await logApiUsage(userId, 'whisper', 'transcription', {
  audioMinutes: 5.5
});

// Get cost summary
const summary = await getCostSummary(userId, startDate, endDate);
```

### 2. Cost Tracking Middleware

**Location**: `/src/backend/middleware/cost-tracking-middleware.ts`

Wrapper around OpenAI client that automatically tracks all API calls:

```typescript
import { createCostTrackedClient } from './middleware/cost-tracking-middleware';

// Create tracked client
const openai = createCostTrackedClient(userId);

// Use normally - costs are tracked automatically
const transcription = await openai.transcribeAudio(audioFile);
const chat = await openai.createChatCompletion(messages);
const audio = await openai.synthesizeSpeech(text);
```

### 3. Budget Management Service

**Location**: `/src/backend/services/budget-management-service.ts`

Manages budgets, alerts, and spending analytics:

```typescript
import {
  updateBudgetConfig,
  getBudgetStatus,
  getSpendingTrends
} from './services/budget-management-service';

// Set budget limits
await updateBudgetConfig(userId, {
  dailyLimit: 10.00,    // $10/day
  monthlyLimit: 200.00, // $200/month
  alertThreshold: 0.8,  // Alert at 80%
  pauseOnExceed: true   // Pause when exceeded
});

// Check budget status
const status = await getBudgetStatus(userId);
console.log(`Daily spent: $${status.dailySpent}`);
console.log(`Monthly spent: $${status.monthlySpent}`);
```

### 4. API Routes

**Location**: `/src/backend/routes/cost-monitoring-routes.ts`

RESTful endpoints for cost monitoring:

- `GET /api/cost-monitoring/summary` - Get cost summary
- `GET /api/cost-monitoring/usage-logs` - Get usage logs
- `GET /api/cost-monitoring/budget` - Get budget configuration
- `PUT /api/cost-monitoring/budget` - Update budget settings
- `GET /api/cost-monitoring/alerts` - Get cost alerts
- `GET /api/cost-monitoring/trends` - Get spending trends
- `GET /api/cost-monitoring/breakdown` - Get service breakdown
- `GET /api/cost-monitoring/dashboard` - Get all dashboard data
- `GET /api/cost-monitoring/export` - Export usage data

### 5. Cost Monitoring Dashboard

**Location**: `/src/ui/components/CostMonitoringDashboard.tsx`

React component providing:
- Real-time cost summary (today, week, month)
- Spending trends chart (30 days)
- Service breakdown pie chart
- Budget status with progress bars
- Cost alerts and notifications
- Budget settings editor
- Service detail table

## Usage Examples

### Example 1: Track a Complete Session

```typescript
const userId = 'user-123';
const openai = createCostTrackedClient(userId);

// 1. Transcribe vocal recording (3 minutes)
const transcription = await openai.transcribeAudio(audioFile);
// Automatically logged: ~$0.018 (3 min × $0.006)

// 2. Get songwriting suggestions
const chat = await openai.createChatCompletion([
  { role: 'user', content: 'Write a hook for a pop song about summer' }
]);
// Automatically logged: ~$0.00005 (500 tokens in + 800 tokens out)

// 3. Generate reference vocal
const tts = await openai.synthesizeSpeech('This is my reference vocal...');
// Automatically logged: ~$0.0012 (40 characters × $0.030/1K)

// Total session cost: ~$0.0193
```

### Example 2: Calculate Costs Before API Calls

```typescript
import { calculateGPT4oCost } from './services/cost-monitoring-service';

// Estimate cost for a large analysis task
const estimatedCost = calculateGPT4oCost(
  5000,  // 5K input tokens
  10000  // 10K output tokens
);

console.log(estimatedCost.breakdown);
// Input: 5000 tokens × $2.50/1M = $0.012500
// Output: 10000 tokens × $10.00/1M = $0.100000

console.log(`Total: $${estimatedCost.totalCost.toFixed(6)}`);
// Total: $0.112500

// Proceed only if within budget
if (estimatedCost.totalCost < userBudgetRemaining) {
  await performAnalysis();
}
```

### Example 3: Budget Alerts

The system automatically creates alerts when:

1. **80% Threshold Reached** (default, configurable)
   - Type: `threshold_reached`
   - Severity: `warning`
   - Message: "You've used 80% of your daily budget"

2. **Budget Exceeded**
   - Type: `budget_exceeded`
   - Severity: `critical`
   - Message: "Your daily budget has been exceeded!"

3. **Services Paused** (if enabled)
   - API calls are blocked when budget is exceeded
   - Returns error: "Budget limit exceeded. Please increase your budget..."

## Cost Calculation Examples

### Scenario 1: Casual User (5 sessions/month)

**Per Session:**
- Whisper: 10 minutes = $0.060
- GPT-4o: 2,500 input + 3,000 output tokens = $0.036
- TTS: 1,000 characters = $0.030
- Realtime: 2K/3K tokens + 5/5 min audio = $0.195
- **Total per session: ~$0.321**

**Monthly (5 sessions): ~$1.61**

**Recommended budget: $2.00/month (25% buffer)**

### Scenario 2: Active Producer (20 sessions/month)

**Per Session:**
- Whisper: 30 minutes = $0.180
- GPT-4o: 5,000 input + 6,000 output tokens = $0.073
- TTS: 3,000 characters = $0.090
- Realtime: 8K/10K tokens + 15/15 min audio = $0.540
- **Total per session: ~$0.883**

**Monthly (20 sessions): ~$17.66**

**Recommended budget: $22.00/month (25% buffer)**

### Scenario 3: Professional Studio (100 sessions/month)

**Per Session:**
- Whisper: 60 minutes = $0.360
- GPT-4o: 10,000 input + 12,000 output tokens = $0.145
- TTS: 5,000 characters = $0.150
- Realtime: 15K/20K tokens + 30/30 min audio = $1.174
- **Total per session: ~$1.829**

**Monthly (100 sessions): ~$182.90**

**Recommended budget: $230.00/month (25% buffer)**

## Setup Instructions

### 1. Database Migration

Run Prisma migration to create cost monitoring tables:

```bash
npx prisma migrate dev --name add_cost_monitoring
npx prisma generate
```

### 2. Environment Variables

No additional environment variables needed. Uses existing `OPENAI_API_KEY`.

### 3. Integration in Backend

The routes are automatically mounted in `/src/backend/server.ts`:

```typescript
import costMonitoringRoutes from './routes/cost-monitoring-routes';
app.use('/api/cost-monitoring', costMonitoringRoutes);
```

### 4. Using in Your Code

Replace direct OpenAI calls with cost-tracked client:

```typescript
// Before
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// After
const openai = createCostTrackedClient(userId);
```

### 5. Add Dashboard to UI

Import and use the dashboard component:

```typescript
import CostMonitoringDashboard from './components/CostMonitoringDashboard';

// In your app routing
<Route path="/cost-monitoring" element={<CostMonitoringDashboard />} />
```

## API Authentication

The current implementation uses a simple header-based auth:

```typescript
// In API requests
headers: {
  'X-User-Id': userId
}
```

**Production Note**: Replace the `requireAuth` middleware in `cost-monitoring-routes.ts` with your actual authentication middleware.

## Budget Reset Schedule

Set up cron jobs to reset budgets:

```typescript
import cron from 'node-cron';
import { resetDailyBudgets, resetMonthlyBudgets } from './services/budget-management-service';

// Reset daily budgets at midnight
cron.schedule('0 0 * * *', async () => {
  await resetDailyBudgets();
});

// Reset monthly budgets on 1st of month at midnight
cron.schedule('0 0 1 * *', async () => {
  await resetMonthlyBudgets();
});
```

## Testing

Run the example calculations:

```bash
npx tsx src/backend/examples/cost-monitoring-example.ts
```

This will show:
- Individual service cost calculations
- Typical production session costs
- Budget scenario comparisons
- Recommended budget limits

## Data Export

Users can export their usage data:

```typescript
// Export as JSON
const data = await exportUsageData(userId, startDate, endDate);

// Export as CSV
const csvUrl = `/api/cost-monitoring/export?format=csv&userId=${userId}`;
```

## Performance Considerations

1. **Database Indexing**: All query-heavy fields are indexed
2. **Batch Operations**: Budget updates are efficient
3. **Caching**: Consider caching budget status for high-traffic apps
4. **Async Logging**: Cost logging doesn't block API responses

## Security Best Practices

1. **User Isolation**: All queries are scoped to userId
2. **Budget Enforcement**: Optional auto-pause prevents runaway costs
3. **Alert Deduplication**: Prevents spam alerts
4. **Data Privacy**: Only user sees their own cost data

## Future Enhancements

Potential additions:
- [ ] Team/organization-level budgets
- [ ] Cost predictions based on usage patterns
- [ ] Anomaly detection for unusual spending
- [ ] Integration with billing systems
- [ ] Cost optimization recommendations
- [ ] A/B testing for cost efficiency
- [ ] Historical cost comparisons
- [ ] Budget rollover options

## Support

For issues or questions:
1. Check the examples in `/src/backend/examples/cost-monitoring-example.ts`
2. Review the dashboard at `/cost-monitoring`
3. Check logs for cost tracking events

## License

Same as main AI DAW project.
