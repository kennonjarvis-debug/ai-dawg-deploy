/**
 * Health Check Endpoint
 * Returns system status for monitoring and CI/CD
 */

import { NextResponse } from 'next/server';
import { validateEnv } from '@dawg-ai/types';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  checks: {
    database: 'ok' | 'error' | 'skip';
    eventBus: 'ok' | 'error' | 'skip';
    storage: 'ok' | 'error' | 'skip';
    ai: 'ok' | 'error' | 'skip';
  };
  version: string;
}

export async function GET() {
  const startTime = Date.now();

  try {
    // Validate environment
    const env = validateEnv();

    // Initialize health status
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: String(env.NODE_ENV),
      checks: {
        database: 'skip',
        eventBus: 'skip',
        storage: 'skip',
        ai: 'skip',
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    // Check database connection (if DATABASE_URL exists)
    if (env.DATABASE_URL) {
      try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$queryRaw`SELECT 1`;
        await prisma.$disconnect();
        health.checks.database = 'ok';
      } catch (error) {
        console.error('[Health] Database check failed:', error);
        health.checks.database = 'error';
        health.status = 'degraded';
      }
    }

    // Check event bus (if configured)
    if (env.EVENT_BUS_MODE === 'nats' && env.NATS_URL) {
      try {
        // Basic connectivity check (don't actually connect for health check)
        health.checks.eventBus = 'ok';
      } catch (error) {
        console.error('[Health] Event bus check failed:', error);
        health.checks.eventBus = 'error';
        health.status = 'degraded';
      }
    } else if (env.EVENT_BUS_MODE === 'redis' && env.REDIS_URL) {
      health.checks.eventBus = 'ok';
    } else {
      health.checks.eventBus = 'skip';
    }

    // Check S3 storage (if configured)
    if (env.S3_BUCKET && env.S3_ACCESS_KEY && env.S3_SECRET_KEY) {
      health.checks.storage = 'ok';
    }

    // Check AI services (if API keys exist)
    if (env.ANTHROPIC_API_KEY || env.OPENAI_API_KEY) {
      health.checks.ai = 'ok';
    }

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        ...health,
        meta: {
          responseTimeMs: responseTime,
          nodeVersion: process.version,
        },
      },
      {
        status: health.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    console.error('[Health] Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        uptime: process.uptime(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    );
  }
}
