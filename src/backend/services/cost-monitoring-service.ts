/**
 * Cost Monitoring Service
 * Tracks and calculates costs for all OpenAI API usage
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { aiCache } from '../../services/ai-cache-service';
import { cacheAnalytics } from '../../services/cache-analytics';

const prisma = new PrismaClient();

/**
 * OpenAI Pricing Constants (as of 2024)
 * All prices in USD
 */
export const PRICING = {
  // Whisper API - Audio Transcription
  WHISPER: {
    COST_PER_MINUTE: 0.006, // $0.006 per minute
  },

  // GPT-4o API - Chat Completion
  GPT_4O: {
    INPUT_COST_PER_1M_TOKENS: 2.50, // $2.50 per 1M input tokens
    OUTPUT_COST_PER_1M_TOKENS: 10.00, // $10.00 per 1M output tokens
  },

  // TTS-1-HD API - Text to Speech
  TTS_1_HD: {
    COST_PER_1K_CHARACTERS: 0.030, // $0.030 per 1K characters
  },

  // Realtime API - Real-time Voice Conversation
  REALTIME_API: {
    INPUT_COST_PER_1M_TOKENS: 5.00, // $5.00 per 1M input tokens
    OUTPUT_COST_PER_1M_TOKENS: 20.00, // $20.00 per 1M output tokens
    AUDIO_INPUT_COST_PER_MINUTE: 0.06, // $0.06 per minute audio input
    AUDIO_OUTPUT_COST_PER_MINUTE: 0.24, // $0.24 per minute audio output
  },
} as const;

/**
 * Service types for cost tracking
 */
export type ServiceType = 'whisper' | 'gpt-4o' | 'tts-1-hd' | 'realtime-api';

/**
 * Operation types for each service
 */
export type OperationType =
  | 'transcription' // Whisper
  | 'chat' // GPT-4o
  | 'synthesis' // TTS-1-HD
  | 'realtime-chat' // Realtime API text tokens
  | 'realtime-audio-input' // Realtime API audio input
  | 'realtime-audio-output'; // Realtime API audio output

/**
 * Usage tracking interface
 */
export interface UsageMetrics {
  inputTokens?: number;
  outputTokens?: number;
  audioMinutes?: number;
  characters?: number;
}

/**
 * Cost calculation result
 */
export interface CostCalculation {
  unitCost: number;
  totalCost: number;
  breakdown?: string;
}

/**
 * Calculate cost for Whisper transcription
 */
export function calculateWhisperCost(audioMinutes: number): CostCalculation {
  const totalCost = audioMinutes * PRICING.WHISPER.COST_PER_MINUTE;

  return {
    unitCost: PRICING.WHISPER.COST_PER_MINUTE,
    totalCost,
    breakdown: `${audioMinutes.toFixed(2)} minutes × $${PRICING.WHISPER.COST_PER_MINUTE} = $${totalCost.toFixed(6)}`,
  };
}

/**
 * Calculate cost for GPT-4o chat
 */
export function calculateGPT4oCost(inputTokens: number, outputTokens: number): CostCalculation {
  const inputCost = (inputTokens / 1_000_000) * PRICING.GPT_4O.INPUT_COST_PER_1M_TOKENS;
  const outputCost = (outputTokens / 1_000_000) * PRICING.GPT_4O.OUTPUT_COST_PER_1M_TOKENS;
  const totalCost = inputCost + outputCost;

  return {
    unitCost: 0, // Variable cost, not a single unit
    totalCost,
    breakdown: `Input: ${inputTokens} tokens × $${PRICING.GPT_4O.INPUT_COST_PER_1M_TOKENS}/1M = $${inputCost.toFixed(6)}\nOutput: ${outputTokens} tokens × $${PRICING.GPT_4O.OUTPUT_COST_PER_1M_TOKENS}/1M = $${outputCost.toFixed(6)}`,
  };
}

/**
 * Calculate cost for TTS-1-HD synthesis
 */
export function calculateTTSCost(characters: number): CostCalculation {
  const totalCost = (characters / 1000) * PRICING.TTS_1_HD.COST_PER_1K_CHARACTERS;

  return {
    unitCost: PRICING.TTS_1_HD.COST_PER_1K_CHARACTERS,
    totalCost,
    breakdown: `${characters} characters × $${PRICING.TTS_1_HD.COST_PER_1K_CHARACTERS}/1K = $${totalCost.toFixed(6)}`,
  };
}

/**
 * Calculate cost for Realtime API usage
 */
export function calculateRealtimeAPICost(
  inputTokens: number = 0,
  outputTokens: number = 0,
  audioInputMinutes: number = 0,
  audioOutputMinutes: number = 0
): CostCalculation {
  const inputTokenCost = (inputTokens / 1_000_000) * PRICING.REALTIME_API.INPUT_COST_PER_1M_TOKENS;
  const outputTokenCost = (outputTokens / 1_000_000) * PRICING.REALTIME_API.OUTPUT_COST_PER_1M_TOKENS;
  const audioInputCost = audioInputMinutes * PRICING.REALTIME_API.AUDIO_INPUT_COST_PER_MINUTE;
  const audioOutputCost = audioOutputMinutes * PRICING.REALTIME_API.AUDIO_OUTPUT_COST_PER_MINUTE;

  const totalCost = inputTokenCost + outputTokenCost + audioInputCost + audioOutputCost;

  return {
    unitCost: 0, // Variable cost
    totalCost,
    breakdown: [
      `Input tokens: ${inputTokens} × $${PRICING.REALTIME_API.INPUT_COST_PER_1M_TOKENS}/1M = $${inputTokenCost.toFixed(6)}`,
      `Output tokens: ${outputTokens} × $${PRICING.REALTIME_API.OUTPUT_COST_PER_1M_TOKENS}/1M = $${outputTokenCost.toFixed(6)}`,
      `Audio input: ${audioInputMinutes.toFixed(2)} min × $${PRICING.REALTIME_API.AUDIO_INPUT_COST_PER_MINUTE} = $${audioInputCost.toFixed(6)}`,
      `Audio output: ${audioOutputMinutes.toFixed(2)} min × $${PRICING.REALTIME_API.AUDIO_OUTPUT_COST_PER_MINUTE} = $${audioOutputCost.toFixed(6)}`,
    ].join('\n'),
  };
}

/**
 * Log API usage and calculate cost
 */
export async function logApiUsage(
  userId: string,
  service: ServiceType,
  operation: OperationType,
  metrics: UsageMetrics,
  metadata?: Record<string, any>
): Promise<{ usageLog: any; cost: number }> {
  try {
    let costCalc: CostCalculation;

    // Calculate cost based on service type
    switch (service) {
      case 'whisper':
        if (!metrics.audioMinutes) {
          throw new Error('Audio minutes required for Whisper service');
        }
        costCalc = calculateWhisperCost(metrics.audioMinutes);
        break;

      case 'gpt-4o':
        if (metrics.inputTokens === undefined || metrics.outputTokens === undefined) {
          throw new Error('Input and output tokens required for GPT-4o service');
        }
        costCalc = calculateGPT4oCost(metrics.inputTokens, metrics.outputTokens);
        break;

      case 'tts-1-hd':
        if (!metrics.characters) {
          throw new Error('Characters required for TTS service');
        }
        costCalc = calculateTTSCost(metrics.characters);
        break;

      case 'realtime-api':
        costCalc = calculateRealtimeAPICost(
          metrics.inputTokens,
          metrics.outputTokens,
          metrics.audioMinutes
        );
        break;

      default:
        throw new Error(`Unknown service type: ${service}`);
    }

    // Create usage log in database
    const usageLog = await prisma.apiUsageLog.create({
      data: {
        userId,
        service,
        operation,
        inputTokens: metrics.inputTokens,
        outputTokens: metrics.outputTokens,
        audioMinutes: metrics.audioMinutes,
        characters: metrics.characters,
        unitCost: costCalc.unitCost,
        totalCost: costCalc.totalCost,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Update budget spent
    await updateBudgetSpent(userId, costCalc.totalCost);

    logger.info('API usage logged', {
      userId,
      service,
      operation,
      cost: costCalc.totalCost,
      breakdown: costCalc.breakdown,
    });

    return {
      usageLog,
      cost: costCalc.totalCost,
    };
  } catch (error) {
    logger.error('Failed to log API usage', { error, userId, service, operation });
    throw error;
  }
}

/**
 * Update budget spent for user
 */
async function updateBudgetSpent(userId: string, cost: number): Promise<void> {
  try {
    // Get or create budget limit
    let budget = await prisma.budgetLimit.findUnique({
      where: { userId },
    });

    if (!budget) {
      budget = await prisma.budgetLimit.create({
        data: { userId },
      });
    }

    // Check if we need to reset daily/monthly counters
    const now = new Date();
    const shouldResetDaily = isNewDay(budget.lastDailyReset, now);
    const shouldResetMonthly = isNewMonth(budget.lastMonthlyReset, now);

    // Update spent amounts
    await prisma.budgetLimit.update({
      where: { userId },
      data: {
        dailySpent: shouldResetDaily ? cost : budget.dailySpent + cost,
        monthlySpent: shouldResetMonthly ? cost : budget.monthlySpent + cost,
        lastDailyReset: shouldResetDaily ? now : budget.lastDailyReset,
        lastMonthlyReset: shouldResetMonthly ? now : budget.lastMonthlyReset,
      },
    });

    // Check for budget alerts
    await checkBudgetAlerts(userId);
  } catch (error) {
    logger.error('Failed to update budget spent', { error, userId, cost });
    throw error;
  }
}

/**
 * Check if date is a new day
 */
function isNewDay(lastDate: Date, currentDate: Date): boolean {
  return (
    lastDate.getFullYear() !== currentDate.getFullYear() ||
    lastDate.getMonth() !== currentDate.getMonth() ||
    lastDate.getDate() !== currentDate.getDate()
  );
}

/**
 * Check if date is a new month
 */
function isNewMonth(lastDate: Date, currentDate: Date): boolean {
  return (
    lastDate.getFullYear() !== currentDate.getFullYear() ||
    lastDate.getMonth() !== currentDate.getMonth()
  );
}

/**
 * Check budget limits and create alerts if needed
 */
async function checkBudgetAlerts(userId: string): Promise<void> {
  try {
    const budget = await prisma.budgetLimit.findUnique({
      where: { userId },
    });

    if (!budget || !budget.alertsEnabled) {
      return;
    }

    // Check daily budget
    if (budget.dailyLimit) {
      const dailyPercentage = budget.dailySpent / budget.dailyLimit;

      if (dailyPercentage >= 1.0) {
        await createCostAlert(userId, 'budget_exceeded', 'critical', {
          currentSpent: budget.dailySpent,
          budgetLimit: budget.dailyLimit,
          percentage: dailyPercentage * 100,
          period: 'daily',
        });
      } else if (dailyPercentage >= budget.alertThreshold) {
        await createCostAlert(userId, 'threshold_reached', 'warning', {
          currentSpent: budget.dailySpent,
          budgetLimit: budget.dailyLimit,
          percentage: dailyPercentage * 100,
          period: 'daily',
        });
      }
    }

    // Check monthly budget
    if (budget.monthlyLimit) {
      const monthlyPercentage = budget.monthlySpent / budget.monthlyLimit;

      if (monthlyPercentage >= 1.0) {
        await createCostAlert(userId, 'budget_exceeded', 'critical', {
          currentSpent: budget.monthlySpent,
          budgetLimit: budget.monthlyLimit,
          percentage: monthlyPercentage * 100,
          period: 'monthly',
        });
      } else if (monthlyPercentage >= budget.alertThreshold) {
        await createCostAlert(userId, 'threshold_reached', 'warning', {
          currentSpent: budget.monthlySpent,
          budgetLimit: budget.monthlyLimit,
          percentage: monthlyPercentage * 100,
          period: 'monthly',
        });
      }
    }
  } catch (error) {
    logger.error('Failed to check budget alerts', { error, userId });
  }
}

/**
 * Create a cost alert
 */
async function createCostAlert(
  userId: string,
  type: string,
  severity: string,
  data: { currentSpent: number; budgetLimit: number; percentage: number; period: string }
): Promise<void> {
  try {
    // Check if similar alert already exists (avoid duplicates)
    const existingAlert = await prisma.costAlert.findFirst({
      where: {
        userId,
        type,
        isRead: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (existingAlert) {
      return; // Don't create duplicate alert
    }

    const message =
      type === 'budget_exceeded'
        ? `Your ${data.period} budget has been exceeded! Spent: $${data.currentSpent.toFixed(2)} / $${data.budgetLimit.toFixed(2)}`
        : `Budget alert: You've used ${data.percentage.toFixed(1)}% of your ${data.period} budget ($${data.currentSpent.toFixed(2)} / $${data.budgetLimit.toFixed(2)})`;

    await prisma.costAlert.create({
      data: {
        userId,
        type,
        message,
        severity,
        currentSpent: data.currentSpent,
        budgetLimit: data.budgetLimit,
        percentage: data.percentage,
      },
    });

    logger.warn('Cost alert created', { userId, type, severity, message });
  } catch (error) {
    logger.error('Failed to create cost alert', { error, userId, type });
  }
}

/**
 * Check if user can make API call (budget check)
 */
export async function canMakeApiCall(userId: string): Promise<boolean> {
  try {
    const budget = await prisma.budgetLimit.findUnique({
      where: { userId },
    });

    if (!budget || !budget.pauseOnExceed) {
      return true; // No budget limits or not configured to pause
    }

    // Check if daily budget exceeded
    if (budget.dailyLimit && budget.dailySpent >= budget.dailyLimit) {
      logger.warn('Daily budget exceeded, blocking API call', {
        userId,
        dailySpent: budget.dailySpent,
        dailyLimit: budget.dailyLimit,
      });
      return false;
    }

    // Check if monthly budget exceeded
    if (budget.monthlyLimit && budget.monthlySpent >= budget.monthlyLimit) {
      logger.warn('Monthly budget exceeded, blocking API call', {
        userId,
        monthlySpent: budget.monthlySpent,
        monthlyLimit: budget.monthlyLimit,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to check budget limits', { error, userId });
    return true; // Allow call on error
  }
}

/**
 * Get cost summary for user (with cache savings)
 */
export async function getCostSummary(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalCost: number;
  byService: Record<string, number>;
  byOperation: Record<string, number>;
  count: number;
  cacheSavings?: {
    totalSaved: number;
    hitRate: number;
    projectedMonthlySavings: number;
  };
}> {
  try {
    const where: any = { userId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const logs = await prisma.apiUsageLog.findMany({ where });

    const summary = {
      totalCost: 0,
      byService: {} as Record<string, number>,
      byOperation: {} as Record<string, number>,
      count: logs.length,
    };

    for (const log of logs) {
      summary.totalCost += log.totalCost;
      summary.byService[log.service] = (summary.byService[log.service] || 0) + log.totalCost;
      summary.byOperation[log.operation] = (summary.byOperation[log.operation] || 0) + log.totalCost;
    }

    // Add cache savings information
    try {
      const analytics = await cacheAnalytics.getAnalytics();
      summary.cacheSavings = {
        totalSaved: analytics.totalSavedCost,
        hitRate: analytics.hitRate,
        projectedMonthlySavings: analytics.projectedMonthlySavings,
      };
    } catch (error) {
      logger.warn('Failed to get cache analytics for cost summary', { error });
    }

    return summary;
  } catch (error) {
    logger.error('Failed to get cost summary', { error, userId });
    throw error;
  }
}

/**
 * Get usage logs for user
 */
export async function getUsageLogs(
  userId: string,
  options?: {
    service?: ServiceType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
) {
  try {
    const where: any = { userId };

    if (options?.service) {
      where.service = options.service;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return await prisma.apiUsageLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 100,
    });
  } catch (error) {
    logger.error('Failed to get usage logs', { error, userId });
    throw error;
  }
}

export default {
  logApiUsage,
  canMakeApiCall,
  getCostSummary,
  getUsageLogs,
  calculateWhisperCost,
  calculateGPT4oCost,
  calculateTTSCost,
  calculateRealtimeAPICost,
};
