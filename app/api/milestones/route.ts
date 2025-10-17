/**
 * Milestone API
 * GET /api/milestones - Get user's milestones
 * POST /api/milestones/unlock - Update milestone progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { milestoneManager } from '@/lib/milestone/MilestoneManager';
import {
  MilestoneUnlockRequestSchema,
  validateUserInput,
  UserMilestonesSchema,
  validateApiResponse,
} from '@/lib/types';

/**
 * GET /api/milestones
 * Returns user's milestone data
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session when auth is integrated
    // For now, use a demo user ID
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const userMilestones = milestoneManager.getOrCreate(userId);

    const validated = validateApiResponse(
      UserMilestonesSchema,
      userMilestones,
      'GET /api/milestones'
    );

    return NextResponse.json({
      success: true,
      data: validated,
    });
  } catch (error: any) {
    console.error('[Milestones API] GET error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load milestones',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/milestones
 * Updates milestone progress
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get userId from session when auth is integrated
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const body = await request.json();

    // Validate request body
    const validated = validateUserInput(
      MilestoneUnlockRequestSchema,
      body,
      'milestone unlock request'
    );

    const userMilestones = milestoneManager.getOrCreate(userId);

    const result = milestoneManager.updateProgress(
      userMilestones,
      validated.milestoneId,
      validated.progress
    );

    const validatedResponse = validateApiResponse(
      UserMilestonesSchema,
      result.updated,
      'POST /api/milestones'
    );

    return NextResponse.json({
      success: true,
      data: validatedResponse,
      unlocked: result.unlocked,
    });
  } catch (error: any) {
    console.error('[Milestones API] POST error:', error);

    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Milestone not found',
          details: error.message,
        },
        { status: 404 }
      );
    }

    if (error.message.includes('Validation failed')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update milestone',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
