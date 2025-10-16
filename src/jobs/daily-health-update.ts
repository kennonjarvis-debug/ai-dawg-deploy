/**
 * Daily Health Update Job
 * Automated job to recalculate CustomerHealth scores for all users
 * Runs daily to keep health metrics up to date
 */

import { PrismaClient } from '@prisma/client';
import { CustomerHealthScoring } from '../ai/gpt-support/customer-health';
import { logger } from '../backend/utils/logger';

const prisma = new PrismaClient();
const healthScoring = new CustomerHealthScoring();

export interface HealthUpdateJobResult {
  totalUsers: number;
  successfulUpdates: number;
  failedUpdates: number;
  atRiskCustomers: number;
  averageHealthScore: number;
  executionTime: number;
}

/**
 * Execute daily health score update for all users
 */
export async function runDailyHealthUpdate(): Promise<HealthUpdateJobResult> {
  const startTime = Date.now();

  logger.info('[DailyHealthUpdate] Starting daily health score update');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    logger.info(`[DailyHealthUpdate] Processing ${users.length} users`);

    let successfulUpdates = 0;
    let failedUpdates = 0;
    const healthScores: number[] = [];

    // Process each user
    for (const user of users) {
      try {
        // Calculate health metrics
        const metrics = await healthScoring.calculateHealth(user.id);

        healthScores.push(metrics.overallHealth);
        successfulUpdates++;

        logger.debug(`[DailyHealthUpdate] Updated health for user ${user.id}`, {
          userId: user.id,
          healthScore: metrics.overallHealth,
          churnRisk: metrics.churnRisk,
        });
      } catch (error) {
        failedUpdates++;
        logger.error(`[DailyHealthUpdate] Failed to update user ${user.id}`, {
          userId: user.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Get at-risk customers count
    const atRiskCount = await prisma.customerHealth.count({
      where: {
        churnRisk: {
          in: ['HIGH', 'CRITICAL'],
        },
      },
    });

    // Calculate average health score
    const averageHealth =
      healthScores.length > 0
        ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
        : 0;

    const executionTime = Date.now() - startTime;

    const result: HealthUpdateJobResult = {
      totalUsers: users.length,
      successfulUpdates,
      failedUpdates,
      atRiskCustomers: atRiskCount,
      averageHealthScore: Math.round(averageHealth * 100) / 100,
      executionTime,
    };

    logger.info('[DailyHealthUpdate] Health update completed', result);

    return result;
  } catch (error) {
    logger.error('[DailyHealthUpdate] Job failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Aggregate daily revenue metrics from StripeEventLog
 */
export async function aggregateDailyRevenue(): Promise<void> {
  logger.info('[DailyHealthUpdate] Aggregating revenue metrics');

  try {
    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    // Get subscription counts by plan
    const entitlements = await prisma.entitlement.groupBy({
      by: ['plan'],
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      _count: {
        id: true,
      },
    });

    // Get active user counts
    const activeUsersByPlan = await prisma.user.groupBy({
      by: [],
      where: {
        lastLoginAt: {
          gte: yesterday,
          lt: today,
        },
      },
      _count: {
        id: true,
      },
    });

    // Create revenue metrics for each plan
    const planPricing = {
      FREE: 0,
      PRO: 99,
      ENTERPRISE: 499,
    };

    for (const plan of ['FREE', 'PRO', 'ENTERPRISE'] as const) {
      const newSubs = entitlements.find(e => e.plan === plan)?._count.id || 0;
      const revenue = newSubs * planPricing[plan];

      // Get active users for this plan
      const activeUsers = await prisma.user.count({
        where: {
          lastLoginAt: {
            gte: yesterday,
            lt: today,
          },
          Entitlement: {
            plan,
          },
        },
      });

      // Upsert revenue metric
      await prisma.revenueMetric.upsert({
        where: {
          date_plan: {
            date: yesterday,
            plan,
          },
        },
        update: {
          newSubscribers: newSubs,
          totalRevenue: revenue,
          activeUsers,
        },
        create: {
          date: yesterday,
          plan,
          newSubscribers: newSubs,
          totalRevenue: revenue,
          activeUsers,
          churnCount: 0,
        },
      });
    }

    logger.info('[DailyHealthUpdate] Revenue aggregation completed');
  } catch (error) {
    logger.error('[DailyHealthUpdate] Revenue aggregation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Main job execution function
 */
export async function executeDailyHealthUpdateJob(): Promise<HealthUpdateJobResult> {
  logger.info('[DailyHealthUpdate] Starting daily health update job');

  try {
    // Run health score updates
    const healthResult = await runDailyHealthUpdate();

    // Aggregate revenue metrics
    await aggregateDailyRevenue();

    logger.info('[DailyHealthUpdate] Daily job completed successfully', healthResult);

    return healthResult;
  } catch (error) {
    logger.error('[DailyHealthUpdate] Daily job failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If run directly from command line
if (require.main === module) {
  executeDailyHealthUpdateJob()
    .then(result => {
      console.log('Daily health update completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Daily health update failed:', error);
      process.exit(1);
    });
}
