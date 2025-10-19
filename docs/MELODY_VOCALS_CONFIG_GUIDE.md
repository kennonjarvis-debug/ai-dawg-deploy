# Melody-to-Vocals Configuration Guide

## Quick Start

### 1. Environment Variables

Create a `.env` file with the following variables:

```bash
# Required
DATABASE_URL="file:./dev.db"
EXPERT_MUSIC_AI_URL="http://localhost:8003"
REDIS_HOST="localhost"
REDIS_PORT="6379"

# Optional - Timeout & Retry Configuration
MELODY_VOCALS_TIMEOUT="180000"    # 3 minutes (in milliseconds)
MELODY_VOCALS_RETRIES="3"         # Number of retry attempts

# Optional - Music Generation Provider
MUSIC_GENERATION_PROVIDER="udio"  # or "musicgen"
```

### 2. Database Setup

Run Prisma migrations to create the database tables:

```bash
npx prisma migrate dev --name add-melody-vocals-models
npx prisma generate
```

### 3. Redis Setup

Start Redis server:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or using Homebrew (macOS)
brew install redis
brew services start redis

# Or using apt (Ubuntu)
sudo apt install redis-server
sudo systemctl start redis
```

Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### 4. Expert Music AI Service

Ensure the Expert Music AI service is running on port 8003:

```bash
# Check if service is running
curl http://localhost:8003/

# Expected response:
# {"service":"Expert Music AI","status":"running","version":"1.0.0"}
```

### 5. Dependencies

Install required system dependencies:

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows (Chocolatey):**
```bash
choco install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
ffprobe -version
```

---

## Configuration Options

### Service Configuration

#### Request Timeout
Controls how long to wait for Expert Music AI to respond.

```bash
MELODY_VOCALS_TIMEOUT=180000  # 3 minutes (default)
```

**Recommendations:**
- Development: `120000` (2 minutes)
- Production: `180000` (3 minutes)
- High-load: `240000` (4 minutes)

#### Retry Attempts
Number of times to retry a failed request before giving up.

```bash
MELODY_VOCALS_RETRIES=3  # default
```

**Recommendations:**
- Development: `1` (fail fast)
- Production: `3` (resilient)
- Critical: `5` (maximum resilience)

### Queue Configuration

Configured in `/src/backend/jobs/melody-vocals-job.ts`:

```typescript
// Worker concurrency (simultaneous jobs)
const WORKER_CONCURRENCY = 3;  // default

// Rate limiting
const RATE_LIMIT = {
  max: 10,      // Max 10 jobs per...
  duration: 60000  // ...per minute
};

// Job timeout
const JOB_TIMEOUT = 300000;  // 5 minutes
```

**Tuning Guidelines:**

| Environment | Concurrency | Rate Limit | Job Timeout |
|------------|-------------|------------|-------------|
| Development | 1-2 | 5/min | 5 min |
| Staging | 3-5 | 10/min | 5 min |
| Production | 5-10 | 20/min | 7 min |
| High-Scale | 10-20 | 50/min | 10 min |

### Validation Configuration

Configured in `/src/backend/validators/audio-validator.ts`:

```typescript
const DEFAULT_OPTIONS = {
  maxSizeMB: 50,              // Maximum file size
  maxDurationSeconds: 300,    // 5 minutes max
  minDurationSeconds: 1,      // 1 second min
  allowedFormats: [           // Supported formats
    'mp3', 'wav', 'm4a',
    'aac', 'ogg', 'flac'
  ],
  requireStereo: false,       // Allow mono
  minSampleRate: 16000,       // 16kHz minimum
};
```

**Customization Example:**

```typescript
// For high-quality conversions only
const validation = await validateAudioFile(filePath, {
  maxSizeMB: 100,              // Allow larger files
  maxDurationSeconds: 600,     // 10 minutes
  minDurationSeconds: 5,       // At least 5 seconds
  allowedFormats: ['wav', 'flac'],  // Lossless only
  requireStereo: true,         // Stereo required
  minSampleRate: 44100,        // CD quality
});
```

### Quota Configuration

Default quotas (configured in database schema):

```typescript
{
  dailyLimit: 10,        // 10 conversions per day
  monthlyLimit: 100,     // 100 conversions per month
}
```

**Adjusting Quotas:**

```typescript
// Update user quota
await prisma.melodyVocalsQuota.update({
  where: { userId: 'user-123' },
  data: {
    dailyLimit: 50,      // Increased daily
    monthlyLimit: 500,   // Increased monthly
  }
});

// Premium tier example
const PREMIUM_QUOTA = {
  dailyLimit: 100,
  monthlyLimit: 1000,
};

// Enterprise tier example
const ENTERPRISE_QUOTA = {
  dailyLimit: -1,        // Unlimited (check in code)
  monthlyLimit: -1,      // Unlimited
};
```

---

## Circuit Breaker Configuration

Configured in `/src/backend/services/melody-vocals-service.ts`:

```typescript
const CONFIG = {
  CIRCUIT_BREAKER_THRESHOLD: 5,     // Failures before opening
  CIRCUIT_BREAKER_TIMEOUT: 60000,   // 1 min before half-open
};
```

**Understanding Circuit Breaker States:**

1. **CLOSED** (Normal):
   - All requests pass through
   - Failures are counted

2. **OPEN** (Failing):
   - Requests immediately fail
   - No calls to Expert Music AI
   - After timeout, enters half-open

3. **HALF-OPEN** (Testing):
   - Next request attempts to go through
   - Success → CLOSED
   - Failure → OPEN

**Tuning Recommendations:**

| Scenario | Threshold | Timeout |
|----------|-----------|---------|
| Aggressive | 3 failures | 30s |
| Balanced (default) | 5 failures | 60s |
| Conservative | 10 failures | 120s |

---

## Monitoring Configuration

### Health Check Thresholds

Configured in `/src/backend/services/melody-vocals-analytics.ts`:

```typescript
// Alert if error rate exceeds 20% in last hour
const ERROR_RATE_THRESHOLD = 20;  // percent

// Alert if queue backlog exceeds 50 jobs
const QUEUE_BACKLOG_THRESHOLD = 50;

// Alert if average latency exceeds 3 minutes
const LATENCY_THRESHOLD = 180000;  // ms
```

### Logging Configuration

Set log level via environment:

```bash
# Development
LOG_LEVEL=debug

# Production
LOG_LEVEL=info

# Critical only
LOG_LEVEL=error
```

---

## Performance Tuning

### File Upload Configuration

Configured in `/src/backend/routes/melody-vocals-routes.ts`:

```typescript
const upload = multer({
  dest: '/tmp/melody-vocals-uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024,  // 50MB
    files: 1,                     // Single file
  },
});
```

**For High-Volume Scenarios:**

```typescript
const upload = multer({
  dest: '/mnt/fast-storage/uploads/',  // SSD storage
  limits: {
    fileSize: 100 * 1024 * 1024,  // 100MB
    files: 1,
  },
  // Add file filtering
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files allowed'));
    }
  },
});
```

### Database Optimization

**For SQLite (Development):**
```bash
DATABASE_URL="file:./dev.db?connection_limit=1&timeout=30"
```

**For PostgreSQL (Production):**
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/dawg?connection_limit=10&pool_timeout=30"
```

### Redis Optimization

**Connection Pool:**
```typescript
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  // Performance tuning
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
});
```

**For High-Load:**
```typescript
const redisConnection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
  // Increase connection pool
  maxRetriesPerRequest: 5,
  enableOfflineQueue: true,
  // Use Redis Cluster
  cluster: [
    { host: 'redis-1', port: 6379 },
    { host: 'redis-2', port: 6379 },
    { host: 'redis-3', port: 6379 },
  ],
});
```

---

## Production Checklist

### Environment Setup
- [ ] Set `NODE_ENV=production`
- [ ] Configure production database (PostgreSQL)
- [ ] Set up Redis cluster for high availability
- [ ] Configure cloud storage (S3) for uploads
- [ ] Set proper file permissions for upload directory
- [ ] Configure reverse proxy (nginx) with rate limiting
- [ ] Set up SSL/TLS certificates

### Security
- [ ] Enable authentication middleware
- [ ] Add CORS configuration
- [ ] Implement rate limiting per user
- [ ] Add file virus scanning
- [ ] Enable CSRF protection
- [ ] Set secure cookie flags
- [ ] Implement input sanitization

### Monitoring
- [ ] Set up logging aggregation (ELK, CloudWatch)
- [ ] Configure metrics collection (Prometheus)
- [ ] Set up alerting (PagerDuty, Slack)
- [ ] Create monitoring dashboards (Grafana)
- [ ] Enable health check endpoints
- [ ] Configure uptime monitoring

### Performance
- [ ] Enable Redis persistence (RDB + AOF)
- [ ] Set up database read replicas
- [ ] Configure CDN for audio files
- [ ] Enable response compression
- [ ] Set up caching layers
- [ ] Configure auto-scaling

### Backup & Recovery
- [ ] Configure database backups
- [ ] Set up Redis backups
- [ ] Document rollback procedures
- [ ] Test disaster recovery plan
- [ ] Set up data retention policies

---

## Common Issues & Solutions

### Issue: Redis Connection Errors

**Error:** `ECONNREFUSED localhost:6379`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### Issue: Expert Music AI Not Responding

**Error:** `Cannot connect to Expert Music AI service`

**Solution:**
```bash
# Check if service is running
curl http://localhost:8003/

# Check circuit breaker status
curl http://localhost:3000/api/v1/melody-vocals/stats

# Manually reset circuit breaker if needed
# (restart the Node.js service)
```

### Issue: File Upload Fails

**Error:** `File size exceeds maximum`

**Solution:**
1. Check file size: `ls -lh audio.wav`
2. Compress if needed: `ffmpeg -i audio.wav -ab 192k output.mp3`
3. Or increase limit in configuration

### Issue: Queue Processing Slow

**Symptoms:** Jobs stuck in "processing" state

**Solution:**
```bash
# Check queue stats
curl http://localhost:3000/api/v1/melody-vocals/stats

# Increase concurrency in config
# Check worker logs for bottlenecks
# Scale horizontally (add more workers)
```

### Issue: High Memory Usage

**Cause:** Large audio files being processed simultaneously

**Solution:**
1. Reduce worker concurrency
2. Implement streaming processing
3. Add memory limits to workers
4. Clean up temp files aggressively

---

## Support & Resources

- **Documentation:** `/docs/MELODY_VOCALS_PRODUCTION_READY.md`
- **API Reference:** `/docs/api/melody-to-vocals-api.md`
- **Examples:** `/docs/examples/melody-to-vocals-examples.md`
- **Tests:** `/tests/e2e/workflows/melody-vocals-workflow.spec.ts`

For issues, check logs:
```bash
# Application logs
tail -f logs/app.log

# Queue logs
tail -f logs/queue.log

# Error logs
tail -f logs/error.log
```
