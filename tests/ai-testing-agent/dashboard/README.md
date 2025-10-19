# AI Testing Agent Dashboard

Real-time monitoring dashboard for the DAWG AI Testing Agent with WebSocket notifications and multi-channel alerts.

## Features

### Real-time Test Execution
- Live test progress with progress bar
- Pass/fail counts updating in real-time
- Current test being executed
- ETA for completion based on average test duration

### Multi-Channel Notifications
- **Slack**: Webhook integration for team notifications
- **Discord**: Webhook integration for Discord channels
- **Email**: SMTP-based email alerts
- **Browser**: Native browser notifications
- **SMS**: Optional Twilio integration for critical alerts

### Historical Trends & Analytics
- Pass rate over time (last 24 hours)
- Test execution time trends (last 50 tests)
- Failure heatmap by component
- Cost tracking over time (last 7 days)

### Smart Alerting
- Critical test failures
- Pass rate drops >10%
- Consecutive failures
- Custom alert thresholds

## Quick Start

### 1. Start the Dashboard

```bash
npm run test:dashboard
```

The dashboard will be available at: **http://localhost:4000**

### 2. Configure Notifications (Optional)

Create or edit `tests/ai-testing-agent/dashboard/notification-settings.json`:

```json
{
  "slack": {
    "enabled": true,
    "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "mentions": ["@channel"]
  },
  "discord": {
    "enabled": true,
    "webhookUrl": "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
  },
  "email": {
    "enabled": true,
    "smtp": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "your-email@gmail.com",
        "pass": "your-app-password"
      }
    },
    "from": "noreply@dawg-ai.com",
    "to": ["team@dawg-ai.com"]
  },
  "alertThresholds": {
    "criticalFailures": true,
    "passRateDrop": 10,
    "consecutiveFailures": 3
  }
}
```

Or use environment variables:

```bash
# Slack
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Discord
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"

# Email
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASS="your-app-password"
export EMAIL_FROM="noreply@dawg-ai.com"
export EMAIL_TO="team@dawg-ai.com,dev@dawg-ai.com"

# Twilio (Optional)
export TWILIO_ACCOUNT_SID="your-account-sid"
export TWILIO_AUTH_TOKEN="your-auth-token"
export TWILIO_PHONE_NUMBER="+1234567890"
export SMS_RECIPIENTS="+1234567890,+0987654321"
```

### 3. Run Tests with Dashboard Integration

The AI Testing Agent automatically sends updates to the dashboard:

```bash
# In one terminal, start the dashboard
npm run test:dashboard

# In another terminal, run the AI agent
npm run test:ai-agent
```

## Dashboard UI

### Main Metrics Cards
- **Current Test**: Shows active test with progress and ETA
- **Total Tests**: All-time test count
- **Pass Rate**: Success percentage with trend indicator
- **Avg Duration**: Average test execution time

### Charts
1. **Pass Rate Trend**: Hourly pass rate for last 24 hours
2. **Test Execution Time**: Duration of last 50 tests
3. **Failure Heatmap**: Top 10 components by failure count
4. **Cost Tracking**: Daily testing costs for last 7 days

### Timeline
- Real-time test results feed
- Shows last 50 test executions
- Displays test name, status, duration, and errors

### Notification Settings Panel
- Toggle notifications for each channel
- Test button to verify configuration
- Settings persist in browser localStorage

## API Endpoints

### WebSocket
```
ws://localhost:4000
```

**Events:**
- `initial-status`: Sent when client connects
- `test-started`: Test run begins
- `test-update`: Individual test completes
- `test-completed`: Full test run completes

### REST API

#### GET /api/status
Get current test status summary

**Response:**
```json
{
  "totalTests": 150,
  "passed": 142,
  "failed": 5,
  "skipped": 3,
  "avgDuration": 1234,
  "passRate": 94.7,
  "passRateChange": -2.3
}
```

#### GET /api/history?limit=100
Get test history (last N tests)

#### GET /api/trends
Get pass rate trends over time

#### GET /api/heatmap
Get failure heatmap by component

#### GET /api/costs
Get cost tracking data

#### POST /api/notifications/settings
Update notification settings

#### POST /api/notifications/test
Test notification for a channel

**Body:**
```json
{
  "channel": "slack"
}
```

#### POST /api/test-update
Receive test update from agent (used by agent)

#### POST /api/test-started
Test run started notification

#### POST /api/test-completed
Test run completed notification

## Notification Examples

### Slack
![Slack Notification](https://via.placeholder.com/500x150?text=Slack+Notification)

Critical failures and pass rate drops are posted to configured Slack channels with:
- Color-coded attachments
- Detailed test information
- Optional @mentions for urgent alerts

### Discord
![Discord Notification](https://via.placeholder.com/500x150?text=Discord+Notification)

Rich embeds with:
- Colored sidebar based on severity
- Inline fields for test details
- Timestamps and footer

### Email
Professional HTML emails with:
- Test summary
- Detailed results table
- Failure information
- Direct links to dashboard

### Browser
Native OS notifications when:
- Test fails (if dashboard is open)
- Test run completes
- Critical alerts triggered

### SMS (Optional)
Text messages via Twilio for:
- Critical test failures only
- Configurable recipient list
- Concise alert format

## Alert Thresholds

Configure when to receive alerts:

```json
{
  "alertThresholds": {
    "criticalFailures": true,        // Alert on any critical test failure
    "passRateDrop": 10,               // Alert if pass rate drops >10%
    "consecutiveFailures": 3          // Alert after N consecutive failures
  }
}
```

## Mobile Responsive

The dashboard is fully responsive and works on mobile devices:
- Stacked metric cards on small screens
- Touch-friendly controls
- Optimized chart sizes
- Collapsible sections

## Data Persistence

Metrics are stored in:
```
tests/ai-testing-agent/dashboard/metrics-data.json
```

Settings are stored in:
```
tests/ai-testing-agent/dashboard/notification-settings.json
```

### Data Retention

By default, keeps:
- Last 1,000 test results
- Last 100 test run completions
- 30 days of historical data

Configure retention in `metrics-collector.ts`.

## Cost Estimation

The dashboard estimates test costs based on:
- Test type (E2E, integration, unit, performance, quality)
- Test duration
- API usage (GPT-4 calls for quality tests)

Estimated rates:
- E2E: $0.0001/second
- Integration: $0.00005/second
- Unit: $0.00001/second
- Performance: $0.00008/second
- Quality: $0.0002/second + $0.01 per GPT-4 call

## Troubleshooting

### Dashboard won't start
- Check port 4000 is available
- Ensure all dependencies installed: `npm install`

### No real-time updates
- Verify WebSocket connection in browser console
- Check firewall settings
- Ensure dashboard is running before agent

### Notifications not sending
- Verify webhook URLs are correct
- Check SMTP credentials for email
- Test notifications using Test button
- Review console logs for errors

### Browser notifications not working
- Grant notification permission when prompted
- Check browser notification settings
- Enable in dashboard settings panel

## Architecture

```
┌─────────────────┐
│  AI Testing     │
│     Agent       │
│                 │
│  - Runs tests   │
│  - Sends updates│
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────┐
│   Dashboard     │
│    Server       │
│                 │
│  - Express      │
│  - WebSocket    │
│  - REST API     │
└────┬────────┬───┘
     │        │
     │        └─────────────┐
     │ WebSocket            │ Webhooks
     ▼                      ▼
┌─────────────┐    ┌────────────────┐
│  Dashboard  │    │  Notification  │
│     UI      │    │   Channels     │
│             │    │                │
│  - Charts   │    │  - Slack       │
│  - Timeline │    │  - Discord     │
│  - Metrics  │    │  - Email       │
└─────────────┘    │  - SMS         │
                   └────────────────┘
```

## Performance

- WebSocket connections: Unlimited
- API rate limit: None (local)
- Data persistence: JSON file-based
- Chart rendering: Client-side (Chart.js)
- Update frequency: Real-time via WebSocket

## Security

- Dashboard runs on localhost only
- No authentication required (local development)
- Environment variables for sensitive data
- Webhook URLs not exposed in frontend

For production deployment:
- Add authentication middleware
- Use HTTPS/WSS
- Implement rate limiting
- Store credentials in secure vault

## License

MIT
