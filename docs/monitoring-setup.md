# DAWG AI - Monitoring & Alerting Setup

**Version:** 1.0.0
**Last Updated:** 2025-10-15

---

## Overview

This document describes the monitoring and alerting infrastructure for DAWG AI's Mother-Load chat-to-create system.

---

## Metrics Collection

### Application Metrics (Prometheus)

The application exposes Prometheus metrics at `/metrics`:

```bash
curl http://localhost:3001/metrics
```

**Key Metrics:**

```prometheus
# API Request Metrics
http_request_duration_seconds{method="POST",route="/api/chat/message",status="200"}
http_requests_total{method="POST",route="/api/chat/message",status="200"}

# WebSocket Metrics
websocket_connections_total{type="websocket",event="connect"}
websocket_connections_gauge{type="websocket"}
websocket_messages_total{type="websocket",event="chat:stream",direction="outbound"}
websocket_latency_seconds{type="websocket",event="generation:progress"}

# Generation Job Queue Metrics
bullmq_queue_waiting{queue="generation"}
bullmq_queue_active{queue="generation"}
bullmq_queue_completed{queue="generation"}
bullmq_queue_failed{queue="generation"}
bullmq_job_duration_seconds{queue="generation"}

# Database Metrics
database_query_duration_seconds{query="conversation.findMany"}
database_connection_pool_size
database_connection_pool_idle

# AI Provider Metrics
ai_provider_requests_total{provider="openai",status="success"}
ai_provider_cost_dollars{provider="anthropic"}
ai_provider_latency_seconds{provider="google"}
```

---

## Prometheus Configuration

### 1. Install Prometheus

**macOS:**
```bash
brew install prometheus
```

**Docker:**
```bash
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v $(pwd)/config/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 2. Prometheus Configuration

Create `/config/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'dawg-ai-production'
    environment: 'production'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'localhost:9093'

# Load rules once and evaluate them according to the global 'evaluation_interval'
rule_files:
  - 'alert_rules.yml'

# Scrape configurations
scrape_configs:
  # DAWG AI Application
  - job_name: 'dawg-ai-app'
    static_configs:
      - targets: ['localhost:3001']
        labels:
          service: 'api'
          instance: 'app-1'

  # Node.js Application Metrics
  - job_name: 'dawg-ai-nodejs'
    static_configs:
      - targets: ['localhost:9090']
        labels:
          service: 'nodejs'

  # Redis Exporter
  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']
        labels:
          service: 'redis'

  # PostgreSQL Exporter
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
        labels:
          service: 'postgres'

  # Node Exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
        labels:
          service: 'system'
```

### 3. Alert Rules

Create `/config/alert_rules.yml`:

```yaml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighAPIErrorRate
        expr: (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) > 0.05
        for: 2m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High API error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # Slow API responses
      - alert: SlowAPIResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "API responses are slow"
          description: "P95 latency is {{ $value }}s (threshold: 1s)"

  - name: websocket_alerts
    interval: 30s
    rules:
      # High WebSocket disconnection rate
      - alert: HighWebSocketDisconnections
        expr: rate(websocket_connections_total{event="disconnect"}[1m]) > 10
        for: 3m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High WebSocket disconnection rate"
          description: "{{ $value }} disconnections per second (threshold: 10/s)"

      # WebSocket connection limit approaching
      - alert: WebSocketConnectionLimitApproaching
        expr: websocket_connections_gauge > 4500
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "WebSocket connection limit approaching"
          description: "{{ $value }} connections (limit: 5000)"

  - name: generation_alerts
    interval: 30s
    rules:
      # Large job queue backlog
      - alert: GenerationQueueBacklog
        expr: bullmq_queue_waiting{queue="generation"} > 50
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Large generation job queue backlog"
          description: "{{ $value }} jobs waiting (threshold: 50)"

      # High job failure rate
      - alert: HighGenerationFailureRate
        expr: (rate(bullmq_queue_failed{queue="generation"}[5m]) / rate(bullmq_queue_completed{queue="generation"}[5m])) > 0.1
        for: 5m
        labels:
          severity: critical
          team: backend
        annotations:
          summary: "High generation job failure rate"
          description: "{{ $value | humanizePercentage }} of jobs failing (threshold: 10%)"

      # Slow generation jobs
      - alert: SlowGenerationJobs
        expr: histogram_quantile(0.95, rate(bullmq_job_duration_seconds_bucket{queue="generation"}[10m])) > 60
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Generation jobs are taking too long"
          description: "P95 duration is {{ $value }}s (threshold: 60s)"

  - name: database_alerts
    interval: 30s
    rules:
      # High database connection pool usage
      - alert: HighDatabaseConnectionPoolUsage
        expr: (database_connection_pool_size - database_connection_pool_idle) / database_connection_pool_size > 0.9
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: "{{ $value | humanizePercentage }} of connections in use (threshold: 90%)"

      # Slow database queries
      - alert: SlowDatabaseQueries
        expr: histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "Database queries are slow"
          description: "P95 query duration is {{ $value }}s (threshold: 1s)"

  - name: infrastructure_alerts
    interval: 60s
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 10m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "High CPU usage on {{ $labels.instance }}"
          description: "CPU usage is {{ $value }}% (threshold: 80%)"

      # High memory usage
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 85
        for: 5m
        labels:
          severity: warning
          team: devops
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is {{ $value }}% (threshold: 85%)"

      # Low disk space
      - alert: LowDiskSpace
        expr: (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100 > 90
        for: 5m
        labels:
          severity: critical
          team: devops
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk usage is {{ $value }}% (threshold: 90%)"

  - name: ai_provider_alerts
    interval: 30s
    rules:
      # High AI provider error rate
      - alert: HighAIProviderErrorRate
        expr: (sum by(provider) (rate(ai_provider_requests_total{status="error"}[5m])) / sum by(provider) (rate(ai_provider_requests_total[5m]))) > 0.1
        for: 5m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High error rate for AI provider {{ $labels.provider }}"
          description: "{{ $value | humanizePercentage }} of requests failing (threshold: 10%)"

      # High AI cost
      - alert: HighAICost
        expr: increase(ai_provider_cost_dollars[1h]) > 100
        for: 10m
        labels:
          severity: warning
          team: backend
        annotations:
          summary: "High AI provider costs"
          description: "${{ $value }} spent in the last hour (threshold: $100/hour)"
```

### 4. Start Prometheus

```bash
prometheus --config.file=/config/prometheus.yml
```

Access dashboard: http://localhost:9090

---

## Grafana Dashboard

### 1. Install Grafana

**macOS:**
```bash
brew install grafana
brew services start grafana
```

**Docker:**
```bash
docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

### 2. Configure Grafana

1. Open http://localhost:3000 (default credentials: admin/admin)
2. Add Prometheus data source:
   - URL: http://localhost:9090
   - Access: Server (default)

### 3. Import Dashboard

Create `/config/grafana-dashboard.json`:

```json
{
  "dashboard": {
    "title": "DAWG AI - Mother-Load Monitoring",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (route)",
            "legendFormat": "{{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "API Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))",
            "legendFormat": "Error Rate"
          }
        ],
        "type": "graph"
      },
      {
        "title": "WebSocket Connections",
        "targets": [
          {
            "expr": "websocket_connections_gauge",
            "legendFormat": "Active Connections"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Generation Job Queue",
        "targets": [
          {
            "expr": "bullmq_queue_waiting{queue=\"generation\"}",
            "legendFormat": "Waiting"
          },
          {
            "expr": "bullmq_queue_active{queue=\"generation\"}",
            "legendFormat": "Active"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

Import dashboard:
1. Dashboards → Import
2. Upload JSON file
3. Select Prometheus data source

---

## Alertmanager Configuration

### 1. Install Alertmanager

```bash
docker run -d \
  --name alertmanager \
  -p 9093:9093 \
  -v $(pwd)/config/alertmanager.yml:/etc/alertmanager/alertmanager.yml \
  prom/alertmanager
```

### 2. Configure Alertmanager

Create `/config/alertmanager.yml`:

```yaml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@dawg-ai.com'
  smtp_auth_username: 'alerts@dawg-ai.com'
  smtp_auth_password: '${SMTP_PASSWORD}'

# The directory from which notification templates are read
templates:
  - '/etc/alertmanager/template/*.tmpl'

# The root route
route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'default'
  routes:
    # Critical alerts go to PagerDuty
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true

    # All alerts go to email
    - match_re:
        severity: (critical|warning)
      receiver: 'email'

    # Slack notifications for all alerts
    - match_re:
        severity: (critical|warning)
      receiver: 'slack'

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@dawg-ai.com'

  - name: 'email'
    email_configs:
      - to: 'devops@dawg-ai.com'
        subject: '[{{ .Status | toUpper }}] {{ .GroupLabels.alertname }}'
        html: |
          <h3>{{ .GroupLabels.alertname }}</h3>
          <p><b>Severity:</b> {{ .GroupLabels.severity }}</p>
          <p><b>Description:</b> {{ .Annotations.description }}</p>

  - name: 'slack'
    slack_configs:
      - api_url: '${SLACK_WEBHOOK_URL}'
        channel: '#dawg-ai-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ .Annotations.summary }}'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
```

---

## Logging

### Application Logs

The application uses Winston for structured logging:

```typescript
import { logger } from './backend/utils/logger';

logger.info('Chat message received', { userId, conversationId, messageLength });
logger.warn('Generation job timeout', { jobId, duration });
logger.error('Database connection failed', { error: err.message });
```

**Log Levels:**
- `debug`: Development debugging
- `info`: General information
- `warn`: Warning conditions
- `error`: Error conditions
- `fatal`: Critical errors

### Log Aggregation (Loki)

**1. Install Loki:**

```bash
docker run -d \
  --name loki \
  -p 3100:3100 \
  grafana/loki
```

**2. Install Promtail (log shipper):**

```bash
docker run -d \
  --name promtail \
  -v /var/log:/var/log \
  -v $(pwd)/config/promtail.yml:/etc/promtail/config.yml \
  grafana/promtail \
  -config.file=/etc/promtail/config.yml
```

**3. Configure Promtail (`/config/promtail.yml`):**

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://localhost:3100/loki/api/v1/push

scrape_configs:
  - job_name: dawg-ai
    static_configs:
      - targets:
          - localhost
        labels:
          job: dawg-ai-app
          __path__: /var/log/dawg-ai/*.log
```

**4. Add Loki to Grafana:**
- Configuration → Data Sources → Add Loki
- URL: http://localhost:3100

---

## Cost Tracking

### AI Provider Cost Dashboard

Track AI costs with custom metrics:

```typescript
// In AI provider service
async function trackCost(provider: string, tokens: number, cost: number) {
  aiProviderCostGauge.labels(provider).inc(cost);
  aiProviderTokensCounter.labels(provider).inc(tokens);

  // Log to database
  await prisma.aiUsage.create({
    data: {
      provider,
      tokens,
      cost,
      timestamp: new Date()
    }
  });
}
```

**Cost Alert Example:**

```yaml
- alert: HighDailyCost
  expr: sum(increase(ai_provider_cost_dollars[24h])) > 500
  labels:
    severity: critical
  annotations:
    summary: "Daily AI costs exceeded $500"
```

---

## Health Checks

### Application Health Check

Endpoint: `GET /health`

```json
{
  "status": "healthy",
  "timestamp": "2025-10-15T12:00:00Z",
  "uptime": 86400,
  "services": {
    "database": {
      "status": "connected",
      "latency_ms": 12
    },
    "redis": {
      "status": "connected",
      "latency_ms": 3
    },
    "s3": {
      "status": "accessible",
      "latency_ms": 45
    }
  },
  "metrics": {
    "active_connections": 245,
    "job_queue_size": 8,
    "memory_usage_mb": 512,
    "cpu_usage_percent": 35
  }
}
```

### Liveness and Readiness Probes (Kubernetes)

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

## Monitoring Checklist

### Daily Checks
- [ ] API error rate < 1%
- [ ] Average response time < 200ms
- [ ] WebSocket connections stable
- [ ] Generation job queue < 10 waiting
- [ ] No critical alerts

### Weekly Checks
- [ ] Review slow query logs
- [ ] Check disk space trends
- [ ] Review AI provider costs
- [ ] Update alert thresholds if needed
- [ ] Review incident reports

### Monthly Checks
- [ ] Capacity planning review
- [ ] Performance benchmark comparison
- [ ] Security audit of logs
- [ ] Update monitoring documentation
- [ ] Review and optimize dashboards

---

## Troubleshooting Monitoring

### Prometheus Not Scraping Metrics

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check if metrics endpoint is accessible
curl http://localhost:3001/metrics

# Verify firewall rules
telnet localhost 3001
```

### High Cardinality Warning

If you see "high cardinality" warnings, reduce label combinations:

```typescript
// Bad - too many labels
apiRequestCounter.labels(userId, endpoint, method, status).inc();

// Good - fewer labels
apiRequestCounter.labels(endpoint, status).inc();
```

### Missing Metrics

```bash
# Verify metric registration
curl http://localhost:3001/metrics | grep your_metric_name

# Check logger configuration
DEBUG=metrics npm run dev:server
```

---

## Support

- **Prometheus Docs:** https://prometheus.io/docs/
- **Grafana Docs:** https://grafana.com/docs/
- **Internal Wiki:** https://wiki.dawg-ai.com/monitoring

---

**Monitoring Status:** Configured ✅
**Last Updated:** 2025-10-15
