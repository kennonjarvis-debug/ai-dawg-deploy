/**
 * Telemetry Collection API
 * Instance 4 (Data & Storage - Karen)
 *
 * POST /api/analytics/telemetry - Submit telemetry batch
 * Privacy-safe, opt-in only, PII scrubbed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  TelemetryBatchSchema,
  scrubEventPII,
  type TelemetryBatch,
} from '@/lib/types/analytics';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if user has consented to telemetry
 */
async function checkConsent(userHash: string): Promise<boolean> {
  const consent = await prisma.telemetryConsent.findUnique({
    where: { userHash },
  });

  if (!consent) {
    // No consent record = no consent given
    return false;
  }

  // Check if any telemetry is allowed
  return (
    consent.allowUsageAnalytics ||
    consent.allowErrorReporting ||
    consent.allowPerformanceTracking
  );
}

/**
 * POST /api/analytics/telemetry
 * Submit telemetry batch (privacy-safe, opt-in only)
 */
export async function POST(request: NextRequest) {
  try {
    // Telemetry can be submitted without session (for anonymous tracking)
    // But user must have explicitly opted in

    const body = await request.json();

    // Validate telemetry batch
    const batchResult = TelemetryBatchSchema.safeParse(body);

    if (!batchResult.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Invalid telemetry batch data',
          details: batchResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const batch: TelemetryBatch = batchResult.data;

    // Check consent
    const hasConsent = await checkConsent(batch.userHash);

    if (!hasConsent) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'User has not consented to telemetry collection',
        },
        { status: 403 }
      );
    }

    // Scrub PII from all events
    const scrubbedBatch: TelemetryBatch = {
      ...batch,
      uiEvents: batch.uiEvents.map(scrubEventPII),
      // Other event types are already privacy-safe by design
    };

    // Store telemetry events in database
    const eventPromises = [];

    // Store UI events
    for (const event of scrubbedBatch.uiEvents) {
      eventPromises.push(
        prisma.telemetryEvent.create({
          data: {
            eventId: event.eventId,
            userHash: event.userHash,
            sessionId: event.sessionId,
            eventType: event.eventType,
            eventCategory: 'ui',
            component: event.component,
            action: event.action,
            label: event.label,
            value: event.value,
            currentPage: event.currentPage,
            previousPage: event.previousPage,
            metadata: event.metadata as any,
            deviceType: event.deviceType,
            browser: event.browser,
            os: event.os,
            experimentId: event.experimentId,
            variant: event.variant,
            timestamp: new Date(event.timestamp),
          },
        })
      );
    }

    // Store performance events
    for (const event of scrubbedBatch.performanceEvents) {
      eventPromises.push(
        prisma.performanceMetric.create({
          data: {
            eventId: event.eventId,
            userHash: event.userHash,
            metricType: event.metricType,
            durationMs: event.durationMs,
            context: event.context,
            statusCode: event.statusCode,
            ttfb: event.ttfb,
            fcp: event.fcp,
            lcp: event.lcp,
            fid: event.fid,
            cls: event.cls,
            resourceSize: event.resourceSize,
            cacheHit: event.cacheHit,
            timestamp: new Date(event.timestamp),
          },
        })
      );
    }

    // Store error events
    for (const event of scrubbedBatch.errorEvents) {
      eventPromises.push(
        prisma.errorEvent.create({
          data: {
            eventId: event.eventId,
            userHash: event.userHash,
            errorType: event.errorType,
            errorCode: event.errorCode,
            errorMessage: event.errorMessage,
            errorStack: event.errorStack,
            component: event.component,
            action: event.action,
            currentPage: event.currentPage,
            severity: event.severity,
            userVisible: event.userVisible,
            recoverable: event.recoverable,
            browser: event.browser,
            os: event.os,
            deviceType: event.deviceType,
            timestamp: new Date(event.timestamp),
          },
        })
      );
    }

    // Execute all inserts in parallel
    await Promise.all(eventPromises);

    // TODO: Trigger real-time analytics processing
    // TODO: Update user's daily metrics aggregate

    console.log('[API] Telemetry batch stored:', {
      userHash: batch.userHash,
      sessionId: batch.sessionId,
      eventsCount: batch.eventsCount,
      uiEvents: batch.uiEvents.length,
      errorEvents: batch.errorEvents.length,
      performanceEvents: batch.performanceEvents.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Telemetry batch received successfully',
      data: {
        batchId: batch.batchId,
        eventsProcessed: batch.eventsCount,
      },
    });
  } catch (error) {
    console.error('[API] /api/analytics/telemetry POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to process telemetry batch',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/telemetry
 * Get aggregated telemetry metrics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to access analytics' },
        { status: 401 }
      );
    }

    // TODO: Check if user is admin
    // For now, allow any logged-in user to view aggregates

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'day'; // day, week, month
    const metric = searchParams.get('metric'); // optional metric filter

    // Calculate aggregates from database
    const aggregates = await calculateAggregates(period, metric);

    return NextResponse.json({
      success: true,
      data: aggregates,
      message: 'Telemetry aggregates retrieved successfully',
    });
  } catch (error) {
    console.error('[API] /api/analytics/telemetry GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve telemetry aggregates',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate aggregates from telemetry database
 */
async function calculateAggregates(period: string, _metric: string | null) {
  const now = new Date();
  const cutoff = new Date();

  switch (period) {
    case 'day':
      cutoff.setDate(cutoff.getDate() - 1);
      break;
    case 'week':
      cutoff.setDate(cutoff.getDate() - 7);
      break;
    case 'month':
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
  }

  // Query events within period
  const [uiEvents, errorEvents, performanceEvents] = await Promise.all([
    prisma.telemetryEvent.findMany({
      where: { timestamp: { gte: cutoff, lte: now } },
    }),
    prisma.errorEvent.findMany({
      where: { timestamp: { gte: cutoff, lte: now } },
    }),
    prisma.performanceMetric.findMany({
      where: { timestamp: { gte: cutoff, lte: now } },
    }),
  ]);

  // Calculate metrics
  const totalEvents = uiEvents.length + errorEvents.length + performanceEvents.length;

  // Unique users
  const uniqueUsers = new Set([
    ...uiEvents.map((e) => e.userHash),
    ...errorEvents.map((e) => e.userHash),
    ...performanceEvents.map((e) => e.userHash),
  ]).size;

  // Event type distribution
  const eventTypeDistribution: Record<string, number> = {};
  uiEvents.forEach((event) => {
    eventTypeDistribution[event.eventType] = (eventTypeDistribution[event.eventType] || 0) + 1;
  });

  // Average performance metrics
  const avgLatency =
    performanceEvents.length > 0
      ? performanceEvents.reduce((sum, event) => sum + event.durationMs, 0) / performanceEvents.length
      : 0;

  return {
    period,
    startDate: cutoff.toISOString(),
    endDate: now.toISOString(),
    summary: {
      totalEvents,
      uniqueUsers,
    },
    eventCounts: {
      uiEvents: uiEvents.length,
      errorEvents: errorEvents.length,
      performanceEvents: performanceEvents.length,
    },
    eventTypeDistribution,
    performance: {
      avgLatencyMs: avgLatency,
      totalMeasurements: performanceEvents.length,
    },
  };
}
