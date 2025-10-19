/**
 * Cache Analytics Service
 * Tracks cache performance, cost savings, and provides detailed metrics
 */

import { aiCache, AIProvider } from './ai-cache-service';
import { logger } from '../backend/utils/logger';

export interface CacheAnalytics {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  totalSavedCost: number;
  byProvider: Record<string, ProviderAnalytics>;
  dailySavings: number;
  monthlySavings: number;
  projectedMonthlySavings: number;
}

export interface ProviderAnalytics {
  provider: AIProvider;
  hits: number;
  misses: number;
  hitRate: number;
  savedCost: number;
  estimatedMonthlySavings: number;
}

export interface DailySummary {
  date: string;
  hits: number;
  misses: number;
  hitRate: number;
  savedCost: number;
}

/**
 * Cache Analytics Service Class
 */
export class CacheAnalyticsService {
  private static instance: CacheAnalyticsService;

  // Expected monthly costs without caching (from requirements)
  private readonly BASELINE_MONTHLY_COSTS = {
    openai: 500, // $200-800/month average
    anthropic: 325, // $150-500/month average
    replicate: 250, // $100-400/month average
    google: 35, // $20-50/month average
    gemini: 35,
  };

  private constructor() {
    logger.info('Cache Analytics Service initialized');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CacheAnalyticsService {
    if (!CacheAnalyticsService.instance) {
      CacheAnalyticsService.instance = new CacheAnalyticsService();
    }
    return CacheAnalyticsService.instance;
  }

  /**
   * Get comprehensive analytics across all providers
   */
  async getAnalytics(): Promise<CacheAnalytics> {
    try {
      // Get global stats
      const globalStats = await aiCache.getStats();

      // Get per-provider stats
      const providers: AIProvider[] = ['openai', 'anthropic', 'replicate', 'google'];
      const byProvider: Record<string, ProviderAnalytics> = {};

      for (const provider of providers) {
        const stats = await aiCache.getStats(provider);
        const baselineCost = this.BASELINE_MONTHLY_COSTS[provider] || 0;

        byProvider[provider] = {
          provider,
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hitRate,
          savedCost: stats.savedCost,
          estimatedMonthlySavings: stats.hitRate > 0 ? baselineCost * stats.hitRate : 0,
        };
      }

      // Calculate daily and monthly savings
      const dailySavings = globalStats.savedCost;
      const monthlySavings = dailySavings * 30; // Extrapolate to month

      // Calculate projected monthly savings based on baseline costs
      const totalBaselineCost = Object.values(this.BASELINE_MONTHLY_COSTS).reduce((a, b) => a + b, 0);
      const projectedMonthlySavings = totalBaselineCost * globalStats.hitRate;

      return {
        totalHits: globalStats.hits,
        totalMisses: globalStats.misses,
        hitRate: globalStats.hitRate,
        totalSavedCost: globalStats.savedCost,
        byProvider,
        dailySavings,
        monthlySavings,
        projectedMonthlySavings,
      };
    } catch (error: any) {
      logger.error('Failed to get analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get analytics for specific provider
   */
  async getProviderAnalytics(provider: AIProvider): Promise<ProviderAnalytics> {
    try {
      const stats = await aiCache.getStats(provider);
      const baselineCost = this.BASELINE_MONTHLY_COSTS[provider] || 0;

      return {
        provider,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hitRate,
        savedCost: stats.savedCost,
        estimatedMonthlySavings: stats.hitRate > 0 ? baselineCost * stats.hitRate : 0,
      };
    } catch (error: any) {
      logger.error('Failed to get provider analytics', { error: error.message, provider });
      throw error;
    }
  }

  /**
   * Get formatted analytics report
   */
  async getReport(): Promise<string> {
    try {
      const analytics = await this.getAnalytics();
      const cacheInfo = await aiCache.getCacheInfo();

      const lines = [
        '='.repeat(80),
        'AI CACHE ANALYTICS REPORT',
        '='.repeat(80),
        '',
        'CACHE PERFORMANCE',
        '-'.repeat(80),
        `Total Requests:        ${analytics.totalHits + analytics.totalMisses}`,
        `Cache Hits:            ${analytics.totalHits}`,
        `Cache Misses:          ${analytics.totalMisses}`,
        `Hit Rate:              ${(analytics.hitRate * 100).toFixed(1)}%`,
        '',
        'COST SAVINGS',
        '-'.repeat(80),
        `Total Saved:           $${analytics.totalSavedCost.toFixed(2)}`,
        `Daily Savings:         $${analytics.dailySavings.toFixed(2)}`,
        `Monthly Projection:    $${analytics.projectedMonthlySavings.toFixed(2)}`,
        `Target Savings:        $${((Object.values(this.BASELINE_MONTHLY_COSTS).reduce((a, b) => a + b, 0)) * 0.5).toFixed(2)} (50% of baseline)`,
        `Progress:              ${((analytics.projectedMonthlySavings / ((Object.values(this.BASELINE_MONTHLY_COSTS).reduce((a, b) => a + b, 0)) * 0.5)) * 100).toFixed(1)}%`,
        '',
        'PROVIDER BREAKDOWN',
        '-'.repeat(80),
      ];

      // Add provider stats
      for (const [providerName, providerStats] of Object.entries(analytics.byProvider)) {
        if (providerStats.hits > 0 || providerStats.misses > 0) {
          lines.push(
            `${providerName.toUpperCase()}:`,
            `  Requests:            ${providerStats.hits + providerStats.misses}`,
            `  Hit Rate:            ${(providerStats.hitRate * 100).toFixed(1)}%`,
            `  Saved:               $${providerStats.savedCost.toFixed(2)}`,
            `  Monthly Projection:  $${providerStats.estimatedMonthlySavings.toFixed(2)}`,
            ''
          );
        }
      }

      lines.push(
        'CACHE STORAGE',
        '-'.repeat(80),
        `Total Cached Keys:     ${cacheInfo.totalKeys}`,
        `Memory Usage:          ${cacheInfo.memoryUsage}`,
        '',
        'CACHED ITEMS BY PROVIDER',
        '-'.repeat(80)
      );

      for (const [provider, count] of Object.entries(cacheInfo.providers)) {
        lines.push(`  ${provider}: ${count} items`);
      }

      lines.push('='.repeat(80));

      return lines.join('\n');
    } catch (error: any) {
      logger.error('Failed to generate report', { error: error.message });
      throw error;
    }
  }

  /**
   * Log analytics to console (for monitoring)
   */
  async logAnalytics(): Promise<void> {
    try {
      const report = await this.getReport();
      console.log('\n' + report + '\n');
    } catch (error: any) {
      logger.error('Failed to log analytics', { error: error.message });
    }
  }

  /**
   * Get cache efficiency score (0-100)
   * Based on hit rate, cost savings, and cache size
   */
  async getEfficiencyScore(): Promise<number> {
    try {
      const analytics = await this.getAnalytics();
      const cacheInfo = await aiCache.getCacheInfo();

      // Weight factors
      const hitRateWeight = 0.6; // 60% weight on hit rate
      const savingsWeight = 0.3; // 30% weight on actual savings
      const utilizationWeight = 0.1; // 10% weight on cache utilization

      // Hit rate score (0-100)
      const hitRateScore = analytics.hitRate * 100;

      // Savings score (0-100) - based on achieving 50% cost reduction goal
      const targetSavings = Object.values(this.BASELINE_MONTHLY_COSTS).reduce((a, b) => a + b, 0) * 0.5;
      const savingsScore = Math.min((analytics.projectedMonthlySavings / targetSavings) * 100, 100);

      // Utilization score (0-100) - healthy cache size (1000-10000 items is optimal)
      const optimalCacheSize = 5000;
      const utilizationScore = Math.min((cacheInfo.totalKeys / optimalCacheSize) * 100, 100);

      // Calculate weighted score
      const score =
        hitRateScore * hitRateWeight +
        savingsScore * savingsWeight +
        utilizationScore * utilizationWeight;

      return Math.round(score);
    } catch (error: any) {
      logger.error('Failed to calculate efficiency score', { error: error.message });
      return 0;
    }
  }

  /**
   * Get recommendations for improving cache performance
   */
  async getRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      const analytics = await this.getAnalytics();
      const cacheInfo = await aiCache.getCacheInfo();

      // Low hit rate
      if (analytics.hitRate < 0.3) {
        recommendations.push(
          'Hit rate is low. Consider implementing semantic similarity matching for similar prompts.'
        );
      }

      // Low cache size
      if (cacheInfo.totalKeys < 100) {
        recommendations.push(
          'Cache size is small. System needs more usage data to be effective. Consider pre-warming cache with common prompts.'
        );
      }

      // High cache size
      if (cacheInfo.totalKeys > 10000) {
        recommendations.push(
          'Cache size is large. Consider reducing TTL values or implementing cache eviction policies.'
        );
      }

      // Provider-specific recommendations
      for (const [provider, stats] of Object.entries(analytics.byProvider)) {
        if (stats.hits + stats.misses > 10 && stats.hitRate < 0.2) {
          recommendations.push(
            `${provider.toUpperCase()} has low hit rate (${(stats.hitRate * 100).toFixed(1)}%). Review prompt patterns for this provider.`
          );
        }
      }

      // Savings not meeting target
      const targetSavings = Object.values(this.BASELINE_MONTHLY_COSTS).reduce((a, b) => a + b, 0) * 0.5;
      if (analytics.projectedMonthlySavings < targetSavings * 0.8) {
        recommendations.push(
          `Projected savings ($${analytics.projectedMonthlySavings.toFixed(2)}/month) below 50% target ($${targetSavings.toFixed(2)}/month). Increase cache TTL for frequently accessed items.`
        );
      }

      // Good performance
      if (analytics.hitRate > 0.5 && analytics.projectedMonthlySavings >= targetSavings * 0.8) {
        recommendations.push(
          'Cache performance is excellent! Current hit rate exceeds 50% and savings target is being met.'
        );
      }
    } catch (error: any) {
      logger.error('Failed to generate recommendations', { error: error.message });
    }

    return recommendations;
  }
}

// Export singleton instance
export const cacheAnalytics = CacheAnalyticsService.getInstance();
