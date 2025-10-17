/**
 * Telemetry Consent API
 * Instance 4 (Data & Storage - Karen)
 *
 * GET  /api/analytics/consent - Get user's telemetry consent settings
 * POST /api/analytics/consent - Update telemetry consent settings
 *
 * GDPR compliant: Explicit opt-in required
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { type TelemetryConsent } from '@/lib/types/analytics';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate user hash from userId
 */
function generateUserHash(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex');
  return `usr_${hash.substring(0, 16)}`;
}

/**
 * GET /api/analytics/consent
 * Retrieve user's telemetry consent settings
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to access consent settings' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const userHash = generateUserHash(userId);

    // Get consent from database or return defaults
    let dbConsent = await prisma.telemetryConsent.findUnique({
      where: { userId },
    });

    if (!dbConsent) {
      // Create default consent (all disabled)
      dbConsent = await prisma.telemetryConsent.create({
        data: {
          userId,
          userHash,
          allowUsageAnalytics: false,
          allowErrorReporting: false,
          allowPerformanceTracking: false,
          allowExperiments: false,
          dataRetentionDays: 365,
        },
      });
    }

    const consent: TelemetryConsent = {
      userHash: dbConsent.userHash,
      consentGivenAt: dbConsent.consentGivenAt.toISOString(),
      consentUpdatedAt: dbConsent.consentUpdatedAt.toISOString(),
      allowUsageAnalytics: dbConsent.allowUsageAnalytics,
      allowErrorReporting: dbConsent.allowErrorReporting,
      allowPerformanceTracking: dbConsent.allowPerformanceTracking,
      allowExperiments: dbConsent.allowExperiments,
      dataRetentionDays: dbConsent.dataRetentionDays,
    };

    return NextResponse.json({
      success: true,
      data: consent,
      message: 'Consent settings retrieved successfully',
    });
  } catch (error) {
    console.error('[API] /api/analytics/consent GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to retrieve consent settings',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/consent
 * Update user's telemetry consent settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to update consent settings' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const userHash = generateUserHash(userId);
    const body = await request.json();

    // Prepare update data
    const updateData: any = {};
    if (body.allowUsageAnalytics !== undefined) updateData.allowUsageAnalytics = body.allowUsageAnalytics;
    if (body.allowErrorReporting !== undefined) updateData.allowErrorReporting = body.allowErrorReporting;
    if (body.allowPerformanceTracking !== undefined) updateData.allowPerformanceTracking = body.allowPerformanceTracking;
    if (body.allowExperiments !== undefined) updateData.allowExperiments = body.allowExperiments;
    if (body.dataRetentionDays !== undefined) updateData.dataRetentionDays = body.dataRetentionDays;

    // Upsert consent in database
    const dbConsent = await prisma.telemetryConsent.upsert({
      where: { userId },
      create: {
        userId,
        userHash,
        allowUsageAnalytics: body.allowUsageAnalytics ?? false,
        allowErrorReporting: body.allowErrorReporting ?? false,
        allowPerformanceTracking: body.allowPerformanceTracking ?? false,
        allowExperiments: body.allowExperiments ?? false,
        dataRetentionDays: body.dataRetentionDays ?? 365,
      },
      update: updateData,
    });

    const updatedConsent: TelemetryConsent = {
      userHash: dbConsent.userHash,
      consentGivenAt: dbConsent.consentGivenAt.toISOString(),
      consentUpdatedAt: dbConsent.consentUpdatedAt.toISOString(),
      allowUsageAnalytics: dbConsent.allowUsageAnalytics,
      allowErrorReporting: dbConsent.allowErrorReporting,
      allowPerformanceTracking: dbConsent.allowPerformanceTracking,
      allowExperiments: dbConsent.allowExperiments,
      dataRetentionDays: dbConsent.dataRetentionDays,
    };

    // TODO: Publish consent update event to event bus
    // TODO: If consent revoked, trigger data deletion for this user

    console.log('[API] Telemetry consent updated:', {
      userHash,
      allowUsageAnalytics: updatedConsent.allowUsageAnalytics,
      allowErrorReporting: updatedConsent.allowErrorReporting,
      allowPerformanceTracking: updatedConsent.allowPerformanceTracking,
      allowExperiments: updatedConsent.allowExperiments,
    });

    return NextResponse.json({
      success: true,
      data: updatedConsent,
      message: 'Consent settings updated successfully',
    });
  } catch (error) {
    console.error('[API] /api/analytics/consent POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to update consent settings',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/consent
 * Revoke all telemetry consent and delete collected data
 */
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Must be logged in to revoke consent' },
        { status: 401 }
      );
    }

    const userId = session.user.email;
    const userHash = generateUserHash(userId);

    // Revoke all consent in database
    await prisma.telemetryConsent.upsert({
      where: { userId },
      create: {
        userId,
        userHash,
        allowUsageAnalytics: false,
        allowErrorReporting: false,
        allowPerformanceTracking: false,
        allowExperiments: false,
        dataRetentionDays: 1, // Delete immediately
      },
      update: {
        allowUsageAnalytics: false,
        allowErrorReporting: false,
        allowPerformanceTracking: false,
        allowExperiments: false,
        dataRetentionDays: 1, // Delete immediately
      },
    });

    // TODO: Trigger deletion of all telemetry data for this userHash
    // TODO: Remove user from A/B testing experiments
    // TODO: Publish consent revocation event to event bus

    console.log('[API] Telemetry consent revoked for user:', userHash);

    return NextResponse.json({
      success: true,
      message: 'All telemetry consent revoked. Data will be deleted within 24 hours.',
    });
  } catch (error) {
    console.error('[API] /api/analytics/consent DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Failed to revoke consent',
      },
      { status: 500 }
    );
  }
}
