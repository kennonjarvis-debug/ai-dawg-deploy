# AI Testing Agent Dashboard - Quick Start Guide

## What You Get

A complete real-time monitoring dashboard with:
- Live test execution tracking
- WebSocket-based instant updates
- Multi-channel notifications (Slack, Discord, Email, SMS, Browser)
- Historical analytics and trends
- Cost tracking
- Failure heatmaps

## 30-Second Setup

### 1. Start the Dashboard

```bash
npm run test:dashboard
```

Dashboard will be available at: **http://localhost:4000**

### 2. Run the Demo

In a new terminal:

```bash
npm run test:dashboard:demo
```

This will simulate 25 test runs and show all dashboard features in action.

### 3. View Results

Open your browser to http://localhost:4000 and watch:
- ✅ Real-time metrics updating
- 📊 Charts populating with data
- 📝 Timeline filling with test results
- 🔔 Browser notifications (if enabled)

## What You'll See

### Dashboard Overview

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI Testing Agent Dashboard              [Connected]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Current Test │  │  Total   │  │ Pass Rate│  │   Avg   │ │
│  │              │  │  Tests   │  │          │  │ Duration│ │
│  │  Running...  │  │   150    │  │  94.7%   │  │  1.2s   │ │
│  │ [=====>    ] │  │          │  │  ↑ 2.3%  │  │         │ │
│  │  5 / 25      │  │          │  │          │  │         │ │
│  │  ETA: 30s    │  │          │  │          │  │         │ │
│  └──────────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Pass Rate Trend (Last 24 Hours)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        📈 Chart showing pass rate over time          │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Test Execution Time (Last 50 Tests)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        📊 Bar chart of test durations                │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Failure Heatmap by Component                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  smart-mix          ████████████ 12                  │   │
│  │  audio-processing   ████████ 8                       │   │
│  │  chat               ██████ 6                         │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Cost Tracking (Last 7 Days)                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        💰 Line chart of daily test costs            │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Notification Settings                                       │
│  ┌─────────┐  ┌─────────┐  ┌──────┐  ┌─────────┐          │
│  │ 💬 Slack│  │🎮Discord│  │📧Email│ │🔔Browser│          │
│  │  [ON]   │  │  [ON]   │  │ [OFF]│  │  [ON]   │          │
│  │ [Test]  │  │ [Test]  │  │[Test]│  │ [Test]  │          │
│  └─────────┘  └─────────┘  └──────┘  └─────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Recent Test Results                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ ✅  voice-chat-to-music-generation        3200ms     │   │
│  │ ✅  text-chat-to-daw-control             1800ms     │   │
│  │ ❌  smart-mix-to-mastering-pipeline       5200ms     │   │
│  │     Error: Audio processing timeout                  │   │
│  │ ✅  vocal-coaching-real-time              2100ms     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Next Steps

### Run Real Tests

Once you've seen the demo, run the actual AI Testing Agent:

```bash
# Terminal 1: Keep dashboard running
npm run test:dashboard

# Terminal 2: Run the AI agent
npm run test:ai-agent
```

The agent will automatically send updates to the dashboard.

### Configure Notifications

1. **For Slack:**
   - Create a Slack webhook: https://api.slack.com/messaging/webhooks
   - Set environment variable:
     ```bash
     export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
     ```

2. **For Discord:**
   - Create a Discord webhook in your server settings
   - Set environment variable:
     ```bash
     export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
     ```

3. **For Email:**
   - Configure SMTP settings:
     ```bash
     export SMTP_HOST="smtp.gmail.com"
     export SMTP_PORT="587"
     export SMTP_USER="your-email@gmail.com"
     export SMTP_PASS="your-app-password"
     export EMAIL_TO="team@example.com"
     ```

4. **Test Notifications:**
   - Open dashboard
   - Click "Test" button for each channel
   - Verify you receive the test notification

### Enable Browser Notifications

1. When prompted, click "Allow" for notifications
2. Toggle "Browser" notification on in dashboard
3. You'll receive notifications when:
   - Tests fail
   - Test runs complete
   - Critical alerts trigger

## Sample Notifications

### Slack Example
```
🚨 Critical Test Failure

Test: smart-mix-to-mastering-pipeline
Error: Audio processing timeout after 5000ms
Time: 2:30 PM

DAWG AI Testing Agent
```

### Discord Example
```
🚨 Critical Test Failure

smart-mix-to-mastering-pipeline failed with critical error

Test: smart-mix-to-mastering-pipeline
Error: Audio processing timeout after 5000ms
Time: 2:30 PM

DAWG AI Testing Agent • Just now
```

### Email Example
```
Subject: 🚨 Critical Test Failure

AI Testing Agent Dashboard
Critical Test Failure

Test "smart-mix-to-mastering-pipeline" failed with critical error

─────────────────────────────
Test: smart-mix-to-mastering-pipeline
Error: Audio processing timeout after 5000ms
Time: October 19, 2025 at 2:30 PM
─────────────────────────────

Sent by DAWG AI Testing Agent at 2:30 PM
```

### Browser Notification Example
```
╔════════════════════════════╗
║ ❌ Test Failed             ║
║                            ║
║ smart-mix-to-mastering-    ║
║ pipeline: Audio processing ║
║ timeout after 5000ms       ║
║                            ║
║ [Dismiss]                  ║
╚════════════════════════════╝
```

## Understanding the Metrics

### Pass Rate
- **Green ↑**: Pass rate improved
- **Red ↓**: Pass rate declined
- **Alert**: Triggered if drop >10%

### Current Test
- **Progress bar**: Visual test completion
- **ETA**: Estimated time remaining
- **Updates**: Real-time as tests complete

### Failure Heatmap
- Shows components with most failures
- Helps identify problem areas
- Based on last 7 days

### Cost Tracking
- Estimates test execution costs
- Includes API usage (GPT-4)
- Daily breakdown for budget planning

## Common Use Cases

### 1. Monitor Test Suite Health
```bash
# Run dashboard 24/7
npm run test:dashboard

# Schedule tests with cron
0 */6 * * * cd /path/to/project && npm run test:ai-agent
```

### 2. Get Alerts for Failures
Configure Slack/Discord/Email, then all critical failures will notify your team automatically.

### 3. Track Testing Costs
View cost chart to see daily testing expenses and optimize expensive tests.

### 4. Identify Flaky Components
Check failure heatmap to see which components fail most frequently.

### 5. Monitor Pass Rate Trends
Track pass rate chart to ensure quality isn't degrading over time.

## Keyboard Shortcuts

While on the dashboard:
- `Ctrl/Cmd + R` - Refresh dashboard
- `F5` - Hard refresh (clears cache)

## Mobile Access

The dashboard is fully responsive. Access from mobile by:
1. Get your local IP: `ifconfig | grep "inet "`
2. Access from phone: `http://YOUR_IP:4000`
3. Works on iOS and Android

## Troubleshooting

### "Dashboard not available"
**Issue**: Server not running
**Fix**: Run `npm run test:dashboard`

### No updates showing
**Issue**: WebSocket not connected
**Fix**: Check browser console, refresh page

### Notifications not sending
**Issue**: Invalid configuration
**Fix**: Click "Test" button to verify settings

### Charts not rendering
**Issue**: JavaScript error
**Fix**: Check browser console for errors

## Architecture Summary

```
AI Testing Agent
     │
     │ HTTP POST /api/test-update
     ▼
Dashboard Server (port 4000)
     │
     ├──> WebSocket ──> Browser (Real-time UI)
     ├──> Notifier ──> Slack/Discord/Email/SMS
     └──> Metrics ──> JSON Storage
```

## Files Structure

```
tests/ai-testing-agent/dashboard/
├── server.ts                          # Express + WebSocket server
├── index.html                         # Dashboard UI
├── notifier.ts                        # Multi-channel notifications
├── metrics-collector.ts               # Analytics and trends
├── demo.ts                            # Demo script
├── README.md                          # Full documentation
├── IMPLEMENTATION_SUMMARY.md          # Technical details
├── QUICK_START.md                     # This file
└── notification-settings.example.json # Config template
```

## Commands Reference

```bash
# Start dashboard
npm run test:dashboard

# Run demo
npm run test:dashboard:demo

# Run AI agent (with dashboard integration)
npm run test:ai-agent

# View all audio tests
npm run test:audio

# Run specific audio test
npm run test:audio:daw
```

## Features Checklist

✅ Real-time test execution tracking
✅ Live progress bar with ETA
✅ WebSocket broadcasting
✅ Pass/fail counts
✅ Historical trends (24 hours)
✅ Failure heatmap by component
✅ Cost tracking (7 days)
✅ Slack notifications
✅ Discord notifications
✅ Email notifications
✅ SMS notifications (Twilio)
✅ Browser notifications
✅ Mobile responsive design
✅ Settings persistence
✅ Timeline of recent tests (50)
✅ Health check endpoint
✅ REST API
✅ Data retention management
✅ Alert thresholds
✅ Component-based analysis

## Support

For issues or questions:
1. Check the full README.md
2. Review IMPLEMENTATION_SUMMARY.md
3. Check browser console for errors
4. Verify all dependencies installed: `npm install`

## What's Next?

After getting familiar with the dashboard:
1. Configure your preferred notification channels
2. Set up automated test runs
3. Monitor pass rate trends
4. Optimize expensive tests based on cost tracking
5. Address components with high failure rates

---

**Dashboard URL**: http://localhost:4000
**Demo Command**: `npm run test:dashboard:demo`
**Start Command**: `npm run test:dashboard`

**Enjoy monitoring your AI tests!** 🚀
