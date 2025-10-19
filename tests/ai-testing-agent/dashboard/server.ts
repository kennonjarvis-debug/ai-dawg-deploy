import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs/promises';
import { TestMetricsCollector } from './metrics-collector';
import { Notifier } from './notifier';

/**
 * Real-time Dashboard Server for AI Testing Agent
 *
 * Features:
 * - WebSocket broadcasting for live test updates
 * - Historical metrics and trends
 * - Notification integration
 * - REST API for test data
 */
export class DashboardServer {
  private app: express.Application;
  private server: any;
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private metrics: TestMetricsCollector;
  private notifier: Notifier;
  private port: number = 4000;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.metrics = new TestMetricsCollector();
    this.notifier = new Notifier();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname)));
  }

  private setupRoutes(): void {
    // Serve dashboard HTML
    this.app.get('/', async (req, res) => {
      try {
        const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
        res.send(html);
      } catch (error) {
        res.status(500).send('Dashboard not available');
      }
    });

    // API: Get current test status
    this.app.get('/api/status', async (req, res) => {
      try {
        const status = await this.metrics.getCurrentStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Get historical data
    this.app.get('/api/history', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 100;
        const history = await this.metrics.getHistory(limit);
        res.json(history);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Get trends
    this.app.get('/api/trends', async (req, res) => {
      try {
        const trends = await this.metrics.getTrends();
        res.json(trends);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Get failure heatmap
    this.app.get('/api/heatmap', async (req, res) => {
      try {
        const heatmap = await this.metrics.getFailureHeatmap();
        res.json(heatmap);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Get cost tracking
    this.app.get('/api/costs', async (req, res) => {
      try {
        const costs = await this.metrics.getCostTracking();
        res.json(costs);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Update notification settings
    this.app.post('/api/notifications/settings', async (req, res) => {
      try {
        await this.notifier.updateSettings(req.body);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // API: Test notification
    this.app.post('/api/notifications/test', async (req, res) => {
      try {
        await this.notifier.sendTestNotification(req.body.channel);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Webhook: Receive test updates from agent
    this.app.post('/api/test-update', async (req, res) => {
      try {
        const update = req.body;

        // Store metrics
        await this.metrics.recordTestUpdate(update);

        // Broadcast to all connected clients
        this.broadcast({
          type: 'test-update',
          data: update,
          timestamp: new Date().toISOString(),
        });

        // Check for alerts
        await this.checkAndSendAlerts(update);

        res.json({ success: true });
      } catch (error) {
        console.error('Error processing test update:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Webhook: Test started
    this.app.post('/api/test-started', async (req, res) => {
      try {
        const { testName, totalTests } = req.body;

        this.broadcast({
          type: 'test-started',
          data: { testName, totalTests },
          timestamp: new Date().toISOString(),
        });

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Webhook: Test completed
    this.app.post('/api/test-completed', async (req, res) => {
      try {
        const result = req.body;

        await this.metrics.recordTestCompletion(result);

        this.broadcast({
          type: 'test-completed',
          data: result,
          timestamp: new Date().toISOString(),
        });

        // Send completion notification
        await this.notifier.sendTestCompletionNotification(result);

        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        websocketConnections: this.clients.size,
        uptime: process.uptime(),
      });
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      // Send current status immediately
      this.metrics.getCurrentStatus().then(status => {
        ws.send(JSON.stringify({
          type: 'initial-status',
          data: status,
          timestamp: new Date().toISOString(),
        }));
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Handle client messages
      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString());

          switch (data.type) {
            case 'request-history':
              const history = await this.metrics.getHistory(data.limit || 100);
              ws.send(JSON.stringify({
                type: 'history-data',
                data: history,
              }));
              break;

            case 'request-trends':
              const trends = await this.metrics.getTrends();
              ws.send(JSON.stringify({
                type: 'trends-data',
                data: trends,
              }));
              break;
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });
    });
  }

  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private async checkAndSendAlerts(update: any): Promise<void> {
    // Check for critical failures
    if (update.status === 'failed' && update.priority === 'critical') {
      await this.notifier.sendCriticalAlert({
        testName: update.testName,
        error: update.error,
        timestamp: new Date().toISOString(),
      });
    }

    // Check for pass rate drop
    const trends = await this.metrics.getTrends();
    if (trends.passRateChange && trends.passRateChange < -10) {
      await this.notifier.sendPassRateAlert({
        currentRate: trends.currentPassRate,
        previousRate: trends.previousPassRate,
        change: trends.passRateChange,
      });
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎯 AI Testing Agent Dashboard Server Started                ║
║                                                                ║
║   Dashboard:  http://localhost:${this.port}                        ║
║   API:        http://localhost:${this.port}/api                    ║
║   WebSocket:  ws://localhost:${this.port}                          ║
║                                                                ║
║   Features:                                                    ║
║   - Real-time test monitoring                                  ║
║   - Historical trends & analytics                              ║
║   - Multi-channel notifications                                ║
║   - Failure heatmaps                                           ║
║   - Cost tracking                                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
        resolve();
      });
    });
  }

  public stop(): void {
    this.wss.close();
    this.server.close();
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    const server = new DashboardServer();
    await server.start();
  })();
}
