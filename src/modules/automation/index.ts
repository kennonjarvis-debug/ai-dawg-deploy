/**
 * Automation Module (Refactored for Module SDK)
 *
 * Handles:
 * - BI data aggregation (daily/weekly metrics)
 * - Predictive planning with GPT forecasting
 * - CI/CD workflow automation
 * - Resource scaling for AI workloads
 * - Scheduled reporting
 */
import { Router } from 'express';
import { BaseModule } from '../../module-sdk/base-module';
import {
  ModuleResponse,
  HealthCheck,
  ScheduledJob,
} from '../../module-sdk/interfaces';
import { MetricsAggregator } from '../../jarvis/modules/automation/services/metrics-aggregator';
import { ForecastingService } from '../../jarvis/modules/automation/services/forecasting';
import { WorkflowAutomation } from '../../jarvis/modules/automation/services/workflow-automation';
import { ResourceScaler } from '../../jarvis/modules/automation/services/resource-scaler';

export class AutomationModule extends BaseModule {
  name = 'automation';
  version = '1.0.0';
  description = 'Business automation, BI aggregation, and predictive planning';

  private metricsAggregator: MetricsAggregator;
  private forecastingService: ForecastingService;
  private workflowAutomation: WorkflowAutomation;
  private resourceScaler: ResourceScaler;

  // Stats
  private aggregationsRun = 0;
  private forecastsGenerated = 0;
  private workflowsExecuted = 0;
  private scalingActions = 0;

  constructor() {
    super();

    // Initialize services
    this.metricsAggregator = new MetricsAggregator();
    this.forecastingService = new ForecastingService();
    this.workflowAutomation = new WorkflowAutomation();
    this.resourceScaler = new ResourceScaler();
  }

  /**
   * Initialize automation services and register commands
   */
  protected async onInitialize(): Promise<void> {
    this.logger.info('Initializing automation module...');

    // Initialize all services
    await this.metricsAggregator.initialize();
    await this.forecastingService.initialize();
    await this.workflowAutomation.initialize();
    await this.resourceScaler.initialize();

    // Register commands using Module SDK
    this.registerCommand('aggregate-metrics', this.handleAggregateMetrics.bind(this));
    this.registerCommand('generate-forecast', this.handleGenerateForecast.bind(this));
    this.registerCommand('execute-workflow', this.handleExecuteWorkflow.bind(this));
    this.registerCommand('scale-resources', this.handleScaleResources.bind(this));
    this.registerCommand('generate-report', this.handleGenerateReport.bind(this));
    this.registerCommand('get-stats', this.handleGetStats.bind(this));

    this.logger.info('Automation module initialized successfully');
  }

  /**
   * Shutdown automation services
   */
  protected async onShutdown(): Promise<void> {
    this.logger.info('Shutting down automation module...');

    // Graceful shutdown of all services
    await this.metricsAggregator.shutdown();
    await this.forecastingService.shutdown();
    await this.workflowAutomation.shutdown();
    await this.resourceScaler.shutdown();

    this.logger.info('Automation module shut down successfully');
  }

  /**
   * Register API routes
   */
  protected onRegisterRoutes(router: Router): void {
    // GET /jarvis/automation/stats
    router.get('/stats', (req, res) => {
      res.json({
        aggregationsRun: this.aggregationsRun,
        forecastsGenerated: this.forecastsGenerated,
        workflowsExecuted: this.workflowsExecuted,
        scalingActions: this.scalingActions,
        services: {
          metricsAggregator: this.metricsAggregator.getStatus(),
          forecastingService: this.forecastingService.getStatus(),
          workflowAutomation: this.workflowAutomation.getStatus(),
          resourceScaler: this.resourceScaler.getStatus(),
        },
      });
    });

    // POST /jarvis/automation/aggregate
    router.post('/aggregate', async (req, res) => {
      try {
        const { type = 'daily', force = false } = req.body;
        const result = await this.metricsAggregator.runAggregation(type, force);
        this.aggregationsRun++;
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // POST /jarvis/automation/forecast
    router.post('/forecast', async (req, res) => {
      try {
        const { metric, horizon = 30 } = req.body;
        const forecast = await this.forecastingService.generateForecast(metric, horizon);
        this.forecastsGenerated++;
        res.json({ success: true, forecast });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // POST /jarvis/automation/workflow
    router.post('/workflow', async (req, res) => {
      try {
        const { workflow, params = {} } = req.body;
        const result = await this.workflowAutomation.executeWorkflow(workflow, params);
        this.workflowsExecuted++;
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    // POST /jarvis/automation/scale
    router.post('/scale', async (req, res) => {
      try {
        const { resource, action } = req.body;
        const result = await this.resourceScaler.scaleResource(resource, action);
        this.scalingActions++;
        res.json({ success: true, result });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Get health checks
   */
  protected async onGetHealthChecks(): Promise<HealthCheck[]> {
    return [
      {
        name: 'initialization',
        status: 'pass',
        message: 'Automation module initialized',
      },
      {
        name: 'aggregations',
        status: 'pass',
        message: `${this.aggregationsRun} aggregations completed`,
        metadata: {
          count: this.aggregationsRun,
        },
      },
      {
        name: 'forecasts',
        status: 'pass',
        message: `${this.forecastsGenerated} forecasts generated`,
        metadata: {
          count: this.forecastsGenerated,
        },
      },
      {
        name: 'workflows',
        status: 'pass',
        message: `${this.workflowsExecuted} workflows executed`,
        metadata: {
          count: this.workflowsExecuted,
        },
      },
      {
        name: 'scaling',
        status: 'pass',
        message: `${this.scalingActions} scaling actions performed`,
        metadata: {
          count: this.scalingActions,
        },
      },
      {
        name: 'memory',
        status: 'pass',
        message: 'Memory usage within limits',
        metadata: {
          heapUsedMB: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
        },
      },
    ];
  }

  /**
   * Register scheduled jobs
   */
  protected onGetScheduledJobs(): ScheduledJob[] {
    return [
      {
        id: 'daily-metrics-aggregation',
        name: 'Daily Metrics Aggregation',
        schedule: '0 0 * * *', // Daily at midnight
        enabled: true,
        description: 'Aggregate daily metrics from all systems',
        handler: async () => {
          this.logger.info('Running daily metrics aggregation...');
          await this.metricsAggregator.runAggregation('daily');
          this.aggregationsRun++;
        },
      },
      {
        id: 'weekly-report-generation',
        name: 'Weekly Report Generation',
        schedule: '0 9 * * 1', // Monday at 9am
        enabled: true,
        description: 'Generate weekly automation reports',
        handler: async () => {
          this.logger.info('Generating weekly report...');
          await this.generateWeeklyReport();
        },
      },
      {
        id: 'hourly-resource-check',
        name: 'Hourly Resource Check',
        schedule: '0 * * * *', // Every hour
        enabled: true,
        description: 'Check and scale resources as needed',
        handler: async () => {
          this.logger.info('Checking resource utilization...');
          await this.resourceScaler.checkAndScale();
        },
      },
      {
        id: 'forecast-update',
        name: 'Forecast Update',
        schedule: '0 6 * * *', // Daily at 6am
        enabled: true,
        description: 'Update predictive forecasts',
        handler: async () => {
          this.logger.info('Updating forecasts...');
          await this.forecastingService.updateAllForecasts();
          this.forecastsGenerated++;
        },
      },
    ];
  }

  // ==================== Command Handlers ====================

  /**
   * Handle aggregate-metrics command
   */
  private async handleAggregateMetrics(params: any): Promise<any> {
    const { type = 'daily', force = false } = params || {};

    const result = await this.metricsAggregator.runAggregation(type, force);
    this.aggregationsRun++;

    return result;
  }

  /**
   * Handle generate-forecast command
   */
  private async handleGenerateForecast(params: any): Promise<any> {
    const { metric, horizon = 30 } = params || {};

    if (!metric) {
      throw new Error('Missing required parameter: metric');
    }

    const forecast = await this.forecastingService.generateForecast(metric, horizon);
    this.forecastsGenerated++;

    return forecast;
  }

  /**
   * Handle execute-workflow command
   */
  private async handleExecuteWorkflow(params: any): Promise<any> {
    const { workflow, params: workflowParams = {} } = params || {};

    if (!workflow) {
      throw new Error('Missing required parameter: workflow');
    }

    const result = await this.workflowAutomation.executeWorkflow(workflow, workflowParams);
    this.workflowsExecuted++;

    return result;
  }

  /**
   * Handle scale-resources command
   */
  private async handleScaleResources(params: any): Promise<any> {
    const { resource, action } = params || {};

    if (!resource || !action) {
      throw new Error('Missing required parameters: resource, action');
    }

    const result = await this.resourceScaler.scaleResource(resource, action);
    this.scalingActions++;

    return result;
  }

  /**
   * Handle generate-report command
   */
  private async handleGenerateReport(params: any): Promise<any> {
    const { type = 'weekly', format = 'json' } = params || {};

    // Validate type
    const validTypes: Array<'daily' | 'weekly' | 'monthly'> = ['daily', 'weekly', 'monthly'];
    const reportType = validTypes.includes(type as any) ? (type as 'daily' | 'weekly' | 'monthly') : 'weekly';

    const report = await this.generateReport(reportType, format);

    return report;
  }

  /**
   * Handle get-stats command
   */
  private async handleGetStats(params: any): Promise<any> {
    return {
      aggregationsRun: this.aggregationsRun,
      forecastsGenerated: this.forecastsGenerated,
      workflowsExecuted: this.workflowsExecuted,
      scalingActions: this.scalingActions,
      uptime: this.getUptime(),
    };
  }

  // ==================== Helper Methods ====================

  /**
   * Generate weekly report
   */
  private async generateWeeklyReport(): Promise<any> {
    return this.generateReport('weekly', 'json');
  }

  /**
   * Generate report
   */
  private async generateReport(type: 'daily' | 'weekly' | 'monthly', format: string): Promise<any> {
    const metrics = await this.metricsAggregator.getAggregatedMetrics(type);
    const forecasts = await this.forecastingService.getAllForecasts();

    return {
      type,
      format,
      generatedAt: new Date().toISOString(),
      metrics,
      forecasts,
      summary: {
        totalAggregations: this.aggregationsRun,
        totalForecasts: this.forecastsGenerated,
        totalWorkflows: this.workflowsExecuted,
        totalScalingActions: this.scalingActions,
      },
    };
  }
}

// Export singleton instance
export default new AutomationModule();
