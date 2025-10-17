/**
 * Profile Skills API - Update skill metrics
 * Called by pitch detection, vocal effects, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfileManager } from '@/lib/profile/ProfileManager';
import {
  SkillsUpdateRequestSchema,
  validateUserInput,
} from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = session.user.email;

    // Validate input with centralized schema
    try {
      const validatedSkills = validateUserInput(SkillsUpdateRequestSchema, body, 'skills update');
      await ProfileManager.updateSkills(userId, validatedSkills);

      return NextResponse.json({
        success: true,
        message: 'Skills updated',
      });
    } catch (validationError: any) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationError.message,
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Profile skills POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
