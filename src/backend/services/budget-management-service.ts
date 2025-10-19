/**
 * Budget Management Service
 * Manages user budget limits, alerts, and spending tracking
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Budget configuration interface
 */
export interface BudgetConfig {
  dailyLimit?: number;
  monthlyLimit?: number;
  alertThreshold?: number;
  alertsEnabled?: boolean;
  pauseOnExceed?: boolean;
}

/**
 * Budget status interface
 */
export interface BudgetStatus {
  dailyLimit: number | null;
  monthlyLimit: number | null;
  dailySpent: number;
  monthlySpent: number;
  dailyRemaining: number | null;
  monthlyRemaining: number | null;
  dailyPercentage: number | null;
  monthlyPercentage: number | null;
  isOverDailyBudget: boolean;
  isOverMonthlyBudget: boolean;
  alertThreshold: number;
  pauseOnExceed: boolean;
}

/**
 * Get or create budget limit for user
 */
export async function getBudgetLimit(userId: string) {
  try {
    let budget = await prisma.budgetLimit.findUnique({
      where: { userId },
    });

    if (!budget) {
      budget = await prisma.budgetLimit.create({
        data: { userId },
      });
    }

    return budget;
  } catch (error) {
    logger.error('Failed to get budget limit', { error, userId });
    throw error;
  }
}

/**
 * Update budget configuration
 */
export async function updateBudgetConfig(userId: string, config: BudgetConfig) {
  try {
    const budget = await prisma.budgetLimit.upsert({
      where: { userId },
      update: {
        dailyLimit: config.dailyLimit,
        monthlyLimit: config.monthlyLimit,
        alertThreshold: config.alertThreshold,
        alertsEnabled: config.alertsEnabled,
        pauseOnExceed: config.pauseOnExceed,
      },
      create: {
        userId,
        dailyLimit: config.dailyLimit,
        monthlyLimit: config.monthlyLimit,
        alertThreshold: config.alertThreshold ?? 0.8,
        alertsEnabled: config.alertsEnabled ?? true,
        pauseOnExceed: config.pauseOnExceed ?? false,
      },
    });

    logger.info('Budget configuration updated', {
      userId,
      dailyLimit: config.dailyLimit,
      monthlyLimit: config.monthlyLimit,
    });

    return budget;
  } catch (error) {
    logger.error('Failed to update budget config', { error, userId });
    throw error;
  }
}

/**
 * Get budget status for user
 */
export async function getBudgetStatus(userId: string): Promise<BudgetStatus> {
  try {
    const budget = await getBudgetLimit(userId);

    const dailyRemaining = budget.dailyLimit ? budget.dailyLimit - budget.dailySpent : null;
    const monthlyRemaining = budget.monthlyLimit ? budget.monthlyLimit - budget.monthlySpent : null;

    const dailyPercentage = budget.dailyLimit ? (budget.dailySpent / budget.dailyLimit) * 100 : null;
    const monthlyPercentage = budget.monthlyLimit
      ? (budget.monthlySpent / budget.monthlyLimit) * 100
      : null;

    return {
      dailyLimit: budget.dailyLimit,
      monthlyLimit: budget.monthlyLimit,
      dailySpent: budget.dailySpent,
      monthlySpent: budget.monthlySpent,
      dailyRemaining,
      monthlyRemaining,
      dailyPercentage,
      monthlyPercentage,
      isOverDailyBudget: budget.dailyLimit ? budget.dailySpent >= budget.dailyLimit : false,
      isOverMonthlyBudget: budget.monthlyLimit ? budget.monthlySpent >= budget.monthlyLimit : false,
      alertThreshold: budget.alertThreshold,
      pauseOnExceed: budget.pauseOnExceed,
    };
  } catch (error) {
    logger.error('Failed to get budget status', { error, userId });
    throw error;
  }
}

/**
 * Reset daily budget (called by cron job)
 */
export async function resetDailyBudgets() {
  try {
    const result = await prisma.budgetLimit.updateMany({
      data: {
        dailySpent: 0,
        lastDailyReset: new Date(),
      },
    });

    logger.info('Daily budgets reset', { count: result.count });
    return result.count;
  } catch (error) {
    logger.error('Failed to reset daily budgets', { error });
    throw error;
  }
}

/**
 * Reset monthly budget (called by cron job)
 */
export async function resetMonthlyBudgets() {
  try {
    const result = await prisma.budgetLimit.updateMany({
      data: {
        monthlySpent: 0,
        lastMonthlyReset: new Date(),
      },
    });

    logger.info('Monthly budgets reset', { count: result.count });
    return result.count;
  } catch (error) {
    logger.error('Failed to reset monthly budgets', { error });
    throw error;
  }
}

/**
 * Get cost alerts for user
 */
export async function getCostAlerts(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
  }
) {
  try {
    const where: any = { userId };

    if (options?.unreadOnly) {
      where.isRead = false;
    }

    return await prisma.costAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  } catch (error) {
    logger.error('Failed to get cost alerts', { error, userId });
    throw error;
  }
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string, userId: string) {
  try {
    return await prisma.costAlert.updateMany({
      where: {
        id: alertId,
        userId, // Ensure user owns the alert
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    logger.error('Failed to mark alert as read', { error, alertId, userId });
    throw error;
  }
}

/**
 * Mark all alerts as read
 */
export async function markAllAlertsAsRead(userId: string) {
  try {
    return await prisma.costAlert.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    logger.error('Failed to mark all alerts as read', { error, userId });
    throw error;
  }
}

/**
 * Resolve alert
 */
export async function resolveAlert(alertId: string, userId: string) {
  try {
    return await prisma.costAlert.updateMany({
      where: {
        id: alertId,
        userId,
      },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('Failed to resolve alert', { error, alertId, userId });
    throw error;
  }
}

/**
 * Get spending trends
 */
export async function getSpendingTrends(userId: string, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.apiUsageLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by day
    const dailySpending = new Map<string, number>();

    for (const log of logs) {
      const dateKey = log.createdAt.toISOString().split('T')[0];
      dailySpending.set(dateKey, (dailySpending.get(dateKey) || 0) + log.totalCost);
    }

    // Convert to array format
    const trends = Array.from(dailySpending.entries()).map(([date, cost]) => ({
      date,
      cost,
    }));

    return trends;
  } catch (error) {
    logger.error('Failed to get spending trends', { error, userId });
    throw error;
  }
}

/**
 * Get service breakdown
 */
export async function getServiceBreakdown(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<Array<{ service: string; cost: number; count: number; percentage: number }>> {
  try {
    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.apiUsageLog.findMany({ where });

    const breakdown = new Map<string, { cost: number; count: number }>();
    let totalCost = 0;

    for (const log of logs) {
      const service = log.service;
      const current = breakdown.get(service) || { cost: 0, count: 0 };
      current.cost += log.totalCost;
      current.count += 1;
      breakdown.set(service, current);
      totalCost += log.totalCost;
    }

    return Array.from(breakdown.entries()).map(([service, data]) => ({
      service,
      cost: data.cost,
      count: data.count,
      percentage: totalCost > 0 ? (data.cost / totalCost) * 100 : 0,
    }));
  } catch (error) {
    logger.error('Failed to get service breakdown', { error, userId });
    throw error;
  }
}

/**
 * Export usage data for user (for analysis or reporting)
 */
export async function exportUsageData(userId: string, startDate?: Date, endDate?: Date) {
  try {
    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.apiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      date: log.createdAt.toISOString(),
      service: log.service,
      operation: log.operation,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      audioMinutes: log.audioMinutes,
      characters: log.characters,
      cost: log.totalCost,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
    }));
  } catch (error) {
    logger.error('Failed to export usage data', { error, userId });
    throw error;
  }
}

export default {
  getBudgetLimit,
  updateBudgetConfig,
  getBudgetStatus,
  resetDailyBudgets,
  resetMonthlyBudgets,
  getCostAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  resolveAlert,
  getSpendingTrends,
  getServiceBreakdown,
  exportUsageData,
};
