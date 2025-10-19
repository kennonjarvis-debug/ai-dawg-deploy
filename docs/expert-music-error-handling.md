# Expert Music AI Error Handling System

## Overview

This document describes the comprehensive error handling system implemented for the Expert Music AI service (port 8003). The system provides robust fault tolerance, graceful degradation, and automatic recovery.

## Architecture

### Components

1. **Health Check Service** (`src/backend/services/expert-music-health-check.ts`)
   - Periodic health monitoring
   - Circuit breaker implementation
   - Metrics tracking
   - Request queueing

2. **Circuit Breaker Integration** (Updated services)
   - `expert-music-service.ts` - Pre-request validation
   - `ai-brain-server.ts` - Endpoint protection

3. **Admin Endpoints** (AI Brain Server port 8002)
   - Health status monitoring
   - Manual health checks
   - Circuit breaker reset
   - Queue management

4. **Frontend Components**
   - Service status indicator
   - User-friendly error messages
   - Alternative suggestions

## Features

### 1. Health Check Service

**Configuration:**
- Check interval: 30 seconds
- Timeout: 5 seconds
- Runs automatically on service start

**Monitored Metrics:**
- Service status (up/down/degraded/circuit_open)
- Circuit breaker state (closed/open/half_open)
- Consecutive failures
- Total successes/failures
- Uptime/downtime tracking
- Average response time

**Example metrics response:**
```json
{
  "status": "up",
  "circuitState": "closed",
  "consecutiveFailures": 0,
  "totalFailures": 5,
  "totalSuccesses": 1247,
  "uptime": 86400000,
  "downtime": 300000,
  "uptimePercentage": 99.65,
  "averageResponseTime": 145
}
```

### 2. Circuit Breaker Pattern

**Behavior:**
- **Threshold**: Trips after 3 consecutive failures
- **Timeout**: Resets after 5 minutes
- **States**:
  - `CLOSED`: Normal operation, requests pass through
  - `OPEN`: Circuit tripped, requests blocked
  - `HALF_OPEN`: Testing recovery, single request allowed

**Benefits:**
- Prevents cascading failures
- Reduces load on failing service
- Automatic recovery testing
- Fast fail for better UX

**Flow Diagram:**
```
[Request] → [Check Circuit] → [CLOSED] → [Forward to Service]
                ↓
           [OPEN]
                ↓
         [Block Request]
                ↓
      [Return Error + Alternatives]
                ↓
         [After 5 min]
                ↓
         [HALF_OPEN]
                ↓
      [Test Recovery]
```

### 3. Graceful Degradation

When Expert Music AI is unavailable, the system provides:

**Circuit Open Response (503):**
```json
{
  "error": "Expert Music AI service temporarily unavailable",
  "message": "Service is experiencing issues and requests are temporarily blocked",
  "status": "circuit_breaker_open",
  "retryAfter": 300,
  "alternatives": [
    "Try using Udio or Suno for music generation instead",
    "Queue your request to be processed when service recovers"
  ],
  "queueOption": true
}
```

**Service Down Response (503):**
```json
{
  "error": "Expert Music AI service currently unavailable",
  "message": "The service is temporarily down. You can queue your request or use an alternative.",
  "status": "service_down",
  "consecutiveFailures": 2,
  "alternatives": [
    "Queue your request to be processed when service recovers",
    "Use Udio or Suno for music generation instead"
  ],
  "queueOption": true,
  "estimatedRecoveryTime": "unknown"
}
```

### 4. Request Queueing

**Features:**
- Automatic queuing of failed requests
- Processing when service recovers
- 10-minute timeout for queued requests
- Queue size monitoring

**Usage:**
```typescript
// Queue a request (returns Promise)
const result = await expertMusicHealthCheck.queueRequest(
  '/melody-to-vocals',
  { prompt: 'test', genre: 'pop' }
);

// Check queue size
const queueLength = expertMusicHealthCheck.getQueuedRequestsCount();

// Clear queue (admin)
expertMusicHealthCheck.clearQueue();
```

### 5. Admin Alerts

**Automatic Alerts:**
- Triggered after 5 minutes of downtime
- Sent once per downtime period
- Includes failure details

**Alert Event Data:**
```json
{
  "duration": 300000,
  "durationMinutes": 5,
  "consecutiveFailures": 10,
  "lastSuccessTime": "2025-01-15T10:30:00Z",
  "status": "circuit_open"
}
```

**Integration Points:**
- Email notifications (TODO)
- Slack/Discord webhooks (TODO)
- PagerDuty alerts (TODO)

## API Endpoints

### GET /health
Main health check with dependency status.

**Response:**
```json
{
  "status": "healthy",
  "service": "ai-brain",
  "timestamp": "2025-01-15T12:00:00Z",
  "dependencies": {
    "expertMusicAI": {
      "status": "up",
      "circuitState": "closed",
      "uptimePercentage": "99.5",
      "lastCheckTime": "2025-01-15T11:59:30Z"
    }
  }
}
```

### GET /api/expert-music/health
Detailed Expert Music AI health metrics.

**Response:**
```json
{
  "success": true,
  "metrics": {
    "status": "up",
    "circuitState": "closed",
    "consecutiveFailures": 0,
    "totalFailures": 3,
    "totalSuccesses": 567,
    "uptime": 86400000,
    "downtime": 120000,
    "uptimePercentage": "99.86%",
    "uptimeHours": "24.00",
    "downtimeHours": "0.03",
    "lastCheckTime": "2025-01-15T12:00:00Z",
    "lastSuccessTime": "2025-01-15T11:59:30Z",
    "lastFailureTime": "2025-01-14T08:15:00Z",
    "averageResponseTime": 145
  },
  "queuedRequests": 0
}
```

### POST /api/expert-music/health/check
Manually trigger health check (admin).

**Response:**
```json
{
  "success": true,
  "message": "Health check completed",
  "metrics": {
    "status": "up",
    "lastCheckTime": "2025-01-15T12:00:05Z"
  }
}
```

### POST /api/expert-music/circuit-breaker/reset
Manually reset circuit breaker (admin).

**Response:**
```json
{
  "success": true,
  "message": "Circuit breaker has been reset",
  "status": "down",
  "circuitState": "closed"
}
```

### POST /api/expert-music/queue/clear
Clear all queued requests (admin).

**Response:**
```json
{
  "success": true,
  "message": "Cleared 5 queued requests"
}
```

## Frontend Integration

### React Component

```tsx
import ExpertMusicStatusIndicator from '@/ui/components/ExpertMusicStatusIndicator';

// Compact mode
<ExpertMusicStatusIndicator compact />

// Detailed mode with callback
<ExpertMusicStatusIndicator
  showDetails
  onStatusChange={(status) => console.log('Status:', status)}
/>
```

### Component Features
- Real-time status updates (30s polling)
- Color-coded status indicators
- Detailed metrics display
- Alternative suggestions
- Manual refresh button

## Event System

The health check service emits events for monitoring:

```typescript
import { expertMusicHealthCheck } from './services/expert-music-health-check';

// Service came online
expertMusicHealthCheck.on('service-up', () => {
  console.log('Service is UP');
});

// Service went offline
expertMusicHealthCheck.on('service-down', () => {
  console.log('Service is DOWN');
});

// Circuit breaker opened
expertMusicHealthCheck.on('circuit-opened', (data) => {
  console.log('Circuit OPENED:', data);
  // Send alert to admins
});

// Circuit breaker closed
expertMusicHealthCheck.on('circuit-closed', () => {
  console.log('Circuit CLOSED');
});

// Downtime alert (>5 minutes)
expertMusicHealthCheck.on('downtime-alert', (data) => {
  console.log('ALERT: Extended downtime', data);
  // Send urgent notification
});

// Request queued
expertMusicHealthCheck.on('request-queued', (data) => {
  console.log('Request queued:', data);
});
```

## Testing

### Manual Testing

1. **Test Circuit Breaker:**
   ```bash
   # Stop Expert Music AI service
   # Wait for 3 failed health checks (90 seconds)
   # Verify circuit opens

   curl http://localhost:8002/api/expert-music/health
   # Should show "circuit_open"
   ```

2. **Test Request Blocking:**
   ```bash
   # With circuit open, try melody-to-vocals
   curl -X POST http://localhost:8002/api/melody-to-vocals \
     -F "audio_file=@melody.wav" \
     -F "prompt=test"

   # Should return 503 with alternatives
   ```

3. **Test Recovery:**
   ```bash
   # Start Expert Music AI service
   # Wait 5 minutes for circuit timeout
   # Verify circuit closes and service recovers
   ```

4. **Test Admin Endpoints:**
   ```bash
   # Manual health check
   curl -X POST http://localhost:8002/api/expert-music/health/check

   # Reset circuit breaker
   curl -X POST http://localhost:8002/api/expert-music/circuit-breaker/reset

   # Clear queue
   curl -X POST http://localhost:8002/api/expert-music/queue/clear
   ```

### Automated Tests

Run the test suite:
```bash
npm run test tests/backend/expert-music-health-check.test.ts
```

**Test Coverage:**
- Circuit breaker state transitions
- Health check success/failure handling
- Metrics tracking accuracy
- Request queueing functionality
- Event emissions
- Edge cases and error handling

## Monitoring Dashboard

### Key Metrics to Track

1. **Service Availability**
   - Current status
   - Uptime percentage
   - Circuit state

2. **Performance**
   - Average response time
   - Success/failure rate
   - Queue length

3. **Failures**
   - Consecutive failures
   - Total failures (24h)
   - Time since last success

4. **Alerts**
   - Active alerts
   - Alert history
   - Downtime duration

## Best Practices

### For Developers

1. **Always check service availability before making requests**
   ```typescript
   if (!expertMusicHealthCheck.isServiceAvailable()) {
     // Handle gracefully
   }
   ```

2. **Handle 503 responses properly**
   - Show user-friendly messages
   - Suggest alternatives
   - Offer to queue request

3. **Monitor health check events**
   - Log state changes
   - Alert on extended downtime
   - Track failure patterns

### For Operations

1. **Monitor health metrics regularly**
   - Set up alerts for extended downtime
   - Track uptime SLAs
   - Review failure logs

2. **Use admin endpoints carefully**
   - Document circuit breaker resets
   - Clear queue only when necessary
   - Investigate root causes

3. **Plan for degraded operation**
   - Ensure Udio/Suno services are available
   - Test fallback paths regularly
   - Have recovery procedures ready

## Troubleshooting

### Circuit Breaker Won't Close

**Symptoms:**
- Circuit stays open after service recovery
- Health checks still failing

**Solutions:**
1. Check Expert Music AI logs for errors
2. Verify network connectivity
3. Manually reset circuit breaker
4. Restart AI Brain server if needed

### Queued Requests Not Processing

**Symptoms:**
- Queue length increasing
- Requests timing out

**Solutions:**
1. Verify service is actually UP
2. Check for processing errors in logs
3. Clear queue and retry manually
4. Increase queue timeout if needed

### High Failure Rate

**Symptoms:**
- Frequent circuit breaker trips
- Low uptime percentage

**Solutions:**
1. Check Expert Music AI resource usage
2. Verify port 8003 is accessible
3. Review network latency
4. Scale Expert Music AI if needed

## Future Enhancements

1. **Advanced Alerting**
   - Email notifications
   - Slack/Discord integration
   - PagerDuty alerts

2. **Smart Queue Management**
   - Priority queuing
   - Request deduplication
   - Batch processing

3. **Predictive Monitoring**
   - Failure pattern detection
   - Proactive alerts
   - Auto-scaling triggers

4. **Dashboard**
   - Real-time metrics visualization
   - Historical data analysis
   - Custom alert rules

## Conclusion

This error handling system provides:
- **Reliability**: Circuit breaker prevents cascading failures
- **Resilience**: Automatic recovery and request queuing
- **Visibility**: Comprehensive metrics and monitoring
- **User Experience**: Graceful degradation with alternatives
- **Operations**: Admin tools for management and troubleshooting

The system is production-ready and follows industry best practices for fault tolerance and service reliability.
