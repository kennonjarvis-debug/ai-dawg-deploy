/**
 * Profile Session API - Log practice sessions
 * Called when SessionPlanner completes a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfileManager } from '@/lib/profile/ProfileManager';
import {
  SessionLogRequestSchema,
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
      const validatedSession = validateUserInput(SessionLogRequestSchema, body, 'session log');
      await ProfileManager.logSession(userId, validatedSession.durationMinutes);

      return NextResponse.json({
        success: true,
        message: 'Session logged',
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
    console.error('Profile session POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
