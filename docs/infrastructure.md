# DAWG AI - Infrastructure Architecture

**Version:** 1.0.0
**Last Updated:** 2025-10-15
**System:** Mother-Load Chat-to-Create Platform

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Scaling Strategy](#scaling-strategy)
6. [High Availability](#high-availability)
7. [Performance Targets](#performance-targets)
8. [Cost Optimization](#cost-optimization)

---

## System Overview

The DAWG AI platform is a real-time, AI-powered music production system that handles:

- **100+ concurrent users** chatting simultaneously
- **50+ concurrent beat generations**
- **1000+ WebSocket connections** for real-time updates
- **Real-time streaming** with < 100ms latency
- **99.9% uptime** SLA

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React 19 + Vite | User interface |
| **Backend** | Node.js 20 + Express | API server |
| **Real-time** | Socket.io 4 | WebSocket connections |
| **Database** | PostgreSQL 15 | Data persistence |
| **Cache/Queue** | Redis 7 | Job queue + WebSocket clustering |
| **Storage** | AWS S3 | Audio file storage |
| **CDN** | CloudFront | Fast audio delivery |
| **AI Providers** | OpenAI, Anthropic, Google | Chat and generation |
| **Monitoring** | Prometheus + Grafana | Metrics and alerts |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│                                                                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐   │
│  │  Browser  │  │  Browser  │  │  Browser  │  │   ...100+ │   │
│  │  Client 1 │  │  Client 2 │  │  Client 3 │  │   Clients │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘   │
│        │              │              │              │           │
└────────┼──────────────┼──────────────┼──────────────┼───────────┘
         │              │              │              │
         │ HTTPS/WSS    │ HTTPS/WSS    │ HTTPS/WSS    │
         └──────────────┴──────────────┴──────────────┘
                        │
         ┌──────────────▼──────────────────────────────┐
         │         LOAD BALANCER / CDN                  │
         │   - SSL Termination                          │
         │   - Session Affinity (WebSocket)             │
         │   - Rate Limiting                            │
         └──────────────┬──────────────────────────────┘
                        │
         ┌──────────────▼──────────────────────────────┐
         │         APPLICATION LAYER                     │
         │                                              │
         │  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
         │  │ Node.js │  │ Node.js │  │ Node.js │     │
         │  │Instance │  │Instance │  │Instance │     │
         │  │    1    │  │    2    │  │    N    │     │
         │  └────┬────┘  └────┬────┘  └────┬────┘     │
         │       │            │            │           │
         └───────┼────────────┼────────────┼───────────┘
                 │            │            │
         ┌───────▼────────────▼────────────▼───────────┐
         │         REDIS CLUSTER                        │
         │   - Pub/Sub (WebSocket messages)            │
         │   - Job Queue (BullMQ)                      │
         │   - Session Store                           │
         │   - Cache Layer                             │
         └──────────────┬──────────────────────────────┘
                        │
         ┌──────────────▼──────────────────────────────┐
         │         DATABASE LAYER                       │
         │                                              │
         │  ┌─────────────────────────────────┐        │
         │  │   PostgreSQL (Primary)          │        │
         │  │   - User data                   │        │
         │  │   - Conversations               │        │
         │  │   - Messages                    │        │
         │  │   - Generations                 │        │
         │  └─────────┬───────────────────────┘        │
         │            │                                 │
         │  ┌─────────▼───────────────────────┐        │
         │  │   PostgreSQL (Replica - Read)   │        │
         │  │   - Query offloading            │        │
         │  └─────────────────────────────────┘        │
         └──────────────┬──────────────────────────────┘
                        │
         ┌──────────────▼──────────────────────────────┐
         │         STORAGE LAYER                        │
         │                                              │
         │  ┌─────────────────────────────────┐        │
         │  │   AWS S3 Bucket                 │        │
         │  │   - Generated audio files       │        │
         │  │   - User uploads                │        │
         │  │   - Versioning enabled          │        │
         │  └─────────┬───────────────────────┘        │
         │            │                                 │
         │  ┌─────────▼───────────────────────┐        │
         │  │   CloudFront CDN                │        │
         │  │   - Edge caching                │        │
         │  │   - Signed URLs                 │        │
         │  └─────────────────────────────────┘        │
         └──────────────┬──────────────────────────────┘
                        │
         ┌──────────────▼──────────────────────────────┐
         │         AI PROVIDER LAYER                    │
         │                                              │
         │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
         │  │ OpenAI   │  │Anthropic │  │  Google  │  │
         │  │   API    │  │   API    │  │   API    │  │
         │  └──────────┘  └──────────┘  └──────────┘  │
         │                                              │
         └──────────────────────────────────────────────┘
                        │
         ┌──────────────▼──────────────────────────────┐
         │      MONITORING & OBSERVABILITY              │
         │                                              │
         │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
         │  │Prometheus│  │  Grafana │  │  Sentry  │  │
         │  │ Metrics  │  │Dashboard │  │  Errors  │  │
         │  └──────────┘  └──────────┘  └──────────┘  │
         └──────────────────────────────────────────────┘
```

---

## Core Components

### 1. Application Server (Node.js)

**Purpose:** Core API and business logic

**Key Responsibilities:**
- REST API endpoints (`/api/chat/*`, `/api/generate/*`)
- WebSocket connection management
- Authentication and authorization
- Request validation and rate limiting
- AI provider orchestration

**Scaling:**
- Horizontal: Multiple instances behind load balancer
- Vertical: 2-4 CPU cores, 4-8GB RAM per instance

**Critical Files:**
- `/src/gateway/server.ts` - Main Express server
- `/src/api/websocket/server.ts` - WebSocket server
- `/src/gateway/rest-api.ts` - REST API routes

### 2. Redis Cluster

**Purpose:** Job queue, pub/sub, caching

**Use Cases:**

**A. Job Queue (BullMQ)**
- Manages audio generation jobs
- Priority queue with retry logic
- Progress tracking
- Job concurrency: 5 concurrent jobs

```typescript
// Job queue configuration
{
  concurrency: 5,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
}
```

**B. WebSocket Pub/Sub**
- Syncs WebSocket messages across server instances
- Redis adapter for Socket.io
- Ensures message delivery to all clients

**C. Session Store**
- User session persistence
- Conversation context caching
- TTL: 24 hours

**Scaling:**
- Redis Cluster with 3-5 nodes
- Master-replica setup for high availability
- Memory: 2-4GB per node

### 3. PostgreSQL Database

**Purpose:** Persistent data storage

**Schema Overview:**

```sql
-- Conversations (user chat sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages (chat messages)
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL, -- user | assistant | system
  content TEXT NOT NULL,
  intent VARCHAR(50), -- GENERATE_BEAT, MIX_TRACK, etc.
  entities JSONB, -- { genre, bpm, key, mood }
  generation_id UUID, -- Link to generation job
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generations (audio generation jobs)
CREATE TABLE generations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  type VARCHAR(20) NOT NULL, -- beat | stems | mix | master
  status VARCHAR(20) NOT NULL, -- pending | processing | completed | failed
  input JSONB NOT NULL, -- User request parameters
  output JSONB, -- Generated audio URLs, metadata
  provider VARCHAR(20), -- openai | anthropic | local
  cost DECIMAL(10,4) DEFAULT 0,
  duration_ms INTEGER, -- Processing time
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_generation ON messages(generation_id);
CREATE INDEX idx_generations_user ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
```

**Performance Optimizations:**
- Connection pooling: 10-20 connections
- Read replicas for analytics queries
- Automatic vacuuming enabled
- Query timeout: 5 seconds

**Scaling:**
- Vertical: db.t3.medium → db.m5.large
- Horizontal: Read replicas (1-2)
- Storage: 20GB-100GB with autoscaling

### 4. S3 + CloudFront

**Purpose:** Audio file storage and delivery

**S3 Configuration:**
- **Bucket:** `dawg-ai-audio-production`
- **Region:** us-east-1
- **Versioning:** Enabled
- **Encryption:** AES-256 at rest
- **Lifecycle:** Archive to Glacier after 90 days

**File Structure:**
```
s3://dawg-ai-audio-production/
├── generated/
│   ├── beats/
│   │   ├── {userId}/
│   │   │   └── {generationId}.mp3
│   ├── stems/
│   │   ├── {userId}/
│   │   │   └── {generationId}-{stem}.wav
├── uploads/
│   └── {userId}/
│       └── {uploadId}.mp3
```

**CloudFront Setup:**
- **Distribution:** Global edge locations
- **Cache TTL:** 24 hours
- **Signed URLs:** 1 hour expiration
- **Invalidation:** On file update

**Scaling:**
- S3: Unlimited storage
- CloudFront: Automatic scaling
- Cost: ~$0.023/GB storage + $0.085/GB transfer

### 5. WebSocket Server (Socket.io)

**Purpose:** Real-time bidirectional communication

**Events:**

```typescript
// Chat events
socket.emit('chat:stream', { conversationId, chunk });
socket.emit('chat:complete', { conversationId, messageId });

// Generation events
socket.emit('generation:queued', { jobId, estimatedTime });
socket.emit('generation:progress', { jobId, percent, stage });
socket.emit('generation:completed', { jobId, audioUrl, metadata });
socket.emit('generation:failed', { jobId, error });

// Collaboration events
socket.emit('project:updated', { projectId, update });
socket.emit('track:created', { projectId, track });
```

**Scaling with Redis Adapter:**

```typescript
// Multi-instance scaling
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Performance:**
- Max connections per instance: 5,000
- Heartbeat interval: 25s
- Ping timeout: 20s
- Reconnection attempts: 5

---

## Data Flow

### 1. Chat Message Flow

```
User types message
    ↓
Frontend sends via WebSocket
    ↓
Server receives → Intent detection
    ↓
Store message in PostgreSQL
    ↓
If GENERATE intent:
    ↓
    Create job in Redis queue
    ↓
    Worker picks up job
    ↓
    Call AI provider API
    ↓
    Generate audio → Upload to S3
    ↓
    Update generation status in PostgreSQL
    ↓
    Emit progress via WebSocket (Redis pub/sub)
    ↓
User receives audio URL
```

### 2. Generation Job Flow

```
POST /api/generate/beat
    ↓
Validate request (genre, BPM, key)
    ↓
Create Generation record (status: pending)
    ↓
Add job to Redis queue (BullMQ)
    ↓
Emit 'generation:queued' event
    ↓
Worker processes job:
    ├─ 0-25%: Generating drum pattern
    ├─ 25-50%: Creating bassline
    ├─ 50-75%: Adding melody
    └─ 75-100%: Mixing and finalizing
    ↓
Upload audio to S3
    ↓
Generate CloudFront signed URL
    ↓
Update Generation record (status: completed)
    ↓
Emit 'generation:completed' event
    ↓
Client downloads and plays audio
```

### 3. WebSocket Synchronization Flow

```
User A sends message (connected to Instance 1)
    ↓
Instance 1 publishes to Redis channel
    ↓
Redis broadcasts to all subscribed instances
    ↓
Instance 2, 3, N receive via Redis pub/sub
    ↓
Each instance emits to connected clients
    ↓
User B (Instance 2) and User C (Instance 3) receive message
```

---

## Scaling Strategy

### Horizontal Scaling

**Application Servers:**
- Start: 2 instances (active-active)
- Scale trigger: CPU > 70% OR Memory > 80%
- Scale up to: 10 instances
- Load balancer: Round-robin with session affinity

**Redis:**
- Start: 1 master + 1 replica
- Scale trigger: Memory > 80%
- Scale up to: 5 node cluster
- Sharding: By key prefix

**PostgreSQL:**
- Start: 1 primary
- Scale trigger: Read queries > 1000/sec
- Add read replicas: 1-2
- Read/write split: Prisma replica support

### Vertical Scaling

**Application Server:**
| Metric | Small | Medium | Large |
|--------|-------|--------|-------|
| CPU | 2 cores | 4 cores | 8 cores |
| RAM | 4GB | 8GB | 16GB |
| Users | 0-50 | 50-200 | 200-500 |

**Database:**
| Metric | Small | Medium | Large |
|--------|-------|--------|-------|
| Type | db.t3.micro | db.t3.medium | db.m5.large |
| CPU | 2 vCPU | 2 vCPU | 2 vCPU |
| RAM | 1GB | 4GB | 8GB |
| Storage | 20GB | 50GB | 100GB |

### Auto-Scaling Configuration

**Railway/Kubernetes:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dawg-ai-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dawg-ai-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## High Availability

### Multi-Region Deployment

**Primary Region:** us-east-1
**Secondary Region:** us-west-2

**Failover Strategy:**
1. DNS-based failover (Route 53)
2. Cross-region database replication
3. S3 cross-region replication
4. Redis cluster replication

### Disaster Recovery

**RTO (Recovery Time Objective):** < 15 minutes
**RPO (Recovery Point Objective):** < 5 minutes

**Backup Strategy:**
- **Database:** Automated backups every 6 hours
- **Redis:** AOF persistence + snapshot every hour
- **S3:** Versioning enabled + cross-region replication
- **Configuration:** Stored in Git + secrets in Vault

**Recovery Procedure:**
```bash
# 1. Launch new infrastructure
terraform apply -var="region=us-west-2"

# 2. Restore database from backup
pg_restore backup-latest.sql

# 3. Sync S3 buckets
aws s3 sync s3://dawg-ai-us-east-1 s3://dawg-ai-us-west-2

# 4. Update DNS to point to new region
aws route53 change-resource-record-sets ...

# 5. Verify health
curl https://api.dawg-ai.com/health
```

---

## Performance Targets

### Latency

| Endpoint | Target | P95 | P99 |
|----------|--------|-----|-----|
| `/api/chat/message` | < 200ms | < 300ms | < 500ms |
| `/api/generate/beat` | < 100ms | < 150ms | < 200ms |
| WebSocket latency | < 50ms | < 100ms | < 150ms |
| S3 signed URL generation | < 50ms | < 75ms | < 100ms |

### Throughput

| Operation | Target | Peak |
|-----------|--------|------|
| Chat messages/sec | 100 | 500 |
| Generation requests/sec | 10 | 50 |
| WebSocket messages/sec | 1000 | 5000 |
| Database queries/sec | 500 | 2000 |

### Availability

| Component | Target | SLA |
|-----------|--------|-----|
| Application | 99.9% | 99.5% |
| Database | 99.99% | 99.9% |
| Redis | 99.9% | 99.5% |
| S3 | 99.99% | 99.9% |

### Resource Usage

| Resource | Average | Peak | Alert Threshold |
|----------|---------|------|-----------------|
| CPU | 30% | 70% | > 80% |
| Memory | 40% | 80% | > 85% |
| Disk I/O | 20% | 60% | > 75% |
| Network | 100 Mbps | 500 Mbps | > 800 Mbps |

---

## Cost Optimization

### Estimated Monthly Costs

**Development Environment:**
- Application Server: $25 (Railway Hobby)
- Database: $7 (Railway PostgreSQL)
- Redis: $10 (Railway Redis)
- S3 Storage: $1 (< 50GB)
- **Total: ~$43/month**

**Production Environment (100 users):**
- Application Servers: $200 (2x Railway Pro)
- Database: $50 (Railway PostgreSQL Pro)
- Redis: $30 (Railway Redis Pro)
- S3 Storage: $25 (100GB + transfers)
- CloudFront: $50 (500GB transfer)
- AI Provider APIs: $200 (usage-based)
- **Total: ~$555/month**

**Production Environment (1000 users):**
- Application Servers: $800 (8x instances)
- Database: $200 (RDS db.m5.large)
- Redis: $150 (ElastiCache)
- S3 Storage: $100 (1TB + transfers)
- CloudFront: $200 (2TB transfer)
- AI Provider APIs: $2000 (usage-based)
- **Total: ~$3,450/month**

### Cost Saving Strategies

1. **Use Reserved Instances** - 30-40% savings on RDS/ElastiCache
2. **S3 Lifecycle Policies** - Archive old files to Glacier
3. **CloudFront Caching** - Reduce origin requests by 70%
4. **AI Provider Selection** - Use cheapest provider with fallback
5. **Compression** - Reduce storage and bandwidth by 50%
6. **Auto-scaling** - Scale down during low-traffic hours

---

## Security Architecture

### Network Security

- **VPC:** Isolated network for database and Redis
- **Security Groups:** Whitelist only necessary ports
- **WAF:** DDoS protection and SQL injection prevention
- **SSL/TLS:** All connections encrypted (TLS 1.3)

### Application Security

- **Authentication:** JWT tokens with 24h expiration
- **Authorization:** Role-based access control (RBAC)
- **Rate Limiting:** 100 requests/minute per user
- **Input Validation:** Zod schemas for all requests
- **CORS:** Whitelist specific origins only

### Data Security

- **Database Encryption:** At-rest (AES-256) and in-transit (SSL)
- **S3 Encryption:** Server-side encryption (SSE-S3)
- **Redis Encryption:** TLS connections + AUTH password
- **Secrets Management:** Environment variables + Vault
- **Audit Logging:** All data access logged

---

## Monitoring & Alerts

### Key Metrics

**Application:**
- Request rate, error rate, latency
- Active WebSocket connections
- Job queue size and processing time
- Memory and CPU usage

**Database:**
- Query latency, connection pool usage
- Slow queries (> 1s)
- Replication lag

**Infrastructure:**
- Disk space, network I/O
- Load balancer health
- Auto-scaling events

### Alert Configuration

| Alert | Condition | Action |
|-------|-----------|--------|
| API Error Rate | > 5% | Page on-call engineer |
| Generation Queue | > 50 jobs | Scale up workers |
| WebSocket Disconnects | > 10/min | Investigate Redis |
| Database Slow Query | > 1s | Optimize query |
| Disk Space | < 10% | Add storage |
| Memory Usage | > 90% | Restart/scale up |

---

## Maintenance Windows

**Scheduled Maintenance:**
- **Frequency:** Monthly
- **Duration:** 1-2 hours
- **Time:** Sunday 2-4 AM UTC
- **Tasks:** Database backups, security patches, Redis restarts

**Zero-Downtime Deployments:**
- Blue-green deployment strategy
- Rolling updates with health checks
- Automatic rollback on failure

---

## Disaster Recovery Scenarios

### Scenario 1: Database Failure

**Impact:** High - Data loss risk

**Response:**
1. Failover to read replica (< 2 minutes)
2. Promote replica to primary
3. Restore from backup if corruption
4. Verify data integrity

### Scenario 2: Redis Failure

**Impact:** Medium - Job queue and WebSocket issues

**Response:**
1. Restart Redis instance
2. Restore from AOF/snapshot
3. Re-queue failed jobs
4. Reconnect WebSocket clients

### Scenario 3: S3 Outage

**Impact:** Low - Generated audio unavailable

**Response:**
1. Serve cached files from CloudFront
2. Queue new generation requests
3. Wait for S3 recovery
4. Retry failed uploads

### Scenario 4: AI Provider API Outage

**Impact:** Medium - Generation failures

**Response:**
1. Automatic fallback to secondary provider
2. Queue requests if all providers down
3. Notify users of delays
4. Retry when provider recovers

---

## Future Enhancements

1. **Multi-Region Active-Active** - Deploy to 3+ regions
2. **Edge Computing** - WebAssembly audio processing in browser
3. **GraphQL API** - Replace REST with GraphQL
4. **Kubernetes** - Migrate from Railway to K8s
5. **Service Mesh** - Implement Istio for advanced routing
6. **Machine Learning** - On-device audio generation models

---

**Infrastructure Status:** Production-Ready ✅

**Last Review:** 2025-10-15
**Next Review:** 2025-11-15
**Reviewed By:** DevOps Team
