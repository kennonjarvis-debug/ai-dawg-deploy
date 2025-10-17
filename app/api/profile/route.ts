/**
 * Profile API - GET all profiles or current user profile
 * Karen's API - centralized profile management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ProfileManager } from '@/lib/profile/ProfileManager';
import {
  ProfileUpdateRequestSchema,
  validateUserInput,
  UserProfileSchema,
  validateApiResponse,
} from '@/lib/types';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.email; // Use email as userId
    const profile = ProfileManager.getProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      const validatedInput = validateUserInput(ProfileUpdateRequestSchema, body, 'profile update');
      const profile = await ProfileManager.upsertProfile(userId, validatedInput);

      // Validate output before sending to client
      const validatedProfile = validateApiResponse(UserProfileSchema, profile, 'POST /api/profile');

      return NextResponse.json({
        success: true,
        profile: validatedProfile,
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
    console.error('Profile POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
