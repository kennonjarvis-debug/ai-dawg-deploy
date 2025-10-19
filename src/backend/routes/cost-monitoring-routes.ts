/**
 * Cost Monitoring API Routes
 * RESTful endpoints for cost tracking and budget management
 */

import { Router, Request, Response } from 'express';
import { getCostSummary, getUsageLogs } from '../services/cost-monitoring-service';
import {
  getBudgetLimit,
  updateBudgetConfig,
  getBudgetStatus,
  getCostAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  resolveAlert,
  getSpendingTrends,
  getServiceBreakdown,
  exportUsageData,
} from '../services/budget-management-service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Middleware to ensure user is authenticated
 * Replace with your actual authentication middleware
 */
function requireAuth(req: Request, res: Response, next: any) {
  // TODO: Replace with your actual auth middleware
  // For now, we'll check if userId is in headers or query
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Attach userId to request
  (req as any).userId = userId;
  next();
}

/**
 * GET /api/cost-monitoring/summary
 * Get cost summary for authenticated user
 */
router.get('/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { period } = req.query;

    let startDate: Date | undefined;
    const endDate = new Date();

    // Calculate start date based on period
    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        startDate = undefined; // All time
    }

    const summary = await getCostSummary(userId, startDate, endDate);

    res.json({
      success: true,
      period: period || 'all',
      summary,
    });
  } catch (error) {
    logger.error('Failed to get cost summary', { error });
    res.status(500).json({ error: 'Failed to get cost summary' });
  }
});

/**
 * GET /api/cost-monitoring/usage-logs
 * Get usage logs for authenticated user
 */
router.get('/usage-logs', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { service, startDate, endDate, limit } = req.query;

    const logs = await getUsageLogs(userId, {
      service: service as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    logger.error('Failed to get usage logs', { error });
    res.status(500).json({ error: 'Failed to get usage logs' });
  }
});

/**
 * GET /api/cost-monitoring/budget
 * Get budget configuration and status
 */
router.get('/budget', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const [budget, status] = await Promise.all([
      getBudgetLimit(userId),
      getBudgetStatus(userId),
    ]);

    res.json({
      success: true,
      budget,
      status,
    });
  } catch (error) {
    logger.error('Failed to get budget', { error });
    res.status(500).json({ error: 'Failed to get budget' });
  }
});

/**
 * PUT /api/cost-monitoring/budget
 * Update budget configuration
 */
router.put('/budget', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { dailyLimit, monthlyLimit, alertThreshold, alertsEnabled, pauseOnExceed } = req.body;

    const budget = await updateBudgetConfig(userId, {
      dailyLimit,
      monthlyLimit,
      alertThreshold,
      alertsEnabled,
      pauseOnExceed,
    });

    res.json({
      success: true,
      budget,
    });
  } catch (error) {
    logger.error('Failed to update budget', { error });
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

/**
 * GET /api/cost-monitoring/alerts
 * Get cost alerts for user
 */
router.get('/alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { unreadOnly, limit } = req.query;

    const alerts = await getCostAlerts(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    logger.error('Failed to get alerts', { error });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

/**
 * PUT /api/cost-monitoring/alerts/:alertId/read
 * Mark alert as read
 */
router.put('/alerts/:alertId/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { alertId } = req.params;

    await markAlertAsRead(alertId, userId);

    res.json({
      success: true,
      message: 'Alert marked as read',
    });
  } catch (error) {
    logger.error('Failed to mark alert as read', { error });
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

/**
 * PUT /api/cost-monitoring/alerts/read-all
 * Mark all alerts as read
 */
router.put('/alerts/read-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    await markAllAlertsAsRead(userId);

    res.json({
      success: true,
      message: 'All alerts marked as read',
    });
  } catch (error) {
    logger.error('Failed to mark all alerts as read', { error });
    res.status(500).json({ error: 'Failed to mark all alerts as read' });
  }
});

/**
 * PUT /api/cost-monitoring/alerts/:alertId/resolve
 * Resolve alert
 */
router.put('/alerts/:alertId/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { alertId } = req.params;

    await resolveAlert(alertId, userId);

    res.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error) {
    logger.error('Failed to resolve alert', { error });
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

/**
 * GET /api/cost-monitoring/trends
 * Get spending trends
 */
router.get('/trends', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { days } = req.query;

    const trends = await getSpendingTrends(userId, days ? parseInt(days as string) : 30);

    res.json({
      success: true,
      trends,
    });
  } catch (error) {
    logger.error('Failed to get spending trends', { error });
    res.status(500).json({ error: 'Failed to get spending trends' });
  }
});

/**
 * GET /api/cost-monitoring/breakdown
 * Get service breakdown
 */
router.get('/breakdown', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { startDate, endDate } = req.query;

    const breakdown = await getServiceBreakdown(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      breakdown,
    });
  } catch (error) {
    logger.error('Failed to get service breakdown', { error });
    res.status(500).json({ error: 'Failed to get service breakdown' });
  }
});

/**
 * GET /api/cost-monitoring/export
 * Export usage data as JSON or CSV
 */
router.get('/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { startDate, endDate, format } = req.query;

    const data = await exportUsageData(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Date', 'Service', 'Operation', 'Input Tokens', 'Output Tokens', 'Audio Minutes', 'Characters', 'Cost'];
      const rows = data.map((log) => [
        log.date,
        log.service,
        log.operation,
        log.inputTokens || '',
        log.outputTokens || '',
        log.audioMinutes || '',
        log.characters || '',
        log.cost,
      ]);

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=usage-export.csv');
      res.send(csv);
    } else {
      // Return as JSON
      res.json({
        success: true,
        count: data.length,
        data,
      });
    }
  } catch (error) {
    logger.error('Failed to export usage data', { error });
    res.status(500).json({ error: 'Failed to export usage data' });
  }
});

/**
 * GET /api/cost-monitoring/dashboard
 * Get all dashboard data in one call
 */
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    // Get all dashboard data
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      budgetStatus,
      todaySummary,
      weekSummary,
      monthSummary,
      trends,
      breakdown,
      alerts,
    ] = await Promise.all([
      getBudgetStatus(userId),
      getCostSummary(userId, todayStart, now),
      getCostSummary(userId, weekStart, now),
      getCostSummary(userId, monthStart, now),
      getSpendingTrends(userId, 30),
      getServiceBreakdown(userId, monthStart, now),
      getCostAlerts(userId, { unreadOnly: true, limit: 10 }),
    ]);

    res.json({
      success: true,
      budgetStatus,
      summary: {
        today: todaySummary,
        week: weekSummary,
        month: monthSummary,
      },
      trends,
      breakdown,
      alerts,
    });
  } catch (error) {
    logger.error('Failed to get dashboard data', { error });
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

export default router;
