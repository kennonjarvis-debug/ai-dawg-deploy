/**
 * Melody-to-Vocals Analytics and Monitoring Service
 *
 * Tracks metrics, performance, and usage patterns for the melody-vocals feature
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AnalyticsMetrics {
  totalConversions: number;
  successRate: number;
  averageProcessingTime: number;
  peakUsageHour: number;
  topGenres: Array<{ genre: string; count: number }>;
  topMoods: Array<{ mood: string; count: number }>;
  errorBreakdown: Array<{ errorType: string; count: number }>;
  quotaUtilization: {
    dailyAverage: number;
    monthlyAverage: number;
  };
  qualityMetrics: {
    averageRating: number;
    totalRatings: number;
  };
}

export interface PerformanceMetrics {
  p50: number; // 50th percentile (median)
  p95: number; // 95th percentile
  p99: number; // 99th percentile
  min: number;
  max: number;
  average: number;
}

/**
 * Get overall analytics for melody-vocals service
 */
export async function getAnalytics(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsMetrics> {
  const whereClause: any = {};

  if (userId) {
    whereClause.userId = userId;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  // Total conversions
  const totalConversions = await prisma.melodyVocalsConversion.count({
    where: whereClause,
  });

  // Success rate
  const completedConversions = await prisma.melodyVocalsConversion.count({
    where: { ...whereClause, status: 'completed' },
  });
  const successRate = totalConversions > 0 ? (completedConversions / totalConversions) * 100 : 0;

  // Average processing time
  const processingTimes = await prisma.melodyVocalsConversion.findMany({
    where: { ...whereClause, status: 'completed', processingTime: { not: null } },
    select: { processingTime: true },
  });

  const averageProcessingTime =
    processingTimes.length > 0
      ? processingTimes.reduce((sum, p) => sum + (p.processingTime || 0), 0) / processingTimes.length
      : 0;

  // Peak usage hour
  const conversions = await prisma.melodyVocalsConversion.findMany({
    where: whereClause,
    select: { createdAt: true },
  });

  const hourCounts = new Array(24).fill(0);
  conversions.forEach((c) => {
    const hour = new Date(c.createdAt).getHours();
    hourCounts[hour]++;
  });
  const peakUsageHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Top genres
  const genreCounts: Record<string, number> = {};
  const genreData = await prisma.melodyVocalsConversion.findMany({
    where: whereClause,
    select: { genre: true },
  });
  genreData.forEach((g) => {
    if (g.genre) {
      genreCounts[g.genre] = (genreCounts[g.genre] || 0) + 1;
    }
  });
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top moods
  const moodCounts: Record<string, number> = {};
  const moodData = await prisma.melodyVocalsConversion.findMany({
    where: whereClause,
    select: { mood: true },
  });
  moodData.forEach((m) => {
    if (m.mood) {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    }
  });
  const topMoods = Object.entries(moodCounts)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Error breakdown
  const errorCounts: Record<string, number> = {};
  const errorData = await prisma.melodyVocalsConversion.findMany({
    where: { ...whereClause, status: 'failed' },
    select: { errorType: true },
  });
  errorData.forEach((e) => {
    const errorType = e.errorType || 'UNKNOWN';
    errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
  });
  const errorBreakdown = Object.entries(errorCounts)
    .map(([errorType, count]) => ({ errorType, count }))
    .sort((a, b) => b.count - a.count);

  // Quota utilization
  const quotaData = await prisma.melodyVocalsQuota.findMany(
    userId ? { where: { userId } } : {}
  );
  const dailyAverage =
    quotaData.length > 0
      ? quotaData.reduce((sum, q) => sum + q.dailyUsed, 0) / quotaData.length
      : 0;
  const monthlyAverage =
    quotaData.length > 0
      ? quotaData.reduce((sum, q) => sum + q.monthlyUsed, 0) / quotaData.length
      : 0;

  // Quality metrics
  const ratings = await prisma.melodyVocalsConversion.findMany({
    where: { ...whereClause, userRating: { not: null } },
    select: { userRating: true },
  });
  const totalRatings = ratings.length;
  const averageRating =
    totalRatings > 0
      ? ratings.reduce((sum, r) => sum + (r.userRating || 0), 0) / totalRatings
      : 0;

  return {
    totalConversions,
    successRate,
    averageProcessingTime,
    peakUsageHour,
    topGenres,
    topMoods,
    errorBreakdown,
    quotaUtilization: {
      dailyAverage,
      monthlyAverage,
    },
    qualityMetrics: {
      averageRating,
      totalRatings,
    },
  };
}

/**
 * Get performance metrics (processing time percentiles)
 */
export async function getPerformanceMetrics(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<PerformanceMetrics> {
  const whereClause: any = {
    status: 'completed',
    processingTime: { not: null },
  };

  if (userId) {
    whereClause.userId = userId;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const conversions = await prisma.melodyVocalsConversion.findMany({
    where: whereClause,
    select: { processingTime: true },
    orderBy: { processingTime: 'asc' },
  });

  if (conversions.length === 0) {
    return {
      p50: 0,
      p95: 0,
      p99: 0,
      min: 0,
      max: 0,
      average: 0,
    };
  }

  const times = conversions.map((c) => c.processingTime || 0);

  const getPercentile = (arr: number[], percentile: number): number => {
    const index = Math.ceil((percentile / 100) * arr.length) - 1;
    return arr[Math.max(0, index)];
  };

  return {
    p50: getPercentile(times, 50),
    p95: getPercentile(times, 95),
    p99: getPercentile(times, 99),
    min: Math.min(...times),
    max: Math.max(...times),
    average: times.reduce((sum, t) => sum + t, 0) / times.length,
  };
}

/**
 * Get conversion trend data (daily counts over time)
 */
export async function getConversionTrends(
  userId?: string,
  days: number = 30
): Promise<Array<{ date: string; count: number; successCount: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const whereClause: any = {
    createdAt: { gte: startDate },
  };

  if (userId) {
    whereClause.userId = userId;
  }

  const conversions = await prisma.melodyVocalsConversion.findMany({
    where: whereClause,
    select: { createdAt: true, status: true },
  });

  // Group by date
  const dateCounts: Record<string, { total: number; success: number }> = {};

  conversions.forEach((c) => {
    const dateKey = new Date(c.createdAt).toISOString().split('T')[0];
    if (!dateCounts[dateKey]) {
      dateCounts[dateKey] = { total: 0, success: 0 };
    }
    dateCounts[dateKey].total++;
    if (c.status === 'completed') {
      dateCounts[dateKey].success++;
    }
  });

  // Fill in missing dates with zeros
  const trends: Array<{ date: string; count: number; successCount: number }> = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    const dateKey = date.toISOString().split('T')[0];

    trends.push({
      date: dateKey,
      count: dateCounts[dateKey]?.total || 0,
      successCount: dateCounts[dateKey]?.success || 0,
    });
  }

  return trends;
}

/**
 * Log a monitoring event
 */
export async function logMonitoringEvent(
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  console.log(`[MelodyVocals Analytics] ${eventType}:`, data);

  // TODO: Integrate with external monitoring service (DataDog, New Relic, etc.)
}

/**
 * Check system health and alert if issues detected
 */
export async function checkSystemHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  metrics: {
    queueBacklog: number;
    errorRate: number;
    averageLatency: number;
  };
}> {
  const issues: string[] = [];

  // Check recent conversions for high error rate
  const recentConversions = await prisma.melodyVocalsConversion.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
    },
    select: { status: true, processingTime: true },
  });

  const total = recentConversions.length;
  const failed = recentConversions.filter((c) => c.status === 'failed').length;
  const errorRate = total > 0 ? (failed / total) * 100 : 0;

  if (errorRate > 20) {
    issues.push(`High error rate: ${errorRate.toFixed(1)}% in the last hour`);
  }

  // Check queue backlog
  const queueBacklog = await prisma.melodyVocalsConversion.count({
    where: { status: { in: ['pending', 'processing'] } },
  });

  if (queueBacklog > 50) {
    issues.push(`Large queue backlog: ${queueBacklog} jobs pending`);
  }

  // Check average latency
  const completedTimes = recentConversions
    .filter((c) => c.status === 'completed' && c.processingTime)
    .map((c) => c.processingTime || 0);

  const averageLatency =
    completedTimes.length > 0
      ? completedTimes.reduce((sum, t) => sum + t, 0) / completedTimes.length
      : 0;

  if (averageLatency > 180000) {
    // > 3 minutes
    issues.push(`High average latency: ${(averageLatency / 1000).toFixed(1)}s`);
  }

  return {
    healthy: issues.length === 0,
    issues,
    metrics: {
      queueBacklog,
      errorRate,
      averageLatency,
    },
  };
}

/**
 * Get user-specific insights
 */
export async function getUserInsights(userId: string): Promise<{
  favoriteGenre: string | null;
  favoriteMood: string | null;
  totalConversions: number;
  averageRating: number;
  improvementSuggestions: string[];
}> {
  const conversions = await prisma.melodyVocalsConversion.findMany({
    where: { userId },
    select: { genre: true, mood: true, userRating: true },
  });

  // Find favorite genre
  const genreCounts: Record<string, number> = {};
  conversions.forEach((c) => {
    if (c.genre) {
      genreCounts[c.genre] = (genreCounts[c.genre] || 0) + 1;
    }
  });
  const favoriteGenre =
    Object.keys(genreCounts).length > 0
      ? Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Find favorite mood
  const moodCounts: Record<string, number> = {};
  conversions.forEach((c) => {
    if (c.mood) {
      moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1;
    }
  });
  const favoriteMood =
    Object.keys(moodCounts).length > 0
      ? Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Average rating
  const ratings = conversions.filter((c) => c.userRating).map((c) => c.userRating || 0);
  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

  // Improvement suggestions
  const improvementSuggestions: string[] = [];

  if (conversions.length < 5) {
    improvementSuggestions.push('Try creating more conversions to discover new styles');
  }

  if (ratings.length === 0) {
    improvementSuggestions.push('Rate your conversions to help improve quality');
  }

  if (averageRating < 3 && ratings.length > 3) {
    improvementSuggestions.push('Try different prompts or genres for better results');
  }

  const uniqueGenres = new Set(conversions.map((c) => c.genre).filter(Boolean));
  if (uniqueGenres.size < 3) {
    improvementSuggestions.push('Experiment with different genres to find your perfect sound');
  }

  return {
    favoriteGenre,
    favoriteMood,
    totalConversions: conversions.length,
    averageRating,
    improvementSuggestions,
  };
}
