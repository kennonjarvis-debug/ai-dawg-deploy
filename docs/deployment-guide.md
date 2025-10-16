# DAWG AI - Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2025-10-15
**Target:** Mother-Load Chat-to-Create Production Deployment

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Redis Setup](#redis-setup)
4. [S3 Storage Setup](#s3-storage-setup)
5. [Database Deployment](#database-deployment)
6. [WebSocket Scaling](#websocket-scaling)
7. [Application Deployment](#application-deployment)
8. [Monitoring & Observability](#monitoring--observability)
9. [Health Checks & Rollback](#health-checks--rollback)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js 20+ and npm
- Docker (for local Redis/PostgreSQL)
- AWS CLI (for S3 configuration)
- Git
- Railway CLI (for production deployment)

### Required Access
- AWS account with IAM permissions
- Railway account (or alternative hosting)
- Domain name (optional for production)

### System Requirements
- **CPU:** 2+ cores
- **RAM:** 4GB minimum, 8GB recommended
- **Disk:** 20GB minimum
- **Network:** Stable internet connection

---

## Environment Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/your-org/ai-dawg-deploy.git
cd ai-dawg-deploy

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Fill in the required values (see `.env.example` for all options):

**Critical Variables:**
```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...

# Database
DATABASE_URL=postgresql://user:password@host:5432/dawg_ai

# Redis
REDIS_URL=redis://localhost:6379

# S3 Storage
AWS_S3_BUCKET=dawg-ai-audio-production
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1

# Security
JWT_SECRET=your-secure-random-string-here
SESSION_SECRET=your-session-secret-here
```

### 3. Verify Configuration

```bash
# Test environment variables
node -e "require('dotenv').config(); console.log('✓ Environment loaded');"

# Test database connection
npm run db:generate
```

---

## Redis Setup

Redis is required for:
- **Job Queue:** BullMQ for audio generation jobs
- **WebSocket Clustering:** Socket.io adapter for multi-instance scaling
- **Caching:** Conversation history and session data

### Option A: Local Development (macOS)

```bash
# Install Redis via Homebrew
brew install redis

# Start Redis server
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return "PONG"
```

### Option B: Docker

```bash
# Run Redis in Docker
docker run -d \
  --name dawg-redis \
  -p 6379:6379 \
  redis:7-alpine redis-server --appendonly yes

# Verify connection
docker exec -it dawg-redis redis-cli ping
```

### Option C: Railway (Production)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Add Redis service
railway add redis

# Get Redis URL
railway variables
# Copy REDIS_URL to your .env file
```

### Option D: AWS ElastiCache (Production)

1. Go to AWS Console → ElastiCache
2. Create Redis cluster:
   - **Engine:** Redis 7.x
   - **Node Type:** cache.t3.micro (for testing) or cache.t3.medium (production)
   - **Number of replicas:** 1-2 for high availability
   - **Encryption:** Enable in-transit and at-rest encryption
3. Copy the endpoint URL to `REDIS_URL` in `.env`

### Testing Redis Connection

```bash
# Test with Node.js
node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping().then(result => {
  console.log('✓ Redis connected:', result);
  redis.disconnect();
}).catch(err => {
  console.error('✗ Redis connection failed:', err.message);
});
"
```

---

## S3 Storage Setup

S3 stores generated audio files and provides CDN distribution.

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://dawg-ai-audio-production --region us-east-1

# Or use the provided script
./scripts/setup-s3.sh
```

### 2. Configure Bucket CORS

Create `s3-cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://www.dawg-ai.com", "http://localhost:5173"],
      "AllowedMethods": ["GET", "POST", "PUT"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

Apply CORS configuration:

```bash
aws s3api put-bucket-cors \
  --bucket dawg-ai-audio-production \
  --cors-configuration file://s3-cors.json
```

### 3. Configure Bucket Policy

Create `s3-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dawg-ai-audio-production/*"
    }
  ]
}
```

Apply policy:

```bash
aws s3api put-bucket-policy \
  --bucket dawg-ai-audio-production \
  --policy file://s3-policy.json
```

### 4. Create IAM User

Create IAM user with S3 permissions:

```bash
# Create user
aws iam create-user --user-name dawg-ai-s3-user

# Attach S3 policy
aws iam attach-user-policy \
  --user-name dawg-ai-s3-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name dawg-ai-s3-user
# Save the AccessKeyId and SecretAccessKey to your .env
```

### 5. Test S3 Upload

```bash
# Test with AWS CLI
echo "test" > test-audio.txt
aws s3 cp test-audio.txt s3://dawg-ai-audio-production/test/
aws s3 rm s3://dawg-ai-audio-production/test/test-audio.txt

# Test with Node.js
node -e "
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: process.env.AWS_REGION });
s3.send(new PutObjectCommand({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: 'test/node-test.txt',
  Body: 'Hello from Node.js'
})).then(() => console.log('✓ S3 upload successful'));
"
```

### 6. Configure CloudFront CDN (Optional)

1. Go to AWS Console → CloudFront
2. Create distribution:
   - **Origin:** Your S3 bucket
   - **Viewer Protocol Policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP Methods:** GET, HEAD, OPTIONS
   - **Cached HTTP Methods:** GET, HEAD
3. Update `.env`:
   ```bash
   AWS_CLOUDFRONT_URL=https://d123456789.cloudfront.net
   ```

---

## Database Deployment

### 1. Local Development (SQLite)

Already configured in `.env`:

```bash
DATABASE_URL="file:./dev.db"
```

Run migrations:

```bash
npm run db:migrate
```

### 2. Production (PostgreSQL)

#### Railway PostgreSQL

```bash
# Add PostgreSQL service
railway add postgresql

# Get DATABASE_URL
railway variables
# Copy DATABASE_URL to your .env
```

#### AWS RDS PostgreSQL

1. Go to AWS Console → RDS
2. Create database:
   - **Engine:** PostgreSQL 15+
   - **Template:** Production (with Multi-AZ)
   - **Instance Type:** db.t3.micro (testing) or db.t3.medium (production)
   - **Storage:** 20GB minimum, enable autoscaling
   - **Backup:** Enable automated backups (7 days)
3. Copy endpoint to `.env`:
   ```bash
   DATABASE_URL=postgresql://username:password@endpoint.rds.amazonaws.com:5432/dawg_ai
   ```

### 3. Run Migrations on Production

```bash
# Dry run (preview changes)
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource $DATABASE_URL \
  --script

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 4. Database Backups

**Automated Backups (RDS):**
- Enable automated backups in RDS console
- Retention: 7-30 days
- Backup window: Low-traffic hours (e.g., 3 AM UTC)

**Manual Backups:**

```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20251015.sql
```

### 5. Connection Pooling

Update `.env` for production:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dawg_ai?connection_limit=10&pool_timeout=20
```

---

## WebSocket Scaling

For multi-instance deployments, configure Redis adapter for Socket.io.

### 1. Install Redis Adapter

Already included in `package.json`:

```bash
npm install socket.io-redis
```

### 2. Update WebSocket Server

The WebSocket server at `/Users/benkennon/ai-dawg-deploy/src/api/websocket/server.ts` needs Redis adapter integration.

Add to the beginning of `initializeWebSocket()`:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export function initializeWebSocket(io: SocketIOServer) {
  // Configure Redis adapter for clustering
  if (process.env.WEBSOCKET_REDIS_ADAPTER === 'true') {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('WebSocket Redis adapter enabled for clustering');
    });
  }

  ioInstance = io;
  // ... rest of the code
}
```

### 3. Enable in Production

Update `.env`:

```bash
WEBSOCKET_REDIS_ADAPTER=true
```

### 4. Test Multi-Instance

```bash
# Start instance 1
PORT=3001 npm run dev:server

# Start instance 2
PORT=3002 npm run dev:server

# Connect clients to different instances and verify messages are synced
```

---

## Application Deployment

### Option A: Railway

```bash
# Login to Railway
railway login

# Link project
railway link

# Set environment variables
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set DATABASE_URL=postgresql://...
railway variables set REDIS_URL=redis://...

# Deploy
git push railway main

# View logs
railway logs
```

### Option B: Docker

```bash
# Build Docker image
docker build -t dawg-ai:latest .

# Run container
docker run -d \
  --name dawg-ai \
  -p 3001:3001 \
  --env-file .env \
  dawg-ai:latest

# View logs
docker logs -f dawg-ai
```

### Option C: Manual Deployment

```bash
# Build application
npm run build
npm run build:ui

# Start production server
NODE_ENV=production npm start
```

---

## Monitoring & Observability

### 1. Application Metrics

Already configured with Prometheus metrics at `/metrics`:

- API response times
- WebSocket connections
- Job queue statistics
- Error rates

Access metrics:

```bash
curl http://localhost:3001/metrics
```

### 2. Logging

Configure log level in `.env`:

```bash
LOG_LEVEL=info  # debug, info, warn, error
```

View logs:

```bash
# Development
npm run dev:server

# Production
pm2 logs dawg-ai
# or
railway logs
```

### 3. Error Tracking (Sentry)

1. Create Sentry project at sentry.io
2. Add to `.env`:
   ```bash
   SENTRY_DSN=https://...@sentry.io/...
   ```

### 4. Monitoring Dashboard

Set up Grafana dashboard:

1. Install Grafana
2. Add Prometheus data source
3. Import dashboard from `config/grafana-dashboard.json`
4. Monitor:
   - API response time (target < 200ms)
   - Generation job queue size (alert if > 50)
   - WebSocket connections
   - Error rate (alert if > 5%)

### 5. Alerts

Configure alerts in `.env`:

```bash
# Email alerts
SMTP_HOST=smtp.gmail.com
SMTP_USER=alerts@dawg-ai.com
SMTP_PASSWORD=...
ALERT_EMAIL=team@dawg-ai.com
```

Alert conditions:
- API error rate > 5%
- Generation queue > 50 jobs
- WebSocket disconnections > 10/min
- Database slow queries > 1s
- Disk space < 10%

---

## Health Checks & Rollback

### 1. Health Check Endpoint

The application exposes `/health`:

```bash
curl http://localhost:3001/health

# Response:
{
  "status": "healthy",
  "timestamp": "2025-10-15T12:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "s3": "accessible"
  }
}
```

### 2. Pre-Deployment Checklist

- [ ] All tests passing (`npm test`, `npm run test:e2e`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Redis connection verified
- [ ] S3 bucket accessible
- [ ] Build successful (`npm run build`)
- [ ] Health check returns 200 OK

### 3. Deployment Steps

```bash
# 1. Tag release
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0

# 2. Backup database
pg_dump $DATABASE_URL > backup-pre-deploy.sql

# 3. Run migrations
npx prisma migrate deploy

# 4. Deploy application
git push railway main

# 5. Verify health
curl https://api.dawg-ai.com/health

# 6. Monitor logs
railway logs --follow

# 7. Test critical flows
npm run test:e2e
```

### 4. Rollback Procedure

If deployment fails:

```bash
# 1. Rollback code
railway rollback

# 2. Rollback database (if needed)
psql $DATABASE_URL < backup-pre-deploy.sql

# 3. Verify health
curl https://api.dawg-ai.com/health

# 4. Notify team
echo "Deployment rolled back. Investigating issue."
```

### 5. Zero-Downtime Deployment

Use blue-green deployment:

```bash
# 1. Deploy to staging environment
railway environment create staging

# 2. Test staging
curl https://staging.dawg-ai.com/health

# 3. Promote to production
railway environment promote staging

# 4. Monitor production
railway logs --environment production
```

---

## Troubleshooting

### Redis Connection Issues

**Error:** `ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
brew services start redis
# or
docker start dawg-redis

# Verify REDIS_URL in .env
echo $REDIS_URL
```

### S3 Upload Failures

**Error:** `AccessDenied: Access Denied`

**Solution:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check IAM permissions
aws iam get-user-policy \
  --user-name dawg-ai-s3-user \
  --policy-name S3Access

# Test upload manually
aws s3 cp test.txt s3://dawg-ai-audio-production/test/
```

### Database Migration Errors

**Error:** `P1001: Can't reach database server`

**Solution:**
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check firewall rules (AWS RDS security groups)
```

### WebSocket Connection Failures

**Error:** `WebSocket connection to 'wss://...' failed`

**Solution:**
```bash
# Check CORS configuration
echo $CORS_ORIGIN

# Verify WebSocket port
curl http://localhost:3003/socket.io/

# Check firewall/load balancer settings
```

### High Memory Usage

**Symptom:** Application crashes with `FATAL ERROR: Ineffective mark-compacts near heap limit`

**Solution:**
```bash
# Increase Node.js heap size
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Check for memory leaks
node --inspect index.js
# Use Chrome DevTools to profile memory
```

### Generation Jobs Stuck

**Symptom:** Jobs remain in "processing" status

**Solution:**
```bash
# Check Redis job queue
redis-cli
> KEYS *bull*
> LLEN bull:generation:wait

# Restart workers
pm2 restart all

# Clear stuck jobs (if safe)
redis-cli FLUSHDB
```

---

## Performance Tuning

### 1. Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_generations_user ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM messages WHERE conversation_id = '...';
```

### 2. Redis Optimization

```bash
# Increase max memory
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Enable persistence
redis-cli CONFIG SET appendonly yes
```

### 3. Node.js Optimization

```bash
# Use cluster mode for multi-core CPUs
pm2 start server.js -i max

# Enable compression
COMPRESSION_ENABLED=true npm start
```

---

## Security Best Practices

1. **Never commit secrets** - Use `.env` files, not hardcoded values
2. **Rotate API keys** - Regularly rotate AI provider keys
3. **Enable HTTPS** - Use SSL/TLS for all connections
4. **Rate limiting** - Configure `RATE_LIMIT_MAX=100`
5. **CORS restrictions** - Set `CORS_ORIGIN` to specific domains
6. **Database encryption** - Enable at-rest encryption on RDS
7. **Redis password** - Set `REDIS_PASSWORD` in production
8. **Audit logs** - Enable CloudTrail for AWS resources

---

## Support & Resources

- **Documentation:** https://docs.dawg-ai.com
- **GitHub Issues:** https://github.com/your-org/ai-dawg-deploy/issues
- **Slack:** #dawg-ai-support
- **Email:** support@dawg-ai.com

---

**Deployment Status:** Ready for Production ✅

**Last Deployed:** [To be updated]
**Version:** 1.0.0
**Deployed By:** [Your Name]
