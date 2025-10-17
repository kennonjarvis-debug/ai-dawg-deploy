/**
 * Milestone Streak API
 * POST /api/milestones/streak - Update practice streak
 */

import { NextRequest, NextResponse } from 'next/server';
import { milestoneManager } from '@/lib/milestone/MilestoneManager';
import {
  StreakUpdateRequestSchema,
  validateUserInput,
  UserMilestonesSchema,
  validateApiResponse,
} from '@/lib/types';

/**
 * POST /api/milestones/streak
 * Updates user's practice streak
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Get userId from session when auth is integrated
    const userId = request.headers.get('x-user-id') || 'demo-user';

    const body = await request.json();

    // Validate request body
    const validated = validateUserInput(
      StreakUpdateRequestSchema,
      body,
      'streak update request'
    );

    const userMilestones = milestoneManager.getOrCreate(userId);

    const updated = milestoneManager.updateStreak(userMilestones, validated.practiceDate);

    const validatedResponse = validateApiResponse(
      UserMilestonesSchema,
      updated,
      'POST /api/milestones/streak'
    );

    return NextResponse.json({
      success: true,
      data: validatedResponse,
      streak: {
        current: validatedResponse.currentStreak,
        longest: validatedResponse.longestStreak,
      },
    });
  } catch (error: any) {
    console.error('[Milestones Streak API] POST error:', error);

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
        error: 'Failed to update streak',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
