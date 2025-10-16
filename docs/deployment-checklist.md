# DAWG AI - Production Deployment Checklist

**Version:** 1.0.0
**Feature:** Mother-Load Chat-to-Create
**Target Date:** [Fill in]

---

## Pre-Deployment (1 Week Before)

### Code & Testing
- [ ] All feature branches merged to `main`
- [ ] Code review completed and approved
- [ ] Unit tests passing (> 90% coverage)
- [ ] Integration tests passing
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Load testing completed (100 concurrent users)
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Performance benchmarks met:
  - [ ] API response time < 200ms (P95)
  - [ ] WebSocket latency < 100ms
  - [ ] Generation time < 30s average

### Documentation
- [ ] API documentation updated
- [ ] Deployment guide reviewed
- [ ] Infrastructure documentation current
- [ ] Runbook for common issues created
- [ ] Release notes drafted

### Infrastructure
- [ ] Redis instance provisioned and tested
- [ ] S3 bucket created and configured
- [ ] PostgreSQL database ready
- [ ] CloudFront CDN configured
- [ ] SSL certificates valid
- [ ] Load balancer configured
- [ ] Backup procedures tested

### Environment Variables
- [ ] All production env vars documented in`.env.example`
- [ ] Production `.env` file configured
- [ ] Secrets stored securely (not in Git)
- [ ] API keys rotated and tested:
  - [ ] ANTHROPIC_API_KEY
  - [ ] OPENAI_API_KEY
  - [ ] GOOGLE_AI_API_KEY
  - [ ] AWS credentials
  - [ ] JWT_SECRET
  - [ ] SESSION_SECRET

### Monitoring & Alerts
- [ ] Prometheus configured and scraping metrics
- [ ] Grafana dashboards created
- [ ] Alertmanager configured
- [ ] Email alerts configured
- [ ] Slack notifications configured
- [ ] PagerDuty integration (for critical alerts)
- [ ] Health check endpoints tested
- [ ] Log aggregation (Loki) configured

### Database
- [ ] Production database created
- [ ] Connection pooling configured
- [ ] Migrations tested on staging
- [ ] Indexes created for performance
- [ ] Backup schedule configured
- [ ] Database credentials secured

### Dependencies
- [ ] All npm dependencies up to date
- [ ] No known security vulnerabilities
- [ ] Production dependencies only (no devDependencies)
- [ ] Node.js version verified (20+)

---

## Deployment Day (Day 0)

### Pre-Deployment Steps

#### 1. Communication (T-2 hours)
- [ ] Notify team in Slack `#dawg-ai-deploy`
- [ ] Post maintenance notice to users
- [ ] Create deployment war room (Slack channel)
- [ ] Assign roles:
  - [ ] Deployment lead
  - [ ] Backend engineer
  - [ ] Frontend engineer
  - [ ] DevOps engineer
  - [ ] QA engineer

#### 2. Backup (T-1 hour)
- [ ] Backup production database:
  ```bash
  pg_dump $DATABASE_URL > backup-pre-deploy-$(date +%Y%m%d-%H%M%S).sql
  ```
- [ ] Tag current production version:
  ```bash
  git tag production-backup-$(date +%Y%m%d-%H%M%S)
  git push --tags
  ```
- [ ] Backup Redis data (if applicable)
- [ ] Backup current environment variables

#### 3. Final Verification (T-30 minutes)
- [ ] All tests passing on `main` branch
- [ ] Staging environment matches production config
- [ ] Smoke tests passed on staging
- [ ] Team members ready
- [ ] Rollback plan reviewed

### Deployment Steps

#### 4. Database Migration (T-0)
```bash
# Dry run first
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datasource $DATABASE_URL \
  --script

# Apply migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Verify migration
psql $DATABASE_URL -c "\dt"
```

- [ ] Migrations applied successfully
- [ ] No errors in migration logs
- [ ] Database schema verified

#### 5. Build Application (T+5 minutes)
```bash
# Build frontend
npm run build:ui

# Build backend
npm run build

# Verify build
ls -lh dist/
```

- [ ] Frontend build successful
- [ ] Backend build successful
- [ ] No build errors or warnings
- [ ] Build artifacts verified

#### 6. Deploy Application (T+10 minutes)

**Option A: Railway**
```bash
railway up
railway logs --follow
```

**Option B: Docker**
```bash
docker build -t dawg-ai:v1.0.0 .
docker push dawg-ai:v1.0.0
kubectl set image deployment/dawg-ai app=dawg-ai:v1.0.0
```

**Option C: Manual**
```bash
pm2 stop dawg-ai
pm2 start ecosystem.config.js
pm2 logs dawg-ai
```

- [ ] Application deployed
- [ ] All instances started
- [ ] No deployment errors
- [ ] Logs show successful startup

#### 7. Health Checks (T+15 minutes)
```bash
# Basic health check
curl https://api.dawg-ai.com/health

# WebSocket check
wscat -c wss://api.dawg-ai.com/socket.io/

# Database connectivity
curl https://api.dawg-ai.com/api/health/db

# Redis connectivity
curl https://api.dawg-ai.com/api/health/redis

# S3 accessibility
curl https://api.dawg-ai.com/api/health/s3
```

- [ ] Health check returns 200 OK
- [ ] WebSocket connection successful
- [ ] Database connected
- [ ] Redis connected
- [ ] S3 accessible
- [ ] All services reporting healthy

#### 8. Smoke Tests (T+20 minutes)

**Critical User Flows:**

1. **Chat Message Flow**
```bash
# Test via API
curl -X POST https://api.dawg-ai.com/api/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "conversationId": "test-conversation",
    "message": "create a trap beat at 140 bpm"
  }'
```

- [ ] Chat message sent successfully
- [ ] Intent detected correctly
- [ ] Response streamed via WebSocket
- [ ] Message persisted to database

2. **Beat Generation Flow**
```bash
curl -X POST https://api.dawg-ai.com/api/generate/beat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "genre": "trap",
    "bpm": 140,
    "key": "Cm"
  }'
```

- [ ] Generation job queued
- [ ] Job progress updates received via WebSocket
- [ ] Audio file generated and uploaded to S3
- [ ] Signed URL returned
- [ ] Audio playback works

3. **Conversation History**
```bash
curl https://api.dawg-ai.com/api/chat/conversations \
  -H "Authorization: Bearer $TEST_TOKEN"
```

- [ ] Conversation list retrieved
- [ ] Conversation details loaded
- [ ] Message history displayed
- [ ] Pagination works

#### 9. Monitoring Verification (T+25 minutes)
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboard showing data
- [ ] No critical alerts firing
- [ ] Error rate < 1%
- [ ] WebSocket connections stable
- [ ] Job queue processing normally

#### 10. Load Testing (T+30 minutes)
```bash
# Run light load test
npm run test:load
```

- [ ] API handles concurrent requests
- [ ] WebSocket connections stable under load
- [ ] Job queue processes without backlog
- [ ] Response times within SLA
- [ ] No memory leaks detected

### Post-Deployment Steps

#### 11. Team Verification (T+45 minutes)
- [ ] Backend team: API functioning correctly
- [ ] Frontend team: UI working as expected
- [ ] QA team: Critical flows validated
- [ ] DevOps team: Monitoring active

#### 12. Gradual Rollout (T+1 hour)
- [ ] Enable for 10% of users
- [ ] Monitor for 15 minutes - no issues
- [ ] Enable for 50% of users
- [ ] Monitor for 15 minutes - no issues
- [ ] Enable for 100% of users

#### 13. Documentation (T+2 hours)
- [ ] Update deployment log
- [ ] Document any issues encountered
- [ ] Update runbook if needed
- [ ] Create post-mortem (if issues occurred)

#### 14. Communication (T+2 hours)
- [ ] Announce successful deployment
- [ ] Remove maintenance notice
- [ ] Post release notes
- [ ] Notify stakeholders

---

## Post-Deployment (First 24 Hours)

### Monitoring Watch

**Hour 1-4 (Critical Watch)**
- [ ] Check monitoring dashboard every 15 minutes
- [ ] Review error logs
- [ ] Monitor WebSocket stability
- [ ] Check generation job queue
- [ ] Verify no critical alerts

**Hour 4-8 (Active Monitoring)**
- [ ] Check dashboard every 30 minutes
- [ ] Review user feedback
- [ ] Monitor AI provider costs
- [ ] Check database performance
- [ ] Verify backup completion

**Hour 8-24 (Passive Monitoring)**
- [ ] Check dashboard every hour
- [ ] Review daily metrics
- [ ] Address any alerts
- [ ] Analyze usage patterns

### Success Metrics

Track these metrics for the first 24 hours:

**API Performance:**
- [ ] P95 response time < 200ms: ____ ms
- [ ] Error rate < 1%: ____ %
- [ ] Uptime 99.9%+: ____ %

**WebSocket:**
- [ ] Connections stable: ____ concurrent
- [ ] Latency < 100ms: ____ ms
- [ ] Disconnection rate < 5%: ____ %

**Generation:**
- [ ] Queue size < 10: ____ jobs
- [ ] Average generation time < 30s: ____ s
- [ ] Success rate > 95%: ____ %

**User Engagement:**
- [ ] Chat messages sent: ____
- [ ] Beats generated: ____
- [ ] Active users: ____
- [ ] User satisfaction: ____ /5

---

## Rollback Procedure

**Trigger Rollback If:**
- Error rate > 10%
- Critical functionality broken
- Data loss detected
- Security vulnerability discovered
- Customer complaints > 5 critical issues

### Rollback Steps

#### 1. Immediate Action (Within 5 minutes)
```bash
# Revert to previous deployment
railway rollback

# OR revert Git tag
git checkout production-backup-YYYYMMDD-HHMMSS
git push --force

# Stop new deployments
kubectl scale deployment dawg-ai --replicas=0
```

#### 2. Database Rollback (If needed)
```bash
# Restore database backup
psql $DATABASE_URL < backup-pre-deploy-YYYYMMDD-HHMMSS.sql

# OR rollback migrations
npx prisma migrate resolve --rolled-back [migration_name]
```

#### 3. Verification
- [ ] Previous version running
- [ ] Health checks passing
- [ ] Critical flows working
- [ ] Error rate normalized
- [ ] Users can access system

#### 4. Communication
- [ ] Notify team of rollback
- [ ] Update incident channel
- [ ] Inform stakeholders
- [ ] Schedule post-mortem

---

## Post-Mortem (If Issues Occurred)

### Incident Report Template

**Incident:** [Brief description]
**Date:** [Date and time]
**Duration:** [How long issue lasted]
**Impact:** [Users affected, severity]

**Timeline:**
- T+0: [What happened]
- T+5: [Action taken]
- T+10: [Resolution]

**Root Cause:**
[Detailed analysis]

**Action Items:**
- [ ] [Action 1] - Owner: [Name] - Due: [Date]
- [ ] [Action 2] - Owner: [Name] - Due: [Date]
- [ ] [Action 3] - Owner: [Name] - Due: [Date]

**Lessons Learned:**
- [Lesson 1]
- [Lesson 2]
- [Lesson 3]

---

## Week 1 Post-Deployment

### Day 1
- [ ] Review overnight metrics
- [ ] Check error logs
- [ ] Monitor AI costs
- [ ] Address any alerts

### Day 3
- [ ] Performance analysis
- [ ] User feedback review
- [ ] Cost analysis
- [ ] Optimization opportunities identified

### Day 7
- [ ] Weekly metrics report
- [ ] Stakeholder update
- [ ] Technical debt assessment
- [ ] Plan next iteration

---

## Sign-Off

**Deployment Lead:** ________________ Date: ____
**Backend Lead:** ________________ Date: ____
**Frontend Lead:** ________________ Date: ____
**DevOps Lead:** ________________ Date: ____
**QA Lead:** ________________ Date: ____

**Deployment Status:** ⬜ Success ⬜ Partial ⬜ Rollback

**Notes:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

---

**Checklist Version:** 1.0.0
**Last Updated:** 2025-10-15
**Next Review:** After first production deployment
